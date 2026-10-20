import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Sliders, Globe, Layers, AlertCircle, Loader2 } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext.jsx';

export default function NewProjectModal({ isOpen, onClose }) {
  const { createProject } = useProject();

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Settings
  const [chunkSize, setChunkSize] = useState(600);
  const [chunkOverlap, setChunkOverlap] = useState(120);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.25);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !topic.trim()) {
      setError('Please provide both a project title and research topic.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createProject({
        title: title.trim(),
        topic: topic.trim(),
        researchSettings: {
          chunkSize: Number(chunkSize),
          chunkOverlap: Number(chunkOverlap),
          webSearchEnabled,
          similarityThreshold: Number(similarityThreshold),
        },
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to create research project.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-navy-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-navy-950/50">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>New Research Project</span>
            </h2>
            <p className="text-xs text-slate-400">Initialize a dedicated RAG workspace with isolated vector storage</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Project Title <span className="text-teal-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next-Gen Nuclear Fusion Architectures"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Research Objective & Topic Scope <span className="text-teal-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe the research questions, key technical domains, and objectives you are investigating..."
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs resize-none"
            />
          </div>

          {/* Advanced RAG Configuration Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center space-x-1.5 font-medium transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Retrieval Hyperparameters' : 'Configure RAG & Retrieval Parameters'}</span>
            </button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-4 rounded-xl bg-navy-950/60 border border-slate-800 space-y-3.5 text-xs"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Layers className="w-3 h-3 text-teal-400" />
                      <span>Chunk Size ({chunkSize} chars)</span>
                    </label>
                    <input
                      type="range"
                      min="200"
                      max="1200"
                      step="50"
                      value={chunkSize}
                      onChange={(e) => setChunkSize(e.target.value)}
                      className="w-full accent-teal-400 mt-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <span>Overlap ({chunkOverlap} chars)</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      step="20"
                      value={chunkOverlap}
                      onChange={(e) => setChunkOverlap(e.target.value)}
                      className="w-full accent-teal-400 mt-1 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-slate-200 flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5 text-teal-400" />
                      <span>Automatic Web Search Discovery</span>
                    </span>
                    <p className="text-[11px] text-slate-500">Augment private documents with live search results</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={webSearchEnabled}
                    onChange={(e) => setWebSearchEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-teal-400 cursor-pointer"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-semibold text-xs flex items-center space-x-2 transition-all disabled:opacity-50 shadow-md shadow-teal-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Workspace...</span>
                </>
              ) : (
                <span>Launch Project Workspace</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
