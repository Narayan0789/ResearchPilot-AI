import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [sources, setSources] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);

  // Global citation inspection drawer state
  const [inspectedCitation, setInspectedCitation] = useState(null);

  // Fetch all user projects
  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingProjects(true);
      const res = await api.get('/projects');
      if (res.success) {
        setProjects(res.projects);
        // Automatically select first project if none is active or active is outdated
        if (res.projects.length > 0 && !activeProject) {
          setActiveProject(res.projects[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, [isAuthenticated, activeProject]);

  useEffect(() => {
    fetchProjects();
  }, [isAuthenticated]);

  // Fetch sources for active project
  const fetchSources = useCallback(async () => {
    if (!activeProject?._id) {
      setSources([]);
      return;
    }
    try {
      setLoadingSources(true);
      const res = await api.get(`/projects/${activeProject._id}/sources`);
      if (res.success) {
        setSources(res.sources);
      }
    } catch (err) {
      console.error('Error fetching sources:', err);
    } finally {
      setLoadingSources(false);
    }
  }, [activeProject?._id]);

  useEffect(() => {
    fetchSources();
  }, [activeProject?._id, fetchSources]);

  // Create project
  const createProject = async (data) => {
    const res = await api.post('/projects', data);
    if (res.success && res.project) {
      setProjects((prev) => [res.project, ...prev]);
      setActiveProject(res.project);
    }
    return res;
  };

  // Update project
  const updateProject = async (id, data) => {
    const res = await api.patch(`/projects/${id}`, data);
    if (res.success && res.project) {
      setProjects((prev) => prev.map((p) => (p._id === id ? res.project : p)));
      if (activeProject?._id === id) {
        setActiveProject(res.project);
      }
    }
    return res;
  };

  // Delete project
  const deleteProject = async (id) => {
    const res = await api.delete(`/projects/${id}`);
    if (res.success) {
      const remaining = projects.filter((p) => p._id !== id);
      setProjects(remaining);
      if (activeProject?._id === id) {
        setActiveProject(remaining[0] || null);
      }
    }
    return res;
  };

  // Upload PDF source
  const uploadPdfSource = async (file, title) => {
    if (!activeProject) throw new Error('No active project selected');
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const res = await api.post(`/projects/${activeProject._id}/sources/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (res.success && res.source) {
      setSources((prev) => [res.source, ...prev]);
      // Refresh project to update stats
      fetchProjects();
    }
    return res;
  };

  // Ingest Web URL source
  const ingestUrlSource = async (url, title) => {
    if (!activeProject) throw new Error('No active project selected');
    const res = await api.post(`/projects/${activeProject._id}/sources/url`, { url, title });
    if (res.success && res.source) {
      setSources((prev) => [res.source, ...prev]);
      fetchProjects();
    }
    return res;
  };

  // Delete source
  const deleteSource = async (id) => {
    const res = await api.delete(`/sources/${id}`);
    if (res.success) {
      setSources((prev) => prev.filter((s) => s._id !== id));
      fetchProjects();
    }
    return res;
  };

  const value = {
    projects,
    activeProject,
    setActiveProject,
    sources,
    loadingProjects,
    loadingSources,
    fetchProjects,
    fetchSources,
    createProject,
    updateProject,
    deleteProject,
    uploadPdfSource,
    ingestUrlSource,
    deleteSource,
    inspectedCitation,
    setInspectedCitation,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

export default ProjectContext;
