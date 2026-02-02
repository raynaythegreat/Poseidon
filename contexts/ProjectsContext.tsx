"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Project } from "@/types/projects";

interface ProjectsContextType {
  projects: Project[];
  addProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  getProjectById: (projectId: string) => Project | undefined;
  getProjectsByType: (type: Project["type"]) => Project[];
  getRecentProjects: (limit?: number) => Project[];
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

const STORAGE_KEY = "poseidon-projects";
const MAX_PROJECTS = 100;

function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, MAX_PROJECTS)));
  } catch (error) {
    console.error("Failed to save projects:", error);
  }
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setProjects(loadProjects());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveProjects(projects);
    }
  }, [projects, isLoaded]);

  const addProject = useCallback((project: Project) => {
    setProjects((prev) => {
      const exists = prev.find((p) => p.id === project.id);
      if (exists) {
        return prev.map((p) => (p.id === project.id ? { ...project, updatedAt: Date.now() } : p));
      }
      return [...prev, project];
    });
  }, []);

  const removeProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, ...updates, updatedAt: Date.now() } : p
      )
    );
  }, []);

  const getProjectById = useCallback(
    (projectId: string) => projects.find((p) => p.id === projectId),
    [projects]
  );

  const getProjectsByType = useCallback(
    (type: Project["type"]) => projects.filter((p) => p.type === type),
    [projects]
  );

  const getRecentProjects = useCallback(
    (limit: number = 6) =>
      [...projects]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, limit),
    [projects]
  );

  // Don't block rendering - render children with empty projects array immediately
  // Data will be loaded asynchronously via useEffect
  // The isLoaded state ensures we only save to localStorage after initial load

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        addProject,
        removeProject,
        updateProject,
        getProjectById,
        getProjectsByType,
        getRecentProjects,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within ProjectsProvider");
  }
  return context;
}
