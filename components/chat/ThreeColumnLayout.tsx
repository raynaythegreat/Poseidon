"use client";

import { useState, useEffect } from "react";
import TridentLogo from "@/components/ui/TridentLogo";

interface ThreeColumnLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export default function ThreeColumnLayout({
  leftPanel,
  centerPanel,
  rightPanel,
}: ThreeColumnLayoutProps) {
  // Load saved state from localStorage
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLeftState = localStorage.getItem("poseidon-left-panel-collapsed");
    const savedRightState = localStorage.getItem("poseidon-right-panel-collapsed");
    if (savedLeftState) setLeftCollapsed(savedLeftState === "true");
    if (savedRightState) setRightCollapsed(savedRightState === "true");
  }, []);

  const toggleLeftPanel = () => {
    const newState = !leftCollapsed;
    setLeftCollapsed(newState);
    localStorage.setItem("poseidon-left-panel-collapsed", String(newState));
  };

  const toggleRightPanel = () => {
    const newState = !rightCollapsed;
    setRightCollapsed(newState);
    localStorage.setItem("poseidon-right-panel-collapsed", String(newState));
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "[") {
        e.preventDefault();
        toggleLeftPanel();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "]") {
        e.preventDefault();
        toggleRightPanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, leftCollapsed, rightCollapsed]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-dvh bg-white dark:bg-black text-gray-900 dark:text-white relative">
      {/* Left Panel - File Tree */}
      {!leftCollapsed && (
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-y-auto bg-white dark:bg-black transition-all duration-300 ease-out">
          {leftPanel}
        </div>
      )}
      {leftCollapsed && (
        <div className="w-12 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 flex flex-col items-center py-4 gap-4 bg-white dark:bg-black transition-all duration-300 ease-out">
          {/* Collapsed state - trident icon */}
          <TridentLogo className="w-6 h-6 text-ink-subtle" />
        </div>
      )}

      {/* Left Collapse Button */}
      <button
        onClick={toggleLeftPanel}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 transition-all duration-200 group"
        title={leftCollapsed ? "Expand (Cmd+[)" : "Collapse (Cmd+[)"}
      >
        <svg className={`w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-200 ${leftCollapsed ? "rotate-0" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Center Panel - Chat */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-black min-w-0">
        {centerPanel}
      </div>

      {/* Right Collapse Button */}
      <button
        onClick={toggleRightPanel}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex-shrink-0 transition-all duration-200 group"
        title={rightCollapsed ? "Expand (Cmd+])" : "Collapse (Cmd+])"}
      >
        <svg className={`w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-200 ${rightCollapsed ? "rotate-180" : "rotate-0"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Right Panel - Preview/Inspector */}
      {!rightCollapsed && (
        <div className="w-80 border-l border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-y-auto bg-white dark:bg-black transition-all duration-300 ease-out">
          {rightPanel}
        </div>
      )}
    </div>
  );
}
