import { NextRequest, NextResponse } from "next/server";

type ImageProvider = "fireworks" | "nanobanana" | "ideogram";

const ALLOWED_SIZES = new Set([
  "512x512",
  "768x768",
  "1024x1024",
  "768x1024",
  "1024x768",
  "1024x576",
]);
const MAX_PROMPT_CHARS = 2000;
const DEFAULT_IMAGE_MIME = "image/png";

type ProviderConfig = {
  label: string;
  apiKey?: string;
  baseUrl: string;
  endpoint?: string;
  model: string;
  callbackUrl?: string;
  taskEndpoint?: string;
  taskEndpointHint?: string;
  taskPollAttempts?: number;
  taskPollIntervalMs?: number;
  keyHint: string;
  baseUrlHint: string;
  endpointHint: string;
  modelHint: string;
  requiresModel: boolean;
  renderingSpeed?: string;
  styleType?: string;
};

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function resolveEndpoint(
  baseUrl: string,
  endpoint: string | undefined,
): string | null {
  const endpointValue = endpoint?.trim() || "";
  if (endpointValue && /^https?:\/\//i.test(endpointValue)) {
    return endpointValue;
  }

  const normalizedBase = normalizeUrl(baseUrl || "");
  if (!normalizedBase) return null;
  const path = endpointValue.replace(/^\/+/, "");
  if (!path) return normalizedBase;
  return new URL(
    path,
    normalizedBase.endsWith("/") ? normalizedBase : `${normalizedBase}/`,
  ).toString();
}

function resolveRequestOrigin(request: NextRequest): string | null {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (!host) return null;
  const proto = forwardedProto || "https";
  return `${proto}://${host}`;
}

