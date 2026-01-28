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
