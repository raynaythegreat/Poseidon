import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface OpenAIModelsResponse {
  data?: OpenAIModel[];
}

const FALLBACK_OPENAI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", description: "Flagship model" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Affordable flagship" },
  { id: "o1", name: "o1", description: "Reasoning model" },
  { id: "o1-mini", name: "o1-mini", description: "Fast reasoning" },
  { id: "o3-mini", name: "o3-mini", description: "Latest reasoning" },
] as const;

function buildFallbackModels() {
  return FALLBACK_OPENAI_MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
  }));
}

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { models: buildFallbackModels(), error: "OPENAI_API_KEY is not configured." },
      { status: 200 }
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `HTTP ${response.status}`);
    }

    const data = (await response.json()) as OpenAIModelsResponse;
    const models = (data.data || [])
      .filter((model) => model.id.startsWith("gpt-") || model.id.startsWith("o1-") || model.id === "o1" || model.id.startsWith("o3-"))
      .filter((model) => !model.id.includes("vision") && !model.id.includes("instruct") && !model.id.includes("realtime"))
      .map((model) => ({
        id: model.id,
        name: model.id,
        description: "OpenAI",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json(
      {
        models: buildFallbackModels(),
        error: error instanceof Error ? error.message : "Failed to load OpenAI models",
      },
      { status: 200 }
    );
  }
}
