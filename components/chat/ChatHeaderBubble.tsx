"use client";

import { useState } from "react";

interface ChatHeaderBubbleProps {
  selectedRepo: { id: number; name: string; full_name: string } | null;
  modelInfo: { name: string; provider: string };
  onModelClick: () => void;
  onNewChat: () => void;
  onMenuClick: () => void;
}

export default function ChatHeaderBubble({
  selectedRepo,
  modelInfo,
  onModelClick,
  onNewChat,
  onMenuClick,
}: ChatHeaderBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="px-4 py-3 border-b border-white/5">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Left: Logo/Brand and Model */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Logo/Brand */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <span className="font-semibold text-white">Poseidon</span>
          </div>

          {/* Separator */}
          <div className="w-px h-4 bg-white/20" />

          {/* Model Selector */}
          <button
            onClick={onModelClick}
            className="text-sm text-white/60 hover:text-white/90 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {modelInfo.name}
          </button>

          {/* Repo name if selected */}
          {selectedRepo && (
            <>
              <div className="w-px h-4 bg-white/20" />
              <span className="text-sm text-white/60">{selectedRepo.name}</span>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white/80 transition-colors"
            title="New chat"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl z-50 overflow-hidden">
                {/* Mode Toggle */}
                <div className="p-3 border-b border-white/10">
                  <div className="text-xs text-white/50 px-1 mb-2">MODE</div>
                  <div className="flex gap-1">
                    <button className="flex-1 px-3 py-2 text-xs rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-white">
                      Plan
                    </button>
                    <button className="flex-1 px-3 py-2 text-xs rounded-lg text-white/60 hover:text-white hover:bg-white/5">
                      Build
                    </button>
                  </div>
                </div>

                {/* Auto-approve */}
                <div className="p-2">
                  <button className="w-full px-3 py-2 text-sm text-left text-white/70 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Auto-approve
                  </button>
                </div>

                {/* Deploy Options */}
                <div className="p-2 border-t border-white/10">
                  <div className="text-xs text-white/50 px-3 mb-1">DEPLOY</div>
                  <button className="w-full px-3 py-2 text-sm text-left text-white/70 hover:bg-white/5 rounded-lg transition-colors">
                    Deploy to Vercel
                  </button>
                  <button className="w-full px-3 py-2 text-sm text-left text-white/70 hover:bg-white/5 rounded-lg transition-colors">
                    Deploy to Render
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
