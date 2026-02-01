"use client";

import { useState, useRef, useEffect } from "react";
import type { Provider } from "@/contexts/ApiUsageContext";

interface ModelOption {
  id: string;
  name: string;
  provider: Provider;
  description?: string;
  price?: number; // Price per 1M input tokens
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
  darkTheme: _darkTheme = true,
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

  const buttonBg =
    "bg-surface-muted/60 hover:bg-surface-muted/80 text-ink-muted hover:text-ink border border-line/60";

  const menuBg = "bg-surface/95 border-line/60 backdrop-blur-xl";
  const itemHover = "hover:bg-surface-muted/60";
  const itemText = "text-ink-muted hover:text-ink";
  const selectedBg = "bg-poseidon-teal-mid/15 text-ink ring-1 ring-poseidon-teal-light/25";

  // Sort models by provider name alphabetically, then by price (ascending) within provider
  const sortedModels = [...models].sort((a, b) => {
    const providerA = a.provider.toLowerCase();
    const providerB = b.provider.toLowerCase();
    if (providerA !== providerB) {
      return providerA.localeCompare(providerB);
    }
    // If same provider, sort by price (ascending), then by model name as tiebreaker
    const priceA = a.price ?? 1;
    const priceB = b.price ?? 1;
    if (priceA !== priceB) {
      return priceA - priceB;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center ${compact ? "gap-1" : "gap-2"} ${compact ? "px-2 py-1" : "px-3 py-1.5"} rounded-lg ${buttonBg} transition-colors ${compact ? "text-xs" : "text-sm"}`}
      >
        <svg className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {!compact && (
          <span className="truncate max-w-[120px]">{modelInfo.name}</span>
        )}
        <svg className={`w-3.5 h-3.5 transition-transform ${showMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className={`absolute bottom-full right-0 mb-2 w-64 rounded-xl border shadow-xl z-[9999] max-h-[300px] overflow-y-auto ${menuBg}`}>
          <div className="p-2">
            {sortedModels.map((model) => (
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
                <div className="text-xs mt-0.5 text-ink-subtle flex items-center justify-between">
                  <span>{model.provider}</span>
                  {model.price !== undefined && model.price !== null && (
                    <span className="text-ink-muted">
                      {model.price === 0 ? 'Free' : `$${model.price}/1M`}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
