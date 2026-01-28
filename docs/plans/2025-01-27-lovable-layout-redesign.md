# Lovable-Style Layout Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Poseidon's interface to match Lovable.dev's clean/modern aesthetic with integrated project management system featuring recently viewed chats, GitHub repos, and templates.

**Architecture:** Single-page application with persistent state management. Uses React Context for global state (chat history, projects, user settings). New home/dashboard page with hero section and project cards grid. Sidebar navigation remains but gets visual refresh.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, localStorage for persistence

---

## Prerequisites

Ensure you're in the Poseidon project directory:
```bash
cd ~/Documents/Poseidon
```

---

## Task 1: Create User Settings Context

**Files:**
- Create: `contexts/UserSettingsContext.tsx`

**Step 1: Create the UserSettingsContext**

```typescript
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserSettings {
  username: string;
  email?: string;
  theme: "light" | "dark" | "auto";
}

interface UserSettingsContextType {
  settings: UserSettings;
  updateUsername: (username: string) => void;
  updateEmail: (email: string) => void;
  updateTheme: (theme: UserSettings["theme"]) => void;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

const STORAGE_KEY = "poseidon-user-settings";

const DEFAULT_SETTINGS: UserSettings = {
  username: "Developer",
  theme: "dark",
};

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: UserSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setIsLoaded(true);
  }, []);

  const updateUsername = (username: string) => {
    const newSettings = { ...settings, username };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const updateEmail = (email: string) => {
    const newSettings = { ...settings, email };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const updateTheme = (theme: UserSettings["theme"]) => {
    const newSettings = { ...settings, theme };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  if (!isLoaded) return null;

  return (
    <UserSettingsContext.Provider value={{ settings, updateUsername, updateEmail, updateTheme }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("useUserSettings must be used within UserSettingsProvider");
  }
  return context;
}
```

**Step 2: Commit**

```bash
git add contexts/UserSettingsContext.tsx
git commit -m "feat: add user settings context with username management"
```

---

## Task 2: Create Project Types and Utilities

**Files:**
- Create: `types/projects.ts`
- Create: `lib/projects.ts`

**Step 1: Create project type definitions**

```typescript
// types/projects.ts
export interface Project {
  id: string;
  name: string;
  description: string;
  type: "chat" | "repo" | "template";
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: {
    chatSessionId?: string;
    repoFullName?: string;
    templateId?: string;
    language?: string;
    framework?: string;
  };
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: "web" | "mobile" | "api" | "cli" | "fullstack";
  prompt: string;
  tags: string[];
}
```

**Step 2: Create project utilities**

```typescript
// lib/projects.ts
import { Project, ProjectTemplate } from "@/types/projects";

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "nextjs-starter",
    name: "Next.js Starter",
    description: "Modern Next.js app with Tailwind CSS and TypeScript",
    thumbnail: "/templates/nextjs.png",
    category: "web",
    prompt: "Create a Next.js 14 application with TypeScript, Tailwind CSS, and App Router. Include a homepage with hero section, about page, and contact page.",
    tags: ["nextjs", "react", "tailwind"],
  },
  {
    id: "express-api",
    name: "Express API",
    description: "RESTful API with Express.js and MongoDB",
    thumbnail: "/templates/express.png",
    category: "api",
    prompt: "Create an Express.js REST API with MongoDB integration. Include authentication, user management, and CRUD operations.",
    tags: ["express", "mongodb", "api"],
  },
  {
    id: "electron-app",
    name: "Electron Desktop",
    description: "Cross-platform desktop app with Electron",
    thumbnail: "/templates/electron.png",
    category: "fullstack",
    prompt: "Create an Electron desktop application with React frontend and Node.js backend. Include main window, menu, and system tray integration.",
    tags: ["electron", "react", "desktop"],
  },
  {
    id: "react-native",
    name: "React Native App",
    description: "Mobile app with React Native and Expo",
    thumbnail: "/templates/react-native.png",
    category: "mobile",
    prompt: "Create a React Native mobile app using Expo. Include bottom tab navigation, home screen, profile screen, and settings screen.",
    tags: ["react-native", "expo", "mobile"],
  },
  {
    id: "vue-dashboard",
    name: "Vue Dashboard",
    description: "Admin dashboard with Vue 3 and Element Plus",
    thumbnail: "/templates/vue.png",
    category: "web",
    prompt: "Create a Vue 3 admin dashboard with Element Plus UI library. Include charts, data tables, and sidebar navigation.",
    tags: ["vue", "dashboard", "admin"],
  },
  {
    id: "cli-tool",
    name: "CLI Tool",
    description: "Command-line tool with Node.js and Commander",
    thumbnail: "/templates/cli.png",
    category: "cli",
    prompt: "Create a Node.js CLI tool using Commander. Include commands for init, build, and deploy with helpful output and error handling.",
    tags: ["nodejs", "cli", "commander"],
  },
];

export function createProjectFromChat(
  sessionId: string,
  name: string,
  repoFullName?: string
): Project {
  return {
    id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: `Chat session about ${name}`,
    type: "chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {
      chatSessionId: sessionId,
      repoFullName,
    },
  };
}

export function createProjectFromRepo(
  repoFullName: string,
  description: string,
  language?: string
): Project {
  const [owner, name] = repoFullName.split("/");
  return {
    id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    type: "repo",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {
      repoFullName,
      language,
    },
  };
}

export function getRecentlyViewedProjects(projects: Project[], limit: number = 6): Project[] {
  return [...projects]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}
```

