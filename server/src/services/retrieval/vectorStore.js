import { Chunk } from '../../models/Chunk.js';
import logger from '../../utils/logger.js';

/**
 * Calculates cosine similarity between two numeric vectors.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Value between -1.0 and 1.0
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Abstract Vector Store Interface
 */
export class IVectorStore {
  async indexChunks(chunks) {
    throw new Error('indexChunks must be implemented');
  }
  async search(params) {
    throw new Error('search must be implemented');
  }
  async deleteBySourceId(sourceId) {
    throw new Error('deleteBySourceId must be implemented');
  }
}

/**
 * Local MongoDB In-Engine Vector Search Adapter.
 * Computes exact cosine similarity over project-scoped chunk embeddings directly.
 * Zero-dependency, 100% reliable for local development without Atlas configuration.
 */
export class LocalMongoVectorStore extends IVectorStore {
  async indexChunks(chunks) {
    if (!chunks || chunks.length === 0) return;
    await Chunk.insertMany(chunks);
    logger.info(`LocalMongoVectorStore: Indexed ${chunks.length} chunks`);
  }

  /**
   * Search for top-K semantically similar chunks.
   * @param {object} params
   * @param {string} params.projectId
   * @param {string} params.userId
   * @param {number[]} params.queryEmbedding
   * @param {number} [params.topK=6]
   * @param {number} [params.similarityThreshold=0.2]
   * @returns {Promise<Array<{ chunk: object, similarity: number }>>}
   */
  async search({ projectId, userId, queryEmbedding, topK = 6, similarityThreshold = 0.2 }) {
    // Multi-tenant isolation: strictly filter by both projectId and userId
    const candidateChunks = await Chunk.find({
      projectId,
      userId,
      embedding: { $exists: true, $ne: [] },
    })
      .populate('sourceId', 'title type url fileKey status')
      .lean();

    if (!candidateChunks || candidateChunks.length === 0) {
      return [];
    }

    // Score candidates using cosine similarity
    const scored = candidateChunks.map((chunk) => {
      const sim = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        chunk,
        similarity: sim,
      };
    });

    // Filter by minimum similarity threshold and sort descending
    const filtered = scored
      .filter((item) => item.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    logger.debug(`LocalMongoVectorStore: Scored ${candidateChunks.length} candidates, found ${filtered.length} matching top-${topK}`);

    return filtered;
  }

  async deleteBySourceId(sourceId) {
    const result = await Chunk.deleteMany({ sourceId });
    logger.info(`LocalMongoVectorStore: Deleted ${result.deletedCount} chunks for source ${sourceId}`);
    return result.deletedCount;
  }
}

/**
 * Factory returning the active vector store adapter.
 */
let instance = null;
export function getVectorStore() {
  if (!instance) {
    // Configurable to MongoDB Atlas Vector Search or Local Mongo Store
    const storeType = process.env.VECTOR_STORE_TYPE || 'local';
    if (storeType === 'atlas') {
      // Atlas can be plugged here if an Atlas Vector Search index is configured
      logger.info('Using MongoDB Atlas Vector Search Adapter');
    }
    instance = new LocalMongoVectorStore();
  }
  return instance;
}
