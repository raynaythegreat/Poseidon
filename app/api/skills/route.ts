import { NextRequest, NextResponse } from "next/server";
import { registry } from "@/lib/skills/registry";

export async function GET(request: NextRequest) {
  try {
    await registry.load();
    const skills = registry.list();

    return NextResponse.json({
      skills: skills.map((skill) => ({
        name: skill.metadata.name,
        description: skill.metadata.description,
        tags: skill.metadata.tags,
        prompt: skill.prompt,
      })),
    });
  } catch (error) {
    console.error("Failed to load skills:", error);
    return NextResponse.json(
      { error: "Failed to load skills" },
      { status: 500 }
    );
  }
}
