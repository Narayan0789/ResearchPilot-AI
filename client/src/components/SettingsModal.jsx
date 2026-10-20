import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Settings, Key, Sliders, Database, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function SettingsModal({ isOpen, onClose }) {
  const { activeProject, updateProject } = useProject();
  const { user } = useAuth();

  const [chunkSize, setChunkSize] = useState(600);
  const [chunkOverlap, setChunkOverlap] = useState(120);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.25);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeProject?.researchSettings) {
      setChunkSize(activeProject.researchSettings.chunkSize || 600);
      setChunkOverlap(activeProject.researchSettings.chunkOverlap || 120);
      setSimilarityThreshold(activeProject.researchSettings.similarityThreshold || 0.25);
      setWebSearchEnabled(activeProject.researchSettings.webSearchEnabled ?? true);
    }
  }, [activeProject]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeProject) return;

    try {
      setIsSaving(true);
      setError('');
      await updateProject(activeProject._id, {
        researchSettings: {
          chunkSize: Number(chunkSize),
          chunkOverlap: Number(chunkOverlap),
          similarityThreshold: Number(similarityThreshold),
          webSearchEnabled,
        },
      });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      setIsSaving(false);
      setError(err.message || 'Failed to update research settings.');
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
              <Settings className="w-4 h-4 text-teal-400" />
              <span>Workspace Settings & Parameters</span>
            </h2>
            <p className="text-xs text-slate-400">Configure RAG retrieval thresholds, chunking, and AI providers</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-xs text-teal-300 flex items-start space-x-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          {/* RAG Sliders */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              <span>Retrieval Hyperparameters</span>
            </h3>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Text Chunk Size</span>
                <span className="font-mono text-teal-400">{chunkSize} characters</span>
              </div>
              <input
                type="range"
                min="200"
                max="1500"
                step="50"
                value={chunkSize}
                onChange={(e) => setChunkSize(e.target.value)}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Controls the maximum character window extracted per passage.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Chunk Overlap</span>
                <span className="font-mono text-teal-400">{chunkOverlap} characters</span>
              </div>
              <input
                type="range"
                min="0"
                max="400"
                step="20"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(e.target.value)}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Preserves context continuity across consecutive chunk splits.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Minimum Similarity Threshold</span>
                <span className="font-mono text-teal-400">{similarityThreshold}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(e.target.value)}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Cosine similarity cutoff. Higher values require tighter semantic relevance.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200">Automatic Web Search</span>
                <p className="text-[11px] text-slate-500">Discover and cite external web research sources</p>
              </div>
              <input
                type="checkbox"
                checked={webSearchEnabled}
                onChange={(e) => setWebSearchEnabled(e.target.checked)}
                className="h-4 w-4 rounded accent-teal-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Engine & Provider Info */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>Storage & Providers</span>
            </h3>

            <div className="p-3 rounded-xl bg-navy-950/50 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Vector Store Adapter</span>
                <span className="text-teal-400 font-mono">LocalMongoVectorStore (Active)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Embedding Engine</span>
                <span className="text-slate-200 font-mono">Subword Cosine L2 (384-dim)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account</span>
                <span className="text-slate-200 font-mono">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold text-xs flex items-center space-x-2 transition-all shadow-md shadow-teal-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Parameters</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
