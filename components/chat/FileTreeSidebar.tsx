"use client";

import { useState } from "react";

interface FileNode {
  path: string;
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
}

interface FileTreeSidebarProps {
  files?: FileNode[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  repoName?: string | null;
}

export default function FileTreeSidebar({
  files,
  selectedFile,
  onFileSelect,
  repoName,
}: FileTreeSidebarProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderFile = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer transition-colors ${
            isSelected
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
          onClick={() => {
            if (node.type === "directory") {
              toggleDir(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
        >
          {node.type === "directory" ? (
            <>
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="truncate">{node.name}</span>
            </>
          ) : (
            <>
              <div className="w-4" />
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{node.name}</span>
            </>
          )}
        </div>
        {node.type === "directory" && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderFile(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="text-xs font-medium text-white/50 uppercase tracking-wide">
          Explorer
        </div>
        {repoName && (
          <div className="text-sm text-white/80 mt-1 truncate">{repoName}</div>
        )}
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {files && files.length > 0 ? (
          files.map((file) => renderFile(file))
        ) : (
          <div className="px-3 py-4 text-sm text-white/40 text-center">
            No repository selected
          </div>
        )}
      </div>

      {/* Footer - Quick Actions */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button className="w-full px-3 py-2 text-xs text-left text-white/60 hover:bg-white/5 rounded-md transition-colors flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload File
        </button>
        <button className="w-full px-3 py-2 text-xs text-left text-white/60 hover:bg-white/5 rounded-md transition-colors flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New File
        </button>
      </div>
    </div>
  );
}
