import fs from 'fs';
import path from 'path';
import { Source } from '../models/Source.js';
import { Project } from '../models/Project.js';
import { Chunk } from '../models/Chunk.js';
import { verifyPdfSignature } from '../middleware/upload.js';
import { processPdfSource, processUrlSource } from '../services/ingestion/ingestionService.js';
import { getVectorStore } from '../services/retrieval/vectorStore.js';
import logger from '../utils/logger.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

/**
 * Upload and ingest a PDF document
 */
export async function uploadPdfSource(req, res, next) {
  try {
    const { id: projectId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded.',
      });
    }

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      // Remove uploaded file if project not authorized
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(404).json({
        success: false,
        error: 'Project not found or access unauthorized.',
      });
    }

    // Verify PDF magic bytes (%PDF-)
    const isRealPdf = await verifyPdfSignature(req.file.path);
    if (!isRealPdf) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        error: 'Security verification failed: uploaded file is not a genuine PDF document.',
      });
    }

    // Create Source record
    const source = await Source.create({
      projectId: project._id,
      userId: req.user._id,
      type: 'pdf',
      title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ''),
      fileKey: req.file.filename,
      fileOriginalName: req.file.originalname,
      fileSize: req.file.size,
      status: 'pending',
    });

    // Process ingestion (runs with immediate indexing)
    try {
      await processPdfSource(source._id, req.file.path);
      const updatedSource = await Source.findById(source._id);

      res.status(201).json({
        success: true,
        source: updatedSource,
      });
    } catch (ingestErr) {
      logger.error(`PDF ingestion error for source ${source._id}: ${ingestErr.message}`);
      res.status(201).json({
        success: true,
        source,
        warning: `File uploaded but ingestion encountered an issue: ${ingestErr.message}`,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Ingest website URL source
 */
export async function ingestUrlSource(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const { url, title } = req.body;

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access unauthorized.',
      });
    }

    const source = await Source.create({
      projectId: project._id,
      userId: req.user._id,
      type: 'url',
      title: title || url,
      url,
      status: 'pending',
    });

    try {
      await processUrlSource(source._id, url);
      const updatedSource = await Source.findById(source._id);

      res.status(201).json({
        success: true,
        source: updatedSource,
      });
    } catch (ingestErr) {
      logger.error(`URL ingestion error for source ${source._id}: ${ingestErr.message}`);
      res.status(400).json({
        success: false,
        error: `Failed to ingest URL: ${ingestErr.message}`,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get all sources for a project
 */
export async function getProjectSources(req, res, next) {
  try {
    const { id: projectId } = req.params;

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access unauthorized.',
      });
    }

    const sources = await Source.find({ projectId }).sort({ createdAt: -1 }).lean();

    // Attach chunk counts
    const sourceIds = sources.map((s) => s._id);
    const chunkCounts = await Chunk.aggregate([
      { $match: { sourceId: { $in: sourceIds } } },
      { $group: { _id: '$sourceId', count: { $sum: 1 } } },
    ]);
    const chunkMap = new Map(chunkCounts.map((c) => [c._id.toString(), c.count]));

    const enriched = sources.map((s) => ({
      ...s,
      chunkCount: chunkMap.get(s._id.toString()) || s.retrievalMetadata?.totalChunks || 0,
    }));

    res.status(200).json({
      success: true,
      sources: enriched,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single source details
 */
export async function getSource(req, res, next) {
  try {
    const source = await Source.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Source not found or access unauthorized.',
      });
    }

    const chunkCount = await Chunk.countDocuments({ sourceId: source._id });

    res.status(200).json({
      success: true,
      source: {
        ...source,
        chunkCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get chunks/text for a specific page number of a source (Citation Inspector)
 */
export async function getSourcePage(req, res, next) {
  try {
    const { id: sourceId, pageNumber } = req.params;
    const pageNum = parseInt(pageNumber, 10);

    const source = await Source.findOne({
      _id: sourceId,
      userId: req.user._id,
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Source not found or access unauthorized.',
      });
    }

    const chunks = await Chunk.find({
      sourceId: source._id,
      pageNumber: pageNum,
    }).sort({ chunkIndex: 1 }).lean();

    res.status(200).json({
      success: true,
      source: {
        id: source._id,
        title: source.title,
        type: source.type,
        url: source.url,
        pageCount: source.pageCount,
      },
      pageNumber: pageNum,
      chunks,
      pageText: chunks.map((c) => c.text).join('\n\n'),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Safely stream/serve PDF file
 */
export async function getSourceFile(req, res, next) {
  try {
    const source = await Source.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!source || !source.fileKey) {
      return res.status(404).json({
        success: false,
        error: 'File not found or access unauthorized.',
      });
    }

    const filePath = path.resolve(process.cwd(), UPLOAD_DIR, source.fileKey);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Physical file not found on disk.',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(source.fileOriginalName || 'document.pdf')}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * Cascade delete single source
 */
export async function deleteSource(req, res, next) {
  try {
    const source = await Source.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Source not found or access unauthorized.',
      });
    }

    // 1. Delete physical file from disk
    if (source.fileKey) {
      const filePath = path.resolve(process.cwd(), UPLOAD_DIR, source.fileKey);
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (unlinkErr) {
        logger.warn(`Could not delete file ${filePath}: ${unlinkErr.message}`);
      }
    }

    // 2. Delete chunk records and vector embeddings
    const vectorStore = getVectorStore();
    await vectorStore.deleteBySourceId(source._id);

    // 3. Delete source record
    await Source.deleteOne({ _id: source._id });

    logger.info(`Source ${source._id} and its chunks were deleted by user ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Source and its vector chunks deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}
