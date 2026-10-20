import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { ResearchRun } from '../models/ResearchRun.js';
import { Project } from '../models/Project.js';
import { executeResearchQuery } from '../services/research/researchEngine.js';

/**
 * Perform a deep research run on a project
 */
export async function runResearchQuery(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const { query, enableWebSearch } = req.body;

    const result = await executeResearchQuery({
      projectId,
      userId: req.user._id,
      query,
      enableWebSearch,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Interactive Chat endpoint with grounded answer and citations
 */
export async function postChatMessage(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const { conversationId, message, enableWebSearch } = req.body;

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access unauthorized.',
      });
    }

    // Find or create conversation
    let conv;
    if (conversationId) {
      conv = await Conversation.findOne({ _id: conversationId, projectId: project._id });
    }
    if (!conv) {
      conv = await Conversation.create({
        projectId: project._id,
        userId: req.user._id,
        title: message.slice(0, 50) || 'Research Session',
      });
    }

    // Save user message
    const userMsg = await Message.create({
      conversationId: conv._id,
      role: 'user',
      content: message,
    });

    // Run research retrieval and synthesis
    const researchResult = await executeResearchQuery({
      projectId: project._id,
      userId: req.user._id,
      query: message,
      enableWebSearch,
    });

    // Save assistant message with verified citations
    const assistantMsg = await Message.create({
      conversationId: conv._id,
      role: 'assistant',
      content: researchResult.answer,
      citations: researchResult.citations,
      metadata: {
        retrievalCount: researchResult.retrievedEvidenceCount,
        webSearchUsed: researchResult.webSearchUsed,
        latencyMs: researchResult.stats.executionTimeMs,
      },
    });

    // Update conversation timestamp
    conv.updatedAt = new Date();
    await conv.save();

    res.status(200).json({
      success: true,
      conversationId: conv._id,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      citations: researchResult.citations,
      stats: researchResult.stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(req, res, next) {
  try {
    const { id: conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access unauthorized.',
      });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();

    res.status(200).json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all conversations for a project
 */
export async function getProjectConversations(req, res, next) {
  try {
    const { id: projectId } = req.params;

    const conversations = await Conversation.find({
      projectId,
      userId: req.user._id,
    }).sort({ updatedAt: -1 }).lean();

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single research run details
 */
export async function getResearchRun(req, res, next) {
  try {
    const run = await ResearchRun.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Research run not found or access unauthorized.',
      });
    }

    res.status(200).json({
      success: true,
      run,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all research runs for a project
 */
export async function getProjectResearchRuns(req, res, next) {
  try {
    const { id: projectId } = req.params;

    const runs = await ResearchRun.find({
      projectId,
      userId: req.user._id,
    }).sort({ createdAt: -1 }).limit(50).lean();

    res.status(200).json({
      success: true,
      runs,
    });
  } catch (error) {
    next(error);
  }
}
