import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getRuntimeEnv } from "@/lib/runtime";
import { ensureNgrokTunnel, getNgrokPublicUrl } from "@/lib/ngrok";
import { SYSTEM_PROMPT, MODE_PROMPTS, formatAsMarkdownCodeBlock } from "@/lib/prompts";

// Model configurations
const MODEL_CONFIG: Record<
  string,
  {
    provider:
      | "claude"
      | "openai"
      | "openrouter"
      | "ollama"
      | "groq"
      | "gemini"
      | "opencodezen"
      | "fireworks"
      | "zai";
    apiModel: string;
  }
> = {
  // Claude models
  "claude-opus-4.5": { provider: "claude", apiModel: "claude-3-opus-20240229" },
  "claude-sonnet-4.5": { provider: "claude", apiModel: "claude-3-5-sonnet-latest" },
  "claude-3.5-sonnet": {
    provider: "claude",
    apiModel: "claude-3-5-sonnet-latest",
  },
  "claude-3.5-haiku": {
    provider: "claude",
    apiModel: "claude-3-5-haiku-latest",
  },
  "claude-3-7-sonnet": {
    provider: "claude",
    apiModel: "claude-3-7-sonnet-20250219",
  },

  // OpenAI models
  "gpt-4o": { provider: "openai", apiModel: "gpt-4o" },
  "gpt-4o-mini": { provider: "openai", apiModel: "gpt-4o-mini" },
  "o1": { provider: "openai", apiModel: "o1" },
  "o1-mini": { provider: "openai", apiModel: "o1-mini" },
  "o3-mini": { provider: "openai", apiModel: "o3-mini" },

  // Google Gemini models (via Google API)
  "gemini-3-flash-preview": {
    provider: "gemini",
    apiModel: "gemini-3-flash-preview",
  },
  "gemini-3-pro-preview": {
    provider: "gemini",
    apiModel: "gemini-3-pro-preview",
  },
  "gemini-2.5-flash": { provider: "gemini", apiModel: "gemini-2.5-flash" },
  "gemini-2.5-pro": { provider: "gemini", apiModel: "gemini-2.5-pro" },
  "gemini-2.0-flash": { provider: "gemini", apiModel: "gemini-2.0-flash" },
  "gemini-2.0-flash-lite": {
    provider: "gemini",
    apiModel: "gemini-2.0-flash-lite",
  },
  "gemini-flash-latest": {
    provider: "gemini",
    apiModel: "gemini-flash-latest",
  },
  "gemini-pro-latest": { provider: "gemini", apiModel: "gemini-pro-latest" },
  // Backwards-compatible aliases
  "gemini-1.5-pro": { provider: "gemini", apiModel: "gemini-pro-latest" },
  "gemini-1.5-flash": { provider: "gemini", apiModel: "gemini-flash-latest" },
  "gemini-2.0-pro": { provider: "gemini", apiModel: "gemini-2.5-pro" },

  // OpenRouter Pro/Latest
  "anthropic/claude-3.5-sonnet": {
    provider: "openrouter",
    apiModel: "anthropic/claude-3.5-sonnet",
  },
  "openai/gpt-4o": { provider: "openrouter", apiModel: "openai/gpt-4o" },
  "deepseek/deepseek-r1": {
    provider: "openrouter",
    apiModel: "deepseek/deepseek-r1",
  },
  "deepseek/deepseek-chat": {
    provider: "openrouter",
    apiModel: "deepseek/deepseek-chat",
  },
  "deepseek/deepseek-r1:free": {
    provider: "openrouter",
    apiModel: "deepseek/deepseek-r1:free",
  },
  "deepseek/deepseek-chat:free": {
    provider: "openrouter",
    apiModel: "deepseek/deepseek-chat:free",
  },

  // Groq Latest
  "deepseek-r1-distill-llama-70b": {
    provider: "groq",
    apiModel: "deepseek-r1-distill-llama-70b",
  },
  "llama-3.3-70b-versatile": {
    provider: "groq",
    apiModel: "llama-3.3-70b-versatile",
  },

  // OpenCode Zen models (free tier)
  "big-pickle": { provider: "opencodezen", apiModel: "big-pickle" },
  "minimax-m2.1-free": { provider: "opencodezen", apiModel: "minimax-m2.1-free" },
  "grok-code": { provider: "opencodezen", apiModel: "grok-code" },
  "gpt-5-nano": { provider: "opencodezen", apiModel: "gpt-5-nano" },
  "glm-4.6": { provider: "opencodezen", apiModel: "glm-4.6" },
  "grok-code-fast-1": { provider: "opencodezen", apiModel: "grok-code" },
  "gpt-5": { provider: "opencodezen", apiModel: "gpt-5" },
  "gpt-5-codex": { provider: "opencodezen", apiModel: "gpt-5-codex" },
  "gpt-5.1": { provider: "opencodezen", apiModel: "gpt-5.1" },
  "gpt-5.1-codex": { provider: "opencodezen", apiModel: "gpt-5.1-codex" },
  "gpt-5.1-codex-max": { provider: "opencodezen", apiModel: "gpt-5.1-codex-max" },
  "gpt-5.1-codex-mini": { provider: "opencodezen", apiModel: "gpt-5.1-codex-mini" },
  "gpt-5.2": { provider: "opencodezen", apiModel: "gpt-5.2" },
  "gpt-5.2-codex": { provider: "opencodezen", apiModel: "gpt-5.2-codex" },
  "gemini-3-flash": { provider: "opencodezen", apiModel: "gemini-3-flash" },
  "gemini-3-pro": { provider: "opencodezen", apiModel: "gemini-3-pro" },

  // Z.ai GLM models (cloud via Z.ai API)
  "glm-4.7:zai": { provider: "zai", apiModel: "glm-4.7" },
  "glm-4.7:cloud": { provider: "zai", apiModel: "glm-4.7" },
  "glm-4.6:zai": { provider: "zai", apiModel: "glm-4.6" },
  "glm-4-flash:zai": { provider: "zai", apiModel: "glm-4-flash" },
  "glm-4-flashx:zai": { provider: "zai", apiModel: "glm-4-flashx" },

  // Ollama Local Models (Standard)
  "llama3": { provider: "ollama", apiModel: "llama3" },
  "llama3:8b": { provider: "ollama", apiModel: "llama3:8b" },
  "llama3.1": { provider: "ollama", apiModel: "llama3.1" },
  "llama3.2": { provider: "ollama", apiModel: "llama3.2" },
  "mistral": { provider: "ollama", apiModel: "mistral" },
  "gemma": { provider: "ollama", apiModel: "gemma" },
  "gemma2": { provider: "ollama", apiModel: "gemma2" },
  "qwen2.5-coder": { provider: "ollama", apiModel: "qwen2.5-coder" },
  "deepseek-r1": { provider: "ollama", apiModel: "deepseek-r1" },
  "deepseek-r1:7b": { provider: "ollama", apiModel: "deepseek-r1:7b" },
  "deepseek-coder-v2": { provider: "ollama", apiModel: "deepseek-coder-v2" },
  "codellama": { provider: "ollama", apiModel: "codellama" },
  "dolphin-mixtral": { provider: "ollama", apiModel: "dolphin-mixtral" },
  "phi3": { provider: "ollama", apiModel: "phi3" },

  // Ollama Cloud models (alphabetically sorted)
  "cogito-2.1:671b-cloud": {
    provider: "ollama",
    apiModel: "cogito-2.1:671b-cloud",
  },
  "deepseek-v3.2:cloud": {
    provider: "ollama",
    apiModel: "deepseek-v3.2:cloud",
  },
  "gemini-3-flash-preview:cloud": {
    provider: "ollama",
    apiModel: "gemini-3-flash-preview:cloud",
  },
  "gemma3:4b-cloud": { provider: "ollama", apiModel: "gemma3:4b-cloud" },
  "gpt-oss:20b-cloud": { provider: "ollama", apiModel: "gpt-oss:20b-cloud" },
  "gpt-oss:120b-cloud": { provider: "ollama", apiModel: "gpt-oss:120b-cloud" },
  "kimi-k2-thinking:cloud": {
    provider: "ollama",
    apiModel: "kimi-k2-thinking:cloud",
  },
  "minimax-m2:cloud": { provider: "ollama", apiModel: "minimax-m2:cloud" },
  "minimax-m2.1:cloud": { provider: "ollama", apiModel: "minimax-m2.1:cloud" },
  "qwen3-coder:480b-cloud": {
    provider: "ollama",
    apiModel: "qwen3-coder:480b-cloud",
  },
  "qwen3-next:80b-cloud": {
    provider: "ollama",
    apiModel: "qwen3-next:80b-cloud",
  },
  "qwen3-vl:235b-cloud": {
    provider: "ollama",
    apiModel: "qwen3-vl:235b-cloud",
  },
  "rnj-1:8b-cloud": { provider: "ollama", apiModel: "rnj-1:8b-cloud" },

  // OpenRouter models (free)
  "deepseek-chat-free": {
    provider: "openrouter",
    apiModel: "meta-llama/llama-3.3-70b-instruct:free",
  },
  "deepseek-r1-free": {
    provider: "openrouter",
    apiModel: "deepseek/deepseek-r1-0528:free",
  },
  "qwen-coder-free": {
    provider: "openrouter",
    apiModel: "qwen/qwen3-coder:free",
  },
  "qwen-72b-free": {
    provider: "openrouter",
    apiModel: "meta-llama/llama-3.3-70b-instruct:free",
  },
  "llama-3.3-70b-free": {
    provider: "openrouter",
    apiModel: "meta-llama/llama-3.3-70b-instruct:free",
  },
  "gemma-2-27b-free": {
    provider: "openrouter",
    apiModel: "google/gemma-3-27b-it:free",
  },
  "mistral-nemo-free": {
    provider: "openrouter",
    apiModel: "mistralai/devstral-2:24b",
  },

  // OpenRouter paid models
  "deepseek-coder-v2-or": {
    provider: "openrouter",
    apiModel: "deepseek/deepseek-coder",
  },
  "claude-3.5-sonnet-or": {
    provider: "openrouter",
    apiModel: "anthropic/claude-3.5-sonnet",
  },
  "gpt-4o-or": { provider: "openrouter", apiModel: "openai/gpt-4o" },
  "codellama-70b": {
    provider: "openrouter",
    apiModel: "meta-llama/codellama-70b-instruct",
  },
  "gemini-2.0-flash-or": {
    provider: "openrouter",
    apiModel: "google/gemini-2.0-flash-001",
  },
  "gemini-2.0-pro-or": {
    provider: "openrouter",
    apiModel: "google/gemini-2.0-pro-exp-02-05:free",
  },
  "gemini-1.5-pro-or": {
    provider: "openrouter",
    apiModel: "google/gemini-pro-1.5",
  },
  "gemini-1.5-flash-or": {
    provider: "openrouter",
    apiModel: "google/gemini-flash-1.5",
  },

  // Groq
  "groq-llama-3.1-70b": {
    provider: "groq",
    apiModel: "llama-3.1-70b-versatile",
  },
  "groq-llama-3.1-8b": { provider: "groq", apiModel: "llama-3.1-8b-instant" },
  "groq-gemma2-9b-it": { provider: "groq", apiModel: "gemma2-9b-it" },
  "groq-mixtral-8x7b": { provider: "groq", apiModel: "mixtral-8x7b" },
};

