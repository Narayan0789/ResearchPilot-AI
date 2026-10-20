import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Globe,
  FileText,
  Upload,
  Bot,
  User,
  Loader2,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Search,
  BookOpen,
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext.jsx';
import api from '../services/api.js';
import { renderContentWithCitations } from '../utils/citationParser.jsx';

export default function ResearchStudioPage({ onOpenUpload, onOpenNewProject }) {
  const { activeProject, sources, setInspectedCitation } = useProject();

  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  // Initialize or fetch messages for active project
  useEffect(() => {
    if (!activeProject?._id) return;

    const fetchHistory = async () => {
      try {
        const convRes = await api.get(`/projects/${activeProject._id}/conversations`);
        if (convRes.success && convRes.conversations?.length > 0) {
          const convId = convRes.conversations[0]._id;
          const msgRes = await api.get(`/conversations/${convId}/messages`);
          if (msgRes.success && msgRes.messages?.length > 0) {
            setMessages(msgRes.messages);
          } else {
            // Seed welcome assistant prompt
            setMessages([
              {
                role: 'assistant',
                content: `### Welcome to ResearchPilot AI Workspace\n\nI am configured for your project: **"${activeProject.title}"**.\n\nI will answer your questions using verified evidence from your uploaded documents and web sources. Every factual claim will feature a clickable citation pill that you can click to inspect the ground-truth text.`,
                citations: [],
              },
            ]);
          }
        }
      } catch (err) {
        console.warn('Could not load chat history:', err);
      }
    };

    fetchHistory();
    setWebSearchEnabled(activeProject.researchSettings?.webSearchEnabled ?? true);
  }, [activeProject?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (queryToSend) => {
    const query = (queryToSend || inputQuery).trim();
    if (!query || !activeProject?._id || isLoading) return;

    setInputQuery('');
    const userMessage = {
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await api.post(`/projects/${activeProject._id}/chat`, {
        message: query,
        enableWebSearch: webSearchEnabled,
      });

      if (res.success && res.assistantMessage) {
        setMessages((prev) => [...prev, res.assistantMessage]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Research Execution Warning**: ${err.message}`,
          citations: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Topic-tailored starter prompt suggestions
  const suggestedQueries = [
    `Summarize the key empirical methodology and findings across all sources`,
    `What are the verified limitations or open challenges mentioned in the documents?`,
    `Identify any conflicting claims or contradictions between the indexed sources`,
  ];

  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">No Research Project Selected</h2>
          <p className="text-xs text-slate-400">
            Create or select a research project to begin indexing sources and querying verified evidence.
          </p>
          <button
            onClick={onOpenNewProject}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-navy-950 font-bold text-xs"
          >
            Create New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-navy-950 overflow-hidden">
      {/* Top Studio Bar */}
      <div className="px-6 py-3 border-b border-slate-800 bg-navy-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          <h1 className="text-xs font-semibold text-slate-200 truncate max-w-sm">
            {activeProject.title}
          </h1>
          <span className="text-[11px] text-slate-500">|</span>
          <span className="text-[11px] text-slate-400">
            {sources.length} {sources.length === 1 ? 'source' : 'sources'} in index
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
              webSearchEnabled
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                : 'bg-navy-800 border-slate-700 text-slate-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Search {webSearchEnabled ? 'On' : 'Off'}</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1 text-teal-400 hover:text-teal-300 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF / Link</span>
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-12 py-6 space-y-6">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start space-x-3 max-w-4xl mx-auto ${
                isUser ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'bg-teal-500/15 border border-teal-500/30 text-teal-300'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex-1 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-teal-600/20 border border-teal-500/30 text-slate-100 max-w-xl'
                    : 'bg-navy-900/90 border border-slate-800/90 text-slate-200 shadow-xl'
                }`}
              >
                {/* Message Header for Assistant */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[11px] text-slate-400">
                    <span className="font-semibold text-teal-400 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Synthesized Evidence</span>
                    </span>
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="hover:text-slate-200 flex items-center space-x-1 transition-colors"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3 h-3 text-teal-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}

                {/* Content with Interactive Citations */}
                <div className="whitespace-pre-wrap space-y-2 prose prose-invert max-w-none">
                  {isUser
                    ? msg.content
                    : renderContentWithCitations(msg.content, msg.citations, (cit) =>
                        setInspectedCitation(cit)
                      )}
                </div>

                {/* Grounded Citations Footer Bar */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="text-[11px] font-semibold text-slate-400 mb-2">
                      Cited References ({msg.citations.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => setInspectedCitation(c)}
                          className="px-2.5 py-1 rounded-lg bg-navy-950/80 hover:bg-slate-800 border border-teal-500/25 text-[11px] font-medium text-teal-300 flex items-center space-x-1.5 transition-colors group"
                        >
                          <span className="font-bold text-teal-400">[{c.citationIndex}]</span>
                          <span className="truncate max-w-[150px]">{c.title}</span>
                          {c.pageNumber && (
                            <span className="text-slate-400 text-[10px]">p. {c.pageNumber}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center space-x-3 max-w-4xl mx-auto text-xs text-slate-400">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-xl bg-navy-900/60 border border-slate-800 flex items-center space-x-3">
              <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
              <span>Scanning vector space, evaluating hybrid score, and synthesizing grounded answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Queries Starter Chips */}
      {messages.length <= 1 && (
        <div className="px-6 py-2 max-w-4xl mx-auto w-full">
          <div className="text-[11px] text-slate-500 font-medium mb-1.5">Quick Research Prompts:</div>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((query, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(query)}
                className="px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-[11px] text-slate-300 text-left transition-all"
              >
                "{query}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query Input Bar */}
      <div className="p-4 border-t border-slate-800 bg-navy-950/80 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex items-center space-x-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask a question grounded in "${activeProject.title}"...`}
              disabled={isLoading}
              className="w-full pl-4 pr-10 py-3 rounded-xl glass-input text-xs sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-bold transition-all disabled:opacity-40 shadow-md shadow-teal-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
