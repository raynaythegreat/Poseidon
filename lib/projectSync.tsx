"use client";

import { useEffect } from "react";
import { useChatHistory } from "@/contexts/ChatHistoryContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { createProjectFromChat } from "@/lib/projects";

/**
 * Hook that automatically creates/updates projects when chat sessions are created or modified.
 * This should be used in a component that's mounted at the app root level.
 */
export function useProjectSync() {
  const { sessions } = useChatHistory();
  const { projects, addProject, updateProject } = useProjects();

  useEffect(() => {
    // Sync chat sessions to projects
    sessions.forEach((session) => {
      // Check if a project already exists for this session
      const existingProject = projects.find(
        (p) => p.metadata?.chatSessionId === session.id
      );

      const projectData = createProjectFromChat(
        session.id,
        session.title,
        session.repoFullName || undefined
      );

      if (existingProject) {
        // Update existing project if title changed
        if (existingProject.name !== session.title) {
          updateProject(existingProject.id, {
            name: session.title,
            description: `Chat session about ${session.title}`,
          });
        }
      } else {
        // Create new project for this session
        // Only create projects for sessions that have messages (active conversations)
        if (session.messages.length > 0) {
          addProject(projectData);
        }
      }
    });
  }, [sessions, projects, addProject, updateProject]);
}
