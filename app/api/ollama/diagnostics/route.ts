import { NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime";

export const dynamic = "force-dynamic";

// Lightweight diagnostics endpoint to help verify Ollama connectivity settings
export async function GET(_request: Request) {
  const { onCloud } = getRuntimeEnv();
  const configuredBaseUrl =
    process.env.OLLAMA_BASE_URL || process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "";
  const prefersNgrok =
    configuredBaseUrl.toLowerCase() === "ngrok" || configuredBaseUrl.toLowerCase() === "auto";

  // Derive a best-effort base URL for diagnostic purposes, mirroring the decision logic in the models route
  const baseUrl = (() => {
    if (configuredBaseUrl && !prefersNgrok) return configuredBaseUrl;
    if (!onCloud && prefersNgrok) return ""; // ngrok not considered resolvable in this diagnostic context
    if (!onCloud && !configuredBaseUrl) return "http://localhost:11434";
    return "";
  })();

  const result = {
    ok: true,
    onCloud,
    configuredBaseUrl,
    prefersNgrok,
    baseUrl,
    hasCustomHeaders: typeof process.env.OLLAMA_CUSTOM_HEADERS === "string",
    customHeadersValue: process.env.OLLAMA_CUSTOM_HEADERS ?? null,
  };

  return NextResponse.json(result, { status: 200 });
}

