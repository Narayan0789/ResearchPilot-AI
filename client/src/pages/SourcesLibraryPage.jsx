import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Globe,
  Upload,
  Trash2,
  ExternalLink,
  BookOpen,
  Layers,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext.jsx';

export default function SourcesLibraryPage({ onOpenUpload }) {
  const { activeProject, sources, deleteSource, loadingSources } = useProject();
  const [searchFilter, setSearchFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const filteredSources = sources.filter(
    (s) =>
      s.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.url?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}" and all its vector chunks?`)) {
      setDeletingId(id);
      try {
        await deleteSource(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'indexed':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Indexed</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Chunking</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-navy-950 overflow-y-auto p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <span>Source Library</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Indexed documents and web pages for workspace: <strong className="text-slate-200">{activeProject?.title}</strong>
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-semibold text-xs flex items-center space-x-2 shadow-md shadow-teal-500/20 transition-all self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload PDF or Add Link</span>
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter indexed sources by title or URL..."
          className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
      </div>

      {/* Sources Grid */}
      {filteredSources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map((source) => {
            const isPdf = source.type === 'pdf';
            return (
              <motion.div
                key={source._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-navy-900 border border-slate-800 hover:border-slate-700 space-y-4 flex flex-col justify-between transition-all glass-panel-hover"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                      {isPdf ? <FileText className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>
                    {getStatusBadge(source.status)}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug">
                      {source.title}
                    </h3>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-teal-400 hover:underline flex items-center space-x-1 mt-1 truncate"
                      >
                        <span className="truncate">{source.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Format</span>
                      <span className="font-medium text-slate-300 uppercase">{source.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">
                        {isPdf ? 'Page Count' : 'Sections'}
                      </span>
                      <span className="font-medium text-slate-300">
                        {isPdf ? `${source.pageCount || 1} pages` : 'Web Sections'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Vector Chunks</span>
                      <span className="font-medium text-slate-300">
                        {source.chunkCount || source.retrievalMetadata?.totalChunks || 0} chunks
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Indexed Date</span>
                      <span className="font-medium text-slate-300">
                        {new Date(source.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  {isPdf && source.fileKey ? (
                    <a
                      href={`/api/v1/sources/${source._id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View PDF</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Indexed for Retrieval</span>
                  )}

                  <button
                    onClick={() => handleDelete(source._id, source.title)}
                    disabled={deletingId === source._id}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Delete source and remove its vector embeddings"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-navy-900/40 border border-slate-800 space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No sources indexed yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload PDF research papers or provide article links to populate the project's vector retrieval index.
          </p>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-semibold hover:bg-teal-500/30 transition-colors"
          >
            Add First Source
          </button>
        </div>
      )}
    </div>
  );
}
