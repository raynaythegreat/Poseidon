import { NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime";
import { ensureNgrokTunnel, getNgrokPublicUrl } from "@/lib/ngrok";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawName = typeof body?.name === "string" ? body.name : "";
  const name = rawName.trim();

  if (!name) {
    return NextResponse.json({ error: "Model name is required." }, { status: 400 });
  }

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

  const normalizedBase = normalizeUrl(baseUrl);
  const apiKey = process.env.OLLAMA_API_KEY;
  const cfAccessClientId = process.env.OLLAMA_CF_ACCESS_CLIENT_ID;
  const cfAccessClientSecret = process.env.OLLAMA_CF_ACCESS_CLIENT_SECRET;

  if (!normalizedBase) {
    return NextResponse.json(
      {
        error: "Ollama is not configured. Set OLLAMA_BASE_URL (or NEXT_PUBLIC_OLLAMA_BASE_URL).",
      },
      { status: 400 }
    );
  }

  if (onCloud && isUnreachableFromVercel(normalizedBase)) {
    return NextResponse.json(
      {
        error:
          "Set OLLAMA_BASE_URL to your public tunnel (ngrok/Cloudflare); localhost/private network is unreachable from a cloud deployment.",
      },
      { status: 400 }
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "Poseidon/1.0",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...(cfAccessClientId && cfAccessClientSecret
      ? {
          "CF-Access-Client-Id": cfAccessClientId,
          "CF-Access-Client-Secret": cfAccessClientSecret,
        }
      : {}),
    ...(isNgrokHost(normalizedBase) ? { "ngrok-skip-browser-warning": "true" } : {}),
    ...getOllamaCustomHeaders(),
  };

  const response = await fetch(`${normalizedBase}/api/pull`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, stream: true }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const errorMessage =
      response.status === 403 ||
      /\b403\b/.test(text) ||
      /forbidden|access denied/i.test(text)
        ? formatOllamaForbidden(normalizedBase)
        : text || `Ollama pull failed (HTTP ${response.status}).`;
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }

  if (!response.body) {
    return NextResponse.json({ error: "Ollama pull started, but no response stream was available." }, { status: 502 });
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
