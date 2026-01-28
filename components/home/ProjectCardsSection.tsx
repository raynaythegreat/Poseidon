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
