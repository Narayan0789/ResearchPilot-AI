import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import { env } from '../config/env.js';
import { DocumentChunk } from '../models/index.js';

// Simple stop words for term frequency weighting
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has',
  'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in',
  'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not',
  'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you',
  'your', 'yours', 'yourself', 'yourselves'
]);

// Extract terms from text
export function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

// Compute Term Frequency vector map
export function computeTF(tokens) {
  const tf = {};
  if (!tokens || tokens.length === 0) return tf;
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  const total = tokens.length;
  for (const t in tf) {
    tf[t] = tf[t] / total;
  }
  return tf;
}

// Compute Cosine Similarity between two term frequency dictionaries
export function cosineSimilarity(tf1, tf2) {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (const term in tf1) {
    mag1 += tf1[term] * tf1[term];
    if (tf2[term]) {
      dotProduct += tf1[term] * tf2[term];
    }
  }

  for (const term in tf2) {
    mag2 += tf2[term] * tf2[term];
  }

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// Extract raw text from uploaded file (PDF or text file)
export async function extractTextFromFile(filePath, mimeType) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    } else {
      // Plain text or source file
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    console.error('[RAG Extract Error]:', error.message);
    throw new Error(`Failed to parse document: ${error.message}`);
  }
}

// Chunk text into overlapping segments
export function chunkText(text, chunkSize = 700, overlap = 100) {
  const sanitized = text.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n\n');
  const chunks = [];
  let startIndex = 0;

  while (startIndex < sanitized.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex >= sanitized.length) {
      chunks.push(sanitized.slice(startIndex).trim());
      break;
    }

    // Try breaking at sentence or newline boundary
    const nextNewline = sanitized.indexOf('\n', endIndex - 50);
    const nextPeriod = sanitized.indexOf('. ', endIndex - 50);

    let breakPoint = endIndex;
    if (nextPeriod !== -1 && nextPeriod <= endIndex + 50) {
      breakPoint = nextPeriod + 1;
    } else if (nextNewline !== -1 && nextNewline <= endIndex + 50) {
      breakPoint = nextNewline;
    }

    const chunkContent = sanitized.slice(startIndex, breakPoint).trim();
    if (chunkContent.length > 50) {
      chunks.push(chunkContent);
    }

    startIndex = breakPoint - overlap;
  }

  return chunks;
}

// Retrieve relevant chunks for a student query within permitted courses
export async function retrieveRelevantChunks({ query, courseIds, topK = 4, threshold = 0.08 }) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const queryTF = computeTF(queryTokens);

  // Search candidate chunks matching tokens in permitted courses
  const candidates = await DocumentChunk.find({
    course: { $in: courseIds },
    terms: { $in: queryTokens }
  }).populate('material', 'title fileName').limit(80);

  if (!candidates || candidates.length === 0) return [];

  const scored = [];
  for (const chunk of candidates) {
    const chunkTokens = chunk.terms && chunk.terms.length > 0 ? chunk.terms : tokenize(chunk.content);
    const chunkTF = computeTF(chunkTokens);
    const score = cosineSimilarity(queryTF, chunkTF);

    if (score >= threshold) {
      scored.push({
        chunkId: chunk._id,
        content: chunk.content,
        title: chunk.material?.title || chunk.metadata?.sourceFileName || 'Course Material',
        score: parseFloat(score.toFixed(4)),
        pageNumber: chunk.metadata?.pageNumber || 1
      });
    }
  }

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// Call configured LLM (Groq / OpenAI) or synthesize grounded response
export async function callLLM({ systemPrompt, userPrompt }) {
  if (env.aiApiKey) {
    try {
      if (env.aiProvider === 'groq') {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: env.aiModel || 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 1024
          },
          {
            headers: {
              Authorization: `Bearer ${env.aiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 25000
          }
        );
        return response.data.choices[0]?.message?.content || 'No response generated.';
      } else {
        // OpenAI endpoint
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: env.aiModel || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 1024
          },
          {
            headers: {
              Authorization: `Bearer ${env.aiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 25000
          }
        );
        return response.data.choices[0]?.message?.content || 'No response generated.';
      }
    } catch (error) {
      console.warn('[LLM API Error]:', error.response?.data?.error?.message || error.message);
      // Fall through to structured synthesized academic response
    }
  }

  // Transparent grounded synthesis when external API key is not configured or offline
  return null;
}
