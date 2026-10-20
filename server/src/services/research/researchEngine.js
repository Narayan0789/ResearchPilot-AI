import { Project } from '../../models/Project.js';
import { ResearchRun } from '../../models/ResearchRun.js';
import { retrieveEvidence } from '../retrieval/hybridRetriever.js';
import { searchWeb } from './webSearchService.js';
import { generateGroundedAnswer } from './llmService.js';
import { validateAndEnrichCitations } from '../citations/citationValidator.js';
import logger from '../../utils/logger.js';

/**
 * Runs a complete research query pipeline:
 * - Hybrid Retrieval (Semantic + Keyword)
 * - Optional Web Search Discovery
 * - Grounded LLM Synthesis
 * - Strict Server-side Citation Validation
 * - Research Run Auditing
 *
 * @param {object} params
 * @param {string} params.projectId
 * @param {string} params.userId
 * @param {string} params.query
 * @param {boolean} [params.enableWebSearch]
 * @returns {Promise<object>} Complete research response with verified citations
 */
export async function executeResearchQuery({
  projectId,
  userId,
  query,
  enableWebSearch = null,
}) {
  const startTime = Date.now();
  logger.info(`Executing research query: "${query}" for project: ${projectId}`);

  // Fetch project settings
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) {
    throw new Error('Project not found or access unauthorized');
  }

  const topK = project.researchSettings?.maxSourcesToRetrieve || 6;
  const similarityThreshold = project.researchSettings?.similarityThreshold || 0.25;
  const shouldWebSearch =
    enableWebSearch !== null ? enableWebSearch : project.researchSettings?.webSearchEnabled ?? true;

  // 1. Retrieve authorized project evidence
  let retrievedEvidence = await retrieveEvidence({
    projectId,
    userId,
    query,
    topK,
    similarityThreshold,
  });

  // 2. Perform Web Search if enabled
  let webResults = [];
  if (shouldWebSearch) {
    try {
      webResults = await searchWeb(query, 3);
      // Map web results to evidence schema
      const webEvidence = webResults.map((w, idx) => ({
        chunkId: null,
        sourceId: null,
        sourceTitle: w.title,
        sourceType: 'web_search',
        sourceUrl: w.url,
        pageNumber: null,
        section: 'Web Search Discovery',
        text: w.snippet,
        score: 0.85,
        semanticScore: 0.85,
        keywordScore: 0.85,
      }));

      // Combine evidence
      retrievedEvidence = [...retrievedEvidence, ...webEvidence];
    } catch (searchErr) {
      logger.warn(`Web search error in research pipeline: ${searchErr.message}`);
    }
  }

  // 3. Generate grounded answer
  const rawAnswer = await generateGroundedAnswer(query, retrievedEvidence);

  // 4. Validate and enrich citations
  const { cleanedAnswer, citations, rejectedCount } = validateAndEnrichCitations(
    rawAnswer,
    retrievedEvidence
  );

  const executionTimeMs = Date.now() - startTime;

  // 5. Create audit record in ResearchRun
  const runRecord = await ResearchRun.create({
    projectId,
    userId,
    query,
    status: 'completed',
    searchMetadata: {
      webSearchUsed: shouldWebSearch,
      webResultsCount: webResults.length,
      retrievedChunksCount: retrievedEvidence.length,
      validCitationsCount: citations.length,
      evidenceSources: citations.map((c) => ({
        sourceId: c.sourceId,
        title: c.title,
        type: c.type,
        pageNumber: c.pageNumber,
      })),
    },
    usage: {
      promptTokens: Math.round(query.length / 4) + Math.round(JSON.stringify(retrievedEvidence).length / 4),
      completionTokens: Math.round(cleanedAnswer.length / 4),
      executionTimeMs,
    },
    answer: cleanedAnswer,
  });

  logger.info(`Research query completed in ${executionTimeMs}ms with ${citations.length} verified citations`);

  return {
    runId: runRecord._id,
    query,
    answer: cleanedAnswer,
    citations,
    retrievedEvidenceCount: retrievedEvidence.length,
    webSearchUsed: shouldWebSearch,
    stats: {
      executionTimeMs,
      citationsCount: citations.length,
      rejectedCitationsCount: rejectedCount,
    },
  };
}
