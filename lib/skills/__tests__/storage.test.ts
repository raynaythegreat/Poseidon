import { describe, it, expect, afterEach } from "@jest/globals";
import { rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { loadSkill, listAllSkills, saveSkill } from "../storage";
import type { Skill } from "../types";

describe("Skill Storage", () => {
  afterEach(async () => {
    try {
      await rm(path.join(os.homedir(), ".poseidon", "skills", "test-skill"), { recursive: true, force: true });
    } catch {}
  });
  it("should list all skills", async () => {
    const skills = await listAllSkills();
    expect(Array.isArray(skills)).toBe(true);
  });

  it("should save and load a skill", async () => {
    const skill: Skill = {
      metadata: {
        name: "test-skill",
        description: "Test skill",
        version: "1.0.0",
        author: "test",
        tags: ["test"],
        context: ["chat"],
      },
      prompt: "Do something",
    };
    await saveSkill("test-skill", skill);
    const loaded = await loadSkill("test-skill");
    expect(loaded?.metadata.name).toBe("test-skill");
  });
});
