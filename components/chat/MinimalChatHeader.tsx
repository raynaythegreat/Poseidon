"use client";

import { useState } from "react";
import RepoSelector from "./RepoSelector";

interface MinimalChatHeaderProps {
  selectedRepo: { id: number; name: string; full_name: string } | null;
  onRepoSelect: (repo: any) => void;
  modelInfo: { name: string; provider: string };
  onModelClick: (e: React.MouseEvent) => void;
  onNewChat: () => void;
}

export default function MinimalChatHeader({
  selectedRepo,
  onRepoSelect,
  modelInfo,
  onModelClick,
  onNewChat,
}: MinimalChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative z-20 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left: Logo/Brand */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-black dark:text-white">
            Poseidon
          </h1>
          {selectedRepo && (
            <span className="text-sm text-gray-600 dark:text-gray-400">/ {selectedRepo.name}</span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Model Selector - Minimal */}
          <button
            onClick={onModelClick}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            {modelInfo.name}
          </button>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              aria-label="Menu"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-xl overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onNewChat();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