function mapNanobananaImageSize(size: string): string {
  switch (size) {
    case "512x512":
    case "768x768":
    case "1024x1024":
      return "1:1";
    default:
      return "1:1";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildNanobananaFallbackEndpoints(
  config: ProviderConfig,
  initialUrl: string,
): string[] {
  const base = normalizeUrl(config.baseUrl || "");
  if (!base) return [];
  const trimmedBase = base.replace(/\/+$/, "");
  const cleanedBase = trimmedBase
    .replace(/\/api\/v1$/i, "")
    .replace(/\/v1$/i, "");
  const baseCandidates = Array.from(
    new Set([trimmedBase, cleanedBase].filter(Boolean)),
  );
  const endpointCandidates = [
    config.endpoint?.trim() || "",
    "api/v1/nanobanana/generate",
    "nanobanana-api/generate-or-edit-image",
  ]
    .map((value) => value.replace(/^\/+/, ""))
    .filter(Boolean);

  const candidates = new Set<string>();
  for (const baseCandidate of baseCandidates) {
    for (const endpointCandidate of endpointCandidates) {
      const resolved = resolveEndpoint(baseCandidate, endpointCandidate);
      if (resolved) candidates.add(resolved);
    }
  }

  candidates.delete(initialUrl);
  return Array.from(candidates);
}

async function readErrorBody(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text) return "";
  try {
    const data = JSON.parse(text);
    if (typeof data === "string") return data;
    const message =
      data?.error?.message || data?.message || data?.error || data?.detail;
    if (typeof message === "string" && message && message !== "No message available") {
      return message;
    }
    return JSON.stringify(data);
  } catch {
    return text;
  }
}

function parseBase64(value: string): { base64: string; mimeType: string } {
  const trimmed = value.trim();
  const match = trimmed.match(/^data:([^;]+);base64,(.+)$/i);
  if (match) {
    return { base64: match[2] || "", mimeType: match[1] || DEFAULT_IMAGE_MIME };
  }
  return { base64: trimmed, mimeType: DEFAULT_IMAGE_MIME };
}

async function fetchImageAsBase64(url: string): Promise<{
  base64: string;
  mimeType: string;
} | null> {
  const response = await fetch(url);
  if (!response.ok) return null;
  const mimeType =
    response.headers.get("content-type")?.split(";")[0] || DEFAULT_IMAGE_MIME;
  const buffer = Buffer.from(await response.arrayBuffer());
  return { base64: buffer.toString("base64"), mimeType };
}

function extractNanobananaTaskId(data: any): string | null {
  const candidate =
    data?.data?.taskId ||
    data?.taskId ||
    data?.data?.task_id ||
    data?.task_id;
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return trimmed ? trimmed : null;
}

function hasNanobananaImageData(data: any): boolean {
  const root = data?.data ?? data;
  if (!root) return false;
  if (
    Array.isArray(root?.imageUrls) &&
    root.imageUrls.some((url: unknown) => typeof url === "string")
  ) {
    return true;
  }
  if (Array.isArray(root?.images)) {
    return root.images.some(
      (item: any) =>
        typeof item === "string" ||
        typeof item?.url === "string" ||
        typeof item?.image === "string",
    );
  }
  if (
    typeof root?.image === "string" ||
    typeof root?.image_base64 === "string" ||
    typeof root?.url === "string"
  ) {
    return true;
  }
  return false;
}

async function pollNanobananaTask(params: {
  taskId: string;
  config: ProviderConfig;
  headers: Record<string, string>;
}): Promise<any | null> {
  const taskEndpoint =
    params.config.taskEndpoint?.trim() ||
    "api/v1/nanobanana/get-task-details";
  const taskUrl = resolveEndpoint(params.config.baseUrl || "", taskEndpoint);
  if (!taskUrl) {
    throw new Error(
      `Nanobanana task endpoint missing. Set ${params.config.taskEndpointHint || "NANOBANANA_TASK_ENDPOINT"}.`,
    );
  }

  const attempts =
    Number(params.config.taskPollAttempts) > 0
      ? Number(params.config.taskPollAttempts)
      : 12;
  const intervalMs =
    Number(params.config.taskPollIntervalMs) > 0
      ? Number(params.config.taskPollIntervalMs)
      : 2000;

  let lastError = "";
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(taskUrl, {
      method: "POST",
      headers: {
        Authorization: params.headers.Authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskId: params.taskId }),
    });

    if (!response.ok) {
      lastError = await readErrorBody(response);
    } else {
      const data = await response.json().catch(() => null);
      const code = typeof data?.code === "number" ? data.code : null;
      if (code && code !== 200) {
        throw new Error(data?.msg || "Nanobanana task failed.");
      }
      if (hasNanobananaImageData(data)) return data;

      const status = `${data?.data?.status || data?.status || ""}`.toLowerCase();
      if (status && ["failed", "error", "canceled"].includes(status)) {
        throw new Error(
          typeof data?.msg === "string"
            ? data.msg
            : "Nanobanana task failed.",
        );
      }
    }

    if (attempt < attempts - 1) {
      await sleep(intervalMs);
    }
  }

  if (lastError) {
    throw new Error(lastError);
  }
  return null;
}

