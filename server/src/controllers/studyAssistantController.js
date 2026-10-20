import path from 'path';
import {
  StudyMaterial,
  DocumentChunk,
  AIConversation,
  AIMessage,
  Course,
  Enrollment
} from '../models/index.js';
import {
  extractTextFromFile,
  chunkText,
  tokenize,
  retrieveRelevantChunks,
  callLLM
} from '../services/ragService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Upload study material and index into vector/term chunks for RAG
// @route   POST /api/study-materials
// @access  Private (Faculty, Admin)
export async function uploadStudyMaterial(req, res, next) {
  try {
    const { courseId, title, description, tags } = req.body;

    if (!req.file) {
      return sendError(res, 'A study material file (PDF or document) is required.', 400);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;

    // Create StudyMaterial record
    const studyMaterial = await StudyMaterial.create({
      course: courseId,
      uploadedBy: req.user._id,
      title: title || req.file.originalname,
      description: description || '',
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      isPublic: true,
      isProcessed: false
    });

    // Extract text from document and chunk it asynchronously/synchronously
    try {
      const extractedText = await extractTextFromFile(filePath, req.file.mimetype);
      const chunks = chunkText(extractedText);

      const chunkDocs = chunks.map((chunkContent, index) => ({
        material: studyMaterial._id,
        course: courseId,
        chunkIndex: index,
        content: chunkContent,
        tokenCount: chunkContent.split(/\s+/).length,
        terms: tokenize(chunkContent),
        metadata: {
          pageNumber: Math.floor(index / 2) + 1,
          sourceFileName: req.file.originalname
        }
      }));

      if (chunkDocs.length > 0) {
        await DocumentChunk.insertMany(chunkDocs);
      }

      studyMaterial.chunkCount = chunkDocs.length;
      studyMaterial.isProcessed = true;
      await studyMaterial.save();
    } catch (parseErr) {
      console.error('[Document Ingestion Warning]:', parseErr.message);
      studyMaterial.isProcessed = false;
      await studyMaterial.save();
    }

    await logAudit({
      userId: req.user._id,
      action: 'UPLOAD_STUDY_MATERIAL',
      entity: 'StudyMaterial',
      entityId: studyMaterial._id,
      details: { title: studyMaterial.title, courseCode: course.code, chunks: studyMaterial.chunkCount },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Study material "${studyMaterial.title}" uploaded and indexed into ${studyMaterial.chunkCount} searchable knowledge chunks.`,
      data: studyMaterial
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get study materials for authorized courses
// @route   GET /api/study-materials
// @access  Private
export async function getStudyMaterials(req, res, next) {
  try {
    const { courseId } = req.query;
    let permittedCourseIds = [];

    if (req.user.role === 'student') {
      const enrollments = await Enrollment.find({ student: req.user._id, status: 'enrolled' });
      permittedCourseIds = enrollments.map(e => String(e.course));
      if (courseId && !permittedCourseIds.includes(String(courseId))) {
        return sendError(res, 'You are not enrolled in this course.', 403);
      }
    } else if (req.user.role === 'faculty') {
      const courses = await Course.find({ faculty: req.user._id });
      permittedCourseIds = courses.map(c => String(c._id));
    }

    const query = {};
    if (courseId) {
      query.course = courseId;
    } else if (req.user.role !== 'admin') {
      query.course = { $in: permittedCourseIds };
    }

    const materials = await StudyMaterial.find(query)
      .populate('course', 'name code')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    return sendSuccess(res, materials, 'Study materials retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Ask AI Study Assistant using RAG over enrolled courses
// @route   POST /api/ai/study-assistant/chat
// @access  Private
export async function chatWithStudyAssistant(req, res, next) {
  try {
    const { message, conversationId, courseId } = req.body;
    if (!message || message.trim().length === 0) {
      return sendError(res, 'Question message is required.', 400);
    }

    // 1. Determine permitted courses for RAG retrieval
    let targetCourseIds = [];
    if (courseId) {
      if (req.user.role === 'student') {
        const isEnrolled = await Enrollment.findOne({ student: req.user._id, course: courseId, status: 'enrolled' });
        if (!isEnrolled) {
          return sendError(res, 'You are not enrolled in this course to query its materials.', 403);
        }
      }
      targetCourseIds = [courseId];
    } else {
      if (req.user.role === 'student') {
        const enrollments = await Enrollment.find({ student: req.user._id, status: 'enrolled' });
        targetCourseIds = enrollments.map(e => e.course);
      } else {
        const courses = await Course.find({ isActive: true });
        targetCourseIds = courses.map(c => c._id);
      }
    }

    // 2. Retrieve relevant chunks using term frequency cosine similarity
    const retrievedChunks = await retrieveRelevantChunks({
      query: message,
      courseIds: targetCourseIds,
      topK: 4,
      threshold: 0.05
    });

    // 3. Find or create AIConversation
    let conversation = null;
    if (conversationId) {
      conversation = await AIConversation.findOne({ _id: conversationId, user: req.user._id });
    }
    if (!conversation) {
      const summaryTitle = message.slice(0, 35) + (message.length > 35 ? '...' : '');
      conversation = await AIConversation.create({
        user: req.user._id,
        title: summaryTitle,
        contextType: courseId ? 'course' : 'general',
        course: courseId || null
      });
    }

    // Save user message
    await AIMessage.create({
      conversation: conversation._id,
      sender: 'user',
      text: message
    });

    // 4. Generate answer via LLM or Grounded Synthesis
    let assistantReply = '';
    const sources = retrievedChunks.map(c => ({
      title: c.title,
      chunkId: c.chunkId,
      score: c.score,
      snippet: c.content.slice(0, 180) + '...'
    }));

    const contextText = retrievedChunks.map((c, i) => `[Source ${i + 1}: ${c.title}]\n${c.content}`).join('\n\n');

    const systemPrompt = `You are SmartCampus AI, an academic study assistant for university students.
Answer questions accurately and educationally based on the provided course lecture materials.
Ground your answers firmly in the provided context. If the material does not contain sufficient details to answer the question, state: "The uploaded course material does not contain enough information on this specific topic."
Never guarantee 100% correctness; encourage students to verify with their course instructors.`;

    const userPrompt = contextText.length > 0
      ? `Retrieved Course Knowledge:\n${contextText}\n\nStudent Question: "${message}"\n\nPlease provide a clear, structured, student-friendly explanation citing the relevant sources.`
      : `Student Question: "${message}"\n\nNote: No course document match was found for this query in the student's enrolled courses. Explain general concepts concisely and advise checking official class handouts.`;

    const llmAnswer = await callLLM({ systemPrompt, userPrompt });

    if (llmAnswer) {
      assistantReply = llmAnswer;
    } else {
      // Grounded deterministic synthesis when external LLM API key is not configured
      if (retrievedChunks.length > 0) {
        assistantReply = `Based on your course materials in **${retrievedChunks[0].title}**:\n\n` +
          retrievedChunks.map((c, idx) => `• **Key Point ${idx + 1}**: ${c.content.trim()}`).join('\n\n') +
          `\n\n*(Note: Answers are derived directly from course syllabus chunks. Please review your lecture notes for full context.)*`;
      } else {
        assistantReply = `I searched your enrolled course notes, but found no direct references to "${message}".\n\n` +
          `Please ensure your faculty has uploaded notes for this module, or try asking with more specific subject keywords.`;
      }
    }

    // Save assistant message
    const savedAssistantMsg = await AIMessage.create({
      conversation: conversation._id,
      sender: 'assistant',
      text: assistantReply,
      sources
    });

    conversation.messageCount += 2;
    await conversation.save();

    return sendSuccess(res, {
      conversationId: conversation._id,
      message: assistantReply,
      sources,
      createdAt: savedAssistantMsg.createdAt
    }, 'Study assistant responded');
  } catch (error) {
    next(error);
  }
}

// @desc    Get user's AI conversations list
// @route   GET /api/ai/study-assistant/conversations
// @access  Private
export async function getConversations(req, res, next) {
  try {
    const conversations = await AIConversation.find({ user: req.user._id })
      .populate('course', 'name code')
      .sort({ updatedAt: -1 });

    return sendSuccess(res, conversations, 'Conversations retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Get messages for a conversation
// @route   GET /api/ai/study-assistant/conversations/:id/messages
// @access  Private
export async function getConversationMessages(req, res, next) {
  try {
    const { id } = req.params;
    const conversation = await AIConversation.findOne({ _id: id, user: req.user._id });
    if (!conversation) {
      return sendError(res, 'Conversation not found', 404);
    }

    const messages = await AIMessage.find({ conversation: id }).sort({ createdAt: 1 });
    return sendSuccess(res, { conversation, messages }, 'Messages retrieved');
  } catch (error) {
    next(error);
  }
}

// @desc    Generate AI practice quiz from course materials
// @route   POST /api/ai/study-assistant/generate-quiz
// @access  Private
export async function generatePracticeQuiz(req, res, next) {
  try {
    const { courseId, topic, numberOfQuestions = 5 } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Retrieve chunks relevant to topic
    const chunks = await retrieveRelevantChunks({
      query: topic || course.name,
      courseIds: [courseId],
      topK: 6,
      threshold: 0.02
    });

    const contextSnippet = chunks.map(c => c.content).join('\n\n').slice(0, 3000);

    const systemPrompt = `You are a university exam creator. Create a multiple-choice practice quiz in strict JSON format based on the provided course material.
Return a valid JSON array of objects with the exact schema:
[
  {
    "questionText": "Question string",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanation": "Why this is correct"
  }
]
Do not wrap in markdown quotes. Return valid raw JSON only.`;

    const userPrompt = `Course: ${course.code} - ${course.name}\nTopic: ${topic || 'Key Concepts'}\nNumber of questions: ${numberOfQuestions}\n\nCourse Text:\n${contextSnippet || 'General fundamental concepts of ' + course.name}`;

    const llmResult = await callLLM({ systemPrompt, userPrompt });

    let questions = [];
    if (llmResult) {
      try {
        const cleaned = llmResult.replace(/```json/g, '').replace(/```/g, '').trim();
        questions = JSON.parse(cleaned);
      } catch (jsonErr) {
        console.warn('[Quiz JSON Parse Warning]:', jsonErr.message);
      }
    }

    // Fallback practice questions if LLM unavailable or JSON parse failed
    if (!questions || questions.length === 0) {
      questions = [
        {
          questionText: `What is the primary objective of studying ${course.name}?`,
          options: [
            'Systematic understanding and practical application of the domain principles',
            'Memorization of arbitrary syntax without practical implementation',
            'Random exploration without theoretical foundations',
            'None of the above'
          ],
          correctOptionIndex: 0,
          explanation: 'The course curriculum emphasizes foundational principles and systematic problem-solving.'
        },
        {
          questionText: `Which of the following best characterizes proper modular architecture in ${course.code}?`,
          options: [
            'Tight coupling and monolithic design',
            'High cohesion, low coupling, and clear separation of concerns',
            'Eliminating all abstractions and interfaces',
            'Bypassing data validation layers'
          ],
          correctOptionIndex: 1,
          explanation: 'High cohesion and low coupling ensure maintainability, testing isolation, and system reliability.'
        },
        {
          questionText: `In ${course.name}, why is algorithmic efficiency measured using asymptotic notations like Big-O?`,
          options: [
            'To calculate exact runtime in milliseconds on a specific CPU',
            'To classify algorithms by how their run-time or space requirements grow as the input size grows',
            'To ignore computational complexity entirely',
            'To measure network round-trip latency'
          ],
          correctOptionIndex: 1,
          explanation: 'Asymptotic notation describes algorithm scalability independent of hardware specifications.'
        }
      ];
    }

    return sendSuccess(res, {
      course: { _id: course._id, code: course.code, name: course.name },
      topic: topic || 'Course Overview',
      questions
    }, 'Practice quiz generated successfully');
  } catch (error) {
    next(error);
  }
}
