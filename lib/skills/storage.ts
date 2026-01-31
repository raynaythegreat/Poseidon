import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import type { Skill } from "./types";

const SKILLS_DIR = path.join(process.env.HOME || "", ".poseidon", "skills");

export async function ensureSkillsDir(): Promise<void> {
  await fs.mkdir(SKILLS_DIR, { recursive: true });
}

export async function loadSkill(name: string): Promise<Skill | null> {
  const skillPath = path.join(SKILLS_DIR, name, "skill.md");
  try {
    const content = await fs.readFile(skillPath, "utf-8");
    const frontmatterMatch = content.match(/^---\n(.*?)\n---/s);
    if (!frontmatterMatch) return null;
    const metadata = parse(frontmatterMatch[1]);
    const prompt = content.replace(/^---\n.*?\n---\n/s, "");
    const handlerPath = path.join(SKILLS_DIR, name, "handler.ts");
    let handlerExists = false;
    try { await fs.access(handlerPath); handlerExists = true; } catch {}
    return { metadata, prompt, handlerPath: handlerExists ? handlerPath : undefined };
  } catch { return null; }
}

export async function listAllSkills(): Promise<Skill[]> {
  await ensureSkillsDir();
  const entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
  const skills: Skill[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skill = await loadSkill(entry.name);
      if (skill) skills.push(skill);
    }
  }
  return skills;
}

export async function saveSkill(name: string, skill: Skill): Promise<void> {
  const skillDir = path.join(SKILLS_DIR, name);
  await fs.mkdir(skillDir, { recursive: true });
  const frontmatter = Object.entries(skill.metadata)
    .map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: [${value.map(v => `"${v}"`).join(", ")}]`;
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join("\n");
  const content = `---\n${frontmatter}\n---\n\n${skill.prompt}`;
  await fs.writeFile(path.join(skillDir, "skill.md"), content, "utf-8");
}
