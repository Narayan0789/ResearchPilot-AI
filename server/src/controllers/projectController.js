import fs from 'fs';
import path from 'path';
import { Project } from '../models/Project.js';
import { Source } from '../models/Source.js';
import { Chunk } from '../models/Chunk.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { ResearchRun } from '../models/ResearchRun.js';
import { Report } from '../models/Report.js';
import logger from '../utils/logger.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

/**
 * Get all projects belonging to the logged-in user
 */
export async function getProjects(req, res, next) {
  try {
    const projects = await Project.find({ userId: req.user._id }).sort({ updatedAt: -1 }).lean();

    // Attach summary stats to each project
    const projectIds = projects.map((p) => p._id);
    const [sourceCounts, runCounts] = await Promise.all([
      Source.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
      ]),
      ResearchRun.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
      ]),
    ]);

    const sourceMap = new Map(sourceCounts.map((s) => [s._id.toString(), s.count]));
    const runMap = new Map(runCounts.map((r) => [r._id.toString(), r.count]));

    const enriched = projects.map((p) => ({
      ...p,
      sourceCount: sourceMap.get(p._id.toString()) || 0,
      runCount: runMap.get(p._id.toString()) || 0,
    }));

    res.status(200).json({
      success: true,
      projects: enriched,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new research project
 */
export async function createProject(req, res, next) {
  try {
    const { title, topic, researchSettings } = req.body;

    const project = await Project.create({
      userId: req.user._id,
      title,
      topic,
      researchSettings: researchSettings || {},
    });

    // Create an initial default conversation for research chat
    await Conversation.create({
      projectId: project._id,
      userId: req.user._id,
      title: 'Initial Research Session',
    });

    logger.info(`Created project "${project.title}" (${project._id}) for user ${req.user.email}`);

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single project by ID with full metrics
 */
export async function getProject(req, res, next) {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied.',
      });
    }

    const [sourceCount, chunkCount, runCount, reportCount] = await Promise.all([
      Source.countDocuments({ projectId: project._id }),
      Chunk.countDocuments({ projectId: project._id }),
      ResearchRun.countDocuments({ projectId: project._id }),
      Report.countDocuments({ projectId: project._id }),
    ]);

    res.status(200).json({
      success: true,
      project: {
        ...project,
        stats: {
          sourceCount,
          chunkCount,
          runCount,
          reportCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update project details and settings
 */
export async function updateProject(req, res, next) {
  try {
    const { title, topic, researchSettings } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied.',
      });
    }

    if (title) project.title = title;
    if (topic) project.topic = topic;
    if (researchSettings) {
      project.researchSettings = {
        ...project.researchSettings.toObject(),
        ...researchSettings,
      };
    }

    await project.save();

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cascade delete project and all associated resources
 */
export async function deleteProject(req, res, next) {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied.',
      });
    }

    // 1. Find all sources to delete uploaded files from disk
    const sources = await Source.find({ projectId: project._id });
    for (const source of sources) {
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
    }

    // 2. Cascade delete database entities
    await Promise.all([
      Source.deleteMany({ projectId: project._id }),
      Chunk.deleteMany({ projectId: project._id }),
      Conversation.deleteMany({ projectId: project._id }),
      ResearchRun.deleteMany({ projectId: project._id }),
      Report.deleteMany({ projectId: project._id }),
      Project.deleteOne({ _id: project._id }),
    ]);

    logger.info(`Cascaded deleted project ${project._id} and all related entities`);

    res.status(200).json({
      success: true,
      message: 'Project and all associated sources, chunks, and history deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}
