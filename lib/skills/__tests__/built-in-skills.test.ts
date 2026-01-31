import { describe, it, expect } from "@jest/globals";
import { registry } from "../registry";

describe("Built-in Skills", () => {
  beforeAll(async () => {
    await registry.load();
  });

  it("should load brainstorm skill", () => {
    const skill = registry.get("brainstorm");
    expect(skill).toBeDefined();
    expect(skill?.metadata.name).toBe("brainstorm");
  });

  it("should load plan skill", () => {
    const skill = registry.get("plan");
    expect(skill).toBeDefined();
  });

  it("should load explain skill", () => {
    const skill = registry.get("explain");
    expect(skill).toBeDefined();
  });

  it("should load code-review skill", () => {
    const skill = registry.get("code-review");
    expect(skill).toBeDefined();
  });
});