const MODEL_PROVIDERS = [
  "claude",
  "openai",
  "openrouter",
  "ollama",
  "groq",
  "gemini",
  "opencodezen",
  "fireworks",
  "zai",
] as const;
type ModelProvider = (typeof MODEL_PROVIDERS)[number];

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

function formatOllamaForbidden(baseUrl: string) {
  return isNgrokHost(baseUrl)
    ? "Tunnel rejected the request (HTTP 403). If ngrok auth is enabled, disable it or set OLLAMA_CUSTOM_HEADERS with the required headers."
    : "Ollama returned HTTP 403. Check tunnel auth or Cloudflare Access headers (OLLAMA_CF_ACCESS_CLIENT_ID/SECRET) or set OLLAMA_CUSTOM_HEADERS.";
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

function parseModelPrefix(
  value: unknown,
): { provider: ModelProvider; model: string } | null {
  if (typeof value !== "string") return null;
  const [prefix, ...rest] = value.split(":");
  if (!MODEL_PROVIDERS.includes(prefix as ModelProvider)) return null;
  const model = rest.join(":").trim();
  if (!model) return null;
  return { provider: prefix as ModelProvider, model };
}

const OPENROUTER_FREE_FALLBACK_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/devstral-2512:free",
  "deepseek/deepseek-r1-0528:free",
  "tngtech/deepseek-r1t-chimera:free",
  "google/gemma-3-27b-it:free",
  "qwen/qwen3-coder:free",
  "xiaomi/mimo-v2-flash:free",
  "allenai/molmo-2-8b:free",
] as const;

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const status = (error as any).status ?? (error as any).response?.status;
  return typeof status === "number" ? status : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Request failed";
}

