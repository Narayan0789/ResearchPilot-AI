import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  FileBox,
  FileCheck2,
  History,
  Sparkles,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext.jsx';

export default function Sidebar() {
  const { activeProject, sources } = useProject();

  const navItems = [
    {
      to: '/',
      label: 'Research Studio',
      icon: MessageSquare,
      description: 'Grounded Q&A with citations',
    },
    {
      to: '/sources',
      label: 'Source Library',
      icon: FileBox,
      badge: sources.length,
      description: 'PDFs & crawled pages',
    },
    {
      to: '/reports',
      label: 'Research Reports',
      icon: FileCheck2,
      description: 'Synthesis & exports',
    },
    {
      to: '/history',
      label: 'Research History',
      icon: History,
      description: 'Audit runs & evidence logs',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-navy-950 flex flex-col justify-between shrink-0 hidden md:flex select-none">
      <div className="p-4 space-y-6">
        {/* Navigation Links */}
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1">
            Workspace Navigation
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-900'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-navy-800 text-slate-300 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Active Project Meta Card */}
        {activeProject && (
          <div className="p-3.5 rounded-xl bg-navy-900/80 border border-slate-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Topic
              </span>
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-200 font-medium line-clamp-3 leading-relaxed">
              {activeProject.topic}
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center space-x-1">
                <Layers className="w-3 h-3 text-teal-400" />
                <span>{sources.length} sources</span>
              </span>
              <span className="text-teal-400 font-medium">Grounded RAG</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-navy-950/60 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Engine Status</span>
          <span className="text-teal-400 font-medium flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 inline-block" />
            <span>Local Vector Active</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Verification Guard</span>
          <span className="text-slate-400 font-mono">Strict 100%</span>
        </div>
      </div>
    </aside>
  );
}