**Step 3: Commit**

```bash
git add types/projects.ts lib/projects.ts
git commit -m "feat: add project types and utilities"
```

---

## Task 3: Create Projects Context

**Files:**
- Create: `contexts/ProjectsContext.tsx`

**Step 1: Create the ProjectsContext**

```typescript
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

  if (!isLoaded) return null;

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
```

**Step 2: Commit**

```bash
git add contexts/ProjectsContext.tsx
git commit -m "feat: add projects context for project management"
```

---

## Task 4: Update Root Layout with New Providers

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Add new providers to the layout**

Replace the content of `app/layout.tsx` with:

```typescript
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatHistoryProvider } from "@/contexts/ChatHistoryContext";
import { ApiUsageProvider } from "@/contexts/ApiUsageContext";
import { DeploymentProvider } from "@/contexts/DeploymentContext";
import { ImageHistoryProvider } from "@/contexts/ImageHistoryContext";
import { UserSettingsProvider } from "@/contexts/UserSettingsContext";
import { ProjectsProvider } from "@/contexts/ProjectsContext";

export const metadata: Metadata = {
  title: "Poseidon - AI Dev Command Center",
  description:
    "Poseidon is a cyber-styled AI command center for planning, building, and deploying web applications with confidence.",
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased overflow-x-hidden">
        <ThemeProvider>
          <UserSettingsProvider>
            <ChatHistoryProvider>
              <ApiUsageProvider>
                <ImageHistoryProvider>
                  <DeploymentProvider>
                    <ProjectsProvider>
                      {children}
                    </ProjectsProvider>
                  </DeploymentProvider>
                </ImageHistoryProvider>
              </ApiUsageProvider>
            </ChatHistoryProvider>
          </UserSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add UserSettingsProvider and ProjectsProvider to root layout"
```

---

## Task 5: Create New Home Page Component

**Files:**
- Create: `components/home/HomePage.tsx`
- Create: `components/home/HeroSection.tsx`
- Create: `components/home/ProjectCardsSection.tsx`
- Create: `components/home/ProjectCard.tsx`
- Create: `components/home/TemplateCard.tsx`

**Step 1: Create HeroSection component**

```typescript
"use client";

import { useUserSettings } from "@/contexts/UserSettingsContext";
import { motion } from "framer-motion";

export default function HeroSection() {
  const { settings } = useUserSettings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-12 md:p-16 text-center"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Let's build something, {settings.username}
        </h1>

        {/* Input field */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <input
              type="text"
              placeholder="Ask Poseidon to create a..."
              className="w-full px-6 py-4 bg-transparent text-white placeholder-white/60 focus:outline-none text-lg"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Attach">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button className="p-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-colors border border-white/20">
            Attach
          </button>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-colors border border-white/20">
            Theme
          </button>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-colors border border-white/20">
            Plan
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

**Step 2: Create ProjectCard component**

```typescript
"use client";

