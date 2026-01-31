"use client";

import { useRef } from "react";
import type { Skill } from "@/lib/skills/types";

interface SkillAutocompleteProps {
  visible: boolean;
  query: string;
  skills: Skill[];
  onSelect: (skill: Skill) => void;
  position: { top: number; left: number };
  contextReason?: string;
}

export default function SkillAutocomplete({
  visible,
  query,
  skills,
  onSelect,
  position,
  contextReason,
}: SkillAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  const filteredSkills = skills.filter(
    (skill) =>
      skill.metadata.name.toLowerCase().includes(query.toLowerCase()) ||
      skill.metadata.description.toLowerCase().includes(query.toLowerCase())
  );

  if (filteredSkills.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] w-80 rounded-xl border border-line bg-surface shadow-xl max-h-64 overflow-y-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {contextReason && (
        <div className="px-3 py-2 text-xs text-ink-muted border-b border-line/60">
          {contextReason}
        </div>
      )}

      {filteredSkills.map((skill) => (
        <button
          key={skill.metadata.name}
          onClick={() => onSelect(skill)}
          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-surface-muted/60 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-400/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">💡</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink">
              /{skill.metadata.name}
            </div>
            <div className="text-xs text-ink-muted truncate">
              {skill.metadata.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
