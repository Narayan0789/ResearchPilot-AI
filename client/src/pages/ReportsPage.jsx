import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck2,
  Sparkles,
  Printer,
  Copy,
  Check,
  Plus,
  Loader2,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext.jsx';
import api from '../services/api.js';

export default function ReportsPage() {
  const { activeProject } = useProject();

  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // New Report Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportTopic, setReportTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeProject?._id) return;

    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/projects/${activeProject._id}/reports`);
        if (res.success && res.reports) {
          setReports(res.reports);
          if (res.reports.length > 0) {
            setActiveReport(res.reports[0]);
          }
        }
      } catch (err) {
        console.warn('Could not load reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
    setReportTopic(activeProject.topic || '');
    setReportTitle(`${activeProject.title} — Executive Synthesis`);
  }, [activeProject?._id]);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!activeProject?._id || !reportTitle.trim()) return;

    try {
      setIsGenerating(true);
      const res = await api.post(`/projects/${activeProject._id}/reports`, {
        title: reportTitle.trim(),
        topic: reportTopic.trim() || activeProject.topic,
        format: 'markdown',
      });

      if (res.success && res.report) {
        setReports((prev) => [res.report, ...prev]);
        setActiveReport(res.report);
        setShowCreateForm(false);
      }
    } catch (err) {
      alert(`Report generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyContent = () => {
    if (activeReport?.content) {
      navigator.clipboard.writeText(activeReport.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-navy-950 overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-navy-900/40 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-teal-400" />
            <span>Research Reports & Formal Syntheses</span>
          </h1>
          <p className="text-xs text-slate-400">
            Generate formal cited briefs across your indexed library
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-semibold text-xs flex items-center space-x-2 shadow-md shadow-teal-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Research Report</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Reports List Left Sidebar */}
        <div className="w-72 border-r border-slate-800 bg-navy-900/30 overflow-y-auto p-4 space-y-2 hidden md:block">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-2 py-1">
            Generated Reports ({reports.length})
          </div>

          {reports.map((r) => (
            <button
              key={r._id}
              onClick={() => setActiveReport(r)}
              className={`w-full text-left p-3 rounded-xl border text-xs transition-all space-y-1 ${
                activeReport?._id === r._id
                  ? 'bg-teal-500/15 border-teal-500/30 text-teal-200'
                  : 'bg-navy-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <h4 className="font-semibold truncate">{r.title}</h4>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-teal-400" />
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </span>
                <span>{r.sourcesUsed?.length || 0} citations</span>
              </div>
            </button>
          ))}

          {reports.length === 0 && !loading && (
            <div className="p-6 text-center text-xs text-slate-500 space-y-2">
              <p>No research reports generated yet.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-teal-400 hover:underline font-medium"
              >
                Compile First Report
              </button>
            </div>
          )}
        </div>

        {/* Report Content View */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6">
          {activeReport ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Action Toolbar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30">
                    Formal Report
                  </span>
                  <span>•</span>
                  <span>{new Date(activeReport.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyContent}
                    className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center space-x-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center space-x-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-400" />
                    <span>Print / PDF Export</span>
                  </button>
                </div>
              </div>

              {/* Formatted Markdown Content */}
              <div className="p-8 rounded-2xl bg-navy-900 border border-slate-800 text-xs sm:text-sm text-slate-200 font-serif leading-relaxed space-y-4 whitespace-pre-wrap shadow-xl">
                {activeReport.content}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center">
              <div className="max-w-sm space-y-3">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-200">No Report Selected</h3>
                <p className="text-xs text-slate-500">
                  Select a generated report from the list or compile a new structured synthesis.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-semibold"
                >
                  Create New Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-navy-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Generate Research Report</span>
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Report Focus & Scope
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportTopic}
                  onChange={(e) => setReportTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-navy-950 font-bold text-xs flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Report...</span>
                    </>
                  ) : (
                    <span>Compile Report</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
