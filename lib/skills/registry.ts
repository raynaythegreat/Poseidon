import { listAllSkills, loadSkill } from "./storage";
import type { Skill, SkillContext, SkillExecutionResult } from "./types";

class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    const skills = await listAllSkills();
    for (const skill of skills) {
      this.skills.set(skill.metadata.name, skill);
    }
    this.loaded = true;
  }

  list(): Skill[] {
    return Array.from(this.skills.values());
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  async execute(name: string, context: SkillContext): Promise<SkillExecutionResult> {
    const skill = this.get(name);
    if (!skill) throw new Error(`Skill not found: ${name}`);
    if (skill.handlerPath) {
      const handler = await import(skill.handlerPath);
      return await handler.execute(context);
    }
    return { response: skill.prompt };
  }
}

export const registry = new SkillRegistry();
