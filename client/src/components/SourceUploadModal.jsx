import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Globe, FileText, AlertCircle, CheckCircle, Loader2, Link2 } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext.jsx';

export default function SourceUploadModal({ isOpen, onClose }) {
  const { uploadPdfSource, ingestUrlSource } = useProject();
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'url'

  // PDF Form State
  const [file, setFile] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // URL Form State
  const [url, setUrl] = useState('');
  const [urlTitle, setUrlTitle] = useState('');

  // Status State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf')) {
        setFile(selected);
        if (!pdfTitle) setPdfTitle(selected.name.replace(/\.[^/.]+$/, ''));
      } else {
        setErrorMessage('Only PDF documents are supported for upload.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!pdfTitle) setPdfTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handlePdfSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a PDF file to upload.');
      return;
    }
    setErrorMessage('');
    setIsUploading(true);
    setUploadProgress(25);

    try {
      // Simulate progress feedback for UX
      const timer = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + 20 : p));
      }, 300);

      await uploadPdfSource(file, pdfTitle);
      clearInterval(timer);
      setUploadProgress(100);
      setSuccessMessage('PDF uploaded and indexed successfully into project memory!');

      setTimeout(() => {
        setIsUploading(false);
        onClose();
      }, 1200);
    } catch (err) {
      setIsUploading(false);
      setErrorMessage(err.message || 'Failed to upload and index PDF.');
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setErrorMessage('Please enter a valid website URL.');
      return;
    }
    setErrorMessage('');
    setIsUploading(true);
    setUploadProgress(40);

    try {
      await ingestUrlSource(url.trim(), urlTitle.trim() || undefined);
      setUploadProgress(100);
      setSuccessMessage('Website content extracted and indexed successfully!');

      setTimeout(() => {
        setIsUploading(false);
        onClose();
      }, 1200);
    } catch (err) {
      setIsUploading(false);
      setErrorMessage(err.message || 'Failed to ingest URL.');
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
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-navy-950/50">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-teal-400" />
              <span>Ingest Research Source</span>
            </h2>
            <p className="text-xs text-slate-400">Add documents or external links to index into project vector space</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-navy-950/30 px-6 pt-2">
          <button
            onClick={() => { setActiveTab('pdf'); setErrorMessage(''); }}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'pdf'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Upload PDF Document</span>
          </button>
          <button
            onClick={() => { setActiveTab('url'); setErrorMessage(''); }}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'url'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Website URL Ingestion</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-xs text-teal-300 flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* PDF Uploader Form */}
          {activeTab === 'pdf' && (
            <form onSubmit={handlePdfSubmit} className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-teal-400 bg-teal-950/20'
                    : 'border-slate-700/70 hover:border-teal-500/50 bg-navy-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="h-12 w-12 mx-auto rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <p className="text-xs font-semibold text-teal-300 truncate max-w-xs mx-auto">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for chunking & indexing
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-medium text-slate-200">
                      Drag and drop your PDF here, or <span className="text-teal-400 underline">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Max file size: 20MB. Page numbers will be extracted automatically.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  placeholder="e.g. Attention Is All You Need (Vaswani et al.)"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              {/* Progress Bar when uploading */}
              {isUploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Extracting pages and embedding vectors...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-teal-400 to-cyan-500 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: 'easeOut', duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-semibold text-xs flex items-center space-x-2 transition-all disabled:opacity-50 shadow-md shadow-teal-500/20"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Indexing PDF...</span>
                    </>
                  ) : (
                    <span>Upload & Index PDF</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Web URL Form */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Website URL <span className="text-teal-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://arxiv.org/html/2312.00752v2"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                  <Link2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Protected with SSRF safeguards. Private IP addresses and malicious redirects are blocked.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Custom Source Label (Optional)
                </label>
                <input
                  type="text"
                  value={urlTitle}
                  onChange={(e) => setUrlTitle(e.target.value)}
                  placeholder="e.g. Gemini 1.5 Architecture Paper"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              {/* Progress Bar when uploading */}
              {isUploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Scraping clean DOM, chunking, and embedding...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-teal-400 to-cyan-500 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: 'easeOut', duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !url.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-semibold text-xs flex items-center space-x-2 transition-all disabled:opacity-50 shadow-md shadow-teal-500/20"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ingesting URL...</span>
                    </>
                  ) : (
                    <span>Scrape & Index URL</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