function shouldFallbackOpenRouter(error: unknown): boolean {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error);

  if (status === 404) return true;
  if (status === 429) return true;
  if (/\b429\b/.test(message)) return true;
  if (/no endpoints found/i.test(message)) return true;
  if (/rate-?limited|too many requests/i.test(message)) return true;

  return false;
}

function formatOpenRouterError(error: unknown): string {
  const message = getErrorMessage(error);
  const status = getErrorStatus(error);

  if (
    /free model publication/i.test(message) ||
    /openrouter\.ai\/settings\/privacy/i.test(message)
  ) {
    return [
      "OpenRouter free models are blocked by your privacy settings.",
      "Enable “Free model publication” at https://openrouter.ai/settings/privacy and try again.",
    ].join(" ");
  }

  if (
    status === 429 ||
    /\b429\b/.test(message) ||
    /rate-?limited|too many requests/i.test(message)
  ) {
    return "OpenRouter free models are temporarily rate-limited. Try again in a minute or switch models.";
  }

  return message;
}

type ChatAttachmentPayload =
  | {
      kind: "image";
      name: string;
      mimeType: string;
      dataUrl: string;
    }
  | {
      kind: "text";
      name: string;
      mimeType: string;
      content: string;
      truncated: boolean;
    }
  | {
      kind: "binary";
      name: string;
      mimeType: string;
      size: number;
    };

type NormalizedAttachment =
  | {
      kind: "image";
      name: string;
      mimeType: string;
      dataUrl: string;
      base64: string;
    }
  | {
      kind: "text";
      name: string;
      mimeType: string;
      content: string;
      truncated: boolean;
    }
  | {
      kind: "binary";
      name: string;
      mimeType: string;
      size: number;
    };

const MAX_ATTACHMENTS = 5;
const MAX_TEXT_CHARS = 60000;
const MAX_IMAGE_DATA_URL_CHARS = 5_000_000;

function resolveAppUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured && configured.trim()) return configured.trim();

  if (process.env.VERCEL_URL) {
    const url = process.env.VERCEL_URL.trim();
    if (url) return url.startsWith("http") ? url : `https://${url}`;
  }

  const origin = request.headers.get("origin");
  if (origin) return origin;

  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) return `${proto}://${host}`;

  return "http://localhost:1998";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeAttachments(value: unknown): NormalizedAttachment[] {
  if (!Array.isArray(value)) return [];

  const normalized: NormalizedAttachment[] = [];
  for (const raw of value.slice(0, MAX_ATTACHMENTS)) {
    if (!isPlainObject(raw)) continue;

    const kind = raw.kind;
    const name =
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim().slice(0, 200)
        : "attachment";
    const mimeType =
      typeof raw.mimeType === "string" && raw.mimeType.trim()
        ? raw.mimeType.trim().slice(0, 200)
        : "application/octet-stream";

    if (kind === "image") {
      const dataUrl = typeof raw.dataUrl === "string" ? raw.dataUrl : "";
      if (!dataUrl || dataUrl.length > MAX_IMAGE_DATA_URL_CHARS) continue;
      const match = dataUrl.match(/^data:([^;]+);base64,([a-z0-9+/=]+)$/i);
      if (!match) continue;
      const dataMimeType = match[1]?.trim() || mimeType;
      const base64 = match[2] || "";
      if (!dataMimeType.startsWith("image/")) continue;
      if (!base64) continue;

      normalized.push({
        kind: "image",
        name,
        mimeType: dataMimeType,
        dataUrl,
        base64,
      });
      continue;
    }

    if (kind === "text") {
      const contentRaw = typeof raw.content === "string" ? raw.content : "";
      const content =
        contentRaw.length > MAX_TEXT_CHARS
          ? contentRaw.slice(0, MAX_TEXT_CHARS)
          : contentRaw;
      const truncated =
        Boolean(raw.truncated) || contentRaw.length > MAX_TEXT_CHARS;
      normalized.push({
        kind: "text",
        name,
        mimeType,
        content,
        truncated,
      });
      continue;
    }

    if (kind === "binary") {
      const size =
        typeof raw.size === "number" && Number.isFinite(raw.size)
          ? Math.max(0, raw.size)
          : 0;
      normalized.push({ kind: "binary", name, mimeType, size });
      continue;
    }
  }

  return normalized;
}

