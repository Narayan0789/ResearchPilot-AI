import crypto from 'crypto';
import path from 'path';
import { Source } from '../../models/Source.js';
import { Project } from '../../models/Project.js';
import { extractPdfWithPages } from './pdfExtractor.js';
import { extractWebContent } from './webExtractor.js';
import { chunkDocuments } from './chunker.js';
import { generateEmbeddingsBatch } from '../retrieval/embeddingService.js';
import { getVectorStore } from '../retrieval/vectorStore.js';
import logger from '../../utils/logger.js';

/**
 * Computes SHA256 hash of a string or buffer.
 */
function computeHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Ingests a PDF document: extracts pages, chunks, generates embeddings, and saves chunks.
 * @param {string} sourceId
 * @param {string} filePath
 * @returns {Promise<object>} Updated source
 */
export async function processPdfSource(sourceId, filePath) {
  const source = await Source.findById(sourceId);
  if (!source) throw new Error(`Source ${sourceId} not found`);

  try {
    source.status = 'processing';
    await source.save();

    const project = await Project.findById(source.projectId);
    const chunkSize = project?.researchSettings?.chunkSize || 600;
    const chunkOverlap = project?.researchSettings?.chunkOverlap || 120;

    // 1. Extract PDF with page numbers
    const { pageCount, pages, fullText } = await extractPdfWithPages(filePath);

    // Compute content hash to detect duplicates
    const contentHash = computeHash(fullText);
    source.contentHash = contentHash;
    source.pageCount = pageCount;

    // 2. Chunk documents with page preservation
    const chunkItems = pages.map((p) => ({
      text: p.text,
      pageNumber: p.pageNumber,
      section: `Page ${p.pageNumber}`,
    }));

    const rawChunks = chunkDocuments(chunkItems, { chunkSize, chunkOverlap });

    if (rawChunks.length === 0) {
      throw new Error('No readable text could be extracted from this PDF.');
    }

    // 3. Batch generate embeddings
    logger.info(`Generating embeddings for ${rawChunks.length} chunks of PDF "${source.title}"`);
    const texts = rawChunks.map((c) => c.text);
    const embeddings = await generateEmbeddingsBatch(texts);

    // 4. Prepare Chunk documents
    const chunkDocs = rawChunks.map((chunk, idx) => ({
      sourceId: source._id,
      projectId: source.projectId,
      userId: source.userId,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      pageNumber: chunk.pageNumber,
      section: chunk.section,
      embedding: embeddings[idx],
    }));

    // 5. Index into vector store
    const vectorStore = getVectorStore();
    await vectorStore.indexChunks(chunkDocs);

    // 6. Finalize source status
    source.status = 'indexed';
    source.retrievalMetadata = {
      totalChunks: chunkDocs.length,
      extractedCharacters: fullText.length,
      detectedLanguage: 'en',
      author: null,
      canonicalUrl: null,
      publishedDate: null,
      headers: pages.map((p) => `Page ${p.pageNumber}`),
    };
    source.errorMessage = null;
    await source.save();

    logger.info(`Successfully indexed PDF "${source.title}" (${chunkDocs.length} chunks, ${pageCount} pages)`);
    return source;
  } catch (err) {
    logger.error(`Error processing PDF source ${sourceId}: ${err.message}`);
    source.status = 'failed';
    source.errorMessage = err.message;
    await source.save();
    throw err;
  }
}

/**
 * Ingests a web URL source: fetches HTML safely, cleans DOM, chunks, embeds, and saves.
 * @param {string} sourceId
 * @param {string} targetUrl
 * @returns {Promise<object>} Updated source
 */
export async function processUrlSource(sourceId, targetUrl) {
  const source = await Source.findById(sourceId);
  if (!source) throw new Error(`Source ${sourceId} not found`);

  try {
    source.status = 'processing';
    await source.save();

    const project = await Project.findById(source.projectId);
    const chunkSize = project?.researchSettings?.chunkSize || 600;
    const chunkOverlap = project?.researchSettings?.chunkOverlap || 120;

    // 1. Extract Web Page content
    const extracted = await extractWebContent(targetUrl);

    source.title = extracted.title || source.title;
    source.url = extracted.canonicalUrl || targetUrl;
    source.contentHash = computeHash(extracted.fullText);

    // 2. Prepare chunks from sections
    const chunkItems = extracted.sections.map((s) => ({
      text: s.text,
      pageNumber: 1, // websites don't have physical page numbers, default to 1
      section: s.section,
    }));

    const rawChunks = chunkDocuments(chunkItems, { chunkSize, chunkOverlap });

    if (rawChunks.length === 0) {
      throw new Error('No readable text content could be extracted from the target website.');
    }

    // 3. Batch generate embeddings
    logger.info(`Generating embeddings for ${rawChunks.length} chunks of web source "${source.title}"`);
    const texts = rawChunks.map((c) => c.text);
    const embeddings = await generateEmbeddingsBatch(texts);

    // 4. Prepare Chunk documents
    const chunkDocs = rawChunks.map((chunk, idx) => ({
      sourceId: source._id,
      projectId: source.projectId,
      userId: source.userId,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      pageNumber: 1,
      section: chunk.section,
      embedding: embeddings[idx],
    }));

    // 5. Index into vector store
    const vectorStore = getVectorStore();
    await vectorStore.indexChunks(chunkDocs);

    // 6. Finalize source status
    source.status = 'indexed';
    source.pageCount = 1;
    source.retrievalMetadata = {
      totalChunks: chunkDocs.length,
      extractedCharacters: extracted.fullText.length,
      detectedLanguage: 'en',
      author: extracted.author,
      canonicalUrl: extracted.canonicalUrl,
      publishedDate: extracted.publishedDate,
      headers: extracted.sections.map((s) => s.section),
    };
    source.errorMessage = null;
    await source.save();

    logger.info(`Successfully indexed URL source "${source.title}" (${chunkDocs.length} chunks)`);
    return source;
  } catch (err) {
    logger.error(`Error processing URL source ${sourceId}: ${err.message}`);
    source.status = 'failed';
    source.errorMessage = err.message;
    await source.save();
    throw err;
  }
}
