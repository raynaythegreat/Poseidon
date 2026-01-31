"use client";

import { useState, useEffect } from "react";
import type { Skill } from "@/lib/skills/types";
import { registry } from "@/lib/skills/registry";

export default function SkillsManager() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/skills");
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || []);
      }
    } catch (error) {
      console.error("Failed to load skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSkill = async (name: string) => {
    if (!confirm(`Delete skill "${name}"?`)) return;

    setDeleting(name);
    try {
      const response = await fetch(`/api/skills/${name}`, { method: "DELETE" });
      if (response.ok) {
        await loadSkills();
      }
    } catch (error) {
      console.error("Failed to delete skill:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-ink mb-4">
        Skills
      </h3>

      <div className="space-y-3">
        {skills.map((skill) => (
          <div
            key={skill.metadata.name}
            className="card rounded-none p-4 flex items-start justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-ink">
                  /{skill.metadata.name}
                </h4>
                <span className="text-xs text-ink-muted">
                  v{skill.metadata.version}
                </span>
              </div>
              <p className="text-sm text-ink-muted mt-1">
                {skill.metadata.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {skill.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-full bg-surface-muted text-ink-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {!skill.metadata.author.includes("Poseidon") && (
              <button
                onClick={() => handleDeleteSkill(skill.metadata.name)}
                disabled={deleting === skill.metadata.name}
                className="px-3 py-1.5 rounded-md text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {deleting === skill.metadata.name ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        ))}

        {skills.length === 0 && (
          <div className="text-center py-8 text-ink-muted">
            No skills yet. Create your first skill!
          </div>
        )}
      </div>
    </div>
  );
}
