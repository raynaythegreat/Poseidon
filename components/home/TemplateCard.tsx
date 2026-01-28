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