function findLastUserMessageIndex(messages: Array<{ role: string }>) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") return i;
  }
  return -1;
}

function formatTextAttachment(
  attachment: Extract<NormalizedAttachment, { kind: "text" }>,
) {
  const header = `Attached file: ${attachment.name} (${attachment.mimeType})${attachment.truncated ? " [truncated]" : ""}`;
  return `${header}\n\n\`\`\`\n${attachment.content}\n\`\`\``;
}

function formatBinaryAttachment(
  attachment: Extract<NormalizedAttachment, { kind: "binary" }>,
) {
  return `Attached file: ${attachment.name} (${attachment.mimeType}, ${attachment.size} bytes). Binary content not included.`;
}

function buildOpenAICompatibleMessages(
  contextPrompt: string,
  messages: Array<{ role: string; content: string }>,
  attachments: NormalizedAttachment[],
) {
  const out: any[] = [
    { role: "system", content: contextPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  if (attachments.length === 0) return out;

  const userIndex = findLastUserMessageIndex(out);
  if (userIndex === -1) return out;

  const target = out[userIndex];
  const originalText = typeof target.content === "string" ? target.content : "";

  const parts: any[] = [];
  if (originalText) {
    parts.push({ type: "text", text: originalText });
  }

  for (const attachment of attachments) {
    if (attachment.kind === "image") {
      parts.push({ type: "text", text: `Image: ${attachment.name}` });
      parts.push({ type: "image_url", image_url: { url: attachment.dataUrl } });
    } else if (attachment.kind === "text") {
      parts.push({ type: "text", text: formatTextAttachment(attachment) });
    } else {
      parts.push({ type: "text", text: formatBinaryAttachment(attachment) });
    }
  }

  out[userIndex] = {
    ...target,
    content:
      parts.length > 0 ? parts : [{ type: "text", text: originalText || "" }],
  };
  return out;
}

function buildAnthropicMessages(
  messages: Array<{ role: string; content: string }>,
  attachments: NormalizedAttachment[],
) {
  const out: any[] = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  if (attachments.length === 0) return out;

  const userIndex = findLastUserMessageIndex(out);
  if (userIndex === -1) return out;

  const target = out[userIndex];
  const originalText = typeof target.content === "string" ? target.content : "";

  const blocks: any[] = [];
  if (originalText) {
    blocks.push({ type: "text", text: originalText });
  } else {
    blocks.push({ type: "text", text: "User sent attachments:" });
  }

  for (const attachment of attachments) {
    if (attachment.kind === "image") {
      blocks.push({ type: "text", text: `Image: ${attachment.name}` });
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: attachment.mimeType,
          data: attachment.base64,
        },
      });
    } else if (attachment.kind === "text") {
      blocks.push({ type: "text", text: formatTextAttachment(attachment) });
    } else {
      blocks.push({ type: "text", text: formatBinaryAttachment(attachment) });
    }
  }

  out[userIndex] = { ...target, content: blocks };
  return out;
}

