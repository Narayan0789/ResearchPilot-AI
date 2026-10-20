import React from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  FileText,
  Search,
  BookOpen,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

export default function LandingPage({ onOpenAuth }) {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-navy-950">
      {/* Top Navigation */}
      <header className="h-20 border-b border-slate-800/80 bg-navy-950/70 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-navy-950 shadow-lg shadow-teal-500/20">
            <Compass className="w-5 h-5 animate-pulse-slow text-navy-950" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white">ResearchPilot AI</span>
            <p className="text-[10px] text-teal-400 font-medium">Personal Research Assistant</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => onOpenAuth('login')}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-semibold text-xs transition-all shadow-md shadow-teal-500/20"
          >
            Get Started Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-16 pt-16 pb-24 overflow-hidden">
        {/* Glowing Background Radial */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-teal-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Grounded Semantic RAG • Actual PDF Page Numbers • Zero Hallucinations</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight"
          >
            Supercharge Your Research with{' '}
            <span className="text-gradient-teal">Verifiable, Cited Evidence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Ingest PDFs with physical page-level accuracy, crawl websites with SSRF protection, and synthesize comprehensive research answers where every claim is backed by clickable citations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
          >
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-xl shadow-teal-500/25 group"
            >
              <span>Start Researching Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-navy-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              Explore Live Demo
            </button>
          </motion.div>
        </div>

        {/* Interactive Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="max-w-5xl mx-auto mt-16 rounded-2xl glass-panel p-2 shadow-2xl border border-slate-800/80 overflow-hidden"
        >
          <div className="bg-navy-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="h-10 bg-navy-950/80 px-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">Research Studio — CRISPR & Gene Editing Ethics</span>
              </div>
              <span className="text-[11px] text-teal-400 font-medium px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                100% Grounded
              </span>
            </div>

            <div className="p-6 space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  AI
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
                  <p>
                    Clinical evaluations of CRISPR-Cas9 therapy in hemoglobinopathies demonstrated an{' '}
                    <strong className="text-teal-300">88% reduction in sickle hemoglobin</strong> levels among cohort participants{' '}
                    <span className="citation-pill">[1, p. 1]</span>. Importantly, high-throughput sequencing of 500 patient loci revealed off-target indel mutation frequencies{' '}
                    <strong className="text-teal-300">below 0.1%</strong>{' '}
                    <span className="citation-pill">[1, p. 2]</span>.
                  </p>
                  <p className="text-slate-400 text-xs">
                    Multilateral international consensus from the Global Bioethics Treaty reinforces that any human germline interventions remain strictly subject to transnational governance frameworks{' '}
                    <span className="citation-pill">[2]</span>.
                  </p>
                </div>
              </div>

              {/* Citations preview bar */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">Verified Evidence:</span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-navy-800 border border-slate-700 text-xs text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span>Clinical Advances in Cas9 (Page 1 & 2)</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-navy-800 border border-slate-700 text-xs text-slate-300">
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Global Bioethics Treaty (Nature Article)</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 lg:px-16 py-20 bg-navy-900/50 border-t border-slate-800">
        <div className="max-w-5xl mx-auto space-y-12 text-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Designed for Rigorous, Hallucination-Free Synthesis
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Every component is built around evidence verification, security protections, and researcher workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 space-y-3 glass-panel-hover">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Page-Level PDF Metadata</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Preserves exact physical PDF page numbers across sliding-window chunks so you can cite and jump to the exact source page.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 space-y-3 glass-panel-hover">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">SSRF & Injection Shield</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevents access to private networks, metadata IPs, and loopbacks while treating all retrieved passages as untrusted text.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 space-y-3 glass-panel-hover">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Local Vector Similarity</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero external subscriptions required. Runs local cosine vector retrieval natively on MongoDB with optional OpenAI/Gemini support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 px-6 lg:px-16 py-8 text-center text-xs text-slate-500">
        <p>© 2026 ResearchPilot AI. Built for researchers, analysts, and students.</p>
      </footer>
    </div>
  );
}
