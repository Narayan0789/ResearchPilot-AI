import { getVectorStore } from './vectorStore.js';
import { generateEmbedding } from './embeddingService.js';
import { searchKeywords } from './keywordRetriever.js';
import logger from '../../utils/logger.js';

/**
 * Hybrid retrieval engine combining dense vector search and sparse keyword search.
 * Deduplicates passages, reranks by combined relevance score, and enforces multi-tenant isolation.
 *
 * @param {object} params
 * @param {string} params.projectId
 * @param {string} params.userId
 * @param {string} params.query
 * @param {number} [params.topK=6]
 * @param {number} [params.similarityThreshold=0.25]
 * @returns {Promise<Array<object>>} Ranked list of unique evidence passages
 */
export async function retrieveEvidence({
  projectId,
  userId,
  query,
  topK = 6,
  similarityThreshold = 0.25,
}) {
  if (!query || !projectId || !userId) return [];

  logger.info(`Starting hybrid retrieval for project ${projectId}, query: "${query.slice(0, 80)}"`);

  // 1. Parallel Semantic and Keyword Retrieval
  const [queryEmbedding, keywordResults] = await Promise.all([
    generateEmbedding(query),
    searchKeywords({ projectId, userId, query, topK: topK * 2 }),
  ]);

  const vectorStore = getVectorStore();
  const semanticResults = await vectorStore.search({
    projectId,
    userId,
    queryEmbedding,
    topK: topK * 2,
    similarityThreshold,
  });

  // 2. Score Map for Reciprocal Rank Fusion & Hybrid Scoring
  const evidenceMap = new Map();

  // Process Semantic Results (Weight: 0.70)
  semanticResults.forEach((res, rank) => {
    const chunkId = res.chunk._id.toString();
    const normalizedSim = Math.max(0, Math.min(res.similarity, 1.0));
    evidenceMap.set(chunkId, {
      chunk: res.chunk,
      semanticScore: normalizedSim,
      keywordScore: 0,
      semanticRank: rank + 1,
      keywordRank: 999,
    });
  });

  // Normalize keyword scores
  const maxKwScore = keywordResults.length > 0 ? Math.max(...keywordResults.map((k) => k.keywordScore), 1) : 1;

  // Process Keyword Results (Weight: 0.30)
  keywordResults.forEach((res, rank) => {
    const chunkId = res.chunk._id.toString();
    const normalizedKw = res.keywordScore / maxKwScore;
    if (evidenceMap.has(chunkId)) {
      const existing = evidenceMap.get(chunkId);
      existing.keywordScore = normalizedKw;
      existing.keywordRank = rank + 1;
    } else {
      evidenceMap.set(chunkId, {
        chunk: res.chunk,
        semanticScore: 0,
        keywordScore: normalizedKw,
        semanticRank: 999,
        keywordRank: rank + 1,
      });
    }
  });

  // 3. Compute Combined Hybrid Score with Reciprocal Rank Fusion
  const candidates = Array.from(evidenceMap.values()).map((entry) => {
    // RRF score: 1/(60 + r_sem) + 1/(60 + r_kw)
    const rrfScore = 1 / (60 + entry.semanticRank) + 1 / (60 + entry.keywordRank);
    // Linear weighted score
    const weightedScore = 0.65 * entry.semanticScore + 0.35 * entry.keywordScore;
    const finalScore = weightedScore + rrfScore * 5;

    return {
      chunkId: entry.chunk._id,
      sourceId: entry.chunk.sourceId?._id || entry.chunk.sourceId,
      sourceTitle: entry.chunk.sourceId?.title || 'Untitled Document',
      sourceType: entry.chunk.sourceId?.type || 'pdf',
      sourceUrl: entry.chunk.sourceId?.url || null,
      pageNumber: entry.chunk.pageNumber || 1,
      section: entry.chunk.section || 'General',
      text: entry.chunk.text,
      score: finalScore,
      semanticScore: entry.semanticScore,
      keywordScore: entry.keywordScore,
    };
  });

  // 4. Deduplicate near-identical text passages
  const uniqueEvidence = [];
  const seenSnippets = new Set();

  candidates
    .sort((a, b) => b.score - a.score)
    .forEach((item) => {
      // First 60 chars fingerprint to catch overlapping identical fragments
      const snippetKey = `${item.sourceId}_${item.pageNumber}_${item.text.slice(0, 60).toLowerCase()}`;
      if (!seenSnippets.has(snippetKey)) {
        seenSnippets.add(snippetKey);
        uniqueEvidence.push(item);
      }
    });

  const finalResults = uniqueEvidence.slice(0, topK);
  logger.info(`Hybrid retrieval finished: selected ${finalResults.length} top evidence passages`);

  return finalResults;
}