import { Project } from "@/types/projects";
import { motion } from "framer-motion";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group relative bg-surface border border-line/60 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all"
    >
      {/* Thumbnail placeholder */}
      <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
        {project.type === "chat" && (
          <svg className="w-12 h-12 text-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {project.type === "repo" && (
          <svg className="w-12 h-12 text-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-ink mb-1 truncate">{project.name}</h3>
        <p className="text-sm text-ink-muted line-clamp-2">{project.description}</p>

        {/* Metadata */}
        <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
          <span className="px-2 py-1 bg-surface-muted rounded-full capitalize">
            {project.type}
          </span>
          {project.metadata?.language && (
            <span className="px-2 py-1 bg-surface-muted rounded-full">
              {project.metadata.language}
            </span>
          )}
          <span className="ml-auto">
            {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
```

**Step 3: Create TemplateCard component**

```typescript
"use client";

import { ProjectTemplate } from "@/types/projects";
import { motion } from "framer-motion";

interface TemplateCardProps {
  template: ProjectTemplate;
  onClick: () => void;
}

export default function TemplateCard({ template, onClick }: TemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group relative bg-surface border border-line/60 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-2 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-ink mb-1">{template.name}</h3>
        <p className="text-sm text-ink-muted line-clamp-2">{template.description}</p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
```

**Step 4: Create ProjectCardsSection component**

```typescript
"use client";

import { useState } from "react";
import { useProjects } from "@/contexts/ProjectsContext";
import { useChatHistory } from "@/contexts/ChatHistoryContext";
import { TEMPLATES } from "@/lib/projects";
import ProjectCard from "./ProjectCard";
import TemplateCard from "./TemplateCard";
import { motion } from "framer-motion";

type TabType = "recent" | "projects" | "templates";

export default function ProjectCardsSection() {
  const { projects, getRecentProjects, getProjectsByType } = useProjects();
  const { loadSession } = useChatHistory();
  const [activeTab, setActiveTab] = useState<TabType>("recent");

  const recentProjects = getRecentProjects(6);
  const allProjects = getProjectsByType("chat").concat(getProjectsByType("repo"));

  const handleProjectClick = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project?.metadata?.chatSessionId) {
      loadSession(project.metadata.chatSessionId);
    }
  };

  const handleTemplateClick = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      // Navigate to chat with template prompt
      window.location.href = `/?prompt=${encodeURIComponent(template.prompt)}`;
    }
  };

  const tabs = [
    { id: "recent" as const, label: "Recently viewed", count: recentProjects.length },
    { id: "projects" as const, label: "My projects", count: allProjects.length },
    { id: "templates" as const, label: "Templates", count: TEMPLATES.length },
  ];

  return (
    <div className="mt-8">
      {/* Tabs header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-ink"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                />
              )}
            </button>
          ))}
        </div>
        <button className="text-sm text-ink-muted hover:text-ink flex items-center gap-1 transition-colors">
          Browse all
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === "recent" &&
          recentProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProjectCard project={project} onClick={() => handleProjectClick(project.id)} />
            </motion.div>
          ))}

        {activeTab === "projects" &&
          allProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProjectCard project={project} onClick={() => handleProjectClick(project.id)} />
            </motion.div>
          ))}

        {activeTab === "templates" &&
          TEMPLATES.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TemplateCard template={template} onClick={() => handleTemplateClick(template.id)} />
            </motion.div>
          ))}
      </div>

      {/* Empty state */}
      {((activeTab === "recent" && recentProjects.length === 0) ||
        (activeTab === "projects" && allProjects.length === 0)) && (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-ink-subtle mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-medium text-ink mb-2">No projects yet</h3>
          <p className="text-ink-muted">Start a chat to see your projects here</p>
        </div>
      )}
    </div>
  );
}
```

**Step 5: Create HomePage component**

```typescript
"use client";

