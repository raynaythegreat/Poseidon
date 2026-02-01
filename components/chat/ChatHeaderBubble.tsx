"use client";

import { useState } from "react";
import ApiUsageDisplay from "./ApiUsageDisplay";
import RepoDropdown from "./RepoDropdown";
import ModelDropdown from "./ModelDropdown";
import type { Provider } from "@/contexts/ApiUsageContext";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  default_branch?: string;
}

interface ModelOption {
  id: string;
  name: string;
  provider: Provider;
  description?: string;
}

interface ChatHeaderBubbleProps {
  selectedRepo: Repository | null;
  repos?: Repository[];
  modelInfo: { name: string; provider: Provider };
  models?: ModelOption[];
  onRepoSelect?: (repo: Repository) => void;
  onModelSelect?: (model: ModelOption) => void;
  onCreateRepo?: () => void;
  onNewChat: () => void;
  onMenuClick: () => void;
  currentProvider?: Provider;
}

export default function ChatHeaderBubble({
  selectedRepo,
  repos = [],
  modelInfo,
  models = [],
  onRepoSelect,
  onModelSelect,
  onCreateRepo,
  onNewChat,
  onMenuClick,
  currentProvider,
}: ChatHeaderBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="px-4 py-3 border-b border-white/[0.08] bg-black relative z-50">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Left: Logo/Brand and Model */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Logo/Brand */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <span className="font-semibold text-white/90">Poseidon</span>
          </div>

          {/* Separator */}
          <div className="w-px h-4 bg-white/10" />

          {/* Model Selector - Show dropdown if handler provided, otherwise show text */}
          {onModelSelect && models.length > 0 ? (
            <ModelDropdown
              modelInfo={modelInfo}
              models={models}
              onSelect={onModelSelect}
            />
          ) : (
            <div className="text-sm text-white/50 hover:text-white/80 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {modelInfo.name}
            </div>
          )}

          {/* Repo Selector - Show dropdown if handler provided, otherwise show text */}
          {onRepoSelect && onCreateRepo ? (
            <RepoDropdown
              selectedRepo={selectedRepo}
              repos={repos}
              onSelect={onRepoSelect}
              onCreateRepo={onCreateRepo}
            />
          ) : selectedRepo ? (
            <span className="text-sm text-white/50">{selectedRepo.name}</span>
          ) : null}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg hover:bg-white/[0.03] text-white/50 hover:text-white/70 transition-colors"
            title="New chat"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* API Usage Display */}
          {currentProvider && <ApiUsageDisplay currentProvider={currentProvider} compact />}

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-white/[0.03] text-white/50 hover:text-white/70 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/[0.08] bg-[#0a0a0a] backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
                {/* Mode Toggle */}
                <div className="p-3 border-b border-white/[0.08]">
                  <div className="text-xs text-white/40 px-1 mb-2">MODE</div>
                  <div className="flex gap-1">
                    <button className="flex-1 px-3 py-2 text-xs rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium">
                      Plan
                    </button>
                    <button className="flex-1 px-3 py-2 text-xs rounded-xl text-white/50 hover:text-white hover:bg-white/[0.03]">
                      Build
                    </button>
                  </div>
                </div>

                {/* Auto-approve */}
                <div className="p-2">
                  <button className="w-full px-3 py-2 text-sm text-left text-white/50 hover:bg-white/[0.03] rounded-xl transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Auto-approve
                  </button>
                </div>

                {/* Deploy Options */}
                <div className="p-2 border-t border-white/[0.08]">
                  <div className="text-xs text-white/40 px-3 mb-1">DEPLOY</div>
                  <button className="w-full px-3 py-2 text-sm text-left text-white/50 hover:bg-white/[0.03] rounded-xl transition-colors">
                    Deploy to Vercel
                  </button>
                  <button className="w-full px-3 py-2 text-sm text-left text-white/50 hover:bg-white/[0.03] rounded-xl transition-colors">
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
