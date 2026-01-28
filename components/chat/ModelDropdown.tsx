"use client";

import { useState, useRef, useEffect } from "react";
import type { Provider } from "@/contexts/ApiUsageContext";

interface ModelOption {
  id: string;
  name: string;
  provider: Provider;
  description?: string;
}

interface ModelDropdownProps {
  modelInfo: { name: string; provider: Provider };
  models: ModelOption[];
  onSelect: (model: ModelOption) => void;
  darkTheme?: boolean;
  compact?: boolean;
}

export default function ModelDropdown({
  modelInfo,
  models,
  onSelect,
  darkTheme = true,
  compact = false,
}: ModelDropdownProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buttonBg = darkTheme
    ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white/90"
    : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-300";

  const menuBg = darkTheme
    ? "bg-black border-white/[0.08]"
    : "bg-white dark:bg-black border-gray-200 dark:border-gray-800";

  const itemHover = darkTheme
    ? "hover:bg-white/[0.03]"
    : "hover:bg-gray-100 dark:hover:bg-gray-900";

  const itemText = darkTheme
    ? "text-white/70 hover:text-white/90"
    : "text-gray-700 dark:text-gray-300";

  const selectedBg = darkTheme
    ? "bg-white/10 text-white"
    : "bg-black dark:bg-white text-white dark:text-black";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 ${compact ? "px-2 py-1" : "px-3 py-1.5"} rounded-lg ${buttonBg} transition-colors ${compact ? "text-xs" : "text-sm"}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {!compact && (
          <span className="truncate max-w-[120px]">{modelInfo.name}</span>
        )}
        <svg className={`w-4 h-4 transition-transform ${showMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className={`absolute top-full right-0 mt-2 w-64 rounded-xl border shadow-xl z-50 max-h-[300px] overflow-y-auto ${menuBg}`}>
          <div className="p-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model);
                  setShowMenu(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                  modelInfo.name === model.name
                    ? selectedBg
                    : `${itemText} ${itemHover}`
                }`}
              >
                <div className="font-medium truncate">{model.name}</div>
                <div className={`text-xs mt-0.5 ${darkTheme ? "opacity-60" : "opacity-60"}`}>
                  {model.provider}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
