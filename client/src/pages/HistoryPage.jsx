import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Clock,
  Layers,
  Globe,
  Sparkles,
  Search,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext.jsx';
import api from '../services/api.js';

export default function HistoryPage() {
  const { activeProject } = useProject();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    if (!activeProject?._id) return;

    const fetchRuns = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/projects/${activeProject._id}/research-runs`);
        if (res.success && res.runs) {
          setRuns(res.runs);
          if (res.runs.length > 0) {
            setSelectedRun(res.runs[0]);
          }
        }
      } catch (err) {
        console.warn('Could not load research runs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, [activeProject?._id]);

  return (
    <div className="flex-1 flex flex-col h-full bg-navy-950 overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-navy-900/40 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <History className="w-5 h-5 text-teal-400" />
            <span>Research Audit Trail & Query Runs</span>
          </h1>
          <p className="text-xs text-slate-400">
            Audit logs, token metrics, and citation verifications for: <strong className="text-slate-200">{activeProject?.title}</strong>
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Runs List */}
        <div className="w-80 border-r border-slate-800 bg-navy-900/30 overflow-y-auto p-4 space-y-2 hidden md:block">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-2 py-1">
            Execution Log ({runs.length})
          </div>

          {runs.map((r) => (
            <button
              key={r._id}
              onClick={() => setSelectedRun(r)}
              className={`w-full text-left p-3 rounded-xl border text-xs transition-all space-y-1.5 ${
                selectedRun?._id === r._id
                  ? 'bg-teal-500/15 border-teal-500/30 text-teal-200 shadow-sm'
                  : 'bg-navy-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <p className="font-semibold line-clamp-2">"{r.query}"</p>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-teal-400" />
                  <span>{new Date(r.createdAt).toLocaleTimeString()}</span>
                </span>
                <span className="text-teal-400 font-mono">
                  {r.searchMetadata?.validCitationsCount || 0} citations
                </span>
              </div>
            </button>
          ))}

          {runs.length === 0 && !loading && (
            <div className="p-6 text-center text-xs text-slate-500">
              No research runs recorded yet. Perform a query in the Research Studio to create an audit record.
            </div>
          )}
        </div>

        {/* Selected Run Details */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6">
          {selectedRun ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Top Query Card */}
              <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    Run ID: {selectedRun._id.slice(-8)}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>{new Date(selectedRun.createdAt).toLocaleString()}</span>
                  </span>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Research Query
                  </label>
                  <p className="text-base font-semibold text-slate-100">
                    "{selectedRun.query}"
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase">Latency</span>
                    <p className="text-slate-200 font-mono font-medium flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      <span>{selectedRun.usage?.executionTimeMs || 0} ms</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase">Retrieved Chunks</span>
                    <p className="text-slate-200 font-mono font-medium flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-teal-400" />
                      <span>{selectedRun.searchMetadata?.retrievedChunksCount || 0} passages</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase">Verified Citations</span>
                    <p className="text-slate-200 font-mono font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                      <span>{selectedRun.searchMetadata?.validCitationsCount || 0} anchors</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase">Web Search</span>
                    <p className="text-slate-200 font-mono font-medium flex items-center space-x-1">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{selectedRun.searchMetadata?.webSearchUsed ? 'Enabled' : 'Off'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Synthesized Output */}
              {selectedRun.answer && (
                <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Audited Answer Output</span>
                  </h3>
                  <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-serif">
                    {selectedRun.answer}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center text-xs text-slate-500">
              Select a research run to view full audit logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
