"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RepoDropdown from "./RepoDropdown";
import ModelDropdown from "./ModelDropdown";

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

interface LovableStyleChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  // Repo selection props
  selectedRepo?: Repository | null;
  repos?: Repository[];
  onRepoSelect?: (repo: Repository | null) => void;
  onCreateRepo?: () => void;
  // Model selection props
  modelInfo?: { name: string; provider: string };
  models?: ModelOption[];
  onModelSelect?: (model: ModelOption) => void;
  // Chat mode for brainstorm button visibility
  chatMode?: "plan" | "build";
}

export default function LovableStyleChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  loading,
  placeholder = "Describe the app you want to build...",
  selectedRepo = null,
  repos = [],
  onRepoSelect,
  onCreateRepo,
  modelInfo = { name: "Claude", provider: "claude" },
  models = [],
  onModelSelect,
  chatMode = "plan",
}: LovableStyleChatInputProps) {
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (loading) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={Boolean(disabled && !loading)}
        className="w-full px-6 py-5 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none text-lg min-h-[140px]"
        rows={5}
      />

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-2">
          {/* Select Repo Dropdown */}
          {onRepoSelect && onCreateRepo ? (
            <RepoDropdown
              selectedRepo={selectedRepo}
              repos={repos}
              onSelect={onRepoSelect}
              onCreateRepo={onCreateRepo}
              compact
            />
          ) : (
            <button
              onClick={() => router.push("/?tab=repos")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 cursor-pointer"
              title="Select a GitHub repository"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>Select Repo</span>
            </button>
          )}

          {/* Model Selector Dropdown */}
          {onModelSelect && models.length > 0 ? (
            <ModelDropdown
              modelInfo={modelInfo}
              models={models}
              onSelect={onModelSelect}
              compact
            />
          ) : (
            <button
              onClick={() => router.push("/?tab=settings")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 cursor-pointer"
              title="Configure AI model"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Models</span>
            </button>
          )}

          {/* Brainstorm - Only show in plan mode */}
          {chatMode === "plan" && (
            <button
              onClick={() => router.push("/superpowers:brainstorm")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 cursor-pointer"
              title="Brainstorm ideas"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Brainstorm</span>
            </button>
          )}

          {/* Write Plan */}
          <button
            onClick={() => router.push("/superpowers:write-plan")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 cursor-pointer"
            title="Create a plan"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Plan</span>
          </button>
        </div>

        {/* Submit Button */}
        {loading && onStop ? (
          <button
            onClick={onStop}
            disabled={!onStop}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500 text-white font-medium transition-all hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Stop generating"
          >
            <span>Stop</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="7" y="7" width="10" height="10" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={!value.trim() || disabled}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Generate</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
