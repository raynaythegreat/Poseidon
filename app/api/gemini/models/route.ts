import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface GeminiModel {
  name: string;
  version: string;
  displayName: string;
  description: string;
  supportedGenerationMethods: string[];
}

interface GeminiModelsResponse {
  models?: GeminiModel[];
}

const FALLBACK_GEMINI_MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Ultra fast" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Most powerful" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Fast & cost-effective" },
] as const;

function buildFallbackModels() {
  return FALLBACK_GEMINI_MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
  }));
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { models: buildFallbackModels(), error: "GEMINI_API_KEY is not configured." },
      { status: 200 }
    );
  }

  const baseUrl = (process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/+$/, "");
  const apiVersion = (process.env.GEMINI_API_VERSION || "v1beta").replace(/^\/+|\/+$/g, "");

  try {
    const response = await fetch(`${baseUrl}/${apiVersion}/models?key=${apiKey}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `HTTP ${response.status}`);
    }

    const data = (await response.json()) as GeminiModelsResponse;
    const models = (data.models || [])
      .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
      .map((model) => {
        // Strip "models/" prefix if present
        const id = model.name.startsWith("models/") ? model.name.slice(7) : model.name;
        return {
          id,
          name: model.displayName || id,
          description: model.description || "Google Gemini",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json(
      {
        models: buildFallbackModels(),
        error: error instanceof Error ? error.message : "Failed to load Gemini models",
      },
      { status: 200 }
    );
  }
}
