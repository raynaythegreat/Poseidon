import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface AnthropicModel {
  id: string;
  display_name: string;
  created_at: string;
}

interface AnthropicModelsResponse {
  data?: AnthropicModel[];
}

const FALLBACK_CLAUDE_MODELS = [
  { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", description: "Smartest flagship" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Previous flagship" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "Fast & capable" },
] as const;

function buildFallbackModels() {
  return FALLBACK_CLAUDE_MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
  }));
}

export async function GET() {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { models: buildFallbackModels(), error: "CLAUDE_API_KEY is not configured." },
      { status: 200 }
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `HTTP ${response.status}`);
    }

    const data = (await response.json()) as AnthropicModelsResponse;
    const models = (data.data || [])
      .map((model) => ({
        id: model.id,
        name: model.display_name || model.id,
        description: "Anthropic Claude",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json(
      {
        models: buildFallbackModels(),
        error: error instanceof Error ? error.message : "Failed to load Claude models",
      },
      { status: 200 }
    );
  }
}