import HeroSection from "./HeroSection";
import ProjectCardsSection from "./ProjectCardsSection";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <HeroSection />
      <ProjectCardsSection />
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add components/home/
git commit -m "feat: add home page components with hero and project cards"
```

---

## Task 6: Update Main Page to Use New Home Layout

**Files:**
- Modify: `app/page.tsx`

**Step 1: Update the page routing**

Replace `app/page.tsx` content with:

```typescript
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChatInterface from "@/components/chat/ChatInterface";
import HistoryPage from "@/components/chat/HistoryPage";
import ReposPage from "@/components/github/ReposPage";
import DeploymentsPage from "@/components/deploy/DeploymentsPage";
import SettingsPage from "@/components/settings/SettingsPage";
import LoginPage from "@/components/auth/LoginPage";
import HomePage from "@/components/home/HomePage";
import GlassesLogo from "@/components/ui/GlassesLogo";
import { useChatHistory } from "@/contexts/ChatHistoryContext";

export default function MainPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { clearCurrentSession } = useChatHistory();

  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

  useEffect(() => {
    if (isElectron) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      checkAuth();
    }
  }, [isElectron]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      clearCurrentSession();
    }
  }, [isLoading, isAuthenticated, clearCurrentSession]);

  const checkAuth = async () => {
    try {
      const checkResponse = await fetch("/api/auth/login");
      const checkData = await checkResponse.json();

      if (!checkData.requiresPassword) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Password check failed:", error);
    }

    const deviceToken = localStorage.getItem("poseidon-device-token");
    const tokenHash = localStorage.getItem("poseidon-token-hash");

    if (!deviceToken || !tokenHash) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken, tokenHash }),
      });

      const data = await response.json();
      if (data.valid) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("poseidon-device-token");
        localStorage.removeItem("poseidon-token-hash");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("poseidon-device-token");
    localStorage.removeItem("poseidon-token-hash");
    setIsAuthenticated(false);
  };

  const handleResumeChat = (sessionId: string) => {
    setActiveTab("chat");
    // The ChatInterface will load the session
  };

  const handleNewChat = () => {
    setActiveTab("chat");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "chat":
        return <ChatInterface />;
      case "history":
        return <HistoryPage onResumeChat={handleResumeChat} onNewChat={handleNewChat} />;
      case "repos":
        return <ReposPage />;
      case "deploy":
        return <DeploymentsPage />;
      case "settings":
        return <SettingsPage onLogout={handleLogout} />;
      default:
        return <HomePage />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-sunset flex items-center justify-center shadow-xl animate-gradient ring-1 ring-white/40 dark:ring-white/10">
            <GlassesLogo className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-center gap-2 text-ink-muted">
            <svg className="animate-spin h-5 w-5 text-gold-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // For chat tab, render ChatInterface directly without DashboardLayout wrapper
  if (activeTab === "chat") {
    return <ChatInterface />;
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add home tab and update routing"
```

---

## Task 7: Update Sidebar to Include Home Tab

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`

**Step 1: Add Home to navigation items**

Update the `navItems` array in `components/dashboard/Sidebar.tsx` to include home as the first item:

```typescript
const navItems: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  // ... rest of the existing items
```

**Step 2: Commit**

```bash
git add components/dashboard/Sidebar.tsx
git commit -m "feat: add Home tab to sidebar navigation"
```

---

## Task 8: Update Settings Page to Include Username Setting

**Files:**
- Modify: `components/settings/SettingsPage.tsx`

**Step 1: Add username settings section**

Add the username input field to the settings page. You'll need to read the existing file and add a new section for user profile settings that includes:
- Username input field
- Email input field (optional)
- Save button

Import and use the `useUserSettings` hook to manage the settings.

**Step 2: Commit**

```bash
git add components/settings/SettingsPage.tsx
git commit -m "feat: add username settings to settings page"
```

---

## Task 9: Auto-Create Projects from Chat Sessions

**Files:**
- Modify: `contexts/ChatHistoryContext.tsx`
- Modify: `contexts/ProjectsContext.tsx`

**Step 1: Update ChatHistoryContext to trigger project creation**

When a new session is created or updated with a repo, also create/update a project. Add a callback or effect that syncs chat sessions to projects.

**Step 2: Commit**

```bash
git add contexts/ChatHistoryContext.tsx contexts/ProjectsContext.tsx
git commit -m "feat: auto-create projects from chat sessions"
```

---

## Task 10: Create Poseidon Trident Icon

**Files:**
- Create: `icons/trident.svg`
- Modify: `components/ui/GlassesLogo.tsx` (or create new TridentLogo component)
- Modify: `icon.icns` (update desktop app icon)

**Step 1: Create trident SVG icon**

Create a new SVG icon file at `icons/trident.svg` with a trident design. The trident should be:
- Clean, modern design
- Work on both light and dark backgrounds
- Scalable for different sizes

**Step 2: Create TridentLogo component**

```typescript
"use client";

interface TridentLogoProps {
  className?: string;
}

export default function TridentLogo({ className }: TridentLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Trident design - central prong and two side prongs */}
      <path
        d="M50 10 L50 70 M50 30 L30 15 M50 30 L70 15 M50 50 L35 40 M50 50 L65 40 M50 70 L50 80 L40 90 M50 80 L60 90"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

**Step 3: Update components to use TridentLogo**

Replace `GlassesLogo` with `TridentLogo` in:
- `components/dashboard/Sidebar.tsx`
- `app/page.tsx` (loading state)
- Any other places using GlassesLogo

**Step 4: Update desktop app icon**

The current `icon.icns` is a pink box. Replace it with a proper trident icon:
1. Create a high-resolution PNG (1024x1024) of the trident
2. Use a tool like `iconutil` (macOS) or online converter to create the .icns file
3. Replace the existing `icon.icns` in the project root

**Step 5: Commit**

```bash
git add icons/trident.svg components/ui/TridentLogo.tsx icon.icns
git commit -m "feat: add Poseidon trident icon and replace glasses logo"
```

---

## Task 11: Update Mobile Navigation

**Files:**
- Modify: `components/dashboard/DashboardLayout.tsx`

**Step 1: Add Home to mobile navigation**

Update the `mobileNavItems` array to include the home tab as the first item.

**Step 2: Commit**

```bash
git add components/dashboard/DashboardLayout.tsx
git commit -m "feat: add home tab to mobile navigation"
```

---

## Task 12: Update Global Styles for New Aesthetic

**Files:**
- Modify: `app/globals.css`

**Step 1: Refine color palette and typography**

Update the CSS variables and styles to match the clean/modern aesthetic:
- Soft gradient backgrounds
- Refined border radius (more rounded)
- Improved spacing
- Better shadow effects

**Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style: update global styles for clean modern aesthetic"
```

---

## Task 13: Test and Verify

**Step 1: Run development server**

```bash
cd ~/Documents/Poseidon
pnpm dev
```

**Step 2: Test all features**

Verify:
- [ ] Home page displays with hero section
- [ ] Username from settings appears in hero
- [ ] Project cards display correctly
- [ ] Tabs switch between Recently viewed, My projects, Templates
- [ ] Clicking project cards navigates correctly
- [ ] Settings page allows username change
- [ ] Trident icon displays correctly
- [ ] Mobile navigation works
- [ ] All existing features still work (chat, history, repos, deployments)

**Step 3: Build for production**

```bash
pnpm run build
```

**Step 4: Test Electron app**

```bash
pnpm run dist:mac
```

---

## Task 14: Final Polish

**Step 1: Add animations and transitions**

Use Framer Motion for smooth page transitions and hover effects.

**Step 2: Optimize performance**

- Lazy load components
- Optimize images
- Add loading states

**Step 3: Accessibility improvements**

- Add ARIA labels
- Ensure keyboard navigation works
- Check color contrast

**Step 4: Final commit**

```bash
git add .
git commit -m "polish: final improvements for Lovable-style layout"
```

---

## Summary

This plan implements:

1. **User Settings System** - Manage username and preferences
2. **Project Management** - Track chats, repos, and templates as projects
3. **New Home Page** - Hero section with personalized greeting
4. **Project Cards** - Visual cards for recent, my projects, and templates
5. **Template System** - Pre-built project templates
6. **New Trident Icon** - Replace glasses logo with Poseidon's trident
7. **Clean/Modern Aesthetic** - Refined design matching Lovable.dev style

**Total estimated tasks:** 14
**Total estimated time:** Several hours of focused development
