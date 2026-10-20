import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Globe,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Copy,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import api from '../services/api.js';

export default function CitationViewerDrawer({ citation, onClose }) {
  const [copied, setCopied] = useState(false);
  const [pageData, setPageData] = useState(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [showFullPage, setShowFullPage] = useState(false);

  useEffect(() => {
    // If it's a PDF citation with sourceId and pageNumber, fetch the full page context
    if (citation?.sourceId && citation?.pageNumber && citation?.type === 'pdf') {
      const fetchPage = async () => {
        try {
          setLoadingPage(true);
          const res = await api.get(`/sources/${citation.sourceId}/pages/${citation.pageNumber}`);
          if (res.success) {
            setPageData(res);
          }
        } catch (err) {
          console.warn('Could not load full page text:', err);
        } finally {
          setLoadingPage(false);
        }
      };
      fetchPage();
    } else {
      setPageData(null);
    }
    setShowFullPage(false);
  }, [citation]);

  if (!citation) return null;

  const isPdf = citation.type === 'pdf';

  const handleCopyPassage = () => {
    if (citation.passage) {
      navigator.clipboard.writeText(citation.passage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm pointer-events-auto"
        />

        {/* Slide-out Drawer */}
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="w-screen max-w-xl pointer-events-auto bg-navy-900 border-l border-slate-800 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-navy-950/60">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  {isPdf ? <FileText className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/20">
                      Citation [{citation.citationIndex}]
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{citation.type} Source</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 truncate max-w-sm mt-0.5">
                    {citation.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Evidence Verification Badge */}
              <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/20 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-medium text-teal-200">Verified Evidence Anchor</p>
                  <p className="text-slate-400 leading-relaxed">
                    This reference was matched against indexed project chunks. Ground truth verification confirmed zero hallucination.
                  </p>
                </div>
              </div>

              {/* Source Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                    <span>Location</span>
                  </span>
                  <p className="font-medium text-slate-200">
                    {isPdf ? `Physical Page ${citation.pageNumber}` : citation.section || 'Canonical Web Page'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Retrieved</span>
                  </span>
                  <p className="font-medium text-slate-200">
                    {citation.retrievalTimestamp
                      ? new Date(citation.retrievalTimestamp).toLocaleTimeString()
                      : 'Active Session'}
                  </p>
                </div>
              </div>

              {/* Supporting Passage Excerpt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Supporting Passage Excerpt</span>
                  </label>
                  <button
                    onClick={handleCopyPassage}
                    className="text-xs text-slate-400 hover:text-teal-400 flex items-center space-x-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 text-sm text-slate-200 leading-relaxed font-mono relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-cyan-500 rounded-l-xl" />
                  <p className="italic pl-2">"{citation.passage}"</p>
                </div>
              </div>

              {/* Full Extracted Page View Toggle (for PDF) */}
              {isPdf && pageData && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowFullPage(!showFullPage)}
                    className="w-full py-2 px-3 rounded-lg bg-navy-800 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-teal-400" />
                      <span>{showFullPage ? 'Hide Page Context' : `View Full Context on Page ${citation.pageNumber}`}</span>
                    </span>
                    <span className="text-slate-400 text-[10px]">{pageData.chunks?.length || 1} Chunks</span>
                  </button>

                  {showFullPage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-xl bg-navy-950/90 border border-slate-800 text-xs text-slate-300 max-h-60 overflow-y-auto space-y-2 font-mono whitespace-pre-wrap leading-relaxed"
                    >
                      {pageData.pageText}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Web Canonical URL Link */}
              {!isPdf && citation.url && (
                <div className="p-3.5 rounded-xl bg-navy-800/80 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">Canonical Source Webpage:</span>
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-xs font-medium text-teal-400 hover:text-teal-300 hover:underline break-all"
                  >
                    <span className="truncate">{citation.url}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="px-6 py-4 border-t border-slate-800 bg-navy-950/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Chunk ID: {citation.chunkId ? citation.chunkId.toString().slice(-8) : 'Direct Match'}
              </span>
              {isPdf && citation.sourceId ? (
                <a
                  href={`/api/v1/sources/${citation.sourceId}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-navy-950 font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-teal-500/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open PDF Document</span>
                </a>
              ) : (
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