function getProviderConfig(provider: ImageProvider): ProviderConfig {
  if (provider === "fireworks") {
    return {
      label: "Fireworks",
      apiKey:
        process.env.FIREWORKS_IMAGE_API_KEY || process.env.FIREWORKS_API_KEY,
      baseUrl:
        process.env.FIREWORKS_IMAGE_BASE_URL ||
        process.env.FIREWORKS_BASE_URL ||
        "https://api.fireworks.ai/inference/v1",
      endpoint:
        process.env.FIREWORKS_IMAGE_ENDPOINT || "images/generations",
      model: process.env.FIREWORKS_IMAGE_MODEL || "",
      keyHint: "FIREWORKS_IMAGE_API_KEY or FIREWORKS_API_KEY",
      baseUrlHint: "FIREWORKS_IMAGE_BASE_URL",
      endpointHint: "FIREWORKS_IMAGE_ENDPOINT",
      modelHint: "FIREWORKS_IMAGE_MODEL",
      requiresModel: true,
    };
  }

  if (provider === "nanobanana") {
    return {
      label: "Nanobanana",
      apiKey:
        process.env.NANOBANANA_IMAGE_API_KEY || process.env.NANOBANANA_API_KEY,
      baseUrl:
        process.env.NANOBANANA_IMAGE_BASE_URL ||
        process.env.NANOBANANA_BASE_URL ||
        "https://api.nanobananaapi.ai",
      endpoint:
        process.env.NANOBANANA_IMAGE_ENDPOINT ||
        "api/v1/nanobanana/generate",
      model: process.env.NANOBANANA_IMAGE_MODEL || "",
      callbackUrl:
        process.env.NANOBANANA_IMAGE_CALLBACK_URL ||
        process.env.NANOBANANA_CALLBACK_URL ||
        "",
      taskEndpoint:
        process.env.NANOBANANA_TASK_ENDPOINT ||
        process.env.NANOBANANA_IMAGE_TASK_ENDPOINT ||
        "",
      taskEndpointHint: "NANOBANANA_TASK_ENDPOINT",
      taskPollAttempts: Number(process.env.NANOBANANA_TASK_POLL_ATTEMPTS || 12),
      taskPollIntervalMs: Number(
        process.env.NANOBANANA_TASK_POLL_INTERVAL_MS || 2000,
      ),
      keyHint: "NANOBANANA_IMAGE_API_KEY or NANOBANANA_API_KEY",
      baseUrlHint: "NANOBANANA_IMAGE_BASE_URL",
      endpointHint: "NANOBANANA_IMAGE_ENDPOINT",
      modelHint: "NANOBANANA_IMAGE_MODEL",
      requiresModel: false,
    };
  }

  return {
    label: "Ideogram",
    apiKey: process.env.IDEOGRAM_IMAGE_API_KEY || process.env.IDEOGRAM_API_KEY,
    baseUrl:
      process.env.IDEOGRAM_IMAGE_BASE_URL ||
      process.env.IDEOGRAM_BASE_URL ||
      "https://api.ideogram.ai",
    endpoint:
      process.env.IDEOGRAM_IMAGE_ENDPOINT || "v1/ideogram-v3/generate",
    model: process.env.IDEOGRAM_IMAGE_MODEL || "",
    renderingSpeed:
      process.env.IDEOGRAM_IMAGE_RENDERING_SPEED || "TURBO",
    styleType: process.env.IDEOGRAM_IMAGE_STYLE_TYPE || "AUTO",
    keyHint: "IDEOGRAM_IMAGE_API_KEY or IDEOGRAM_API_KEY",
    baseUrlHint: "IDEOGRAM_IMAGE_BASE_URL",
    endpointHint: "IDEOGRAM_IMAGE_ENDPOINT",
    modelHint: "IDEOGRAM_IMAGE_MODEL",
    requiresModel: false,
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const provider = payload.provider as ImageProvider | undefined;
    if (!provider || !["fireworks", "nanobanana", "ideogram"].includes(provider)) {
      return NextResponse.json(
        { error: "Unsupported image provider." },
        { status: 400 },
      );
    }

    const promptRaw = typeof payload.prompt === "string" ? payload.prompt : "";
    const styleRaw = typeof payload.style === "string" ? payload.style.trim() : "";

    // Apply style template to prompt if provided
    let enhancedPrompt = promptRaw.trim();
    if (styleRaw) {
      const styleModifiers: Record<string, string> = {
        "realistic": ", photorealistic, highly detailed, 4k quality",
        "digital-art": ", digital art style, vibrant colors, detailed illustration",
        "anime": ", anime style, manga art, vibrant colors",
        "cartoon": ", cartoon style, playful, colorful illustration",
        "3d-render": ", 3D rendered, cinema 4d, octane render, high quality",
        "oil-painting": ", oil painting style, classical art, textured brushstrokes",
        "watercolor": ", watercolor painting, soft colors, artistic",
        "sketch": ", pencil sketch, hand drawn, artistic sketch",
        "pixel-art": ", pixel art style, retro gaming aesthetic, 8-bit",
        "cyberpunk": ", cyberpunk style, neon lights, futuristic, sci-fi",
        "fantasy": ", fantasy art style, magical, ethereal, detailed",
        "minimalist": ", minimalist style, clean, simple, modern design",
      };
      const modifier = styleModifiers[styleRaw];
      if (modifier) {
        enhancedPrompt = enhancedPrompt + modifier;
      }
    }

    const prompt = enhancedPrompt.slice(0, MAX_PROMPT_CHARS);
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const sizeCandidate = typeof payload.size === "string" ? payload.size : "";
    const size = ALLOWED_SIZES.has(sizeCandidate)
      ? sizeCandidate
      : "1024x1024";

    const config = getProviderConfig(provider);
    if (!config.apiKey) {
      return NextResponse.json(
        { error: `${config.label} API key missing. Set ${config.keyHint}.` },
        { status: 400 },
      );
    }

    const endpointUrl = resolveEndpoint(config.baseUrl || "", config.endpoint);
    if (!endpointUrl) {
      return NextResponse.json(
        {
          error: `${config.label} endpoint missing. Set ${config.baseUrlHint} and ${config.endpointHint}.`,
        },
        { status: 400 },
      );
    }

    let resolvedEndpointUrl = endpointUrl;
    const modelOverride =
      typeof payload.model === "string" ? payload.model.trim() : "";
    const model = modelOverride || config.model.trim();
    if (config.requiresModel && !model) {
      return NextResponse.json(
        {
          error: `${config.label} model is required. Set ${config.modelHint} or pass a model.`,
        },
        { status: 400 },
      );
    }

    let callbackUrl = "";
    if (provider === "nanobanana") {
      callbackUrl = config.callbackUrl?.trim() || "";
      if (!callbackUrl) {
        const origin = resolveRequestOrigin(request);
        if (origin) {
          callbackUrl = `${origin}/api/images/nanobanana/callback`;
        }
      }
      if (!callbackUrl) {
        return NextResponse.json(
          {
            error:
              "Nanobanana callback URL missing. Set NANOBANANA_CALLBACK_URL or NANOBANANA_IMAGE_CALLBACK_URL.",
          },
          { status: 400 },
        );
      }
    }

    const headers: Record<string, string> = {};
    let requestBody: BodyInit;
    if (provider === "ideogram") {
      headers["Api-Key"] = config.apiKey;
      const form = new FormData();
      form.append("prompt", prompt);
      if (config.renderingSpeed) {
        form.append("rendering_speed", config.renderingSpeed);
      }
      if (config.styleType) {
        form.append("style_type", config.styleType);
      }
      requestBody = form;
    } else if (provider === "fireworks") {
      headers.Authorization = `Bearer ${config.apiKey}`;
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify({
        model,
        prompt,
        size,
        n: 1,
        response_format: "b64_json",
      });
    } else {
      headers.Authorization = `Bearer ${config.apiKey}`;
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify({
        prompt,
        numImages: 1,
        type: "TEXTTOIMAGE",
        image_size: mapNanobananaImageSize(size),
        callBackUrl: callbackUrl,
      });
    }

    const makeRequest = (url: string) =>
      fetch(url, {
        method: "POST",
        headers,
        body: requestBody,
      });

    let response = await makeRequest(resolvedEndpointUrl);
    if (!response.ok && provider === "nanobanana" && response.status === 404) {
      const fallbackEndpoints = buildNanobananaFallbackEndpoints(
        config,
        resolvedEndpointUrl,
      );
      for (const fallback of fallbackEndpoints) {
        const fallbackResponse = await makeRequest(fallback);
        if (fallbackResponse.ok || fallbackResponse.status !== 404) {
          response = fallbackResponse;
          resolvedEndpointUrl = fallback;
          break;
        }
      }
    }

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      const errorText = await readErrorBody(response);
      const errorPath = (() => {
        try {
          return new URL(resolvedEndpointUrl).pathname;
        } catch {
          return "";
        }
      })();
      return NextResponse.json(
        {
          error:
            errorText ||
            `${config.label} image request failed (HTTP ${response.status})${
              errorPath ? ` at ${errorPath}` : ""
            }.`,
        },
        { status: response.status },
      );
    }

    let data: any = null;
    let directImage: { base64: string; mimeType: string } | null = null;
    if (contentType.startsWith("image/")) {
      const buffer = Buffer.from(await response.arrayBuffer());
      directImage = {
        base64: buffer.toString("base64"),
        mimeType: contentType.split(";")[0] || DEFAULT_IMAGE_MIME,
      };
    } else {
      const responseText = await response.text();
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }
    }

    if (provider === "nanobanana" && data) {
      const taskId = extractNanobananaTaskId(data);
      if (taskId && !hasNanobananaImageData(data)) {
        const taskData = await pollNanobananaTask({
          taskId,
          config,
          headers,
        });
        if (!taskData) {
          return NextResponse.json(
            {
              error:
                "Nanobanana task is still processing. Try again shortly or increase NANOBANANA_TASK_POLL_ATTEMPTS.",
            },
            { status: 202 },
          );
        }
        data = taskData;
      }
    }

    const candidates: Array<{
      b64?: string;
      url?: string;
      mimeType?: string;
      revisedPrompt?: string | null;
    }> = [];

    if (directImage) {
      candidates.push({ b64: directImage.base64, mimeType: directImage.mimeType });
    }

    const dataArray = Array.isArray(data?.data) ? data.data : [];
    for (const item of dataArray) {
      if (typeof item?.b64_json === "string") {
        candidates.push({
          b64: item.b64_json,
          mimeType: DEFAULT_IMAGE_MIME,
          revisedPrompt:
            typeof item?.revised_prompt === "string"
              ? item.revised_prompt
              : null,
        });
        continue;
      }
      if (typeof item?.url === "string") {
        candidates.push({ url: item.url });
        continue;
      }
      if (typeof item?.image === "string") {
        candidates.push({ b64: item.image, mimeType: DEFAULT_IMAGE_MIME });
      }
    }

    const nestedData = data?.data;
    if (Array.isArray(nestedData?.imageUrls)) {
      for (const url of nestedData.imageUrls) {
        if (typeof url === "string") {
          candidates.push({ url });
        }
      }
    }
    if (Array.isArray(nestedData?.images)) {
      for (const image of nestedData.images) {
        if (typeof image === "string") {
          candidates.push({ url: image });
        } else if (typeof image?.url === "string") {
          candidates.push({ url: image.url });
        } else if (typeof image?.image === "string") {
          candidates.push({ b64: image.image, mimeType: DEFAULT_IMAGE_MIME });
        }
      }
    }
    if (typeof nestedData?.image === "string") {
      candidates.push({ b64: nestedData.image, mimeType: DEFAULT_IMAGE_MIME });
    }
    if (typeof nestedData?.image_base64 === "string") {
      candidates.push({
        b64: nestedData.image_base64,
        mimeType: DEFAULT_IMAGE_MIME,
      });
    }
    if (typeof nestedData?.url === "string") {
      candidates.push({ url: nestedData.url });
    }

    if (typeof data?.image === "string") {
      candidates.push({ b64: data.image, mimeType: DEFAULT_IMAGE_MIME });
    }
    if (typeof data?.image_base64 === "string") {
      candidates.push({ b64: data.image_base64, mimeType: DEFAULT_IMAGE_MIME });
    }
    if (typeof data?.url === "string") {
      candidates.push({ url: data.url });
    }

    const normalizedImages: Array<{
      b64: string;
      mimeType: string;
      revisedPrompt: string | null;
    }> = [];

    for (const candidate of candidates) {
      if (candidate.b64) {
        const parsed = parseBase64(candidate.b64);
        if (!parsed.base64) continue;
        normalizedImages.push({
          b64: parsed.base64,
          mimeType: candidate.mimeType || parsed.mimeType,
          revisedPrompt: candidate.revisedPrompt ?? null,
        });
        continue;
      }

      if (candidate.url) {
        const fetched = await fetchImageAsBase64(candidate.url);
        if (!fetched?.base64) continue;
        normalizedImages.push({
          b64: fetched.base64,
          mimeType: fetched.mimeType || DEFAULT_IMAGE_MIME,
          revisedPrompt: candidate.revisedPrompt ?? null,
        });
      }
    }

    if (normalizedImages.length === 0) {
      return NextResponse.json(
        { error: "No image data returned from provider." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      provider,
      images: normalizedImages,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
