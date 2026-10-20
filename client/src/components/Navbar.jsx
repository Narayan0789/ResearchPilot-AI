import React, { useState } from 'react';
import {
  Compass,
  FolderOpen,
  Plus,
  Upload,
  LogOut,
  ChevronDown,
  User,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useProject } from '../contexts/ProjectContext.jsx';

export default function Navbar({ onOpenUpload, onOpenNewProject, onOpenSettings }) {
  const { user, logout } = useAuth();
  const { projects, activeProject, setActiveProject } = useProject();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 bg-navy-950/80 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Project Switcher */}
      <div className="flex items-center space-x-4 lg:space-x-6">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-navy-950 shadow-md shadow-teal-500/25 font-bold">
            <Compass className="w-5 h-5 text-navy-950 animate-pulse-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-tight text-white">ResearchPilot</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-widest">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Personal Research Assistant</p>
          </div>
        </div>

        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-[200px]">
              {activeProject ? activeProject.title : 'Select Project'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-navy-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Research Workspaces
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 my-1">
                {projects.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => {
                      setActiveProject(p);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeProject?._id === p._id
                        ? 'bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{p.title}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                      {p.sourceCount || 0} src
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-800/80 pt-1 mt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewProject();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-teal-400 hover:bg-teal-500/10 flex items-center space-x-2 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Project</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Upload Source Button */}
        <button
          onClick={onOpenUpload}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-teal-400" />
          <span>Add Source</span>
        </button>

        {/* New Project Quick Button */}
        <button
          onClick={onOpenNewProject}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 text-xs font-semibold transition-all shadow-md shadow-teal-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">New Project</span>
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-navy-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover border border-teal-500/40"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 text-xs font-bold border border-slate-700">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <span className="text-xs font-medium text-slate-200 hidden lg:inline max-w-[120px] truncate">
              {user?.name || 'Researcher'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500 hidden sm:inline" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-navy-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 flex items-center space-x-2 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>RAG Settings & Keys</span>
              </button>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-950/30 flex items-center space-x-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
