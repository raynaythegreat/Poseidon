import { NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime";
import { ensureNgrokTunnel, getNgrokPublicUrl } from "@/lib/ngrok";

export const dynamic = "force-dynamic";

function parseUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`http://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parsed = parseUrl(trimmed);
  if (!parsed) return trimmed.replace(/\/+$/, "");
  return parsed.toString().replace(/\/+$/, "");
}

function getOllamaCustomHeaders(): Record<string, string> {
  const raw = process.env.OLLAMA_CUSTOM_HEADERS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const normalizedKey = typeof key === "string" ? key.trim() : "";
      if (!normalizedKey) continue;
      if (value == null) continue;
      if (typeof value === "string") {
        headers[normalizedKey] = value;
      } else if (typeof value === "number" || typeof value === "boolean") {
        headers[normalizedKey] = String(value);
      }
    }
    return headers;
  } catch {
    return {};
  }
}

function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const octets = match.slice(1).map((part) => Number(part));
  if (octets.some((num) => !Number.isFinite(num) || num < 0 || num > 255)) return false;

  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function isUnreachableFromVercel(urlOrHost: string): boolean {
  const parsed = parseUrl(urlOrHost);
  const hostname = (parsed?.hostname || urlOrHost).trim().toLowerCase();
  if (!hostname) return false;
  if (hostname === "localhost") return true;
  if (hostname === "::1") return true;
  if (hostname.endsWith(".local")) return true;
  return isPrivateIpv4(hostname);
}

function isNgrokHost(urlOrHost: string): boolean {
  const parsed = parseUrl(urlOrHost);
  const hostname = (parsed?.hostname || urlOrHost).trim().toLowerCase();
  if (!hostname) return false;
  return hostname.includes("ngrok");
}

async function fetchWithTimeout(url: string, timeoutMs: number, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeout);
  }
}

interface OllamaModelDetails {
  family?: string;
  parameter_size?: string;
  quantization_level?: string;
}

interface OllamaModel {
  name: string;
  details?: OllamaModelDetails;
}

interface OllamaTagsResponse {
  models?: OllamaModel[];
}

function buildDescription(details?: OllamaModelDetails): string {
  if (!details) return "Ollama model";
  const parts = [details.family, details.parameter_size, details.quantization_level].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Ollama model";
}

function shouldExcludeOllamaModel(name: string) {
  const normalized = name.trim().toLowerCase();
  return normalized.startsWith("gemini-3-pro");
}

function isNetworkError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("etimedout") ||
    lower.includes("ehostunreach") ||
    lower.includes("econnreset") ||
    lower.includes("networkerror")
  );
}

function formatOllamaModelsError(errors: string[]) {
  const combined = errors.join("; ");
  if (/unreachable from (a )?cloud/i.test(combined) && /(localhost|private network)/i.test(combined)) {
    return "Set OLLAMA_BASE_URL to your public tunnel; localhost/private network is unreachable from a cloud deployment.";
  }
  if (/\b403\b/.test(combined) || /forbidden|access denied/i.test(combined)) {
    return "Ollama returned HTTP 403. Check tunnel auth or Cloudflare Access headers (OLLAMA_CF_ACCESS_CLIENT_ID/SECRET) or set OLLAMA_CUSTOM_HEADERS.";
  }
  if (errors.some((message) => isNetworkError(message))) {
    return "Ollama is offline. Start Ollama and check your tunnel/OLLAMA_BASE_URL.";
  }
  return errors.length > 0 ? errors[0] : "Failed to load Ollama models. Check OLLAMA_BASE_URL.";
}

export async function GET(_request: Request) {
  const { onCloud } = getRuntimeEnv();
  const configuredBaseUrl =
    process.env.OLLAMA_BASE_URL || process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "";
  const prefersNgrok =
    configuredBaseUrl.toLowerCase() === "ngrok" ||
    configuredBaseUrl.toLowerCase() === "auto";
  const baseUrl = (() => {
    if (configuredBaseUrl && !prefersNgrok) return configuredBaseUrl;
    if (!onCloud && prefersNgrok) return "";
    if (!onCloud && !configuredBaseUrl) return "http://localhost:11434";
    return "";
  })();
  const modelsUrl = process.env.OLLAMA_MODELS_URL;
  const apiKey = process.env.OLLAMA_API_KEY;
  const cfAccessClientId = process.env.OLLAMA_CF_ACCESS_CLIENT_ID;
  const cfAccessClientSecret = process.env.OLLAMA_CF_ACCESS_CLIENT_SECRET;

  let resolvedBaseUrl = baseUrl;
  if (!resolvedBaseUrl && !onCloud && prefersNgrok) {
    const ensured = await ensureNgrokTunnel(11434);
    resolvedBaseUrl = ensured.publicUrl || "";
  } else if (!resolvedBaseUrl && !onCloud) {
    resolvedBaseUrl = (await getNgrokPublicUrl(11434)) || resolvedBaseUrl;
  }

  // Auto-start ngrok if still not resolved and running locally
  if (!resolvedBaseUrl && !onCloud) {
    const ensured = await ensureNgrokTunnel(11434);
    if (ensured.publicUrl) resolvedBaseUrl = ensured.publicUrl;
  }

  resolvedBaseUrl = normalizeUrl(resolvedBaseUrl);

  if (!resolvedBaseUrl) {
    return NextResponse.json(
      {
        models: [],
        suggestions: [],
        error:
          "Ollama is not configured. Set OLLAMA_BASE_URL (or NEXT_PUBLIC_OLLAMA_BASE_URL).",
      },
      { status: 200 }
    );
  }

  const candidates = Array.from(
    new Set(
      [
        modelsUrl ? normalizeUrl(modelsUrl) : null,
        resolvedBaseUrl,
      ].filter(Boolean)
    )
  ) as string[];

  const collected: OllamaModel[] = [];
  const errors: string[] = [];
  let reachedAnySource = false;

  for (const candidate of candidates) {
    try {
      if (onCloud && isUnreachableFromVercel(candidate)) {
        throw new Error(
          "Set OLLAMA_BASE_URL to your public tunnel; localhost/private network is unreachable from a cloud deployment."
        );
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "GateKeep/1.0",
        "ngrok-skip-browser-warning": "true",
        "Origin": "http://localhost:11434",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...(cfAccessClientId && cfAccessClientSecret
          ? {
              "CF-Access-Client-Id": cfAccessClientId,
              "CF-Access-Client-Secret": cfAccessClientSecret,
            }
          : {}),
        ...getOllamaCustomHeaders(),
      };

      let response = await fetchWithTimeout(`${candidate}/api/tags`, onCloud ? 20000 : 5000, {
        headers: {
          ...headers,
        },
      });

      // If the request failed, attempt a fallback to localhost as a last resort
      if (!response.ok) {
        try {
          const fallbackResponse = await fetchWithTimeout(`http://localhost:11434/api/tags`, onCloud ? 20000 : 5000, {
            headers: {
              ...headers,
            },
          });
          if (fallbackResponse.ok) {
            response = fallbackResponse;
          } else {
            const text = await fallbackResponse.text();
            throw new Error(text || `HTTP ${fallbackResponse.status}`);
          }
        } catch {
          // keep original error handling if fallback fails
          const text = await response.text();
          throw new Error(text || `HTTP ${response.status}`);
        }
      }

      reachedAnySource = true;
      const data = (await response.json()) as OllamaTagsResponse;
      if (Array.isArray(data.models)) {
        collected.push(...data.models);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load Ollama models";
      errors.push(message);
    }
  }

  const uniqueByName = Array.from(
    collected.reduce((map, model) => {
      if (!map.has(model.name)) {
        map.set(model.name, model);
      }
      return map;
    }, new Map<string, OllamaModel>())
  ).map(([, model]) => model);

  const filteredByName = uniqueByName.filter(
    (model) => !shouldExcludeOllamaModel(model.name),
  );
  const models = filteredByName.map((model) => ({
    id: `ollama:${model.name}`,
    name: model.name,
    description: buildDescription(model.details),
  }));

  const suggestions: Array<{ name: string; description: string; pullCommand: string }> = [];

  if (reachedAnySource) {
    return NextResponse.json({
      models,
      suggestions,
      ...(errors.length > 0 ? { note: `Some sources failed: ${errors.join("; ")}` } : {}),
    });
  }

  return NextResponse.json(
    {
      models: [],
      suggestions,
      error: formatOllamaModelsError(errors),
    },
    { status: 200 }
  );
}
