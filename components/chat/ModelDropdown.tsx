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

  const menuBg = "bg-surface/95 border-line/60 backdrop-blur-xl shadow-2xl";
  const itemHover = "hover:bg-surface-muted/60";
  const itemText = "text-ink-muted hover:text-ink";
  const selectedBg = "bg-accent-500/10 text-accent-500 border border-accent-500/20";

  // Helper to get price display emoji based on cost
  function getPriceDisplay(price?: number): { emoji: string; tooltip: string } {
    if (price === 0 || price === undefined) {
      return { emoji: "🆓", tooltip: "Free" };
    }
    if (price < 0.5) {
      return { emoji: "💰", tooltip: `$${price}/1M - Very affordable` };
    }
    if (price < 3) {
      return { emoji: "💰💰", tooltip: `$${price}/1M - Affordable` };
    }
    if (price < 10) {
      return { emoji: "💰💰💰", tooltip: `$${price}/1M - Moderate` };
    }
    return { emoji: "💰💰💰💰", tooltip: `$${price}/1M - Expensive` };
  }

  // Sort models: GLM first, then by Provider (A-Z), then by Price
  const sortedModels = [...models].sort((a, b) => {
    // GLM provider always comes first
    const isGlmA = a.provider.toLowerCase() === "glm";
    const isGlmB = b.provider.toLowerCase() === "glm";
    if (isGlmA && !isGlmB) return -1;
    if (!isGlmA && isGlmB) return 1;

    // Then by provider name (alphabetically)
    const providerA = a.provider.toLowerCase();
    const providerB = b.provider.toLowerCase();
    if (providerA !== providerB) {
      return providerA.localeCompare(providerB);
    }

    // Then by price (free/0 first, then ascending)
    const priceA = a.price ?? 0;
    const priceB = b.price ?? 0;
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
        className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg ${buttonBg} transition-colors text-xs sm:text-sm min-w-[140px] sm:min-w-[180px] max-w-[200px] sm:max-w-[280px]`}
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
        <div className={`absolute bottom-full left-0 sm:left-auto right-0 sm:right-0 mb-2 w-full min-w-[200px] sm:min-w-[280px] rounded-xl border shadow-2xl z-[9999] max-h-[280px] sm:max-h-[400px] overflow-y-auto ${menuBg}`}>
          <div className="p-1">
            {Object.entries(modelsByProvider).map(([provider, providerModels], index) => (
              <div key={provider} className={index > 0 ? "mt-2 pt-2 border-t border-line/50" : ""}>
                {/* Provider Header */}
                <div className="px-3 py-1.5 text-xs font-bold text-accent-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
                  {provider}
                </div>
                {providerModels.map((model) => {
                  const priceDisplay = getPriceDisplay(model.price);
                  const isFree = !model.price || model.price === 0;
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
                      title={priceDisplay.tooltip}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium truncate">{model.name}</span>
                        <span className={`text-sm shrink-0 px-2 py-0.5 rounded-full font-medium border ${
                          isFree
                            ? "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-300 dark:border-green-500/30"
                            : ""
                        }`} title={priceDisplay.tooltip}>
                          {priceDisplay.emoji}
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
