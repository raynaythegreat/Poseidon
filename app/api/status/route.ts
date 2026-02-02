import { NextResponse } from "next/server";
import { getNgrokPublicUrl } from "@/lib/ngrok";
import { readFileSync, existsSync } from "fs";
import { getEnvFilePath } from "@/lib/env";

export const dynamic = "force-dynamic";

// Helper to read .env.local file directly (for dynamic config without restart)
function readEnvLocal(): Record<string, string> {
  const envPath = getEnvFilePath();
  if (!existsSync(envPath)) {
    return {};
  }
  const content = readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};

  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=");
      const keyName = key.trim();
      const value = valueParts.join("=").trim();
      env[keyName] = value;
    }
  });

  return env;
}

function parseUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    // URL() requires a scheme; fall back to parsing host:port
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

function isAbortError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error && error.name === "AbortError") return true;
  if (
    typeof (error as any)?.name === "string" &&
    (error as any).name === "AbortError"
  )
    return true;
  if (
    typeof (error as any)?.code === "string" &&
    (error as any).code === "ABORT_ERR"
  )
    return true;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /aborted|abort/i.test(message);
}

function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const octets = match.slice(1).map((part) => Number(part));
  if (octets.some((num) => !Number.isFinite(num) || num < 0 || num > 255))
    return false;

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

