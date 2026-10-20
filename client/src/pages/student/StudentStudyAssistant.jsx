import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  Award,
  ChevronRight,
  Info,
  Clock,
  MessageSquare,
  PlusCircle,
  X
} from 'lucide-react';

export default function StudentStudyAssistant() {
  const [searchParams] = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Practice Quiz Generator Modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizTopic, setQuizTopic] = useState('');
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function initData() {
      try {
        const [courseRes, convRes] = await Promise.all([
          api.get('/courses/my/enrolled'),
          api.get('/ai/study-assistant/conversations')
        ]);

        if (courseRes.data.success) {
          setCourses(courseRes.data.data);
          if (!selectedCourseId && courseRes.data.data.length > 0) {
            setSelectedCourseId(courseRes.data.data[0]._id);
          }
        }

        if (convRes.data.success) {
          setConversations(convRes.data.data);
          if (convRes.data.data.length > 0) {
            loadConversation(convRes.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to init AI Study Assistant:', err);
      }
    }
    initData();
  }, []);

  const loadConversation = async (convId) => {
    setActiveConversationId(convId);
    try {
      const res = await api.get(`/ai/study-assistant/conversations/${convId}/messages`);
      if (res.data.success) {
        setMessages(res.data.data.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([
      {
        sender: 'assistant',
        text: 'Hello! I am your SmartCampus AI academic study assistant. Ask me questions about your enrolled course notes, request revision summaries, or generate practice quizzes.',
        sources: []
      }
    ]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Optimistically append user message
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setIsTyping(true);

    try {
      const res = await api.post('/ai/study-assistant/chat', {
        message: userText,
        conversationId: activeConversationId,
        courseId: selectedCourseId || undefined
      });

      if (res.data.success) {
        const { conversationId, message, sources } = res.data.data;
        if (!activeConversationId) {
          setActiveConversationId(conversationId);
          // Refresh conversation list
          const convRes = await api.get('/ai/study-assistant/conversations');
          if (convRes.data.success) setConversations(convRes.data.data);
        }

        setMessages(prev => [
          ...prev,
          {
            sender: 'assistant',
            text: message,
            sources: sources || []
          }
        ]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error communicating with AI assistant.';
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ **Notice:** ${msg}. (Make sure AI_API_KEY is configured in server/.env or query a topic covered in your lecture uploads.)`,
          sources: []
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedCourseId) {
      toast.error('Please select an enrolled course first.');
      return;
    }
    setGeneratingQuiz(true);
    try {
      const res = await api.post('/ai/study-assistant/generate-quiz', {
        courseId: selectedCourseId,
        topic: quizTopic || 'Key Concepts',
        numberOfQuestions: 3
      });
      if (res.data.success) {
        setGeneratedQuiz(res.data.data);
        toast.success('Practice questions synthesized from notes!');
      }
    } catch (err) {
      toast.error('Failed to generate quiz.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const quickPrompts = [
    "Explain Dijkstra's shortest path algorithm with priority queues",
    "What is the difference between Kruskal and Prim MST algorithms?",
    "Generate 3 revision flashcard questions from my DSA syllabus",
    "Explain AVL tree balance factors and rotation cases in simple terms"
  ];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row gap-4">
      {/* Left Sidebar: Conversations & Scopes */}
      <div className="hidden lg:flex w-72 bg-white rounded-2xl border border-slate-200 p-4 flex-col justify-between shadow-xs">
        <div className="space-y-4">
          <button
            onClick={handleStartNewChat}
            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" /> New Discussion
          </button>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              RAG Scoped Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
            >
              <option value="">All Enrolled Courses</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Recent Conversations
            </label>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {conversations.map(c => (
                <button
                  key={c._id}
                  onClick={() => loadConversation(c._id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium truncate transition flex items-center gap-2 ${
                    activeConversationId === c._id
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </button>
              ))}

              {conversations.length === 0 && (
                <p className="text-[11px] text-slate-400 py-3 text-center">No previous chats.</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowQuizModal(true)}
          className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
        >
          <Award className="w-4 h-4 text-indigo-600" /> Synthesize Practice Quiz
        </button>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Academic Tutor</h3>
              <p className="text-[11px] text-slate-500">
                Grounded in uploaded lecture PDFs &bull; Cosine Term Vector Retrieval
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuizModal(true)}
              className="lg:hidden p-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold"
            >
              Quiz Gen
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="py-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">SmartCampus Study AI</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ask any questions directly relating to your enrolled courses. The AI searches through indexed lecture handouts and presents answers citing the exact sources.
              </p>

              <div className="text-left space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Query Suggestions:
                </span>
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => { setInputMessage(prompt); }}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs text-slate-700 transition"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Grounding Source Citations */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Cited Course References:
                    </span>
                    {m.sources.map((src, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2 rounded-lg bg-white/80 border border-slate-200/60 text-[11px] text-slate-600"
                      >
                        <strong className="text-slate-800 block">{src.title} (Match Score: {src.score})</strong>
                        <span className="italic line-clamp-2">"{src.snippet}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 text-slate-500 rounded-xl w-36 text-xs animate-pulse">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>Analyzing notes...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2 bg-slate-50/30">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about graph algorithms, virtual memory, or request revision summaries..."
            className="flex-1 px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Practice Quiz Synthesis Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">AI Practice Quiz Generator</h3>
              </div>
              <button
                onClick={() => { setShowQuizModal(false); setGeneratedQuiz(null); }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedQuiz ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  Synthesized <strong>{generatedQuiz.questions.length} practice MCQs</strong> for <em>{generatedQuiz.course.code} &bull; {generatedQuiz.topic}</em>.
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {generatedQuiz.questions.map((q, qIdx) => (
                    <div key={qIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                      <p className="font-bold text-slate-900 mb-2">Q{qIdx + 1}: {q.questionText}</p>
                      <div className="space-y-1 mb-2">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg text-xs font-medium ${
                              oIdx === q.correctOptionIndex
                                ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                                : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}. {opt}{' '}
                            {oIdx === q.correctOptionIndex && '✓ (Correct)'}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={() => setGeneratedQuiz(null)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                  >
                    Generate Another
                  </button>
                  <button
                    onClick={() => setShowQuizModal(false)}
                    className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Synthesizes multiple-choice questions directly from lecture notes uploaded by your course professor.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  >
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Chapter Focus</label>
                  <input
                    type="text"
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    placeholder="e.g. Graph Algorithms, AVL Trees, Semaphores"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={generatingQuiz}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {generatingQuiz ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate Practice Quiz from Notes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
