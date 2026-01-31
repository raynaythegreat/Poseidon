"use client";

import { useState, useRef, useEffect } from "react";
import TridentLogo from "@/components/ui/TridentLogo";
import ApiUsageDisplay from "@/components/chat/ApiUsageDisplay";
import type { Provider } from "@/contexts/ApiUsageContext";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
}

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

interface LovableChatHeaderProps {
  selectedRepo: Repository | null;
  repos: Repository[];
  modelInfo: { name: string; provider: string };
  models: ModelOption[];
  onRepoSelect: (repo: Repository | null) => void;
  onCreateRepo: () => void;
  onModelSelect: (model: ModelOption) => void;
  onNewChat: () => void;
  currentProvider?: Provider;
}

export default function LovableChatHeader({
  selectedRepo,
  repos,
  modelInfo,
  models,
  onRepoSelect,
  onCreateRepo,
  onModelSelect,
  onNewChat,
  currentProvider = "claude",
}: LovableChatHeaderProps) {
  const [showRepoMenu, setShowRepoMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const repoMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (repoMenuRef.current && !repoMenuRef.current.contains(event.target as Node)) {
        setShowRepoMenu(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="px-4 py-3 relative z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Logo & Repo Selector */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={onNewChat}
          >
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <TridentLogo className="w-5 h-5 text-white dark:text-black" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Poseidon</span>
          </div>

          {/* Repo Selector Dropdown */}
          <div className="relative" ref={repoMenuRef}>
            <button
              onClick={() => setShowRepoMenu(!showRepoMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="truncate max-w-[150px]">
                {selectedRepo ? selectedRepo.name : "Select Repo"}
              </span>
              <svg className={`w-4 h-4 transition-transform ${showRepoMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showRepoMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-xl z-[9999] max-h-[300px] overflow-y-auto">
                <div className="p-2">
                  {repos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => {
                        onRepoSelect(repo);
                        setShowRepoMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                        selectedRepo?.id === repo.id
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
                      }`}
                    >
                      <div className="font-medium truncate">{repo.name}</div>
                      {repo.description && (
                        <div className="text-xs opacity-70 truncate mt-0.5">{repo.description}</div>
                      )}
                    </button>
                  ))}
                  {repos.length === 0 && (
                    <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No repositories yet
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 p-2">
                  <button
                    onClick={() => {
                      onCreateRepo();
                      setShowRepoMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Repository
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Model Selector, API Usage & New Chat */}
        <div className="flex items-center gap-2">
          {/* Model Selector Dropdown */}
          <div className="relative" ref={modelMenuRef}>
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate max-w-[150px]">{modelInfo.name}</span>
              <svg className={`w-4 h-4 transition-transform ${showModelMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showModelMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-xl z-[9999] max-h-[300px] overflow-y-auto">
                <div className="p-2">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelSelect(model);
                        setShowModelMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                        modelInfo.name === model.name
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
                      }`}
                    >
                      <div className="font-medium truncate">{model.name}</div>
                      <div className="text-xs opacity-60 mt-0.5">{model.provider}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* API Usage Display */}
          <ApiUsageDisplay currentProvider={currentProvider} compact />

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-gray-600 dark:text-gray-400"
            title="New chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
