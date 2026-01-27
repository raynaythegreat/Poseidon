"use client";

import { useState } from "react";

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
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white">
      {/* Left Panel - File Tree */}
      {!leftCollapsed && (
        <div className="w-52 border-r border-white/10 flex-shrink-0 overflow-y-auto bg-[#0f0f15]">
          {leftPanel}
        </div>
      )}
      {leftCollapsed && (
        <div className="w-12 border-r border-white/10 flex-shrink-0 flex flex-col items-center py-4 gap-4 bg-[#0f0f15]">
          {/* Collapsed state icons */}
        </div>
      )}

      {/* Left Collapse Button */}
      <button
        onClick={() => setLeftCollapsed(!leftCollapsed)}
        className="w-6 h-6 flex items-center justify-center hover:bg-white/5 border-r border-white/10 flex-shrink-0"
      >
        <svg className="w-3 h-3 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {leftCollapsed ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          )}
        </svg>
      </button>

      {/* Center Panel - Chat */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {centerPanel}
      </div>

      {/* Right Collapse Button */}
      <button
        onClick={() => setRightCollapsed(!rightCollapsed)}
        className="w-6 h-6 flex items-center justify-center hover:bg-white/5 border-l border-white/10 flex-shrink-0"
      >
        <svg className="w-3 h-3 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {rightCollapsed ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          )}
        </svg>
      </button>

      {/* Right Panel - Preview/Inspector */}
      {!rightCollapsed && (
        <div className="w-72 border-l border-white/10 flex-shrink-0 overflow-y-auto bg-[#0f0f15]">
          {rightPanel}
        </div>
      )}
    </div>
  );
}