async function checkHttpOk(
  url: string,
  options: { timeoutMs?: number; headers?: HeadersInit } = {},
): Promise<{ ok: boolean; error?: string; timedOut?: boolean }> {
  const { timeoutMs = 2500, headers } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { ok: false, error: text || `HTTP ${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    if (isAbortError(error)) {
      return { ok: false, timedOut: true, error: "Timed out" };
    }
    const message =
      error instanceof Error ? error.message : "Failed to reach endpoint";
    return { ok: false, error: message || "Failed to reach endpoint" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const onVercel = process.env.VERCEL === "1";
  const onRender =
    process.env.RENDER === "true" ||
    (typeof process.env.RENDER_SERVICE_ID === "string" &&
      process.env.RENDER_SERVICE_ID.trim().length > 0);
  const onCloud = onVercel || onRender;
  const vercelEnv =
    typeof process.env.VERCEL_ENV === "string" && process.env.VERCEL_ENV.trim()
      ? process.env.VERCEL_ENV.trim()
      : null;
  const vercelUrl =
    typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL.trim()
      ? process.env.VERCEL_URL.trim()
      : null;
  const vercelGitRef =
    typeof process.env.VERCEL_GIT_COMMIT_REF === "string" &&
    process.env.VERCEL_GIT_COMMIT_REF.trim()
      ? process.env.VERCEL_GIT_COMMIT_REF.trim()
      : null;
  const vercelCommitSha =
    typeof process.env.VERCEL_GIT_COMMIT_SHA === "string" &&
    process.env.VERCEL_GIT_COMMIT_SHA.trim()
      ? process.env.VERCEL_GIT_COMMIT_SHA.trim()
      : null;
  const vercelCommitMessage =
    typeof process.env.VERCEL_GIT_COMMIT_MESSAGE === "string" &&
    process.env.VERCEL_GIT_COMMIT_MESSAGE.trim()
      ? process.env.VERCEL_GIT_COMMIT_MESSAGE.trim()
      : null;
  const rawOllamaBaseUrl =
    typeof process.env.OLLAMA_BASE_URL === "string"
      ? process.env.OLLAMA_BASE_URL.trim()
      : "";
  const rawPublicOllamaBaseUrl =
    typeof process.env.NEXT_PUBLIC_OLLAMA_BASE_URL === "string"
      ? process.env.NEXT_PUBLIC_OLLAMA_BASE_URL.trim()
      : "";
  const configuredOllamaBaseUrl =
    rawOllamaBaseUrl || rawPublicOllamaBaseUrl || "";
  const ollamaPrefersNgrok =
    configuredOllamaBaseUrl.toLowerCase() === "ngrok" ||
    configuredOllamaBaseUrl.toLowerCase() === "auto";
  const ollamaSource = rawOllamaBaseUrl
    ? "OLLAMA_BASE_URL"
    : rawPublicOllamaBaseUrl
      ? "NEXT_PUBLIC_OLLAMA_BASE_URL"
      : !onCloud
        ? "default_localhost"
        : null;
  let ollamaBaseUrl =
    configuredOllamaBaseUrl && !ollamaPrefersNgrok
      ? configuredOllamaBaseUrl
      : !onCloud && !configuredOllamaBaseUrl
        ? "http://localhost:11434"
        : null;
  if (!onCloud && ollamaPrefersNgrok) {
    ollamaBaseUrl = (await getNgrokPublicUrl(11434)) || null;
  }
  if (ollamaBaseUrl) {
    const normalized = normalizeUrl(ollamaBaseUrl);
    ollamaBaseUrl = normalized || null;
  }
  const ollamaConfigured =
    Boolean(process.env.OLLAMA_API_KEY) ||
    Boolean(configuredOllamaBaseUrl) ||
    (!onCloud && !configuredOllamaBaseUrl);

  const groqApiKey =
    process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const groqSource = process.env.GROQ_API_KEY
    ? "GROQ_API_KEY"
    : process.env.NEXT_PUBLIC_GROQ_API_KEY
      ? "NEXT_PUBLIC_GROQ_API_KEY"
      : null;
  const groqWarning =
    !process.env.GROQ_API_KEY && process.env.NEXT_PUBLIC_GROQ_API_KEY
      ? "NEXT_PUBLIC_GROQ_API_KEY is set; move it to GROQ_API_KEY to avoid exposing your key to the browser."
      : null;

  const ollamaStatus: {
    configured: boolean;
    reachable: boolean | null;
    error: string | null;
    source: string | null;
    url: string | null;
    warning: string | null;
  } = {
    configured: ollamaConfigured,
    reachable: null,
    error: null,
    source: ollamaSource,
    url: ollamaBaseUrl
      ? (parseUrl(ollamaBaseUrl)?.origin ?? ollamaBaseUrl)
      : null,
    warning:
      !rawOllamaBaseUrl && rawPublicOllamaBaseUrl
        ? "NEXT_PUBLIC_OLLAMA_BASE_URL is set; move it to OLLAMA_BASE_URL to avoid exposing your tunnel URL to the browser."
        : null,
  };

  if (ollamaBaseUrl) {
    if (onCloud && isUnreachableFromVercel(ollamaBaseUrl)) {
      ollamaStatus.reachable = false;
      ollamaStatus.error =
        "OLLAMA_BASE_URL points to localhost/private network, which is unreachable from a cloud deployment. Use a public tunnel URL.";
    } else {
      const normalized = ollamaBaseUrl.replace(/\/+$/, "");
      const apiKey = process.env.OLLAMA_API_KEY;
      const cfAccessClientId = process.env.OLLAMA_CF_ACCESS_CLIENT_ID;
      const cfAccessClientSecret = process.env.OLLAMA_CF_ACCESS_CLIENT_SECRET;
      const customHeaders = getOllamaCustomHeaders();
      const headers: Record<string, string> = {
        Accept: "application/json",
        "User-Agent": "Poseidon/1.0",
        "ngrok-skip-browser-warning": "true",
        "Origin": "http://localhost:11434",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...(cfAccessClientId && cfAccessClientSecret
          ? {
              "CF-Access-Client-Id": cfAccessClientId,
              "CF-Access-Client-Secret": cfAccessClientSecret,
            }
          : {}),
        ...customHeaders,
      };

      const timeoutMs = onVercel ? 6000 : 2500;
      const result = await checkHttpOk(`${normalized}/api/tags`, {
        timeoutMs,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });
      if (result.ok) {
        ollamaStatus.reachable = true;
        ollamaStatus.error = null;
      } else if (result.timedOut) {
        ollamaStatus.reachable = null;
        ollamaStatus.error =
          "Timed out checking Ollama. It may still be starting up.";
      } else {
        ollamaStatus.reachable = false;
        const errorText = result.error || "Ollama is offline";
        if (/\b403\b/.test(errorText) || /forbidden|access denied/i.test(errorText)) {
          // Check if it's the ngrok warning page (HTML) or Ollama (text)
          const isNgrokWarning = errorText.includes("You are about to visit") || errorText.includes("ngrok-skip-browser-warning");
          
          if (isNgrokHost(normalized)) {
             ollamaStatus.error = `Tunnel rejected (403). ${isNgrokWarning ? "Ngrok warning page detected." : "Auth failed."} Response: ${errorText.slice(0, 100)}`;
          } else {
             ollamaStatus.error = `Ollama rejected (403). Response: ${errorText.slice(0, 100)}`;
          }
        } else {
          ollamaStatus.error = errorText;
        }
      }
    }
  }

  const status = {
    runtime: {
      onVercel,
      onRender,
      vercelEnv,
      vercelUrl: vercelUrl ? `https://${vercelUrl}` : null,
      vercelGitRef,
      vercelCommitSha,
      vercelCommitMessage,
    },
    claude: {
      configured: Boolean(process.env.CLAUDE_API_KEY),
      reachable: (await checkHttpOk("https://api.anthropic.com/v1/models", {
        timeoutMs: 3000,
        headers: { 
          "x-api-key": process.env.CLAUDE_API_KEY || "",
          "anthropic-version": "2023-06-01"
        }
      })).ok,
    },
    groq: {
      configured: Boolean(groqApiKey),
      source: groqSource,
      warning: groqWarning,
    },
    openrouter: {
      configured: Boolean(
        process.env.OPENROUTER_API_KEY ||
          process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
      ),
    },
    opencodezen: {
      configured: Boolean(
        process.env.OPENCODE_API_KEY ||
          process.env.OPENCODE_ZEN_API_KEY ||
          process.env.OPENCODEZEN_API_KEY,
      ),
    },
    fireworks: {
      configured: Boolean(
        process.env.FIREWORKS_IMAGE_API_KEY || process.env.FIREWORKS_API_KEY,
      ),
    },
    nanobanana: {
      configured: Boolean(
        process.env.NANOBANANA_IMAGE_API_KEY || process.env.NANOBANANA_API_KEY,
      ),
    },
    ideogram: {
      configured: Boolean(
        process.env.IDEOGRAM_IMAGE_API_KEY || process.env.IDEOGRAM_API_KEY,
      ),
    },
    ollama: ollamaStatus,
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY),
      reachable: (await checkHttpOk(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`, { timeoutMs: 3000 })).ok,
    },
    glm: {
      configured: Boolean(process.env.GLM_API_KEY),
      reachable: (await checkHttpOk("https://api.z.ai/api/coding/paas/v4/models", {
        timeoutMs: 3000,
        headers: { Authorization: `Bearer ${process.env.GLM_API_KEY}` }
      })).ok,
    },
    openai: {
      configured: Boolean(process.env.OPENAI_API_KEY),
      reachable: (await checkHttpOk("https://api.openai.com/v1/models", { 
        timeoutMs: 3000,
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
      })).ok,
    },
    github: {
      configured: Boolean(process.env.GITHUB_TOKEN || readEnvLocal().GITHUB_TOKEN),
      username: process.env.GITHUB_USERNAME || readEnvLocal().GITHUB_USERNAME || null,
    },
    vercel: {
      configured: Boolean(process.env.VERCEL_TOKEN || readEnvLocal().VERCEL_TOKEN),
    },
    render: {
      configured: Boolean(process.env.RENDER_API_KEY || readEnvLocal().RENDER_API_KEY),
    },
  };

  return NextResponse.json(status);
}
