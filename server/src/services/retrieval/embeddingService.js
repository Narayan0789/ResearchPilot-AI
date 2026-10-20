import crypto from 'crypto';
import logger from '../../utils/logger.js';

const VECTOR_DIMENSION = 384;

/**
 * Deterministic local dense vector generator.
 * Produces a normalized 384-dimensional dense embedding based on subword hashing and term frequency.
 * Enables 100% offline local semantic retrieval without external API keys.
 *
 * @param {string} text
 * @returns {number[]} Normalized 384-element float array
 */
function generateLocalEmbedding(text) {
  const vector = new Float32Array(VECTOR_DIMENSION);
  if (!text || typeof text !== 'string') return Array.from(vector);

  const clean = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter((t) => t.length > 1);

  if (tokens.length === 0) return Array.from(vector);

  // Term frequencies and character tri-grams
  for (const token of tokens) {
    // Word level hashing
    const wordHash = crypto.createHash('md5').update(token).digest();
    const wordIdx = Math.abs(wordHash.readInt32BE(0)) % VECTOR_DIMENSION;
    vector[wordIdx] += 1.5;

    // Character 3-gram hashing for subword semantics
    for (let i = 0; i < token.length - 2; i++) {
      const gram = token.slice(i, i + 3);
      const gramHash = crypto.createHash('md5').update(gram).digest();
      const gramIdx = Math.abs(gramHash.readInt32BE(0)) % VECTOR_DIMENSION;
      vector[gramIdx] += 0.5;
    }
  }

  // L2 Normalization (unit vector)
  let sumSq = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSION; i++) {
      vector[i] = vector[i] / norm;
    }
  }

  return Array.from(vector);
}

/**
 * Generate embedding for a single text using configured provider or local fallback.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function generateEmbedding(text) {
  const provider = process.env.EMBEDDING_PROVIDER || 'local';
  const apiKey = process.env.EMBEDDING_API_KEY;

  if (provider === 'openai' && apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.slice(0, 8000),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.data[0].embedding;
      }
      logger.warn(`OpenAI embedding failed (${res.status}), falling back to local vectorizer`);
    } catch (err) {
      logger.warn(`OpenAI embedding error: ${err.message}, falling back to local vectorizer`);
    }
  } else if (provider === 'gemini' && apiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/gemini-embedding-001',
            content: { parts: [{ text: text.slice(0, 8000) }] },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data.embedding.values;
      }
      logger.warn(`Gemini embedding failed (${res.status}), falling back to local vectorizer`);
    } catch (err) {
      logger.warn(`Gemini embedding error: ${err.message}, falling back to local vectorizer`);
    }
  }

  // Default / Local offline generator
  return generateLocalEmbedding(text);
}

/**
 * Batch generate embeddings for an array of texts.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function generateEmbeddingsBatch(texts) {
  return Promise.all(texts.map((t) => generateEmbedding(t)));
}
