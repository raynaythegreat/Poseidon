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
    <div className="flex h-screen bg-black text-white relative">
      {/* Left Panel - File Tree */}
      {!leftCollapsed && (
        <div className="w-64 border-r border-white/[0.08] flex-shrink-0 overflow-y-auto bg-[#050505]">
          {leftPanel}
        </div>
      )}
      {leftCollapsed && (
        <div className="w-12 border-r border-white/[0.08] flex-shrink-0 flex flex-col items-center py-4 gap-4 bg-[#050505]">
          {/* Collapsed state icons */}
        </div>
      )}

      {/* Left Collapse Button */}
      <button
        onClick={() => setLeftCollapsed(!leftCollapsed)}
        className="w-6 h-6 flex items-center justify-center hover:bg-white/[0.02] border-r border-white/[0.08] flex-shrink-0 transition-colors"
      >
        <svg className="w-3 h-3 text-white/20 hover:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {leftCollapsed ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          )}
        </svg>
      </button>

      {/* Center Panel - Chat */}
      <div className="flex-1 overflow-hidden flex flex-col bg-black">
        {centerPanel}
      </div>

      {/* Right Collapse Button */}
      <button
        onClick={() => setRightCollapsed(!rightCollapsed)}
        className="w-6 h-6 flex items-center justify-center hover:bg-white/[0.02] border-l border-white/[0.08] flex-shrink-0 transition-colors"
      >
        <svg className="w-3 h-3 text-white/20 hover:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {rightCollapsed ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          )}
        </svg>
      </button>

      {/* Right Panel - Preview/Inspector */}
      {!rightCollapsed && (
        <div className="w-80 border-l border-white/[0.08] flex-shrink-0 overflow-y-auto bg-[#050505]">
          {rightPanel}
        </div>
      )}
    </div>
  );
}
