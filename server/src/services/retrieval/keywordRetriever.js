import { Chunk } from '../../models/Chunk.js';

/**
 * Performs keyword search over chunks for a specific project and user.
 * Implements token-overlap and phrase matching score.
 *
 * @param {object} params
 * @param {string} params.projectId
 * @param {string} params.userId
 * @param {string} params.query
 * @param {number} [params.topK=6]
 * @returns {Promise<Array<{ chunk: object, keywordScore: number }>>}
 */
export async function searchKeywords({ projectId, userId, query, topK = 6 }) {
  if (!query || typeof query !== 'string') return [];

  const rawTokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (rawTokens.length === 0) return [];

  // Construct regex pattern matching any of the tokens
  const regexPatterns = rawTokens.map((t) => new RegExp(`\\b${t}`, 'i'));

  const candidateChunks = await Chunk.find({
    projectId,
    userId,
    $or: regexPatterns.map((p) => ({ text: p })),
  })
    .populate('sourceId', 'title type url fileKey status')
    .lean();

  if (candidateChunks.length === 0) return [];

  const queryLower = query.toLowerCase();

  const scored = candidateChunks.map((chunk) => {
    const textLower = chunk.text.toLowerCase();
    let score = 0;

    // Exact phrase match bonus
    if (textLower.includes(queryLower)) {
      score += 2.0;
    }

    // Token match scores
    for (const token of rawTokens) {
      const occurrences = (textLower.match(new RegExp(`\\b${token}`, 'gi')) || []).length;
      if (occurrences > 0) {
        score += Math.min(occurrences * 0.4, 1.2);
      }
    }

    // Section title relevance
    if (chunk.section && rawTokens.some((t) => chunk.section.toLowerCase().includes(t))) {
      score += 0.5;
    }

    return {
      chunk,
      keywordScore: score,
    };
  });

  return scored
    .sort((a, b) => b.keywordScore - a.keywordScore)
    .slice(0, topK);
}
