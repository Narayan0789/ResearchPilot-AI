import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ProjectProvider, useProject } from './contexts/ProjectContext.jsx';

import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import CitationViewerDrawer from './components/CitationViewerDrawer.jsx';
import SourceUploadModal from './components/SourceUploadModal.jsx';
import NewProjectModal from './components/NewProjectModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';

import LandingPage from './pages/LandingPage.jsx';
import AuthModal from './pages/AuthModal.jsx';
import ResearchStudioPage from './pages/ResearchStudioPage.jsx';
import SourcesLibraryPage from './pages/SourcesLibraryPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const { inspectedCitation, setInspectedCitation } = useProject();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // Initial loading state while validating JWT cookie
  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-teal-400 tracking-wider uppercase font-mono">
            Initializing ResearchPilot AI...
          </p>
        </div>
      </div>
    );
  }

  // If unauthenticated, show premium animated Landing Page with Auth Modal
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage onOpenAuth={handleOpenAuth} />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
        />
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#0f172a', color: '#f8fafc', border: '1px solid #1e293b' } }} />
      </>
    );
  }

  // Authenticated Workspace Layout
  return (
    <div className="h-screen w-screen bg-navy-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        onOpenUpload={() => setUploadModalOpen(true)}
        onOpenNewProject={() => setNewProjectModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-navy-950">
          <Routes>
            <Route
              path="/"
              element={
                <ResearchStudioPage
                  onOpenUpload={() => setUploadModalOpen(true)}
                  onOpenNewProject={() => setNewProjectModalOpen(true)}
                />
              }
            />
            <Route
              path="/sources"
              element={<SourcesLibraryPage onOpenUpload={() => setUploadModalOpen(true)} />}
            />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Interactive Modals & Drawers */}
      <CitationViewerDrawer
        citation={inspectedCitation}
        onClose={() => setInspectedCitation(null)}
      />

      <SourceUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />

      <NewProjectModal
        isOpen={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #1e293b',
            fontSize: '12px',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <MainApp />
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
