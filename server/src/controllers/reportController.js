import { Report } from '../models/Report.js';
import { Project } from '../models/Project.js';
import { Source } from '../models/Source.js';
import { Chunk } from '../models/Chunk.js';
import { retrieveEvidence } from '../services/retrieval/hybridRetriever.js';
import { generateGroundedAnswer } from '../services/research/llmService.js';
import { validateAndEnrichCitations } from '../services/citations/citationValidator.js';
import logger from '../utils/logger.js';

/**
 * Generate a comprehensive structured research report
 */
export async function generateProjectReport(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const { title, topic, format = 'markdown' } = req.body;

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access unauthorized.',
      });
    }

    // Retrieve high-priority evidence across the project
    const evidence = await retrieveEvidence({
      projectId: project._id,
      userId: req.user._id,
      query: topic || project.topic,
      topK: 10,
      similarityThreshold: 0.15,
    });

    const reportQuery = `Produce a comprehensive formal research report analyzing: "${topic || project.topic}". Include an Executive Summary, Key Evidence-Based Findings, Methodology, Source Analysis, and Conclusion.`;

    const rawSynthesis = await generateGroundedAnswer(reportQuery, evidence);
    const { cleanedAnswer, citations } = validateAndEnrichCitations(rawSynthesis, evidence);

    // Format structured report
    const fullReportMarkdown = `
# Research Report: ${title || project.title}

**Project Topic**: ${project.topic}  
**Generated Date**: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  
**Verified Evidence Passages**: ${evidence.length}  
**Validated Citations**: ${citations.length}  

---

## 1. Executive Summary
${cleanedAnswer}

---

## 2. Evidence Source Registry
${
  citations.length > 0
    ? citations
        .map(
          (c) =>
            `- **[${c.citationIndex}] ${c.title}** (${c.type.toUpperCase()}${
              c.pageNumber ? `, Page ${c.pageNumber}` : ''
            })\n  > *"${c.passage}"*`
        )
        .join('\n\n')
    : '_No direct external citations were referenced in this synthesis._'
}

---
*Report compiled automatically by ResearchPilot AI — Grounded Personal Research Assistant.*
`.trim();

    const report = await Report.create({
      projectId: project._id,
      userId: req.user._id,
      title: title || `${project.title} — Research Report`,
      topic: topic || project.topic,
      content: fullReportMarkdown,
      format,
      sourcesUsed: citations.map((c) => ({
        sourceId: c.sourceId,
        title: c.title,
        type: c.type,
        url: c.url,
        citationCount: 1,
      })),
    });

    logger.info(`Generated research report "${report.title}" (${report._id}) for project ${project._id}`);

    res.status(201).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get report by ID
 */
export async function getReport(req, res, next) {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or access unauthorized.',
      });
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all reports for a project
 */
export async function getProjectReports(req, res, next) {
  try {
    const { id: projectId } = req.params;

    const reports = await Report.find({
      projectId,
      userId: req.user._id,
    }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    next(error);
  }
}
