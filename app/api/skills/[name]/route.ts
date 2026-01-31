import { NextRequest, NextResponse } from "next/server";
import { registry } from "@/lib/skills/registry";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    await registry.load();
    const { name } = await params;
    const skill = registry.get(name);

    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      skill: {
        name: skill.metadata.name,
        description: skill.metadata.description,
        tags: skill.metadata.tags,
        prompt: skill.prompt,
      },
    });
  } catch (error) {
    console.error("Failed to load skill:", error);
    return NextResponse.json(
      { error: "Failed to load skill" },
      { status: 500 }
    );
  }
}