function buildOllamaMessages(
  contextPrompt: string,
  messages: Array<{ role: string; content: string }>,
  attachments: NormalizedAttachment[],
) {
  const out: any[] = [
    { role: "system", content: contextPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  if (attachments.length === 0) return out;

  const userIndex = findLastUserMessageIndex(out);
  if (userIndex === -1) return out;

  const target = out[userIndex];
  const originalText = typeof target.content === "string" ? target.content : "";

  let nextContent = originalText;
  const images: string[] = [];

  for (const attachment of attachments) {
    if (attachment.kind === "image") {
      images.push(attachment.base64);
      nextContent += `\n\n[Image: ${attachment.name}]`;
    } else if (attachment.kind === "text") {
      nextContent += `\n\n${formatTextAttachment(attachment)}`;
    } else {
      nextContent += `\n\n${formatBinaryAttachment(attachment)}`;
    }
  }

  out[userIndex] = {
    ...target,
    content: nextContent || "User sent attachments.",
    ...(images.length > 0 ? { images } : {}),
  };

  return out;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages,
      model,
      provider: requestedProvider,
      customConfig,
      repoContext,
      attachments,
      mode,
      skillMode,
    } = body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Custom Provider Handling
    if (requestedProvider === "custom" && customConfig) {
      const { baseUrl, apiKey, model: customModelId } = customConfig;
      const effectiveModel = customModelId || model;

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
             const openai = new OpenAI({
              apiKey: apiKey || "dummy", // Some local servers don't need a key
              baseURL: baseUrl,
            });

            const contextPrompt = SYSTEM_PROMPT; // Use base system prompt or enhance it
             // We can reuse the buildOpenAICompatibleMessages logic
             // Need to handle attachments
             const normalizedAttachments = normalizeAttachments(
                attachments as ChatAttachmentPayload[] | undefined,
             );
            const openAIStyleMessages = buildOpenAICompatibleMessages(
              contextPrompt,
              messages,
              normalizedAttachments,
            );

            const response = await openai.chat.completions.create({
              model: effectiveModel,
              messages: openAIStyleMessages,
              stream: true,
            });

            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                  ),
                );
              }
            }
             controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
             );
            controller.close();
          } catch (error) {
            console.error("Custom provider stream error:", error);
             controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "error",
                    error: error instanceof Error ? error.message : "Stream failed",
                  })}\n\n`,
                ),
              );
            controller.close();
          }
        }
      });
      
       return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const parsedModel = parseModelPrefix(model);
    const normalizedProvider = MODEL_PROVIDERS.includes(
      requestedProvider as ModelProvider,
    )
      ? (requestedProvider as ModelProvider)
      : null;
    const modelName = typeof model === "string" ? model : "";
    const baseConfig = modelName ? MODEL_CONFIG[modelName] : undefined;
    let modelConfig:
      | {
          provider: ModelProvider;
          apiModel: string;
        }
      | undefined;

    if (parsedModel) {
      const parsedConfig = MODEL_CONFIG[parsedModel.model];
      modelConfig =
        parsedConfig && parsedConfig.provider === parsedModel.provider
          ? parsedConfig
          : { provider: parsedModel.provider, apiModel: parsedModel.model };
    } else if (normalizedProvider && modelName) {
      modelConfig =
        baseConfig && baseConfig.provider === normalizedProvider
          ? baseConfig
          : { provider: normalizedProvider, apiModel: modelName };
    } else {
      modelConfig = baseConfig || MODEL_CONFIG["claude-sonnet-4"];
    }
    const provider = modelConfig.provider;
    const apiModel = modelConfig.apiModel;

    // Debug logging
    console.log("[Chat API] Model routing:", {
      receivedModel: model,
      receivedProvider: requestedProvider,
      normalizedProvider,
      parsedModel,
      baseConfigProvider: baseConfig?.provider ?? null,
      finalProvider: provider,
      finalApiModel: apiModel,
    });

    const openrouterApiKey =
      process.env.OPENROUTER_API_KEY ||
      process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    const groqApiKey =
      process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const fireworksApiKey =
      process.env.FIREWORKS_API_KEY || process.env.FIREWORKS_IMAGE_API_KEY;
    const fireworksBaseUrl =
      process.env.FIREWORKS_CHAT_BASE_URL?.trim() ||
      process.env.FIREWORKS_BASE_URL?.trim() ||
      "https://api.fireworks.ai/inference/v1";
    const appUrl = resolveAppUrl(request);

    const opencodeApiKey =
      process.env.OPENCODE_API_KEY ||
      process.env.OPENCODE_ZEN_API_KEY ||
      process.env.OPENCODEZEN_API_KEY;
    const rawProviderKey = {
      claude: process.env.CLAUDE_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      openrouter: openrouterApiKey,
      ollama: process.env.OLLAMA_API_KEY,
      groq: groqApiKey,
      opencodezen: opencodeApiKey,
      fireworks: fireworksApiKey,
      zai: process.env.ZAI_API_KEY,
    }[provider];
    const providerKey =
      typeof rawProviderKey === "string" ? rawProviderKey.trim() : rawProviderKey;

    if (!providerKey && provider !== "ollama") {
      const envHint =
        provider === "openrouter"
          ? "Set OPENROUTER_API_KEY (or NEXT_PUBLIC_OPENROUTER_API_KEY)."
          : provider === "groq"
            ? "Set GROQ_API_KEY (recommended) or NEXT_PUBLIC_GROQ_API_KEY."
            : provider === "gemini"
              ? "Set GEMINI_API_KEY."
              : provider === "opencodezen"
                ? "Set OPENCODE_API_KEY (or OPENCODE_ZEN_API_KEY / OPENCODEZEN_API_KEY)."
                : provider === "fireworks"
                  ? "Set FIREWORKS_API_KEY."
                : provider === "zai"
                  ? "Set ZAI_API_KEY."
                : "";
      return new Response(
        JSON.stringify({
          error: `${provider.toUpperCase()} API key is not configured${envHint ? ` ${envHint}` : ""}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Build context-aware system prompt
    let contextPrompt = SYSTEM_PROMPT;
    const resolvedMode =
      mode === "plan" || mode === "build" ? (mode as keyof typeof MODE_PROMPTS) : null;

    if (repoContext) {
      contextPrompt += `\n\n## Current Repository Context\n`;
      contextPrompt += `Repository: ${repoContext.repoFullName}\n\n`;

      if (repoContext.structure) {
        contextPrompt += `### Repository Structure:\n${formatAsMarkdownCodeBlock(repoContext.structure)}\n\n`;
      }

      if (repoContext.files && repoContext.files.length > 0) {
        contextPrompt += `### Key Files:\n`;
        for (const file of repoContext.files.slice(0, 10)) {
          contextPrompt += `\n#### ${file.path}\n${formatAsMarkdownCodeBlock(file.content.slice(0, 3000))}\n`;
        }
      }
    }

    if (resolvedMode) {
      contextPrompt += MODE_PROMPTS[resolvedMode];
    }

    if (skillMode) {
      contextPrompt += "\n\nThe user is using a skill. You should follow the skill's prompt instructions and respond accordingly. The skill prompt contains specific guidance for how to handle this request.";
    }

    const normalizedAttachments = normalizeAttachments(
      attachments as ChatAttachmentPayload[] | undefined,
    );

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (provider === "openrouter") {
            // OpenRouter API (OpenAI-compatible)
            const openrouter = new OpenAI({
              apiKey: openrouterApiKey,
              baseURL: "https://openrouter.ai/api/v1",
              defaultHeaders: {
                "HTTP-Referer": appUrl,
                "X-Title": "Poseidon",
              },
            });

            const openAIStyleMessages = buildOpenAICompatibleMessages(
              contextPrompt,
              messages,
              normalizedAttachments,
            );
            const modelsToTry = apiModel.endsWith(":free")
              ? Array.from(
                  new Set<string>([
                    apiModel,
                    ...OPENROUTER_FREE_FALLBACK_MODELS,
                  ]),
                )
              : [apiModel];

            let lastError: unknown = null;
            let streamedAnyContent = false;

            for (let attempt = 0; attempt < modelsToTry.length; attempt += 1) {
              const candidateModel = modelsToTry[attempt]!;

              try {
                const response = await openrouter.chat.completions.create({
                  model: candidateModel,
                  messages: openAIStyleMessages,
                  stream: true,
                });

                for await (const chunk of response) {
                  const content = chunk.choices[0]?.delta?.content;
                  if (content) {
                    streamedAnyContent = true;
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                      ),
                    );
                  }
                }

                lastError = null;
                break;
              } catch (error) {
                lastError = error;
                if (
                  !streamedAnyContent &&
                  attempt < modelsToTry.length - 1 &&
                  shouldFallbackOpenRouter(error)
                ) {
                  continue;
                }
              }
            }

            if (lastError) {
              throw new Error(formatOpenRouterError(lastError));
            }
          } else if (provider === "openai") {
            const openai = new OpenAI({
              apiKey: process.env.OPENAI_API_KEY,
            });

            const response = await openai.chat.completions.create({
              model: apiModel,
              messages: buildOpenAICompatibleMessages(
                contextPrompt,
                messages,
                normalizedAttachments,
              ),
              stream: true,
            });

            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                  ),
                );
              }
            }
          } else if (provider === "fireworks") {
            const fireworks = new OpenAI({
              apiKey: providerKey,
              baseURL: fireworksBaseUrl,
            });

            const response = await fireworks.chat.completions.create({
              model: apiModel,
              messages: buildOpenAICompatibleMessages(
                contextPrompt,
                messages,
                normalizedAttachments,
              ),
              stream: true,
            });

            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                  ),
                );
              }
            }
          } else if (provider === "groq") {
            const openAIStyleMessages = buildOpenAICompatibleMessages(
              contextPrompt,
              messages,
              normalizedAttachments.filter((a) => a.kind !== "image"),
            );

            const response = await fetch(
              "https://api.groq.com/openai/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${providerKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: apiModel,
                  messages: openAIStyleMessages,
                  stream: true,
                }),
              },
            );

            if (!response.ok || !response.body) {
              const text = await response.text().catch(() => "");
              throw new Error(
                text || `Groq request failed (HTTP ${response.status})`,
              );
            }

            const parseIntHeader = (name: string) => {
              const raw = response.headers.get(name);
              if (!raw) return null;
              const value = Number(raw);
              return Number.isFinite(value) ? value : null;
            };

            const parseResetSeconds = (raw: string | null) => {
              if (!raw) return null;
              const trimmed = raw.trim();
              if (!trimmed) return null;
              if (/^\d+(\.\d+)?$/.test(trimmed)) {
                const seconds = Number(trimmed);
                return Number.isFinite(seconds) ? seconds : null;
              }
              // Formats like "1m0s", "6s", "2h3m"
              const regex = /(\d+(?:\.\d+)?)(ms|s|m|h|d)/g;
              let match: RegExpExecArray | null;
              let totalSeconds = 0;
              while ((match = regex.exec(trimmed))) {
                const amount = Number(match[1]);
                const unit = match[2];
                if (!Number.isFinite(amount)) continue;
                if (unit === "ms") totalSeconds += amount / 1000;
                else if (unit === "s") totalSeconds += amount;
                else if (unit === "m") totalSeconds += amount * 60;
                else if (unit === "h") totalSeconds += amount * 3600;
                else if (unit === "d") totalSeconds += amount * 86400;
              }
              return totalSeconds > 0 ? totalSeconds : null;
            };

            const now = Date.now();
            const rateLimit = {
              requests: {
                limit: parseIntHeader("x-ratelimit-limit-requests"),
                remaining: parseIntHeader("x-ratelimit-remaining-requests"),
                resetAt: (() => {
                  const seconds = parseResetSeconds(
                    response.headers.get("x-ratelimit-reset-requests"),
                  );
                  return seconds != null ? now + seconds * 1000 : null;
                })(),
              },
              tokens: {
                limit: parseIntHeader("x-ratelimit-limit-tokens"),
                remaining: parseIntHeader("x-ratelimit-remaining-tokens"),
                resetAt: (() => {
                  const seconds = parseResetSeconds(
                    response.headers.get("x-ratelimit-reset-tokens"),
                  );
                  return seconds != null ? now + seconds * 1000 : null;
                })(),
              },
              updatedAt: now,
              source: "groq:headers",
            };

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "rate_limit", provider: "groq", rateLimit })}\n\n`,
              ),
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });

              while (true) {
                const eventEnd = buffer.indexOf("\n\n");
                if (eventEnd === -1) break;

                const eventBlock = buffer.slice(0, eventEnd);
                buffer = buffer.slice(eventEnd + 2);

                const lines = eventBlock.split("\n");
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const payload = trimmed.slice(5).trimStart();
                  if (!payload) continue;
                  if (payload === "[DONE]") continue;

                  let data: any;
                  try {
                    data = JSON.parse(payload);
                  } catch {
                    continue;
                  }

                  const content = data?.choices?.[0]?.delta?.content;
                  if (typeof content === "string" && content) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                      ),
                    );
                  }
                }
              }
            }
          } else if (provider === "ollama") {
            const { onCloud } = getRuntimeEnv();
            const configuredBaseUrl =
              process.env.OLLAMA_BASE_URL ||
              process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ||
              "";
            const prefersNgrok =
              configuredBaseUrl.toLowerCase() === "ngrok" ||
              configuredBaseUrl.toLowerCase() === "auto";
            let baseUrl = "";
            if (configuredBaseUrl && !prefersNgrok) {
              baseUrl = configuredBaseUrl;
            } else if (!onCloud && !configuredBaseUrl) {
              baseUrl = "http://localhost:11434";
            }

            if (!baseUrl && !onCloud && prefersNgrok) {
              const ensured = await ensureNgrokTunnel(11434);
              baseUrl = ensured.publicUrl || "";
            } else if (!baseUrl && !onCloud) {
              baseUrl = (await getNgrokPublicUrl(11434)) || baseUrl;
            }

            const normalizedBaseUrl = normalizeUrl(baseUrl);

            if (!normalizedBaseUrl) {
              throw new Error(
                "Ollama is not configured. Set OLLAMA_BASE_URL to your public tunnel (ngrok/Cloudflare) or a reachable endpoint.",
              );
            }
            if (onCloud && isUnreachableFromVercel(normalizedBaseUrl)) {
              throw new Error(
                "Set OLLAMA_BASE_URL to your public tunnel (ngrok/Cloudflare); localhost/private network is unreachable from a cloud deployment.",
              );
            }
            const cfAccessClientId = process.env.OLLAMA_CF_ACCESS_CLIENT_ID;
            const cfAccessClientSecret =
              process.env.OLLAMA_CF_ACCESS_CLIENT_SECRET;
            const customHeaders = getOllamaCustomHeaders();
            const response = await fetch(`${normalizedBaseUrl}/api/chat`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "User-Agent": "Poseidon/1.0",
                "ngrok-skip-browser-warning": "true",
                "Origin": "http://localhost:11434",
                ...(providerKey
                  ? { Authorization: `Bearer ${providerKey}` }
                  : {}),
                ...(cfAccessClientId && cfAccessClientSecret
                  ? {
                      "CF-Access-Client-Id": cfAccessClientId,
                      "CF-Access-Client-Secret": cfAccessClientSecret,
                    }
                  : {}),
                ...customHeaders,
              },
              body: JSON.stringify({
                model: apiModel,
                messages: buildOllamaMessages(
                  contextPrompt,
                  messages,
                  normalizedAttachments,
                ),
                stream: true,
              }),
            });

            if (!response.ok || !response.body) {
              const errorText = await response.text();
              if (
                response.status === 403 ||
                /\b403\b/.test(errorText) ||
                /forbidden|access denied/i.test(errorText)
              ) {
                throw new Error(formatOllamaForbidden(normalizedBaseUrl));
              }
              throw new Error(errorText || "Ollama request failed");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                  const data = JSON.parse(trimmed);
                  if (data.error) {
                    throw new Error(data.error);
                  }
                  const content = data.message?.content;
                  if (content) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                      ),
                    );
                  }
                } catch (parseError) {
                  if (parseError instanceof Error) {
                    throw parseError;
                  }
                }
              }
            }
          } else if (provider === "opencodezen") {
            const zenBaseUrl = "https://opencode.ai/zen/v1";
            const isGemini = apiModel.startsWith("gemini-3");
            const isMinimax = apiModel.includes("minimax");
            const zenHeaders: Record<string, string> = {
              "Content-Type": "application/json",
              ...(providerKey
                ? {
                    Authorization: `Bearer ${providerKey}`,
                    "x-api-key": providerKey,
                  }
                : {}),
            };

            const sendZenRequest = async (url: string, payload: any) =>
              fetch(url, {
                method: "POST",
                headers: zenHeaders,
                body: JSON.stringify(payload),
              });

            let response: Response;
            let streamFormat: "openai" | "anthropic" | "google" = "openai";

            if (isMinimax) {
              streamFormat = "anthropic";
              const anthropicMessages = buildAnthropicMessages(
                messages,
                normalizedAttachments,
              );
              response = await sendZenRequest(`${zenBaseUrl}/messages`, {
                model: apiModel,
                messages: anthropicMessages,
                system: contextPrompt,
                max_tokens: 4096,
                stream: true,
              });
            } else if (isGemini) {
              const openAiBody = {
                model: apiModel,
                messages: buildOpenAICompatibleMessages(
                  contextPrompt,
                  messages,
                  normalizedAttachments,
                ),
                stream: true,
                max_tokens: 4096,
              };
              const openAiResponse = await sendZenRequest(
                `${zenBaseUrl}/chat/completions`,
                openAiBody,
              );

              if (!openAiResponse.ok || !openAiResponse.body) {
                const openAiText = await openAiResponse.text().catch(() => "");
                const shouldFallback =
                  openAiResponse.status === 401 ||
                  openAiResponse.status === 403 ||
                  openAiResponse.status === 404 ||
                  openAiResponse.status === 405 ||
                  /missing api key/i.test(openAiText);

                if (shouldFallback) {
                  streamFormat = "google";
                  const geminiMessages = [
                    { role: "user", parts: [{ text: contextPrompt }] },
                    ...messages.map((m: { role: string; content: string }) => ({
                      role: m.role === "user" ? "user" : "model",
                      parts: [{ text: m.content }],
                    })),
                  ];
                  response = await sendZenRequest(
                    `${zenBaseUrl}/models/${apiModel}:streamGenerateContent`,
                    { contents: geminiMessages },
                  );
                  if (!response.ok || !response.body) {
                    const fallbackText = await response.text().catch(() => "");
                    throw new Error(
                      fallbackText ||
                        openAiText ||
                        `OpenCode Zen request failed (HTTP ${response.status})`,
                    );
                  }
                } else {
                  throw new Error(
                    openAiText ||
                      `OpenCode Zen request failed (HTTP ${openAiResponse.status})`,
                  );
                }
              } else {
                streamFormat = "openai";
                response = openAiResponse;
              }
            } else {
              streamFormat = "openai";
              response = await sendZenRequest(`${zenBaseUrl}/chat/completions`, {
                model: apiModel,
                messages: buildOpenAICompatibleMessages(
                  contextPrompt,
                  messages,
                  normalizedAttachments,
                ),
                stream: true,
              });
            }

            if (!response.ok || !response.body) {
              const text = await response.text().catch(() => "");
              throw new Error(
                text || `OpenCode Zen request failed (HTTP ${response.status})`,
              );
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (streamFormat === "openai") {
                  if (trimmed === "data: [DONE]") continue;
                  if (trimmed.startsWith("data: ")) {
                    try {
                      const json = JSON.parse(trimmed.slice(6));
                      const content = json.choices?.[0]?.delta?.content;
                      if (content) {
                        controller.enqueue(
                          encoder.encode(
                            `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                          ),
                        );
                      }
                    } catch {
                      // Skip malformed chunks
                    }
                  }
                } else if (streamFormat === "anthropic") {
                  if (trimmed.startsWith("event: ")) continue;
                  if (trimmed.startsWith("data: ")) {
                    try {
                      const json = JSON.parse(trimmed.slice(6));
                      if (
                        json.type === "content_block_delta" &&
                        json.delta?.type === "text_delta"
                      ) {
                        const content = json.delta.text;
                        if (content) {
                          controller.enqueue(
                            encoder.encode(
                              `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                            ),
                          );
                        }
                      }
                    } catch {
                      // Skip
                    }
                  }
                } else if (streamFormat === "google") {
                   // Google stream usually just sends JSON objects (possibly wrapped in array brackets if not SSE)
                   // But typically via REST it might return a JSON stream or SSE.
                   // The documentation for Zen isn't explicit on stream format for Gemini.
                   // Assuming it proxies the Google API, it might send "data: { ... }" if using SSE adapter
                   // OR just raw JSON objects if using direct stream.
                   // However, our standard Gemini implementation (L1342) reads raw JSON objects from the stream.
                   // Let's try to parse as JSON line first, if it fails, check for "data: ".
                   
                   // Clean potential SSE prefix
                   const jsonStr = trimmed.replace(/^data: /, "").trim();
                   if (jsonStr === "[DONE]") continue;
                   
                   try {
                      const data = JSON.parse(jsonStr);
                      const candidates = data.candidates || [];
                      for (const candidate of candidates) {
                        const content = candidate.content?.parts?.[0]?.text;
                        if (content) {
                          controller.enqueue(
                            encoder.encode(
                              `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                            ),
                          );
                        }
                      }
                   } catch {
                      // Skip
                   }
                }
              }
            }
          } else if (provider === "gemini") {
            const googleApiKey = process.env.GEMINI_API_KEY?.trim();
            if (!googleApiKey) {
              throw new Error("GEMINI_API_KEY is not configured");
            }

            const geminiBaseUrl = (
              process.env.GEMINI_API_BASE_URL ||
              "https://generativelanguage.googleapis.com"
            )
              .trim()
              .replace(/\/+$/, "");
            const geminiApiVersion = (process.env.GEMINI_API_VERSION || "v1beta")
              .trim()
              .replace(/^\/+|\/+$/g, "");
            const geminiUrl = `${geminiBaseUrl}/${geminiApiVersion}/models/${apiModel}:streamGenerateContent?key=${googleApiKey}`;

            const geminiMessages = [
              { role: "user", parts: [{ text: contextPrompt }] },
              ...messages.map((m: { role: string; content: string }) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }],
              })),
            ];

            const response = await fetch(geminiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": googleApiKey,
              },
              body: JSON.stringify({ contents: geminiMessages }),
            });

            if (!response.ok || !response.body) {
              const errorText = await response.text();
              throw new Error(errorText || "Gemini request failed");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });

              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                const cleaned = trimmed.replace(/^data:\s*/i, "").trim();
                if (!cleaned) continue;
                if (cleaned === "])") continue;
                if (cleaned === "[DONE]") continue;

                try {
                  const data = JSON.parse(cleaned);
                  if (data.error) {
                    throw new Error(data.error.message || "Gemini error");
                  }
                  const candidates = data.candidates || [];
                  for (const candidate of candidates) {
                    const content = candidate.content?.parts?.[0]?.text;
                    if (content) {
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                        ),
                      );
                    }
                  }
                } catch (parseError) {
                  // Ignore parsing errors for incomplete chunks
                }
              }
            }
          } else if (provider === "zai") {
            // Z.ai GLM API (OpenAI-compatible)
            const zai = new OpenAI({
              apiKey: providerKey,
              baseURL: "https://api.z.ai/api/paas/v4/",
            });

            const response = await zai.chat.completions.create({
              model: apiModel,
              messages: buildOpenAICompatibleMessages(
                contextPrompt,
                messages,
                normalizedAttachments,
              ),
              stream: true,
            });

            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", content })}\n\n`,
                  ),
                );
              }
            }
          } else {
            // Claude (Anthropic)
            const anthropic = new Anthropic({
              apiKey: process.env.CLAUDE_API_KEY,
            });

            const response = await anthropic.messages.stream({
              model: apiModel,
              max_tokens: 8192,
              system: contextPrompt,
              messages: buildAnthropicMessages(messages, normalizedAttachments),
            });

            for await (const event of response) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", content: event.delta.text })}\n\n`,
                  ),
                );
              }
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
          );
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "Stream failed",
              })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Chat failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
