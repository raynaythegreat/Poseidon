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
    <div className="relative z-20 px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left: Logo/Brand */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Poseidon
          </h1>
          {selectedRepo && (
            <span className="text-sm text-white/60">/ {selectedRepo.name}</span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Model Selector - Minimal */}
          <button
            onClick={onModelClick}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white/80 hover:bg-white/15 transition-colors"
          >
            {modelInfo.name}
          </button>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
              aria-label="Menu"
            >
              <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-xl overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onNewChat();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
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
