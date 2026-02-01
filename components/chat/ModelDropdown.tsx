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
}

export default function ModelDropdown({
  modelInfo,
  models,
  onSelect,
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

  // Helper to get price display text and color
  function getPriceDisplay(price?: number): { text: string; color: string } {
    if (price === 0 || price === undefined) {
      return { text: "Free", color: "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/30" };
    }
    if (price < 0.5) {
      return { text: `$${price}/1M`, color: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30" };
    }
    if (price < 3) {
      return { text: `$${price}/1M`, color: "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30" };
    }
    if (price < 10) {
      return { text: `$${price}/1M`, color: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30" };
    }
    return { text: `$${price}/1M`, color: "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30" };
  }

  // Sort models: free models first, then by provider, then by price (ascending)
  const sortedModels = [...models].sort((a, b) => {
    // Free models (price 0) come first
    const aIsFree = (a.price ?? 1) === 0;
    const bIsFree = (b.price ?? 1) === 0;
    if (aIsFree && !bIsFree) return -1;
    if (!aIsFree && bIsFree) return 1;

    // Then by provider name
    const providerA = a.provider.toLowerCase();
    const providerB = b.provider.toLowerCase();
    if (providerA !== providerB) {
      return providerA.localeCompare(providerB);
    }

    // Then by price (ascending)
    const priceA = a.price ?? 1;
    const priceB = b.price ?? 1;
    if (priceA !== priceB) {
      return priceA - priceB;
    }

    // Then by model name as tiebreaker
    return a.name.localeCompare(b.name);
  });

  // Group models by provider
  const modelsByProvider = sortedModels.reduce((acc, model) => {
    const provider = model.provider;
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, ModelOption[]>);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${buttonBg} transition-colors text-sm min-w-[180px] max-w-[280px]`}
      >
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="truncate flex-1 text-left font-medium">{modelInfo.name}</span>
        <svg className={`w-3.5 h-3.5 transition-transform shrink-0 ${showMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className={`absolute bottom-full right-0 mb-2 w-80 rounded-xl border shadow-xl z-[9999] max-h-[400px] overflow-y-auto ${menuBg}`}>
          <div className="p-2">
            {Object.entries(modelsByProvider).map(([provider, providerModels], index) => (
              <div key={provider} className={index > 0 ? "mt-3 pt-3 border-t border-line/60" : ""}>
                {/* Provider Header */}
                <div className="px-3 py-1 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                  {provider}
                </div>
                {providerModels.map((model) => {
                  const priceDisplay = getPriceDisplay(model.price);
                  return (
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
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{model.name}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${priceDisplay.color}`}>
                          {priceDisplay.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
