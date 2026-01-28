"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  useChatHistory,
  ChatMessage,
  ChatSession,
  ChatAttachment,
} from "@/contexts/ChatHistoryContext";
import RepoSelector from "./RepoSelector";
import MinimalChatHeader from "./MinimalChatHeader";
import FloatingControls from "./FloatingControls";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import ImageGeneratorModal, {
  type ImageProviderId,
  type ImageProviderOption,
} from "./ImageGeneratorModal";
import ImageHistoryPanel from "./ImageHistoryPanel";
import ApiUsageDisplay from "./ApiUsageDisplay";
import NotificationPanel from "./NotificationPanel";
import { useApiUsage } from "@/contexts/ApiUsageContext";
import { useImageHistory } from "@/contexts/ImageHistoryContext";
import { useDeploymentProvider, type DeploymentProvider } from "@/contexts/DeploymentContext";
import {
  buildVercelDeployStrategies,
  getRepoRootDirectoryCandidates,
  startVercelDeploy,
  waitForVercelDeployment,
} from "@/lib/vercel-deploy";
import {
  buildRenderDeployStrategies,
  startRenderDeploy,
  waitForRenderDeployment,
} from "@/lib/render-deploy";
import ThreeColumnLayout from "@/components/chat/ThreeColumnLayout";
import ChatHeaderBubble from "@/components/chat/ChatHeaderBubble";
import FileTreeSidebar from "@/components/chat/FileTreeSidebar";
import PreviewPanel from "@/components/chat/PreviewPanel";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
}

interface RepoContextData {
  structure?: string;
  files?: { path: string; content: string }[];
}

interface ParsedFileChanges {
  startIndex: number;
  commitMessage: string;
  branch?: string;
  files: { path: string; content: string }[];
}

type PendingAttachment = ChatAttachment & { file: File };

type ModelProvider =
  | "claude"
  | "openai"
  | "groq"
  | "openrouter"
  | "ollama"
  | "gemini"
  | "opencodezen"
  | "fireworks"
  | "custom";
const MODEL_PROVIDERS: ModelProvider[] = [
  "claude",
  "openai",
  "groq",
  "openrouter",
  "ollama",
  "gemini",
  "opencodezen",
  "fireworks",
  "custom",
];

interface CustomProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: { id: string; name: string }[];
  enabled: boolean;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: ModelProvider;
  kind?: "model" | "suggestion";
  pullCommand?: string;
  customConfig?: CustomProviderConfig;
}

interface Status {
  claude: { configured: boolean };
  openai: { configured: boolean };
  gemini: { configured: boolean };
  rtrvr: { configured: boolean };
  groq: {
    configured: boolean;
    source?: string | null;
    warning?: string | null;
  };
  openrouter: { configured: boolean };
  fireworks?: { configured: boolean };
  nanobanana?: { configured: boolean };
  ideogram?: { configured: boolean };
  ollama: {
    configured: boolean;
    reachable: boolean | null;
    error: string | null;
  };
  github: { configured: boolean; username: string | null };
  vercel: { configured: boolean };
  render?: { configured: boolean };
}

type DeployResult =
  | {
      provider: "vercel";
      projectId: string;
      projectName: string;
      deploymentId: string;
      url: string;
      status: string;
      inspectorUrl?: string;
      strategy?: number;
      retriesUsed?: number;
    }
  | {
      provider: "render";
      serviceId: string;
      serviceName: string;
      deploymentId: string;
      url: string | null;
      status: string;
      dashboardUrl?: string | null;
      logsUrl?: string | null;
      strategy?: number;
      retriesUsed?: number;
    };

interface ApplyRepoResult {
  commitUrl: string;
  branch: string;
  previewUrl: string | null;
  filesChanged: number;
  operationId: number;
}

interface DeployProgress {
  provider: DeploymentProvider;
  attempt: number;
  total: number;
  strategyLabel: string;
  deploymentId?: string;
  state?: string;
  inspectorUrl?: string;
  logsUrl?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}

interface DeployFailure {
  provider: DeploymentProvider;
  repository: string;
  projectName: string;
  branch: string;
  deploymentId: string | null;
  strategyLabel: string;
  inspectorUrl?: string | null;
  logsUrl?: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

interface DeployAutoFixProgress {
  round: number;
  total: number;
  step: string;
  modelLabel?: string;
}

const MAX_ATTACHMENTS = 5;
const MAX_TOTAL_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_TEXT_FILE_BYTES = 512 * 1024;
const MAX_TEXT_CHARS = 60000;
const MAX_DEPLOY_AUTOFIX_ROUNDS = 2;

function formatBytes(bytes: number) {
  if (!bytes || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = unitIndex === 0 ? 0 : value < 10 ? 1 : 0;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function buildProviderModelId(provider: ModelProvider, model: string) {
  return `${provider}:${model}`;
}

const DISPLAY_NAME_PROVIDERS = new Set<ModelProvider>([
  "ollama",
  "openrouter",
  "groq",
  "fireworks",
]);

const MODEL_TOKEN_CASE: Record<string, string> = {
  gpt: "GPT",
  o1: "o1",
  o3: "o3",
  o4: "o4",
  r1: "R1",
  llama: "Llama",
  qwen: "Qwen",
  gemma: "Gemma",
  mixtral: "Mixtral",
  mistral: "Mistral",
  deepseek: "DeepSeek",
  gemini: "Gemini",
  phi: "Phi",
  claude: "Claude",
  groq: "Groq",
  openai: "OpenAI",
  meta: "Meta",
  turbo: "Turbo",
  mini: "Mini",
  nano: "Nano",
  pro: "Pro",
  flash: "Flash",
  vision: "Vision",
  instruct: "Instruct",
  coder: "Coder",
  instant: "Instant",
  versatile: "Versatile",
  preview: "Preview",
  beta: "Beta",
};

function isSlugLike(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const hasSpaces = /\s/.test(trimmed);
  const hasUpper = /[A-Z]/.test(trimmed);
  const hasSeparators = /[\/:_-]/.test(trimmed);
  if (hasSpaces && hasUpper) return false;
  if (!hasSpaces && hasSeparators) return true;
  return trimmed === trimmed.toLowerCase() && hasSeparators;
}

function splitAlphaNumericToken(token: string): string[] {
  const match = token.match(/^([a-z]{3,})(\d+(?:\.\d+)?)$/i);
  if (match) return [match[1], match[2]];
  return [token];
}

function formatModelToken(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();

  if (MODEL_TOKEN_CASE[lower]) return MODEL_TOKEN_CASE[lower];

  const versionMatch = lower.match(/^v(\d+)(?:p(\d+))?$/);
  if (versionMatch) {
    const major = versionMatch[1];
    const minor = versionMatch[2];
    return minor ? `${major}.${minor}` : major;
  }

  if (/^\d+(?:\.\d+)?[bk]$/i.test(trimmed)) return trimmed.toUpperCase();
  if (/^q\d+$/i.test(trimmed)) return `Q${trimmed.slice(1)}`;
  if (/^(fp|int)\d+$/i.test(trimmed)) return trimmed.toUpperCase();
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return trimmed;

  if (/^[a-z]{2,}$/.test(lower)) {
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  return trimmed;
}

function humanizeModelSlug(value: string): string {
  const normalized = value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return value;
  const tokens = normalized
    .split(" ")
    .flatMap((token) => splitAlphaNumericToken(token))
    .map((token) => formatModelToken(token))
    .filter(Boolean);
  return tokens.join(" ");
}

function formatModelDisplayName(
  provider: ModelProvider,
  id: string,
  name?: string,
): string {
  const rawName = (name ?? "").trim();
  if (!DISPLAY_NAME_PROVIDERS.has(provider)) {
    return rawName || id;
  }

  if (rawName && !isSlugLike(rawName)) {
    return rawName.replace(/\s+/g, " ").trim();
  }

  let cleaned = id.trim().replace(/^fireworks:/, "");
  const [baseId, tag] = cleaned.split(":");

  let vendor = "";
  let modelId = baseId;
  if (provider === "openrouter" && baseId.includes("/")) {
    const parts = baseId.split("/");
    vendor = parts.shift() || "";
    modelId = parts.join("/");
  } else if (baseId.includes("/")) {
    modelId = baseId.split("/").pop() || baseId;
  }

  let displayName = humanizeModelSlug(modelId);
  if (vendor) {
    displayName = `${humanizeModelSlug(vendor)} ${displayName}`.trim();
  }

  if (provider === "ollama" && tag && tag.toLowerCase() !== "latest") {
    displayName = `${displayName} ${humanizeModelSlug(tag)}`.trim();
  }

  return displayName || rawName || id;
}

function sortModelOptionsAlphabetically(options: ModelOption[]): ModelOption[] {
  return [...options].sort((a, b) => {
    const nameDiff = a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
    });
    if (nameDiff !== 0) return nameDiff;
    return a.id.localeCompare(b.id, undefined, { sensitivity: "base" });
  });
}

function getProviderSortKey(groupName: string): string {
  const normalized = groupName.toLowerCase();
  if (normalized.includes("openrouter")) return "OpenRouter";
  if (normalized.startsWith("claude")) return "Claude";
  if (normalized.startsWith("ollama")) return "Ollama";
  const base = groupName.replace(/\s*\(.*\)\s*$/, "").trim();
  return base || groupName;
}

function generateAttachmentId() {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function stripAttachmentPreviews(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) =>
    message.attachments
      ? {
          ...message,
          attachments: message.attachments.map(
            ({ previewUrl, ...attachment }) => attachment,
          ),
        }
      : message,
  );
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

type ImageGenerationRequest = {
  provider: ImageProviderId;
  prompt: string;
  size: string;
  model?: string;
  style?: string;
};

type ImageProviderModelConfig = {
  models: string[];
  defaultModel?: string;
};

function normalizeModelList(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const cleaned = list
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned)).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

const TEXT_FILE_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".csv",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".rb",
  ".php",
  ".sh",
  ".env",
  ".toml",
  ".ini",
  ".sql",
  ".graphql",
  ".gql",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".html",
  ".htm",
  ".svg",
]);

function isProbablyTextFile(file: File) {
  const mimeType = file.type || "";
  if (mimeType.startsWith("text/")) return true;
  if (
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/javascript" ||
    mimeType === "application/typescript" ||
    mimeType === "application/x-typescript"
  ) {
    return true;
  }

  const name = file.name || "";
  const dotIndex = name.lastIndexOf(".");
  const ext = dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : "";
  return TEXT_FILE_EXTENSIONS.has(ext);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

function dataURLtoBlob(dataUrl: string): Blob | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const base64 = match[2];
  return base64ToBlob(base64, mimeType);
}

async function buildChatAttachmentsPayload(
  attachments: PendingAttachment[],
): Promise<ChatAttachmentPayload[]> {
  const payload: ChatAttachmentPayload[] = [];

  for (const attachment of attachments) {
    const mimeType =
      attachment.mimeType || attachment.file.type || "application/octet-stream";

    if (attachment.kind === "image") {
      const dataUrl = await fileToDataUrl(attachment.file);
      payload.push({
        kind: "image",
        name: attachment.name,
        mimeType,
        dataUrl,
      });
      continue;
    }

    if (isProbablyTextFile(attachment.file)) {
      if (attachment.file.size > MAX_TEXT_FILE_BYTES) {
        payload.push({
          kind: "text",
          name: attachment.name,
          mimeType,
          content: `File is ${formatBytes(attachment.file.size)}; omitted because it exceeds the ${formatBytes(MAX_TEXT_FILE_BYTES)} limit.`,
          truncated: true,
        });
        continue;
      }

      const text = await attachment.file.text();
      const normalized = text.replace(/\r\n/g, "\n");
      const truncated = normalized.length > MAX_TEXT_CHARS;
      payload.push({
        kind: "text",
        name: attachment.name,
        mimeType,
        content: truncated ? normalized.slice(0, MAX_TEXT_CHARS) : normalized,
        truncated,
      });
      continue;
    }

    payload.push({
      kind: "binary",
      name: attachment.name,
      mimeType,
      size: attachment.size,
    });
  }

  return payload;
}

function parseFileChanges(raw: string): ParsedFileChanges | null {
  const normalized = raw.replace(/\r\n/g, "\n");
  const fileHeaderRegex = /^\s*(?:[-*]\s*)?FILE:\s*(.+?)\s*$/i;
  const commitLineRegex = /^\s*commit message:\s*(.+?)\s*$/i;
  const branchLineRegex = /^\s*branch:\s*(.+?)\s*$/i;
  const fenceLineRegex = /^\s*```/;

  const lines = normalized.split("\n");
  const lineStartIndices: number[] = [];
  let offset = 0;
  for (const line of lines) {
    lineStartIndices.push(offset);
    offset += line.length + 1;
  }

  const headerLines: Array<{ lineIndex: number; path: string }> = [];
  let firstHeaderLine: number | null = null;
  let lastCommitBeforeFirstHeaderLine: number | null = null;
  let inFence = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const commitMatch = line.match(commitLineRegex);
    if (commitMatch) {
      if (firstHeaderLine === null) {
        lastCommitBeforeFirstHeaderLine = i;
      }
      continue;
    }

    const headerMatch = line.match(fileHeaderRegex);
    if (headerMatch) {
      const path = headerMatch[1]
        .trim()
        .replace(/^`|`$/g, "")
        .replace(/^"|"$/g, "");
      if (path) {
        headerLines.push({ lineIndex: i, path });
        if (firstHeaderLine === null) {
          firstHeaderLine = i;
        }
      }
    }
  }

  if (headerLines.length === 0) return null;

  const startLine =
    lastCommitBeforeFirstHeaderLine ??
    firstHeaderLine ??
    headerLines[0].lineIndex;
  const startIndex = lineStartIndices[startLine] ?? 0;
  const tail = normalized.slice(startIndex);

  const commitMatch = tail.match(/^\s*commit message:\s*(.+?)\s*$/im);
  let commitMessage = commitMatch ? commitMatch[1].trim() : "";
  if (!commitMessage || /^<.*commit message.*>$/i.test(commitMessage)) {
    commitMessage = "Apply AI changes";
  }

  const branchMatch = tail.match(/^\s*branch:\s*(.+?)\s*$/im);
  const branchRaw = branchMatch ? branchMatch[1].trim() : "";
  const branch =
    branchRaw && !/^<.*branch name.*>$/i.test(branchRaw)
      ? branchRaw
      : undefined;

  const fileMatches: Array<{ index: number; path: string; content: string }> =
    [];
  let i = startLine;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    const headerMatch = line.match(fileHeaderRegex);
    if (!headerMatch) {
      i += 1;
      continue;
    }

    const path = headerMatch[1]
      .trim()
      .replace(/^`|`$/g, "")
      .replace(/^"|"$/g, "");
    if (!path) {
      i += 1;
      continue;
    }

    const headerIndex = lineStartIndices[i] ?? 0;
    const nextLine = lines[i + 1] ?? "";

    if (nextLine.match(fenceLineRegex)) {
      const contentLines: string[] = [];
      let j = i + 2;
      for (; j < lines.length; j += 1) {
        const candidate = lines[j] ?? "";
        if (candidate.match(fenceLineRegex)) break;
        contentLines.push(candidate);
      }
      fileMatches.push({
        index: headerIndex,
        path,
        content: contentLines.join("\n"),
      });
      i = j + 1;
      continue;
    }

    const contentLines: string[] = [];
    let j = i + 1;
    let inInnerFence = false;
    for (; j < lines.length; j += 1) {
      const candidate = lines[j] ?? "";
      const trimmed = candidate.trim();
      if (trimmed.startsWith("```")) {
        inInnerFence = !inInnerFence;
        contentLines.push(candidate);
        continue;
      }
      if (!inInnerFence) {
        if (candidate.match(fileHeaderRegex)) break;
        if (
          candidate.match(commitLineRegex) ||
          candidate.match(branchLineRegex)
        )
          break;
      }
      contentLines.push(candidate);
    }

    fileMatches.push({
      index: headerIndex,
      path,
      content: contentLines.join("\n").trimEnd(),
    });
    i = j;
  }

  const files = fileMatches
    .filter((entry) => entry.index >= startIndex)
    .map(({ path, content }) => ({ path, content }));

  if (files.length === 0) return null;

  const uniqueByPath = new Map<string, string>();
  for (const file of files) {
    if (!file.path) continue;
    uniqueByPath.set(file.path, file.content);
  }

  const deduped = Array.from(uniqueByPath.entries()).map(([path, content]) => ({
    path,
    content,
  }));
  if (deduped.length === 0) return null;
  return { startIndex, commitMessage, branch, files: deduped };
}

function stripFileChanges(raw: string, startIndex: number): string {
  const normalized = raw.replace(/\r\n/g, "\n");
  const before = normalized.slice(0, startIndex).trimEnd();
  return before || "Applied file changes to the selected repository.";
}

function shouldShowProceedButton(message: string, currentMode: "plan" | "build"): boolean {
  const text = message.trim();
  if (!text) return false;

  const lower = text.toLowerCase();
  const disqualifyPhrases = [
    "how would you like to proceed",
    "how do you want to proceed",
    "how should we proceed",
    "which option",
    "choose one",
    "pick one",
    "select one",
    "which one do you want",
    "which would you like",
    "what would you like me to do",
    "what should i do next",
  ];
  if (disqualifyPhrases.some((phrase) => lower.includes(phrase))) {
    return false;
  }

  const optionMatches = text.match(/(^|\n)\s*\d+[\).]\s+\S+/g);
  if (optionMatches && optionMatches.length >= 2) return false;

  const proceedPhrases = [
    "would you like me to proceed",
    "would you like to proceed",
    "shall i proceed",
    "should i proceed",
    "may i proceed",
    "ready to proceed",
    "if you'd like me to proceed",
    "if you would like me to proceed",
    "if you'd like to proceed",
    "if you would like to proceed",
    "say \"yes proceed\"",
    "type \"yes proceed\"",
    "reply \"yes proceed\"",
    "let me know if i should proceed",
    "let me know if you'd like me to proceed",
    "do you want me to proceed",
    "can i proceed",
    "proceed with the changes",
    "proceed with suggestion",
    "proceed with the suggestion",
    // Plan/Build mode specific
    "shall i implement",
    "should i implement",
    "would you like me to implement",
    "ready to implement",
    "shall i generate",
    "should i generate",
    "would you like me to generate",
    "ready to generate",
    "asking for confirmation before",
    "confirmation before generating",
    "confirmation before implementing",
    "ready to create the file changes",
    "ready to make the changes",
    "ready to write the code",
  ];
  if (proceedPhrases.some((phrase) => lower.includes(phrase))) {
    return true;
  }

  // Detect approval/confirmation requests
  const approvalPhrases = [
    "approve",
    "confirm",
    "authorization",
    "permission",
    "ready to make",
    "ready to apply",
    "ready to create",
    "ready to update",
    "ready to modify",
    "ready to implement",
    "waiting for confirmation",
    "need your approval",
    "need your confirmation",
    "waiting for approval",
    // Specifically for plan mode approval
    ...(currentMode === "plan" ? ["approve the plan", "plan is ready for approval"] : []),
  ];
  if (approvalPhrases.some((phrase) => lower.includes(phrase)) && text.includes("?")) {
    return true;
  }

  // Detect code change proposals
  const changeActionWords = [
    "create",
    "update",
    "modify",
    "edit",
    "change",
    "add",
    "delete",
    "remove",
    "apply",
    "commit",
    "implement",
    "fix",
    "refactor",
  ];
  const hasChangeAction = changeActionWords.some((word) => lower.includes(word));
  const hasQuestion = text.includes("?");
  const hasModalVerb = lower.includes("should i") ||
                       lower.includes("shall i") ||
                       lower.includes("would you like me to") ||
                       lower.includes("do you want me to") ||
                       lower.includes("may i") ||
                       lower.includes("can i");

  if (hasChangeAction && hasQuestion && hasModalVerb) {
    return true;
  }

  // Detect FILE CHANGES mention waiting for approval
  if (lower.includes("file changes") && (
    lower.includes("confirm") ||
    lower.includes("approve") ||
    lower.includes("ready") ||
    hasQuestion
  )) {
    return true;
  }

  if (lower.includes("proceed") && text.includes("?")) return true;
  if (
    lower.includes("continue") &&
    text.includes("?") &&
    (lower.includes("want") ||
      lower.includes("like") ||
      lower.includes("should") ||
      lower.includes("ready"))
  ) {
    return true;
  }

  // Detect plan/implementation readiness questions
  if (text.includes("?")) {
    const planReadinessPatterns = [
      /ready to (start|begin|write|create|implement|generate|make)/i,
      /(implement|generate|create|make) (this|the) (plan|changes)/i,
      /move forward with/i,
      /go ahead (with|and)/i,
      /confirmation (before|to|for)/i,
      /asking for (your )?confirmation/i,
      /need (your )?confirmation/i,
      /confirm (before|that|you|to)/i,
    ];
    if (planReadinessPatterns.some((pattern) => pattern.test(text))) {
      return true;
    }
  }

  // Detect plan mode ending phrases (even without ?)
  const planModeEndingPhrases = [
    "finish by asking for confirmation",
    "awaiting your confirmation",
    "please confirm",
    "confirm to proceed",
    "let me know to proceed",
    "give me the go-ahead",
    "approval to proceed",
    "approval to continue",
    "confirmation to move forward",
    "green light to",
  ];
  if (planModeEndingPhrases.some((phrase) => lower.includes(phrase))) {
    return true;
  }

  return false;
}

function buildDeployFailureKey(failure: DeployFailure): string {
  if (failure.deploymentId) return `deployment:${failure.provider}:${failure.deploymentId}`;
  return `noid:${failure.provider}:${failure.repository}:${failure.branch}:${failure.strategyLabel}:${failure.errorCode ?? ""}:${failure.errorMessage ?? ""}`;
}

// Model groups for the selector
const MODEL_GROUPS: Record<string, ModelOption[]> = {
  "Claude (Anthropic)": [
    {
      id: "claude-3-7-sonnet",
      name: "Claude 3.7 Sonnet",
      description: "Latest thinking model",
      provider: "claude",
    },
    {
      id: "claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      description: "Great for code",
      provider: "claude",
    },
    {
      id: "claude-3.5-haiku",
      name: "Claude 3.5 Haiku",
      description: "Fast & efficient",
      provider: "claude",
    },
    {
      id: "claude-sonnet-4.5",
      name: "Claude 4.5 Sonnet",
      description: "Next-gen Sonnet",
      provider: "claude",
    },
    {
      id: "claude-opus-4.5",
      name: "Claude 4.5 Opus",
      description: "Most capable",
      provider: "claude",
    },
  ],
  OpenAI: [
    {
      id: "o3-mini",
      name: "o3-mini",
      description: "Latest reasoning",
      provider: "openai",
    },
    {
      id: "o1",
      name: "o1",
      description: "Reasoning flagship",
      provider: "openai",
    },
    {
      id: "o1-mini",
      name: "o1 Mini",
      description: "Fast reasoning",
      provider: "openai",
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description: "Latest flagship",
      provider: "openai",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      description: "Fast & affordable",
      provider: "openai",
    },
  ],
  Fireworks: [
    {
      id: "fireworks:accounts/fireworks/models/llama-v3-70b-instruct",
      name: "Llama 3 70B Instruct",
      description: "Fireworks Llama 3 70B",
      provider: "fireworks",
    },
    {
      id: "fireworks:accounts/fireworks/models/llama-v3-8b-instruct",
      name: "Llama 3 8B Instruct",
      description: "Fireworks Llama 3 8B",
      provider: "fireworks",
    },
    {
      id: "fireworks:accounts/fireworks/models/mixtral-8x7b-instruct",
      name: "Mixtral 8x7B Instruct",
      description: "Fireworks Mixtral",
      provider: "fireworks",
    },
    {
      id: "fireworks:accounts/fireworks/models/qwen2-72b-instruct",
      name: "Qwen2 72B Instruct",
      description: "Fireworks Qwen2",
      provider: "fireworks",
    },
  ],
  Gemini: [
    {
      id: "gemini-3-flash-preview",
      name: "Gemini 3 Flash Preview",
      description: "Fast preview",
      provider: "gemini",
    },
    {
      id: "gemini-3-pro-preview",
      name: "Gemini 3 Pro Preview",
      description: "Most powerful preview",
      provider: "gemini",
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      description: "Most powerful",
      provider: "gemini",
    },
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      description: "Fast & cost-effective",
      provider: "gemini",
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      description: "Ultra fast",
      provider: "gemini",
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      description: "Super efficient",
      provider: "gemini",
    },
    {
      id: "gemini-pro-latest",
      name: "Gemini Pro Latest",
      description: "Stable general",
      provider: "gemini",
    },
    {
      id: "gemini-flash-latest",
      name: "Gemini Flash Latest",
      description: "Stable fast",
      provider: "gemini",
    },
  ],
  "Gemini (OpenRouter)": [
    {
      id: "gemini-2.0-pro-or",
      name: "Gemini 2.0 Pro (OR)",
      description: "via OpenRouter",
      provider: "openrouter",
    },
    {
      id: "gemini-2.0-flash-or",
      name: "Gemini 2.0 Flash (OR)",
      description: "via OpenRouter",
      provider: "openrouter",
    },
    {
      id: "gemini-1.5-pro-or",
      name: "Gemini 1.5 Pro (OR)",
      description: "via OpenRouter",
      provider: "openrouter",
    },
    {
      id: "gemini-1.5-flash-or",
      name: "Gemini 1.5 Flash (OR)",
      description: "via OpenRouter",
      provider: "openrouter",
    },
  ],
  "OpenCode Zen": [
    {
      id: "big-pickle",
      name: "Big Pickle",
      description: "Stealth",
      provider: "opencodezen",
    },
    {
      id: "minimax-m2.1-free",
      name: "MiniMax M2.1",
      description: "MiniMax",
      provider: "opencodezen",
    },
    {
      id: "grok-code-fast-1",
      name: "Grok Code Fast 1",
      description: "xAI",
      provider: "opencodezen",
    },
    {
      id: "gpt-5",
      name: "GPT 5",
      description: "OpenAI",
      provider: "opencodezen",
    },
    {
      id: "gpt-5-codex",
      name: "GPT 5 Codex",
      description: "OpenAI",
      provider: "opencodezen",
    },
    {
      id: "gpt-5-nano",
      name: "GPT 5 Nano",
      description: "OpenAI",
      provider: "opencodezen",
    },
    {
      id: "gpt-5.1",
      name: "GPT 5.1",
      description: "OpenAI",
      provider: "opencodezen",
    },
    {
      id: "gpt-5.1-codex",
      name: "GPT 5.1 Codex",
      description: "OpenAI",
      provider: "opencodezen",
    },
    {
      id: "gpt-5.1-codex-max",
      name: "GPT 5.1 Codex Max",
      description: "OpenAI",
      provider: "opencodezen",
    },
    {
      id: "gpt-5.1-codex-mini",
      name: "GPT 5.1 Codex Mini",
      description: "OpenAI",
      provider: "opencodezen",
    },
    {
      id: "gpt-5.2",
      name: "GPT 5.2",
      description: "OpenAI",
      provider: "opencodezen",
    },
    {
      id: "gpt-5.2-codex",
      name: "GPT 5.2 Codex",
      description: "OpenAI",
      provider: "opencodezen",
    },
    {
      id: "gemini-3-flash",
      name: "Gemini 3 Flash",
      description: "Google",
      provider: "opencodezen",
    },
    {
      id: "gemini-3-pro",
      name: "Gemini 3 Pro",
      description: "Google",
      provider: "opencodezen",
    },
    {
      id: "glm-4.6",
      name: "GLM 4.6",
      description: "Z.ai",
      provider: "opencodezen",
    },
  ],
  Groq: [
    {
      id: "deepseek-r1-distill-llama-70b",
      name: "DeepSeek R1 70B",
      description: "Reasoning (Groq)",
      provider: "groq",
    },
    {
      id: "llama-3.3-70b-versatile",
      name: "Llama 3.3 70B",
      description: "Versatile (Groq)",
      provider: "groq",
    },
    {
      id: "llama-3.1-8b-instant",
      name: "Llama 3.1 8B",
      description: "Fastest (Groq)",
      provider: "groq",
    },
    {
      id: "mixtral-8x7b-32768",
      name: "Mixtral 8x7B 32k",
      description: "Long context (Groq)",
      provider: "groq",
    },
  ],
  "Free Models (OpenRouter)": [
    {
      id: "deepseek/deepseek-r1:free",
      name: "DeepSeek R1",
      description: "Free reasoning",
      provider: "openrouter",
    },
    {
      id: "deepseek/deepseek-chat:free",
      name: "DeepSeek V3",
      description: "Free chat",
      provider: "openrouter",
    },
    {
      id: "mistralai/mistral-7b-instruct:free",
      name: "Mistral 7B",
      description: "Free",
      provider: "openrouter",
    },
    {
      id: "google/gemma-2-9b-it:free",
      name: "Gemma 2 9B",
      description: "Free",
      provider: "openrouter",
    },
    {
      id: "meta-llama/llama-3.3-70b-instruct:free",
      name: "Llama 3.3 70B",
      description: "Free",
      provider: "openrouter",
    },
    {
      id: "qwen/qwen-2.5-72b-instruct:free",
      name: "Qwen 2.5 72B",
      description: "Free",
      provider: "openrouter",
    },
  ],
  "OpenRouter Pro": [
    {
      id: "anthropic/claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      description: "Pro",
      provider: "openrouter",
    },
    {
      id: "openai/gpt-4o",
      name: "GPT-4o",
      description: "Pro",
      provider: "openrouter",
    },
    {
      id: "deepseek/deepseek-r1",
      name: "DeepSeek R1",
      description: "Pro Reasoning",
      provider: "openrouter",
    },
    {
      id: "deepseek/deepseek-chat",
      name: "DeepSeek V3",
      description: "Pro Chat",
      provider: "openrouter",
    },
  ],
  "Local Models (Ollama)": [
    {
      id: "llama3",
      name: "Llama 3",
      description: "Meta's open model",
      provider: "ollama",
    },
    {
      id: "mistral",
      name: "Mistral",
      description: "Mistral AI",
      provider: "ollama",
    },
    {
      id: "gemma2",
      name: "Gemma 2",
      description: "Google's open model",
      provider: "ollama",
    },
    {
      id: "qwen2.5-coder",
      name: "Qwen 2.5 Coder",
      description: "Great for coding",
      provider: "ollama",
    },
    {
      id: "deepseek-r1",
      name: "DeepSeek R1",
      description: "Strong reasoning",
      provider: "ollama",
    },
    {
      id: "phi3",
      name: "Phi 3",
      description: "Microsoft's efficient model",
      provider: "ollama",
    },
  ],
  "Ollama (Cloud)": [
    {
      id: "cogito-2.1:671b-cloud",
      name: "Cogito 2.1",
      description: "Cogito's large",
      provider: "ollama",
    },
    {
      id: "deepseek-v3.2:cloud",
      name: "DeepSeek V3.2",
      description: "DeepSeek's latest",
      provider: "ollama",
    },
    {
      id: "gemini-3-flash-preview:cloud",
      name: "Gemini 3 Flash",
      description: "Google's flash",
      provider: "ollama",
    },
    {
      id: "gemma3:4b-cloud",
      name: "Gemma 3 4B",
      description: "Google's 4B",
      provider: "ollama",
    },
    {
      id: "glm-4.7:cloud",
      name: "GLM-4.7",
      description: "Zhipu's latest",
      provider: "ollama",
    },
    {
      id: "gpt-oss:20b-cloud",
      name: "GPT-OSS 20B",
      description: "Open source GPT",
      provider: "ollama",
    },
    {
      id: "gpt-oss:120b-cloud",
      name: "GPT-OSS 120B",
      description: "Open source GPT",
      provider: "ollama",
    },
    {
      id: "kimi-k2-thinking:cloud",
      name: "Kimi-K2 Thinking",
      description: "Moonshot's thinking",
      provider: "ollama",
    },
    {
      id: "minimax-m2:cloud",
      name: "MiniMax M2",
      description: "MiniMax's model",
      provider: "ollama",
    },
    {
      id: "minimax-m2.1:cloud",
      name: "MiniMax M2.1",
      description: "MiniMax's updated",
      provider: "ollama",
    },
    {
      id: "qwen3-coder:480b-cloud",
      name: "Qwen3 Coder",
      description: "Alibaba's large",
      provider: "ollama",
    },
    {
      id: "qwen3-next:80b-cloud",
      name: "Qwen3 Next 80B",
      description: "Alibaba's next",
      provider: "ollama",
    },
    {
      id: "qwen3-vl:235b-cloud",
      name: "Qwen3 VL",
      description: "Alibaba's vision",
      provider: "ollama",
    },
    {
      id: "rnj-1:8b-cloud",
      name: "RNJ-1 8B",
      description: "Research model",
      provider: "ollama",
    },
  ],
};

export default function ChatInterface() {
  const {
    currentSession,
    currentSessionId,
    createNewSession,
    updateCurrentSession,
    clearCurrentSession,
  } = useChatHistory();
  const { recordUsage, refreshBilling, updateRateLimit } = useApiUsage();
  const { provider: deploymentProvider, setProvider: setDeploymentProvider } = useDeploymentProvider();
  const [chatMode, setChatMode] = useState<"plan" | "build">("build");
  const [autoApprove, setAutoApprove] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showImageHistory, setShowImageHistory] = useState(false);
  const [imageGeneratorLoading, setImageGeneratorLoading] = useState(false);
  const [imageGeneratorError, setImageGeneratorError] = useState<string | null>(
    null,
  );
  const { addImage: saveImageToHistory } = useImageHistory();
  const [imageProviderModels, setImageProviderModels] = useState<
    Record<ImageProviderId, ImageProviderModelConfig>
  >({
    fireworks: { models: [], defaultModel: "" },
    nanobanana: { models: [], defaultModel: "" },
    ideogram: { models: [], defaultModel: "" },
  });
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProceedButton, setShowProceedButton] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [repoContext, setRepoContext] = useState<RepoContextData | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    "ollama:gemini-3-flash-preview:cloud",
  );
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showFloatingControls, setShowFloatingControls] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [deployRecommendation, setDeployRecommendation] = useState<{
    provider: DeploymentProvider;
    reasons: string[];
  } | null>(null);
  const [deployRecommendationLoading, setDeployRecommendationLoading] =
    useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployProgress, setDeployProgress] = useState<DeployProgress | null>(
    null,
  );
  const [lastDeployFailure, setLastDeployFailure] =
    useState<DeployFailure | null>(null);
  const [deployAutoFixing, setDeployAutoFixing] = useState(false);
  const [deployAutoFixProgress, setDeployAutoFixProgress] =
    useState<DeployAutoFixProgress | null>(null);
  const [deployAutoFixError, setDeployAutoFixError] = useState<string | null>(
    null,
  );
  const [applyingRepoChanges, setApplyingRepoChanges] = useState(false);
  const [applyRepoError, setApplyRepoError] = useState<string | null>(null);
  const [applyRepoResult, setApplyRepoResult] =
    useState<ApplyRepoResult | null>(null);
  const [pendingRepoChanges, setPendingRepoChanges] =
    useState<ParsedFileChanges | null>(null);
  const [pendingRepoChangesRepoFullName, setPendingRepoChangesRepoFullName] =
    useState<string | null>(null);
  const [groqModels, setGroqModels] = useState<ModelOption[]>([]);
  const [groqError, setGroqError] = useState<string | null>(null);
  const [groqLoading, setGroqLoading] = useState(false);
  const [openrouterModels, setOpenrouterModels] = useState<ModelOption[]>([]);
  const [openrouterError, setOpenrouterError] = useState<string | null>(null);
  const [openrouterLoading, setOpenrouterLoading] = useState(false);
  const [fireworksModels, setFireworksModels] = useState<ModelOption[]>([]);
  const [fireworksError, setFireworksError] = useState<string | null>(null);
  const [fireworksLoading, setFireworksLoading] = useState(false);
  const [geminiModels, setGeminiModels] = useState<ModelOption[]>([]);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [openaiModels, setOpenaiModels] = useState<ModelOption[]>([]);
  const [openaiError, setOpenaiError] = useState<string | null>(null);
  const [openaiLoading, setOpenaiLoading] = useState(false);
  const [claudeModels, setClaudeModels] = useState<ModelOption[]>([]);
  const [claudeError, setClaudeError] = useState<string | null>(null);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<ModelOption[]>([]);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [ollamaRetrying, setOllamaRetrying] = useState(false);
  const [customModels, setCustomModels] = useState<ModelOption[]>([]);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [isClient, setIsClient] = useState(false);

  // File tree and preview state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [fileContent, setFileContent] = useState<string>("");

  // Load custom provider config
  const loadCustomModels = useCallback(() => {
    try {
      const stored = localStorage.getItem("poseidon_custom_provider");
      if (stored) {
        const config = JSON.parse(stored) as CustomProviderConfig;
        if (config.enabled && Array.isArray(config.models)) {
          const options: ModelOption[] = config.models.map((m) => ({
            id: `custom:${m.id}`,
            name: m.name || m.id,
            description: config.name,
            provider: "custom",
            customConfig: config,
          }));
          setCustomModels(options);
          return;
        }
      }
      setCustomModels([]);
    } catch (e) {
      console.error("Failed to load custom provider config", e);
      setCustomModels([]);
    }
  }, []);

  useEffect(() => {
    loadCustomModels();
    
    const handler = () => loadCustomModels();
    window.addEventListener("customProviderUpdated", handler);
    return () => window.removeEventListener("customProviderUpdated", handler);
  }, [loadCustomModels]);

  // Load repos from GitHub
  useEffect(() => {
    const loadRepos = async () => {
      try {
        const response = await fetch("/api/github/repos");
        if (response.ok) {
          const data = await response.json();
          setRepos(data.repos || []);
        }
      } catch (error) {
        console.error("Failed to load repos:", error);
      }
    };
    loadRepos();
  }, []);

  const abortControllerRef = useRef<AbortController | null>(null);
  const deployAbortControllerRef = useRef<AbortController | null>(null);
  const deployAutoFixAbortControllerRef = useRef<AbortController | null>(null);
  const deployAutoFixRoundRef = useRef(0);
  const lastAutoFixedFailureKeyRef = useRef<string | null>(null);
  const lastDeployFailureMessageKeyRef = useRef<string | null>(null);
  const lastOllamaReachableRef = useRef<boolean | null>(null);
  const applyRepoOperationIdRef = useRef(0);
  const objectUrlsRef = useRef<string[]>([]);
  const streamBufferRef = useRef("");
  const streamRafRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const stopGenerating = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isLoading) {
        abortControllerRef.current?.abort();
      }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "C") {
        setShowFloatingControls((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRafRef.current) {
        cancelAnimationFrame(streamRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentSession?.messages) {
      setMessages(currentSession.messages);
    } else {
      setMessages([]);
    }
    if (currentSession?.model) {
      setSelectedModel(currentSession.model);
    }
  }, [currentSessionId, currentSession?.messages, currentSession?.model]);

  useEffect(() => {
    if (!pendingRepoChanges) return;
    if (!pendingRepoChangesRepoFullName) return;
    if (selectedRepo?.full_name === pendingRepoChangesRepoFullName) return;
    setPendingRepoChanges(null);
    setPendingRepoChangesRepoFullName(null);
  }, [
    pendingRepoChanges,
    pendingRepoChangesRepoFullName,
    selectedRepo?.full_name,
  ]);

  useEffect(() => {
    // Show proceed button when assistant finishes responding
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.role === "assistant" &&
        shouldShowProceedButton(lastMessage.content || "", chatMode)
      ) {
        setShowProceedButton(true);
      } else {
        setShowProceedButton(false);
      }
    } else {
      setShowProceedButton(false);
    }
  }, [isLoading, messages, chatMode]);

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/status");
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error("Failed to fetch status:", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const selectedRepoFullName = selectedRepo?.full_name || null;

  useEffect(() => {
    if (!selectedRepoFullName) {
      setDeployRecommendation(null);
      setDeployRecommendationLoading(false);
      return;
    }

    const controller = new AbortController();
    setDeployRecommendationLoading(true);

    const run = async () => {
      try {
        const response = await fetch("/api/deploy/recommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repository: selectedRepoFullName }),
          signal: controller.signal,
        });
        const data = await response.json().catch(() => null);
        const recommendedProvider = data?.recommendedProvider;
        if (recommendedProvider !== "vercel" && recommendedProvider !== "render") {
          setDeployRecommendation(null);
          return;
        }
        const reasons = Array.isArray(data?.reasons)
          ? (data.reasons as unknown[]).filter((r): r is string => typeof r === "string" && r.trim().length > 0)
          : [];
        setDeployRecommendation({
          provider: recommendedProvider,
          reasons,
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setDeployRecommendation(null);
      } finally {
        setDeployRecommendationLoading(false);
      }
    };

    void run();
    return () => controller.abort();
  }, [selectedRepoFullName]);

  // Load file tree when repo selected
  useEffect(() => {
    if (!selectedRepo) {
      setFileTree([]);
      return;
    }

    const loadFileTree = async () => {
      try {
        const response = await fetch(
          `/api/github/repos/${selectedRepo.full_name}/structure`
        );
        if (response.ok) {
          const structure = await response.json();
          // Convert structure to FileNode format
          const buildTree = (path: string, nodes: any[]): any[] => {
            return nodes.map((node) => ({
              path: node.path,
              name: node.name || node.path.split("/").pop(),
              type: node.type === "tree" ? "directory" : "file",
              children: node.children ? buildTree(node.path, node.children) : undefined,
            }));
          };
          setFileTree(buildTree("", structure || []));
        }
      } catch (error) {
        console.error("Failed to load file tree:", error);
      }
    };

    loadFileTree();
  }, [selectedRepo]);

  // Load file content when file selected
  useEffect(() => {
    if (!selectedFile || !selectedRepo) return;

    const loadFileContent = async () => {
      try {
        const response = await fetch(
          `/api/github/repos/${selectedRepo.full_name}/files?path=${encodeURIComponent(selectedFile)}`
        );
        if (response.ok) {
          const data = await response.json();
          // Store file content for preview panel
          setFileContent(data.content);
        }
      } catch (error) {
        console.error("Failed to load file content:", error);
      }
    };

    loadFileContent();
  }, [selectedFile, selectedRepo]);

  useEffect(() => {
    if (!fallbackNotice) return;
    const timeout = setTimeout(() => setFallbackNotice(null), 8000);
    return () => clearTimeout(timeout);
  }, [fallbackNotice]);

  const loadOllamaModels = useCallback(async () => {
    setOllamaLoading(true);
    setOllamaError(null);
    try {
      const response = await fetch("/api/ollama/models");
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load Ollama models");
      }

      const models = Array.isArray(data?.models)
        ? (data.models as Array<{
            id: string;
            name: string;
            description?: string;
          }>)
        : [];

      const installed = models.map(
        (model: { id: string; name: string; description?: string }) => ({
          id: model.id,
          name: formatModelDisplayName("ollama", model.id, model.name),
          description: model.description || "Ollama model",
          provider: "ollama" as const,
        }),
      );

      setOllamaModels(sortModelOptionsAlphabetically(installed));

      if (data?.error) {
        setOllamaError(
          typeof data.error === "string"
            ? data.error
            : "Failed to load Ollama models",
        );
      }
    } catch (error) {
      setOllamaError(
        error instanceof Error ? error.message : "Failed to load Ollama models",
      );
      setOllamaModels([]);
    } finally {
      setOllamaLoading(false);
    }
  }, []);

  const fetchOllamaModels = useCallback(async () => {
    if (!status?.ollama?.configured) {
      setOllamaModels([]);
      setOllamaError(null);
      setOllamaLoading(false);
      return;
    }

    if (status?.ollama?.reachable === false) {
      setOllamaModels([]);
      setOllamaLoading(false);
      return;
    }

    await loadOllamaModels();
  }, [loadOllamaModels, status?.ollama?.configured, status?.ollama?.reachable]);

  useEffect(() => {
    fetchOllamaModels();
  }, [fetchOllamaModels]);

  const retryOllamaConnection = useCallback(async () => {
    setOllamaRetrying(true);
    setOllamaError(null);
    try {
      // Best-effort: when running locally, try to start Ollama + Cloudflare Tunnel.
      const localRetryRes = await fetch("/api/ollama/retry", {
        method: "POST",
      }).catch(() => null);
      const localRetryData = localRetryRes
        ? await localRetryRes.json().catch(() => null)
        : null;
      const localRetryError =
        localRetryData && typeof localRetryData.error === "string"
          ? (localRetryData.error as string)
          : null;
      const localRetryUnsupported = Boolean(
        localRetryError && /local mac|localhost/i.test(localRetryError),
      );

      // First refresh the status to check connection
      const statusResponse = await fetch("/api/status");
      const statusData = await statusResponse.json();
      setStatus(statusData);

      if (!statusData?.ollama?.configured) {
        setOllamaError(
          "Ollama is not configured. Set OLLAMA_BASE_URL (or your tunnel) and retry.",
        );
        return;
      }

      // If the health check timed out (reachable === null), still attempt to fetch models to recover quickly.
      if (statusData?.ollama?.reachable !== false) {
        await loadOllamaModels();
        return;
      }

      if (statusData?.ollama?.error) {
        setOllamaError(
          localRetryUnsupported
            ? `${statusData.ollama.error} (Open Poseidon on your Mac to restart Ollama/cloudflared.)`
            : statusData.ollama.error,
        );
        return;
      }

      if (localRetryUnsupported) {
        setOllamaError(
          "Ollama is offline. This deployment can't restart your tunnel—open Poseidon on your Mac to start Ollama/cloudflared, then retry.",
        );
      }
    } catch (error) {
      setOllamaError(
        error instanceof Error
          ? error.message
          : "Failed to reconnect to Ollama",
      );
    } finally {
      setOllamaRetrying(false);
    }
  }, [loadOllamaModels]);

  useEffect(() => {
    if (!status?.groq?.configured) {
      setGroqModels([]);
      setGroqError(null);
      setGroqLoading(false);
      return;
    }

    const fetchGroqModels = async () => {
      setGroqLoading(true);
      setGroqError(null);
      try {
        const response = await fetch("/api/groq/models");
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to load Groq models");
        }
        const models = Array.isArray(data.models) ? data.models : [];
        const options = models.map(
          (model: { id: string; name?: string; description?: string }) => ({
            id: model.id,
            name: formatModelDisplayName("groq", model.id, model.name),
            description: model.description || "Groq",
            provider: "groq" as const,
          }),
        );
        setGroqModels(sortModelOptionsAlphabetically(options));
      } catch (error) {
        setGroqError(
          error instanceof Error ? error.message : "Failed to load Groq models",
        );
        setGroqModels([]);
      } finally {
        setGroqLoading(false);
      }
    };

    fetchGroqModels();
  }, [status?.groq?.configured]);

  useEffect(() => {
    if (!status?.openrouter?.configured) {
      setOpenrouterModels([]);
      setOpenrouterError(null);
      setOpenrouterLoading(false);
      return;
    }

    const fetchOpenrouterModels = async () => {
      setOpenrouterLoading(true);
      setOpenrouterError(null);
      try {
        const response = await fetch("/api/openrouter/models");
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to load OpenRouter models");
        }
        const models = Array.isArray(data.models) ? data.models : [];
        const options = models.map(
          (model: { id: string; name?: string; description?: string }) => ({
            id: model.id,
            name: formatModelDisplayName("openrouter", model.id, model.name),
            description: model.description || "OpenRouter model",
            provider: "openrouter" as const,
          }),
        );
        setOpenrouterModels(sortModelOptionsAlphabetically(options));
      } catch (error) {
        setOpenrouterError(
          error instanceof Error
            ? error.message
            : "Failed to load OpenRouter models",
        );
        setOpenrouterModels([]);
      } finally {
        setOpenrouterLoading(false);
      }
    };

    fetchOpenrouterModels();
  }, [status?.openrouter?.configured]);

  useEffect(() => {
    if (!status?.fireworks?.configured) {
      setFireworksModels([]);
      setFireworksError(null);
      setFireworksLoading(false);
      return;
    }

    const fetchFireworksModels = async () => {
      setFireworksLoading(true);
      setFireworksError(null);
      try {
        const response = await fetch("/api/fireworks/models");
        const data = await response.json();
        const models = Array.isArray(data.models) ? data.models : [];
        if (!response.ok && models.length === 0) {
          throw new Error(data?.error || "Failed to load Fireworks models");
        }
        if (models.length === 0) {
          throw new Error(data?.error || "No Fireworks models returned");
        }
        const options = models.map(
          (model: { id: string; name?: string; description?: string }) => ({
            id: `fireworks:${model.id}`,
            name: formatModelDisplayName(
              "fireworks",
              `fireworks:${model.id}`,
              model.name,
            ),
            description: model.description || "Fireworks model",
            provider: "fireworks" as const,
          }),
        );
        setFireworksModels(sortModelOptionsAlphabetically(options));
      } catch (error) {
        setFireworksError(
          error instanceof Error
            ? error.message
            : "Failed to load Fireworks models",
        );
        setFireworksModels([]);
      } finally {
        setFireworksLoading(false);
      }
    };

    fetchFireworksModels();
  }, [status?.fireworks?.configured]);

  useEffect(() => {
    if (!status?.gemini?.configured) {
      setGeminiModels([]);
      setGeminiError(null);
      setGeminiLoading(false);
      return;
    }

    const fetchGeminiModels = async () => {
      setGeminiLoading(true);
      setGeminiError(null);
      try {
        const response = await fetch("/api/gemini/models");
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to load Gemini models");
        }
        const models = Array.isArray(data.models) ? data.models : [];
        const options = models.map(
          (model: { id: string; name?: string; description?: string }) => ({
            id: model.id,
            name: formatModelDisplayName("gemini", model.id, model.name),
            description: model.description || "Google Gemini",
            provider: "gemini" as const,
          }),
        );
        setGeminiModels(sortModelOptionsAlphabetically(options));
      } catch (error) {
        setGeminiError(
          error instanceof Error ? error.message : "Failed to load Gemini models",
        );
        setGeminiModels([]);
      } finally {
        setGeminiLoading(false);
      }
    };

    fetchGeminiModels();
  }, [status?.gemini?.configured]);

  useEffect(() => {
    if (!status?.openai?.configured) {
      setOpenaiModels([]);
      setOpenaiError(null);
      setOpenaiLoading(false);
      return;
    }

    const fetchOpenaiModels = async () => {
      setOpenaiLoading(true);
      setOpenaiError(null);
      try {
        const response = await fetch("/api/openai/models");
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to load OpenAI models");
        }
        const models = Array.isArray(data.models) ? data.models : [];
        const options = models.map(
          (model: { id: string; name?: string; description?: string }) => ({
            id: model.id,
            name: formatModelDisplayName("openai", model.id, model.name),
            description: model.description || "OpenAI flagship",
            provider: "openai" as const,
          }),
        );
        setOpenaiModels(sortModelOptionsAlphabetically(options));
      } catch (error) {
        setOpenaiError(
          error instanceof Error ? error.message : "Failed to load OpenAI models",
        );
        setOpenaiModels([]);
      } finally {
        setOpenaiLoading(false);
      }
    };

    fetchOpenaiModels();
  }, [status?.openai?.configured]);

  useEffect(() => {
    if (!status?.claude?.configured) {
      setClaudeModels([]);
      setClaudeError(null);
      setClaudeLoading(false);
      return;
    }

    const fetchClaudeModels = async () => {
      setClaudeLoading(true);
      setClaudeError(null);
      try {
        const response = await fetch("/api/claude/models");
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to load Claude models");
        }
        const models = Array.isArray(data.models) ? data.models : [];
        const options = models.map(
          (model: { id: string; name?: string; description?: string }) => ({
            id: model.id,
            name: formatModelDisplayName("claude", model.id, model.name),
            description: model.description || "Anthropic flagship",
            provider: "claude" as const,
          }),
        );
        setClaudeModels(sortModelOptionsAlphabetically(options));
      } catch (error) {
        setClaudeError(
          error instanceof Error ? error.message : "Failed to load Claude models",
        );
        setClaudeModels([]);
      } finally {
        setClaudeLoading(false);
      }
    };

    fetchClaudeModels();
  }, [status?.claude?.configured]);

  useEffect(() => {
    const repoFullName = currentSession?.repoFullName;
    if (!repoFullName) {
      if (currentSessionId) {
        setSelectedRepo(null);
      }
      return;
    }
    if (selectedRepo?.full_name === repoFullName) return;

    const [owner, repo] = repoFullName.split("/");
    if (!owner || !repo) return;

    let cancelled = false;
    const loadRepo = async () => {
      try {
        const response = await fetch(`/api/github/repos/${owner}/${repo}`);
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to load repository");
        }
        if (!cancelled) {
          setSelectedRepo(data.repo);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to restore repo from history:", error);
        }
      }
    };

    loadRepo();
    return () => {
      cancelled = true;
    };
  }, [currentSessionId, currentSession?.repoFullName, selectedRepo?.full_name]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside dropdown AND not on the trigger button
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(target)
      ) {
        setShowModelDropdown(false);
      }
    };
    // Use capture phase to handle the event before other handlers
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  useLayoutEffect(() => {
    if (!showModelDropdown) return;

    let animationFrameId: number;

      const updatePosition = () => {
        const anchor = dropdownRef.current;
        const menu = dropdownMenuRef.current;
        if (!anchor || !menu) return;

        const rect = anchor.getBoundingClientRect();
        const padding = 12;
        const menuWidth =
          menu.offsetWidth || Math.min(360, window.innerWidth - padding * 2);
        const gap = 8;
      const mobileNavHeight =
        document.getElementById("mobile-nav")?.getBoundingClientRect().height ??
        0;
      const viewportBottom = window.innerHeight - padding - mobileNavHeight;

      let left = rect.right - menuWidth;
      const minLeft = padding;
      const maxLeft = Math.max(
        padding,
        window.innerWidth - padding - menuWidth,
      );
      if (left < minLeft) left = minLeft;
      if (left > maxLeft) left = maxLeft;

      const spaceBelow = viewportBottom - (rect.bottom + gap);
      const spaceAbove = rect.top - padding - gap;
      const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;

      const nextStyle: CSSProperties = {
        position: "fixed",
        left,
        width: menuWidth,
        maxHeight: openUp ? Math.max(0, spaceAbove) : Math.max(0, spaceBelow),
      };

      if (openUp) {
        nextStyle.bottom = window.innerHeight - rect.top + gap;
      } else {
        nextStyle.top = rect.bottom + gap;
      }

      setDropdownStyle(nextStyle);
    };

    const handleScroll = (event: Event) => {
      const menu = dropdownMenuRef.current;
      if (menu && event.target instanceof Node && menu.contains(event.target)) {
        return;
      }
      updatePosition();
    };

    // Use requestAnimationFrame and setTimeout to ensure the menu is fully mounted
    requestAnimationFrame(() => {
      animationFrameId = requestAnimationFrame(() => {
        setTimeout(updatePosition, 0);
      });
    });

    window.addEventListener("resize", updatePosition);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("scroll", handleScroll, true);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showModelDropdown]);

  // Load repo context when repo is selected
  const loadRepoContext = useCallback(
    async (repo: Repository): Promise<RepoContextData | null> => {
      setLoadingContext(true);
      setRepoContext(null);

      try {
        const [owner, repoName] = repo.full_name.split("/");

        const [structureRes, filesRes] = await Promise.all([
          fetch(`/api/github/repos/${owner}/${repoName}/structure?format=text`),
          fetch(`/api/github/repos/${owner}/${repoName}/files`),
        ]);

        const structureData = await structureRes.json();
        const filesData = await filesRes.json();

        const nextContext: RepoContextData = {
          structure: structureData.structure,
          files: filesData.files,
        };

        setRepoContext(nextContext);
        return nextContext;
      } catch (error) {
        console.error("Failed to load repo context:", error);
        return null;
      } finally {
        setLoadingContext(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedRepo) {
      loadRepoContext(selectedRepo);
    } else {
      setRepoContext(null);
    }
  }, [selectedRepo, loadRepoContext]);

  useEffect(() => {
    setDeployResult(null);
    setDeployError(null);
    setDeployProgress(null);
    setLastDeployFailure(null);
    setDeployAutoFixError(null);
    setDeployAutoFixProgress(null);
    setDeployAutoFixing(false);
    deployAutoFixAbortControllerRef.current?.abort();
    deployAutoFixAbortControllerRef.current = null;
    deployAutoFixRoundRef.current = 0;
    lastAutoFixedFailureKeyRef.current = null;
  }, [selectedRepo?.full_name]);

  useEffect(() => {
    setApplyRepoResult(null);
    setApplyRepoError(null);
  }, [selectedRepo?.full_name]);

  useEffect(() => {
    setChatError(null);
  }, [selectedModel]);

  const parseModelInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const [prefix, ...rest] = trimmed.split(":");
    if (!MODEL_PROVIDERS.includes(prefix as ModelProvider)) return null;
    const modelName = rest.join(":").trim();
    if (!modelName) return null;
    return { provider: prefix as ModelProvider, modelName };
  };

  const addAttachments = useCallback((files: FileList) => {
    setAttachmentError(null);
    const incoming = Array.from(files || []);
    if (incoming.length === 0) return;

    setPendingAttachments((prev) => {
      const next = [...prev];
      let totalBytes = next.reduce((sum, att) => sum + att.size, 0);

      for (const file of incoming) {
        if (next.length >= MAX_ATTACHMENTS) {
          setAttachmentError(
            `You can attach up to ${MAX_ATTACHMENTS} files per message.`,
          );
          break;
        }

        const mimeType = file.type || "application/octet-stream";
        const isImage = mimeType.startsWith("image/");

        if (isImage && file.size > MAX_IMAGE_BYTES) {
          setAttachmentError(
            `Image "${file.name}" is too large (${formatBytes(file.size)}). Max is ${formatBytes(MAX_IMAGE_BYTES)}.`,
          );
          continue;
        }

        if (totalBytes + file.size > MAX_TOTAL_ATTACHMENT_BYTES) {
          setAttachmentError(
            `Attachments exceed ${formatBytes(MAX_TOTAL_ATTACHMENT_BYTES)} total. Remove a file or attach fewer.`,
          );
          continue;
        }

        const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
        if (previewUrl) {
          objectUrlsRef.current.push(previewUrl);
        }

        next.push({
          id: generateAttachmentId(),
          name: file.name,
          kind: isImage ? "image" : "file",
          mimeType,
          size: file.size,
          previewUrl,
          file,
        });

        totalBytes += file.size;
      }

      return next;
    });
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => {
      const target = prev.find((att) => att.id === id);
      if (target?.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          // ignore
        }
        objectUrlsRef.current = objectUrlsRef.current.filter(
          (url) => url !== target.previewUrl,
        );
      }
      return prev.filter((att) => att.id !== id);
    });
  }, []);

  const shouldLoadImageModels = Boolean(
    status?.fireworks?.configured ||
      status?.nanobanana?.configured ||
      status?.ideogram?.configured,
  );

  useEffect(() => {
    if (!shouldLoadImageModels) return;
    let cancelled = false;

    const fetchImageModels = async () => {
      try {
        const response = await fetch("/api/images/models", {
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || data?.error) {
          throw new Error(data?.error || "Failed to load image models");
        }

        const providers = data?.providers ?? {};
        const nextModels: Record<ImageProviderId, ImageProviderModelConfig> = {
          fireworks: {
            models: normalizeModelList(providers.fireworks?.models),
            defaultModel:
              typeof providers.fireworks?.defaultModel === "string"
                ? providers.fireworks.defaultModel.trim()
                : "",
          },
          nanobanana: {
            models: normalizeModelList(providers.nanobanana?.models),
            defaultModel:
              typeof providers.nanobanana?.defaultModel === "string"
                ? providers.nanobanana.defaultModel.trim()
                : "",
          },
          ideogram: {
            models: normalizeModelList(providers.ideogram?.models),
            defaultModel:
              typeof providers.ideogram?.defaultModel === "string"
                ? providers.ideogram.defaultModel.trim()
                : "",
          },
        };

        (Object.keys(nextModels) as ImageProviderId[]).forEach((key) => {
          const config = nextModels[key];
          if (config.defaultModel && !config.models.includes(config.defaultModel)) {
            config.models = [config.defaultModel, ...config.models];
          }
        });

        if (!cancelled) {
          setImageProviderModels(nextModels);
        }
      } catch (error) {
        if (!cancelled) {
          setImageProviderModels({
            fireworks: { models: [], defaultModel: "" },
            nanobanana: { models: [], defaultModel: "" },
            ideogram: { models: [], defaultModel: "" },
          });
        }
      }
    };

    void fetchImageModels();
    return () => {
      cancelled = true;
    };
  }, [shouldLoadImageModels]);

  const imageProviders: ImageProviderOption[] = useMemo(
    () => [
      {
        id: "fireworks",
        label: "Fireworks",
        description: "Fireworks image API",
        configured: status ? Boolean(status.fireworks?.configured) : true,
        models: imageProviderModels.fireworks.models,
        defaultModel: imageProviderModels.fireworks.defaultModel,
      },
      {
        id: "nanobanana",
        label: "Nanobanana",
        description: "Nanobanana image API",
        configured: status ? Boolean(status.nanobanana?.configured) : true,
        models: imageProviderModels.nanobanana.models,
        defaultModel: imageProviderModels.nanobanana.defaultModel,
      },
      {
        id: "ideogram",
        label: "Ideogram",
        description: "Ideogram image API",
        configured: status ? Boolean(status.ideogram?.configured) : true,
        models: imageProviderModels.ideogram.models,
        defaultModel: imageProviderModels.ideogram.defaultModel,
      },
    ],
    [imageProviderModels, status],
  );

  const defaultImageProvider = useMemo(() => {
    const firstConfigured = imageProviders.find((item) => item.configured);
    return (firstConfigured?.id ?? "fireworks") as ImageProviderId;
  }, [imageProviders]);

  const canGenerateImages = imageProviders.some((item) => item.configured);

  const handleGenerateImage = useCallback(
    async (params: ImageGenerationRequest) => {
      if (pendingAttachments.length >= MAX_ATTACHMENTS) {
        setImageGeneratorError(
          `You can attach up to ${MAX_ATTACHMENTS} files per message.`,
        );
        return false;
      }

      setImageGeneratorLoading(true);
      setImageGeneratorError(null);

      try {
        const response = await fetch("/api/images/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || "Image generation failed");
        }

        const images = Array.isArray(data?.images) ? data.images : [];
        if (images.length === 0) {
          throw new Error("No images returned from provider.");
        }

        const currentTotalBytes = pendingAttachments.reduce(
          (sum, att) => sum + att.size,
          0,
        );

        images.forEach((image: any, index: number) => {
          const b64 = typeof image?.b64 === "string" ? image.b64 : "";
          const mimeType =
            typeof image?.mimeType === "string" && image.mimeType
              ? image.mimeType
              : "image/png";
          if (!b64) return;

          const blob = base64ToBlob(b64, mimeType);
          if (blob.size > MAX_IMAGE_BYTES) {
            throw new Error(
              `Generated image is too large (${formatBytes(blob.size)}). Max is ${formatBytes(MAX_IMAGE_BYTES)}.`,
            );
          }
          if (currentTotalBytes + blob.size > MAX_TOTAL_ATTACHMENT_BYTES) {
            throw new Error(
              `Attachments exceed ${formatBytes(MAX_TOTAL_ATTACHMENT_BYTES)} total. Remove a file or generate a smaller image.`,
            );
          }

          // Save to history
          const dataUrl = `data:${mimeType};base64,${b64}`;
          saveImageToHistory({
            imageData: dataUrl,
            mimeType,
            prompt: params.prompt,
            style: params.style,
            size: params.size,
            provider: params.provider,
            model: params.model,
          });

          const extension = mimeType.split("/")[1] || "png";
          const fileName = `${params.provider}-${Date.now()}-${index + 1}.${extension}`;
          const file = new File([blob], fileName, { type: mimeType });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          addAttachments(dataTransfer.files);
        });

        return true;
      } catch (error) {
        setImageGeneratorError(
          error instanceof Error ? error.message : "Image generation failed.",
        );
        return false;
      } finally {
        setImageGeneratorLoading(false);
      }
    },
    [addAttachments, pendingAttachments, saveImageToHistory],
  );

  const modelGroups: Record<string, ModelOption[]> = useMemo(
    () => {
        const groups: Record<string, ModelOption[]> = {
          "Claude (Anthropic)":
            claudeModels.length > 0
              ? claudeModels
              : MODEL_GROUPS["Claude (Anthropic)"],
          "Free Models (OpenRouter)":
            openrouterModels.length > 0
              ? openrouterModels
              : MODEL_GROUPS["Free Models (OpenRouter)"],
          Fireworks:
            fireworksModels.length > 0
              ? fireworksModels
              : MODEL_GROUPS.Fireworks,
          Gemini: geminiModels.length > 0 ? geminiModels : MODEL_GROUPS["Gemini"],
          Groq: groqModels.length > 0 ? groqModels : MODEL_GROUPS["Groq"],
          ...(ollamaModels.length > 0
            ? { "Ollama (Installed)": ollamaModels }
            : {}),
          OpenAI: openaiModels.length > 0 ? openaiModels : MODEL_GROUPS["OpenAI"],
          "OpenCode Zen": MODEL_GROUPS["OpenCode Zen"],
          "OpenRouter Pro": MODEL_GROUPS["OpenRouter Pro"],
        };

        // Add custom providers as their own groups
        customModels.forEach(model => {
            if (model.customConfig) {
                const groupName = model.customConfig.name;
                if (!groups[groupName]) {
                    groups[groupName] = [];
                }
                groups[groupName].push(model);
            }
        });

        return groups;
    },
    [
      fireworksModels,
      geminiModels,
      groqModels,
      openaiModels,
      claudeModels,
      openrouterModels,
      ollamaModels,
      customModels,
    ],
  );

  const selectedModelInfo: ModelOption = useMemo(() => {
    const parsed = parseModelInput(selectedModel);
    if (parsed) {
      return {
        id: selectedModel,
        name: formatModelDisplayName(
          parsed.provider,
          parsed.modelName,
          parsed.modelName,
        ),
        description: "",
        provider: parsed.provider,
      };
    }

    for (const group of Object.values(modelGroups)) {
      const model = group.find((m) => m.id === selectedModel);
      if (model) return model;
    }

    const inferProvider = (value: string): ModelProvider => {
      const lower = value.toLowerCase();
      if (lower.startsWith("claude")) return "claude";
      if (lower.startsWith("gpt-") || lower === "o1" || lower.startsWith("o1-"))
        return "openai";
      if (value.includes("/") || lower.endsWith(":free")) return "openrouter";
      return "claude";
    };

    const inferredProvider = inferProvider(selectedModel);
    return {
      id: selectedModel,
      name: formatModelDisplayName(
        inferredProvider,
        selectedModel,
        selectedModel,
      ),
      description: "",
      provider: inferredProvider,
    };
  }, [selectedModel, modelGroups]);

  const deployWithAutoRetry = useCallback(
    async (params: {
      provider: DeploymentProvider;
      repository: string;
      projectName: string;
      branch: string;
    }): Promise<
      | { ok: true; result: DeployResult }
      | { ok: false; error: string; failure: DeployFailure | null }
    > => {
      if (status && params.provider === "vercel" && !status.vercel?.configured) {
        const message =
          "Vercel is not configured. Set VERCEL_TOKEN in your hosting environment variables (or .env.local locally).";
        setDeployError(message);
        return { ok: false, error: message, failure: null };
      }

      if (status && params.provider === "render" && !status.render?.configured) {
        const message =
          "Render is not configured. Set RENDER_API_KEY in your hosting environment variables (or .env.local locally).";
        setDeployError(message);
        return { ok: false, error: message, failure: null };
      }

      deployAbortControllerRef.current?.abort();
      const controller = new AbortController();
      deployAbortControllerRef.current = controller;

      setDeploying(true);
      setDeployError(null);
      setDeployResult(null);
      setDeployProgress(null);
      setLastDeployFailure(null);
      setDeployAutoFixError(null);
      setDeployAutoFixProgress(null);

      try {
        const rootDirectoryCandidates = await getRepoRootDirectoryCandidates(
          params.repository,
          {
            signal: controller.signal,
          },
        );

        const strategies =
          params.provider === "render"
            ? buildRenderDeployStrategies({
                repository: params.repository,
                serviceName: params.projectName,
                branch: params.branch,
                rootDirectoryCandidates,
              })
            : buildVercelDeployStrategies({
                repository: params.repository,
                projectName: params.projectName,
                branch: params.branch,
                rootDirectoryCandidates,
              });

        const total = strategies.length;
        let lastFailure: string | null = null;
        let lastFailureDetails: DeployFailure | null = null;

        for (let index = 0; index < strategies.length; index += 1) {
          const strategy = strategies[index];
          setDeployProgress({
            provider: params.provider,
            attempt: index + 1,
            total,
            strategyLabel: strategy.label,
          });

          let startedDeploymentId: string | null = null;
          let startedInspectorUrl: string | null = null;
          let startedLogsUrl: string | null = null;

          try {
            if (params.provider === "render") {
              const started = await startRenderDeploy(strategy.body as any, {
                signal: controller.signal,
              });
              startedDeploymentId = started.deployId;
              startedLogsUrl = started.logsUrl || null;

              setDeployProgress((prev) =>
                prev
                  ? {
                      ...prev,
                      deploymentId: started.deployId,
                      state: started.status,
                      logsUrl: started.logsUrl || null,
                    }
                  : null,
              );

              const finalDeployment = await waitForRenderDeployment(
                started.deployId,
                {
                  signal: controller.signal,
                  onUpdate: (deployment) => {
                    setDeployProgress((prev) =>
                      prev
                        ? {
                            ...prev,
                            state: deployment.status,
                            logsUrl:
                              deployment.logsUrl || prev.logsUrl || null,
                          }
                        : null,
                    );
                  },
                },
              );

              if (
                finalDeployment.status &&
                ["live", "success", "succeeded", "deployed"].includes(
                  finalDeployment.status.toLowerCase(),
                )
              ) {
                const result: DeployResult = {
                  provider: "render",
                  serviceId: started.serviceId,
                  serviceName: started.serviceName,
                  deploymentId: started.deployId,
                  url: started.url,
                  status: finalDeployment.status,
                  dashboardUrl: started.dashboardUrl,
                  logsUrl: started.logsUrl,
                };
                setDeployResult(result);
                setDeployProgress(null);
                if (started.url) {
                  window.open(started.url, "_blank", "noopener,noreferrer");
                } else if (started.dashboardUrl) {
                  window.open(
                    started.dashboardUrl,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }
                return { ok: true, result };
              }

              const errorDetails = `status=${finalDeployment.status}`;
              lastFailure = `${strategy.label} failed (${errorDetails})`;
              lastFailureDetails = {
                provider: "render",
                repository: params.repository,
                projectName: params.projectName,
                branch: params.branch,
                deploymentId: startedDeploymentId,
                strategyLabel: strategy.label,
                inspectorUrl: null,
                logsUrl: finalDeployment.logsUrl || startedLogsUrl,
                errorCode: null,
                errorMessage: errorDetails,
              };
            } else {
              const started = await startVercelDeploy(strategy.body as any, {
                signal: controller.signal,
              });
              startedDeploymentId = started.deploymentId;
              startedInspectorUrl = started.inspectorUrl || null;
              setDeployProgress((prev) =>
                prev
                  ? {
                      ...prev,
                      deploymentId: started.deploymentId,
                      state: started.status,
                      inspectorUrl: started.inspectorUrl,
                    }
                  : null,
              );

              const finalDeployment = await waitForVercelDeployment(
                started.deploymentId,
                {
                  signal: controller.signal,
                  onUpdate: (deployment) => {
                    setDeployProgress((prev) =>
                      prev
                        ? {
                            ...prev,
                            state: deployment.state,
                            inspectorUrl:
                              deployment.inspectorUrl || prev.inspectorUrl,
                            errorCode:
                              deployment.errorCode ?? prev.errorCode ?? null,
                            errorMessage:
                              deployment.errorMessage ??
                              prev.errorMessage ??
                              null,
                          }
                        : null,
                    );
                  },
                },
              );

              if (finalDeployment.state === "READY") {
                const url = finalDeployment.url.startsWith("http")
                  ? finalDeployment.url
                  : `https://${finalDeployment.url}`;
                const result: DeployResult = {
                  provider: "vercel",
                  projectId: started.projectId,
                  projectName: started.projectName,
                  deploymentId: started.deploymentId,
                  url,
                  status: finalDeployment.state,
                  inspectorUrl:
                    finalDeployment.inspectorUrl || started.inspectorUrl,
                  strategy: started.strategy,
                  retriesUsed: started.retriesUsed,
                };
                setDeployResult(result);
                setDeployProgress(null);
                if (url) {
                  window.open(url, "_blank", "noopener,noreferrer");
                }
                return { ok: true, result };
              }

              const errorDetails = [
                finalDeployment.errorCode
                  ? `code=${finalDeployment.errorCode}`
                  : null,
                finalDeployment.errorMessage
                  ? finalDeployment.errorMessage
                  : null,
                `state=${finalDeployment.state}`,
              ]
                .filter(Boolean)
                .join(" • ");
              lastFailure = `${strategy.label} failed (${errorDetails})`;
              lastFailureDetails = {
                provider: "vercel",
                repository: params.repository,
                projectName: params.projectName,
                branch: params.branch,
                deploymentId: startedDeploymentId,
                strategyLabel: strategy.label,
                inspectorUrl:
                  finalDeployment.inspectorUrl || startedInspectorUrl,
                logsUrl: null,
                errorCode: finalDeployment.errorCode ?? null,
                errorMessage: finalDeployment.errorMessage ?? null,
              };
            }
          } catch (attemptError) {
            if ((attemptError as Error).name === "AbortError") {
              throw attemptError;
            }
            const message =
              attemptError instanceof Error
                ? attemptError.message
                : "Deployment attempt failed";
            lastFailure = `${strategy.label} failed (${message})`;
            lastFailureDetails = {
              provider: params.provider,
              repository: params.repository,
              projectName: params.projectName,
              branch: params.branch,
              deploymentId: startedDeploymentId,
              strategyLabel: strategy.label,
              inspectorUrl: startedInspectorUrl,
              logsUrl: startedLogsUrl,
              errorCode: null,
              errorMessage: message,
            };
          }
        }

        const message =
          lastFailure || "Deployment failed after multiple attempts";
        setDeployError(message);
        setDeployProgress(null);
        if (lastFailureDetails) {
          setLastDeployFailure(lastFailureDetails);
        }
        return { ok: false, error: message, failure: lastFailureDetails };
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return { ok: false, error: "Deployment canceled", failure: null };
        }
        const message =
          error instanceof Error ? error.message : "Deployment failed";
        setDeployError(message);
        return { ok: false, error: message, failure: null };
      } finally {
        setDeploying(false);
        deployAbortControllerRef.current = null;
      }
    },
    [status],
  );

  const isProviderAvailable = useCallback(
    (provider: ModelProvider) => {
      if (!status) return false;
      if (provider === "ollama") {
        return Boolean(
          status.ollama?.configured && status.ollama?.reachable === true,
        );
      }
      return Boolean((status as any)[provider]?.configured);
    },
    [status],
  );

  const buildDeployFixModelCandidates = useCallback(() => {
    const candidates: Array<{
      model: string;
      provider: ModelProvider;
      label: string;
    }> = [];
    const seen = new Set<string>();

    const push = (model: string, provider: ModelProvider, label: string) => {
      const key = `${provider}:${model}`;
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ model, provider, label });
    };

    if (isProviderAvailable(selectedModelInfo.provider)) {
      push(selectedModel, selectedModelInfo.provider, selectedModelInfo.name);
    }

    if (isProviderAvailable("claude")) {
      push("claude-sonnet-4", "claude", "Claude Sonnet 4");
      push("claude-3.5-haiku", "claude", "Claude 3.5 Haiku");
    }

    if (isProviderAvailable("openai")) {
      push("gpt-4o-mini", "openai", "GPT-4o Mini");
      push("gpt-4o", "openai", "GPT-4o");
    }

    if (isProviderAvailable("groq")) {
      push("llama-3.1-70b-versatile", "groq", "Groq (Llama 3.1 70B)");
      push("llama-3.1-8b-instant", "groq", "Groq (Llama 3.1 8B)");
    }

    if (isProviderAvailable("openrouter")) {
      const preferred =
        openrouterModels.find(
          (m) => /coder/i.test(m.id) || /coder/i.test(m.name),
        ) ||
        openrouterModels.find((m) => m.id.endsWith(":free")) ||
        openrouterModels[0];
      push(
        preferred?.id || "qwen/qwen3-coder:free",
        "openrouter",
        preferred?.name || "OpenRouter (Free)",
      );
    }

    if (isProviderAvailable("ollama") && ollamaModels.length > 0) {
      const first = ollamaModels[0];
      push(first.id, "ollama", `Ollama (${first.name})`);
    }

    return candidates.slice(0, 6);
  }, [
    isProviderAvailable,
    selectedModel,
    selectedModelInfo,
    openrouterModels,
    ollamaModels,
  ]);

  const runChatOnce = useCallback(
    async (params: {
      prompt: string;
      model: string;
      provider: ModelProvider;
      repoContext: RepoContextData | null;
      signal: AbortSignal;
    }) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: params.prompt }],
          model: params.model,
          provider: params.provider,
          repoContext: selectedRepo
            ? {
                repoFullName: selectedRepo.full_name,
                structure: params.repoContext?.structure,
                files: params.repoContext?.files?.slice(0, 6),
              }
            : undefined,
        }),
        signal: params.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "Failed to run model");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";
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
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trimStart();
            if (!payload) continue;

            let data: any;
            try {
              data = JSON.parse(payload);
            } catch {
              continue;
            }

            if (data.type === "text" && data.content) {
              fullContent += data.content;
              continue;
            }

            if (data.type === "rate_limit" && data.provider && data.rateLimit) {
              try {
                updateRateLimit(data.provider as any, data.rateLimit);
              } catch {
                // ignore
              }
              continue;
            }

            if (data.type === "error") {
              throw new Error(data.error || "Stream failed");
            }
          }
        }
      }

      return fullContent.trim();
    },
    [selectedRepo, updateRateLimit],
  );

  const startDeployAutoFix = useCallback(
    async (initialFailure: DeployFailure) => {
      if (deployAutoFixing) return;
      if (!selectedRepo) return;
      if (selectedRepo.full_name !== initialFailure.repository) return;
      if (!status?.github?.configured) return;
      if (initialFailure.provider === "vercel" && !status?.vercel?.configured) return;
      if (initialFailure.provider === "render" && !status?.render?.configured) return;

      deployAutoFixAbortControllerRef.current?.abort();
      const controller = new AbortController();
      deployAutoFixAbortControllerRef.current = controller;

      setDeployAutoFixError(null);
      setDeployAutoFixing(true);

      try {
        let failure: DeployFailure = initialFailure;
        deployAutoFixRoundRef.current = 0;
        lastAutoFixedFailureKeyRef.current =
          buildDeployFailureKey(initialFailure);

        while (true) {
          if (deployAutoFixRoundRef.current >= MAX_DEPLOY_AUTOFIX_ROUNDS) {
            throw new Error(
              `Auto-fix stopped after ${MAX_DEPLOY_AUTOFIX_ROUNDS} attempts.`,
            );
          }

          const round = deployAutoFixRoundRef.current + 1;
          deployAutoFixRoundRef.current = round;

          lastAutoFixedFailureKeyRef.current = buildDeployFailureKey(failure);

          const providerLabel = failure.provider === "render" ? "Render" : "Vercel";

          setDeployAutoFixProgress({
            round,
            total: MAX_DEPLOY_AUTOFIX_ROUNDS,
            step: `Fetching ${providerLabel} build logs…`,
          });

          let logsText = "";
          if (failure.deploymentId) {
            if (failure.provider === "vercel") {
              const eventsRes = await fetch(
                `/api/vercel/deployments/${encodeURIComponent(failure.deploymentId)}/events?limit=2000`,
                { signal: controller.signal },
              );
              const eventsData = await eventsRes.json().catch(() => null);
              logsText =
                typeof eventsData?.text === "string" ? eventsData.text : "";
            } else if (failure.provider === "render") {
              const logsRes = await fetch(
                `/api/render/deployments/${encodeURIComponent(failure.deploymentId)}/logs?limit=2000`,
                { signal: controller.signal },
              );
              const logsData = await logsRes.json().catch(() => null);
              logsText =
                typeof logsData?.text === "string" ? logsData.text : "";
            }
          }

          const ensureContext =
            repoContext ?? (await loadRepoContext(selectedRepo));
          const promptParts = [
            `A ${providerLabel} deployment is failing and must be fixed by committing changes to the GitHub repo.`,
            ``,
            `Repo: ${failure.repository}`,
            `Branch: ${failure.branch}`,
            `Project: ${failure.projectName}`,
            `Strategy: ${failure.strategyLabel}`,
            failure.inspectorUrl ? `Inspector: ${failure.inspectorUrl}` : null,
            failure.logsUrl ? `Logs: ${failure.logsUrl}` : null,
            failure.errorCode ? `Error code: ${failure.errorCode}` : null,
            failure.errorMessage
              ? `Error message: ${failure.errorMessage}`
              : null,
            ``,
            `${providerLabel} build logs (recent):`,
            logsText ? logsText : "(No logs available.)",
            ``,
            `Task: Fix the cause of the deployment failure with the smallest safe changes.`,
            `Rules:`,
            `- Keep the explanation to 1-3 short sentences.`,
            `- End your response with FILE CHANGES using COMPLETE file contents (no diffs/patches, no placeholders).`,
            `- Do not include secrets. If an env var is missing, add validation + a clear error message and update docs.`,
            ``,
            `CONFIRMED: You are explicitly authorized to proceed and output FILE CHANGES now.`,
          ].filter(Boolean);
          const prompt = promptParts.join("\n");

          const candidates = buildDeployFixModelCandidates();
          let parsedChanges: ParsedFileChanges | null = null;
          let usedModel: {
            model: string;
            provider: ModelProvider;
            label: string;
          } | null = null;
          let lastModelError: string | null = null;

          for (const candidate of candidates) {
            setDeployAutoFixProgress({
              round,
              total: MAX_DEPLOY_AUTOFIX_ROUNDS,
              step: "Generating fix…",
              modelLabel: candidate.label,
            });

            try {
              const output = await runChatOnce({
                prompt,
                model: candidate.model,
                provider: candidate.provider,
                repoContext: ensureContext,
                signal: controller.signal,
              });
              const parsed = parseFileChanges(output);
              if (!parsed) {
                lastModelError = `${candidate.label} did not return FILE CHANGES.`;
                continue;
              }
              parsedChanges = parsed;
              usedModel = candidate;
              break;
            } catch (error) {
              lastModelError =
                error instanceof Error
                  ? error.message
                  : "Failed to generate fix";
              continue;
            }
          }

          if (!parsedChanges || !usedModel) {
            throw new Error(
              lastModelError ||
                "Unable to generate a deploy fix with the available models.",
            );
          }

          setDeployAutoFixProgress({
            round,
            total: MAX_DEPLOY_AUTOFIX_ROUNDS,
            step: "Applying fixes to GitHub…",
            modelLabel: usedModel.label,
          });

          setApplyingRepoChanges(true);
          setApplyRepoError(null);
          setApplyRepoResult(null);
          const operationId = (applyRepoOperationIdRef.current += 1);

          try {
            const [owner, repo] = selectedRepo.full_name.split("/");
            const targetBranch =
              failure.branch || selectedRepo.default_branch || "main";
            const applyRes = await fetch(
              `/api/github/repos/${owner}/${repo}/apply`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message:
                    parsedChanges.commitMessage ||
                    `Fix ${failure.provider === "render" ? "Render" : "Vercel"} deploy (round ${round})`,
                  branch: targetBranch,
                  files: parsedChanges.files,
                }),
                signal: controller.signal,
              },
            );

            const applyData = await applyRes.json().catch(() => null);
            if (!applyRes.ok || applyData?.error) {
              throw new Error(
                applyData?.error || "Failed to apply changes to GitHub",
              );
            }

            setApplyRepoResult({
              commitUrl: applyData.commitUrl,
              branch: applyData.branch,
              previewUrl: applyData.previewUrl || null,
              filesChanged: applyData.filesChanged || 0,
              operationId,
            });

            await loadRepoContext(selectedRepo);
          } finally {
            setApplyingRepoChanges(false);
          }

          setDeployAutoFixProgress({
            round,
            total: MAX_DEPLOY_AUTOFIX_ROUNDS,
            step: "Retrying deployment…",
            modelLabel: usedModel.label,
          });

          const redeploy = await deployWithAutoRetry({
            provider: failure.provider,
            repository: failure.repository,
            projectName: failure.projectName,
            branch: failure.branch,
          });

          if (redeploy.ok) {
            setApplyRepoResult((prev) => {
              if (!prev) return prev;
              if (prev.operationId !== operationId) return prev;
              return { ...prev, previewUrl: redeploy.result.url };
            });
            setDeployAutoFixProgress({
              round,
              total: MAX_DEPLOY_AUTOFIX_ROUNDS,
              step: "Deployment succeeded.",
              modelLabel: usedModel.label,
            });
            return;
          }

          if (!redeploy.failure) {
            throw new Error(redeploy.error || "Deployment still failing.");
          }

          failure = redeploy.failure;
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setDeployAutoFixError(
          error instanceof Error ? error.message : "Auto-fix failed",
        );
      } finally {
        setDeployAutoFixing(false);
        deployAutoFixAbortControllerRef.current = null;
      }
    },
    [
      buildDeployFixModelCandidates,
      deployAutoFixing,
      deployWithAutoRetry,
      loadRepoContext,
      repoContext,
      runChatOnce,
      selectedRepo,
      status?.github?.configured,
      status?.vercel?.configured,
      status?.render?.configured,
    ],
  );

  useEffect(() => {
    if (!lastDeployFailure) return;
    if (!selectedRepo) return;
    if (selectedRepo.full_name !== lastDeployFailure.repository) return;

    const key = buildDeployFailureKey(lastDeployFailure);
    if (lastDeployFailureMessageKeyRef.current === key) return;
    lastDeployFailureMessageKeyRef.current = key;

    const post = async () => {
      const providerLabel = lastDeployFailure.provider === "render" ? "Render" : "Vercel";
      let logsText = "";
      if (lastDeployFailure.deploymentId) {
        if (lastDeployFailure.provider === "vercel") {
          try {
            const eventsRes = await fetch(
              `/api/vercel/deployments/${encodeURIComponent(lastDeployFailure.deploymentId)}/events?limit=2000`,
            );
            const eventsData = await eventsRes.json().catch(() => null);
            logsText =
              typeof eventsData?.text === "string" ? eventsData.text : "";
          } catch {
            // ignore
          }
        } else if (lastDeployFailure.provider === "render") {
          try {
            const logsRes = await fetch(
              `/api/render/deployments/${encodeURIComponent(lastDeployFailure.deploymentId)}/logs?limit=2000`,
            );
            const logsData = await logsRes.json().catch(() => null);
            logsText =
              typeof logsData?.text === "string" ? logsData.text : "";
          } catch {
            // ignore
          }
        }
      }

      const content = [
        `🚨 ${providerLabel} deployment failed`,
        `Repo: ${lastDeployFailure.repository}`,
        `Branch: ${lastDeployFailure.branch}`,
        `Strategy: ${lastDeployFailure.strategyLabel}`,
        lastDeployFailure.inspectorUrl
          ? `Inspector: ${lastDeployFailure.inspectorUrl}`
          : null,
        lastDeployFailure.logsUrl ? `Logs: ${lastDeployFailure.logsUrl}` : null,
        lastDeployFailure.errorCode
          ? `Error code: ${lastDeployFailure.errorCode}`
          : null,
        lastDeployFailure.errorMessage
          ? `Error message: ${lastDeployFailure.errorMessage}`
          : null,
        "",
        "Build logs (recent):",
        "```text",
        logsText ? logsText : "(No logs available.)",
        "```",
        "",
        'Reply with what you want next (e.g. "analyze the logs and propose a fix plan").',
      ]
        .filter(Boolean)
        .join("\n");

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const next = [...prev, assistantMessage];
        const storedNext = stripAttachmentPreviews(next);
        if (!currentSessionId) {
          createNewSession({
            repoName: selectedRepo?.name ?? null,
            repoFullName: selectedRepo?.full_name ?? null,
            model: selectedModel,
            provider: selectedModelInfo.provider,
            messages: storedNext,
          });
        } else {
          updateCurrentSession(
            storedNext,
            {
              repoName: selectedRepo?.name ?? null,
              repoFullName: selectedRepo?.full_name ?? null,
            },
            currentSessionId,
          );
        }
        return next;
      });
    };

    void post();
  }, [
    createNewSession,
    currentSessionId,
    lastDeployFailure,
    selectedModel,
    selectedModelInfo.provider,
    selectedRepo,
    updateCurrentSession,
  ]);

  const applyPendingRepoChanges = useCallback(
    async (options?: { announce?: boolean }) => {
      const announce = options?.announce ?? false;
    if (!pendingRepoChanges || !selectedRepo) return;
    if (
      pendingRepoChangesRepoFullName &&
      selectedRepo.full_name !== pendingRepoChangesRepoFullName
    ) {
      setApplyRepoError(
        "Pending changes belong to a different repository. Discard them and try again.",
      );
      return;
    }
    if (!status?.github?.configured) {
      setApplyRepoError(
        "GitHub is not configured. Set GITHUB_TOKEN in your hosting environment variables (or .env.local locally).",
      );
      return;
    }

    setApplyingRepoChanges(true);
    setApplyRepoError(null);
    setApplyRepoResult(null);
    const operationId = (applyRepoOperationIdRef.current += 1);

    try {
      const [owner, repo] = selectedRepo.full_name.split("/");
      const targetBranch =
        pendingRepoChanges.branch || selectedRepo.default_branch || "main";

      const applyRes = await fetch(`/api/github/repos/${owner}/${repo}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: pendingRepoChanges.commitMessage,
          branch: targetBranch,
          files: pendingRepoChanges.files,
        }),
      });

      const applyData = await applyRes.json().catch(() => null);
      if (!applyRes.ok || applyData?.error) {
        throw new Error(
          applyData?.error || "Failed to apply changes to GitHub",
        );
      }

      const applyResult = {
        commitUrl: applyData.commitUrl,
        branch: applyData.branch,
        previewUrl: applyData.previewUrl || null,
        filesChanged: applyData.filesChanged || 0,
        operationId,
      };
      setApplyRepoResult(applyResult);
      setPendingRepoChanges(null);
      setPendingRepoChangesRepoFullName(null);

      await loadRepoContext(selectedRepo);

      if (announce) {
        const commitMessage: ChatMessage = {
          role: "assistant",
          content:
            `✅ **Auto-committed to GitHub**\n\n` +
            `**Repository:** ${selectedRepo.full_name}\n` +
            `**Branch:** ${applyResult.branch}\n` +
            `**Files Changed:** ${applyResult.filesChanged}\n` +
            `**Commit:** ${pendingRepoChanges.commitMessage}\n\n` +
            `[View Commit](${applyResult.commitUrl})`,
        };

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, commitMessage];
          if (currentSessionId) {
            updateCurrentSession(
              stripAttachmentPreviews(updatedMessages),
              undefined,
              currentSessionId,
            );
          }
          return updatedMessages;
        });
      }
    } catch (applyError) {
      setApplyRepoError(
        applyError instanceof Error
          ? applyError.message
          : "Failed to apply changes to GitHub",
      );

      if (announce) {
        const errorMsg =
          applyError instanceof Error
            ? applyError.message
            : "Failed to apply changes to GitHub";
        const errorMessage: ChatMessage = {
          role: "assistant",
          content:
            `❌ **Auto-commit failed**\n\n` +
            `**Error:** ${errorMsg}\n\n` +
            `The changes were generated but could not be committed to GitHub. ` +
            `Please check your GitHub configuration and try again.`,
        };

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, errorMessage];
          if (currentSessionId) {
            updateCurrentSession(
              stripAttachmentPreviews(updatedMessages),
              undefined,
              currentSessionId,
            );
          }
          return updatedMessages;
        });
      }
    } finally {
      setApplyingRepoChanges(false);
    }
  },
    [
      currentSessionId,
      loadRepoContext,
      pendingRepoChanges,
      pendingRepoChangesRepoFullName,
      selectedRepo,
      status?.github?.configured,
      updateCurrentSession,
    ],
  );

  useEffect(() => {
    if (!pendingRepoChanges || !selectedRepo) return;
    if (chatMode !== "build" && !autoApprove) return;
    if (applyingRepoChanges) return;
    if (
      pendingRepoChangesRepoFullName &&
      selectedRepo.full_name !== pendingRepoChangesRepoFullName
    ) {
      return;
    }
    if (!status?.github?.configured) {
      if (!applyRepoError) {
        setApplyRepoError(
          "GitHub is not configured. Set GITHUB_TOKEN in your hosting environment variables (or .env.local locally).",
        );
      }
      return;
    }
    void applyPendingRepoChanges({ announce: true });
  }, [
    applyPendingRepoChanges,
    applyingRepoChanges,
    autoApprove,
    chatMode,
    pendingRepoChanges,
    pendingRepoChangesRepoFullName,
    selectedRepo,
    status?.github?.configured,
    applyRepoError,
  ]);

  const pickFreeFallbackModel = useCallback((): {
    model: string;
    provider: ModelProvider;
    label: string;
  } | null => {
    if (!status) return null;

    if (status.groq?.configured) {
      const candidates = groqModels.length > 0 ? groqModels : MODEL_GROUPS.Groq;
      const preferred =
        candidates.find((m) => /8b/i.test(m.id) || /instant/i.test(m.id)) ||
        candidates.find((m) => /70b/i.test(m.id)) ||
        candidates[0];
      const model = preferred?.id || "llama-3.1-8b-instant";
      return { model, provider: "groq", label: preferred?.name || "Groq" };
    }

    if (status.openrouter?.configured) {
      const candidates =
        openrouterModels.length > 0
          ? openrouterModels
          : MODEL_GROUPS["Free Models (OpenRouter)"];
      const preferred =
        candidates.find((m) => /coder/i.test(m.id) || /coder/i.test(m.name)) ||
        candidates.find((m) => m.id.endsWith(":free")) ||
        candidates[0];
      const model = preferred?.id || "qwen/qwen3-coder:free";
      return {
        model,
        provider: "openrouter",
        label: preferred?.name || "OpenRouter (Free)",
      };
    }

    return null;
  }, [groqModels, openrouterModels, status]);

  const pickOllamaFallbackModel = useCallback((): {
    model: string;
    provider: ModelProvider;
    label: string;
  } | null => {
    if (!status) return null;

    if (status.openai?.configured) {
      return { model: "gpt-5.1", provider: "openai", label: "OpenAI GPT-5.1" };
    }

    return pickFreeFallbackModel();
  }, [pickFreeFallbackModel, status]);

  useEffect(() => {
    const reachable = status?.ollama?.reachable ?? null;
    const prevReachable = lastOllamaReachableRef.current;
    lastOllamaReachableRef.current = reachable;

    if (selectedModelInfo.provider !== "ollama") return;
    if (prevReachable !== true || reachable !== false) return;

    const fallback = pickOllamaFallbackModel();
    if (!fallback) return;
    setSelectedModel(buildProviderModelId(fallback.provider, fallback.model));
    setFallbackNotice(`Ollama went offline — switched to ${fallback.label}.`);
  }, [
    pickOllamaFallbackModel,
    selectedModelInfo.provider,
    status?.ollama?.reachable,
  ]);

  useEffect(() => {
    if (!status) return;
    if (selectedModel !== "ollama:gemini-3-flash-preview:latest") return;
    if (status.ollama?.configured && status.ollama?.reachable !== false) return;

    const fallback = pickOllamaFallbackModel();
    if (!fallback) return;
    setSelectedModel(buildProviderModelId(fallback.provider, fallback.model));
    setFallbackNotice(`Ollama is offline — switched to ${fallback.label}.`);
  }, [
    pickOllamaFallbackModel,
    selectedModel,
    status,
    status?.ollama?.configured,
    status?.ollama?.reachable,
  ]);

  const handleProceedClick = () => {
    setShowProceedButton(false);
    setInput("yes proceed");
    sendMessage({ prompt: "yes proceed", includeAttachments: false });
  };

  const sendMessage = useCallback(async (options?: {
    prompt?: string;
    includeAttachments?: boolean;
  }) => {
    const content =
      typeof options?.prompt === "string"
        ? options.prompt.trim()
        : input.trim();
    const includeAttachments = options?.includeAttachments !== false;
    const attachmentsToSend = includeAttachments ? pendingAttachments : [];

    if ((!content && attachmentsToSend.length === 0) || isLoading) return;

    const modelInfo = selectedModelInfo;
    let modelToUse = selectedModel;
    let providerToUse: ModelProvider = modelInfo.provider;

    if (providerToUse === "ollama" && status?.ollama?.reachable === false) {
      const fallback = pickOllamaFallbackModel();
      if (fallback) {
        modelToUse = fallback.model;
        providerToUse = fallback.provider;
        setSelectedModel(buildProviderModelId(providerToUse, modelToUse));
        setFallbackNotice(`Ollama went offline — switched to ${fallback.label}.`);
      }
    }

    const providerConfigured =
      providerToUse === "custom"
        ? true
        : providerToUse === "ollama"
        ? Boolean(status?.ollama?.configured)
        : status
          ? (status as unknown as Record<string, { configured?: boolean }>)[
              providerToUse
            ]?.configured
          : true;
    const canChat =
      providerToUse === "ollama"
        ? Boolean(
            status?.ollama?.configured && status?.ollama?.reachable !== false,
          )
        : Boolean(providerConfigured);

    if (!canChat) {
      if (providerToUse === "ollama") {
        if (!status?.ollama?.configured) {
          setChatError(
            "Ollama is not configured. Set OLLAMA_BASE_URL (or your tunnel) and try again.",
          );
          return;
        }

        if (status?.ollama?.reachable === false) {
          const details = status.ollama.error ? status.ollama.error.trim() : "";
          const fallbackAvailable = Boolean(pickOllamaFallbackModel());
          const message = fallbackAvailable
            ? `Ollama is offline. ${details || "Try again in a moment or use another model."}`
            : details
              ? `Ollama is offline. ${details}`
              : "Ollama is offline. Start Ollama (or set OLLAMA_BASE_URL to your tunnel) and try again.";
          setChatError(message.trim());
          return;
        }

        setChatError("Checking Ollama connection…");
        return;
      }

      const message = `${providerToUse.toUpperCase()} API is not configured. Set the key in your hosting environment variables (or .env.local locally) to continue.`;
      setChatError(message);
      return;
    }

    setChatError(null);

    let attachmentsPayload: ChatAttachmentPayload[] | undefined;

    if (attachmentsToSend.length > 0) {
      try {
        attachmentsPayload =
          await buildChatAttachmentsPayload(attachmentsToSend);
      } catch (error) {
        setAttachmentError(
          error instanceof Error ? error.message : "Failed to read attachments",
        );
        return;
      }
    }

    const messageAttachments = attachmentsToSend.map(
      ({ file, ...attachment }) => attachment,
    );
    if (includeAttachments) {
      setPendingAttachments([]);
      setAttachmentError(null);
    }

    const userMessage: ChatMessage = {
      role: "user",
      content,
      ...(messageAttachments.length > 0
        ? { attachments: messageAttachments }
        : {}),
      timestamp: Date.now(),
    };

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    const requestMessages = [...messages, userMessage];
    const pendingMessages = [...requestMessages, assistantMessage];
    const storedPendingMessages = stripAttachmentPreviews(pendingMessages);
    setMessages(pendingMessages);
    if (options?.prompt == null) {
      setInput("");
    }
    setIsLoading(true);

    const metadata: Partial<ChatSession> = {
      model: modelToUse,
      provider: providerToUse,
      ...(selectedRepo
        ? { repoName: selectedRepo.name, repoFullName: selectedRepo.full_name }
        : {}),
    };

    const sessionId =
      currentSessionId ||
      createNewSession({
        repoName: selectedRepo?.name ?? null,
        repoFullName: selectedRepo?.full_name ?? null,
        model: modelToUse,
        provider: providerToUse,
        messages: storedPendingMessages,
      });

    if (currentSessionId) {
      updateCurrentSession(storedPendingMessages, metadata);
    }

    try {
      abortControllerRef.current = new AbortController();
      streamBufferRef.current = "";
      if (streamRafRef.current) {
        cancelAnimationFrame(streamRafRef.current);
        streamRafRef.current = null;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: requestMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          attachments: attachmentsPayload,
          model: modelToUse,
          provider: providerToUse,
          customConfig:
            providerToUse === "custom" && modelInfo.customConfig
              ? {
                  baseUrl: modelInfo.customConfig.baseUrl,
                  apiKey: modelInfo.customConfig.apiKey,
                  model: modelToUse.split(":").slice(2).join(":"), // Extract model ID from custom:providerId:modelId
                }
              : undefined,
          mode: chatMode,
          repoContext: selectedRepo
            ? {
                repoFullName: selectedRepo.full_name,
                structure: repoContext?.structure,
                files: repoContext?.files,
              }
            : undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";
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
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trimStart();
            if (!payload) continue;

            let data: any;
            try {
              data = JSON.parse(payload);
            } catch {
              continue;
            }

            if (data.type === "text" && data.content) {
              fullContent += data.content;
              streamBufferRef.current = fullContent;
              if (!streamRafRef.current) {
                streamRafRef.current = requestAnimationFrame(() => {
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: streamBufferRef.current,
                    };
                    return updated;
                  });
                  streamRafRef.current = null;
                });
              }
              continue;
            }

            if (data.type === "rate_limit" && data.provider && data.rateLimit) {
              try {
                updateRateLimit(data.provider as any, data.rateLimit);
              } catch {
                // ignore
              }
              continue;
            }

            if (data.type === "error") {
              throw new Error(data.error || "Stream failed");
            }
          }
        }
      }

      const parsedChanges = selectedRepo ? parseFileChanges(fullContent) : null;
      const displayContent = parsedChanges
        ? stripFileChanges(fullContent, parsedChanges.startIndex)
        : fullContent;

      const finalMessages = [...pendingMessages];
      finalMessages[finalMessages.length - 1] = {
        ...assistantMessage,
        content: displayContent,
      };
      setMessages(finalMessages);
      updateCurrentSession(
        stripAttachmentPreviews(finalMessages),
        metadata,
        sessionId,
      );

      // Record API usage on successful completion
      recordUsage(providerToUse, modelToUse);
      void refreshBilling();

      if (parsedChanges && selectedRepo) {
        setApplyRepoError(null);
        setApplyRepoResult(null);

        // In build mode or with auto-approve, apply via effect
        if (chatMode === "build" || autoApprove) {
          setPendingRepoChanges(parsedChanges);
          setPendingRepoChangesRepoFullName(selectedRepo.full_name);
        } else {
          // In plan mode without auto-approve, require manual approval
          setPendingRepoChanges(parsedChanges);
          setPendingRepoChangesRepoFullName(selectedRepo.full_name);
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      const errorMessage = `Error: ${(error as Error).message}`;
      console.error("Chat error:", error);
      const errorMessages = [...pendingMessages];
      errorMessages[errorMessages.length - 1] = {
        ...assistantMessage,
        content: errorMessage,
      };
      setMessages(errorMessages);
      updateCurrentSession(
        stripAttachmentPreviews(errorMessages),
        metadata,
        sessionId,
      );
      setChatError(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    input,
    pendingAttachments,
    isLoading,
    selectedModelInfo,
    selectedModel,
    status,
    pickOllamaFallbackModel,
    messages,
    selectedRepo,
    currentSessionId,
    createNewSession,
    updateCurrentSession,
    chatMode,
    repoContext,
    recordUsage,
    refreshBilling,
    updateRateLimit,
    autoApprove,
  ]);

  const handleApproveAndBuild = useCallback(() => {
    if (isLoading) return;

    const approvalMessage = "The plan is approved. Proceed with implementation.";
    void sendMessage({ prompt: approvalMessage });
    setChatMode("build");
  }, [isLoading, sendMessage, setChatMode]);

  const deployNow = async () => {
    if (!selectedRepo) return;
    if (!currentSessionId) {
      createNewSession({
        repoName: selectedRepo.name,
        repoFullName: selectedRepo.full_name,
        model: selectedModel,
        provider: selectedModelInfo.provider,
        messages: stripAttachmentPreviews(messages),
      });
    }
    await deployWithAutoRetry({
      provider: deploymentProvider,
      repository: selectedRepo.full_name,
      projectName: selectedRepo.name,
      branch: selectedRepo.default_branch || "main",
    });
  };

  const handleNewChat = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    deployAbortControllerRef.current?.abort();
    deployAbortControllerRef.current = null;
    for (const url of objectUrlsRef.current) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    objectUrlsRef.current = [];
    clearCurrentSession();
    setMessages([]);
    setInput("");
    setPendingAttachments([]);
    setAttachmentError(null);
    setSelectedRepo(null);
    setRepoContext(null);
    setChatError(null);
    setDeployError(null);
    setDeployResult(null);
    setDeployProgress(null);
    setApplyRepoError(null);
    setApplyRepoResult(null);
    setPendingRepoChanges(null);
    setPendingRepoChangesRepoFullName(null);
  };

  // Handler for repo selection
  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
  };

  // Handler for model selection
  const handleModelSelect = (model: ModelOption) => {
    setSelectedModel(model.id);
  };

  // Handler for creating a new repo - navigate to repos page
  const handleCreateRepo = () => {
    window.location.href = "/?tab=repos";
  };

  // Get all models as a flat list for the dropdown
  const getAllModels = (): ModelOption[] => {
    const allModels: ModelOption[] = [];
    for (const group in modelGroups) {
      allModels.push(...modelGroups[group]);
    }
    return allModels;
  };

  const modelInfo = selectedModelInfo;
  const providerConfigured =
    modelInfo.provider === "ollama"
      ? true
      : status
        ? (status as any)[modelInfo.provider]?.configured
        : true;
  const vercelConfigured = status ? status.vercel?.configured : true;
  const renderConfigured = status ? status.render?.configured : true;
  const deployProviderConfigured =
    deploymentProvider === "vercel" ? vercelConfigured : renderConfigured;
  const hasDeployForCurrentProvider =
    deployResult?.provider === deploymentProvider;
  const githubConfigured = Boolean(status?.github?.configured);

  const lastAssistantText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (!message) continue;
      if (message.role !== "assistant") continue;
      const text = message.content ? message.content.trim() : "";
      if (text) return text;
    }
    return "";
  }, [messages]);

  const sortedModelGroups = useMemo(() => {
    return Object.entries(modelGroups)
      .sort(([a], [b]) => {
        const keyA = getProviderSortKey(a);
        const keyB = getProviderSortKey(b);
        const keyDiff = keyA.localeCompare(keyB, undefined, {
          sensitivity: "base",
        });
        if (keyDiff !== 0) return keyDiff;
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      })
      .map(([groupName, models]) => ({
        groupName,
        models: [...models].sort((a, b) => {
          const nameDiff = a.name.localeCompare(b.name, undefined, {
            sensitivity: "base",
          });
          return nameDiff !== 0
            ? nameDiff
            : a.id.localeCompare(b.id, undefined, { sensitivity: "base" });
        }),
      }));
  }, [modelGroups]);

  const modelDropdown = showModelDropdown ? (
    <div
      ref={dropdownMenuRef}
      style={dropdownStyle}
      className="fixed z-[999] max-h-[70vh] overflow-hidden rounded-none border border-line-strong bg-surface backdrop-blur-xl shadow-2xl ring-1 ring-line/60"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b border-line bg-surface/90">
        <button
          onClick={() => {
            const inputValue = window.prompt(
              "Enter provider:model (claude|openai|groq|openrouter|ollama|gemini|opencodezen|fireworks)",
              selectedModel,
            );
            if (!inputValue) return;
            const parsed = parseModelInput(inputValue);
            if (!parsed) {
              setChatError(
                "Invalid custom model format. Use provider:model.",
              );
              return;
            }
            setSelectedModel(`${parsed.provider}:${parsed.modelName}`);
            setShowModelDropdown(false);
          }}
          className="w-full px-4 py-3 text-left hover:bg-surface/10 transition-all duration-200 rounded-none text-sm text-ink flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-sm bg-surface/90 border border-line-strong flex items-center justify-center group-hover:bg-surface/10 transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <span className="font-medium">Use Custom Model</span>
        </button>
      </div>

      <div className="max-h-[calc(70vh-80px)] overflow-y-auto">
        {sortedModelGroups.map(({ groupName, models }) => (
          <div
            key={groupName}
            className="border-b border-line/50 last:border-b-0"
          >
            <div className="px-4 py-3 text-xs font-bold text-ink-muted uppercase tracking-wide bg-surface-muted/40 sticky top-0 backdrop-blur-sm">
              {groupName}
            </div>
            <div className="py-1">
              {models.map((model) => {
                const parsedSelected = parseModelInput(selectedModel);
                const isSelected =
                  selectedModel === model.id ||
                  (parsedSelected &&
                    parsedSelected.provider === model.provider &&
                    parsedSelected.modelName === model.id);

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-surface-muted/70 dark:hover:bg-surface-strong/30 transition-all duration-200 flex items-center justify-between group ${
                      isSelected
                        ? "bg-surface-muted/20 border-l-4 border-accent-500"
                        : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-semibold truncate transition-colors ${
                          isSelected
                            ? "text-ink"
                            : "text-ink group-hover:text-ink"
                        }`}
                      >
                        {model.name}
                      </div>
                      <div
                        className={`text-xs truncate mt-0.5 transition-colors ${
                          isSelected
                            ? "text-ink-subtle"
                            : "text-ink-subtle group-hover:text-ink-subtle"
                        }`}
                      >
                        {model.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="ml-3 flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <>
    <ThreeColumnLayout
      leftPanel={
        <FileTreeSidebar
          files={fileTree}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          repoName={selectedRepo?.name}
        />
      }
      centerPanel={
        <div className="flex flex-col h-full">
          {/* Header Bubble - Integrated into chat flow like lovable.dev */}
          <ChatHeaderBubble
            selectedRepo={selectedRepo}
            repos={repos}
            modelInfo={modelInfo}
            models={getAllModels()}
            onRepoSelect={handleRepoSelect}
            onModelSelect={handleModelSelect}
            onCreateRepo={handleCreateRepo}
            onNewChat={handleNewChat}
            onMenuClick={() => setShowFloatingControls(!showFloatingControls)}
            currentProvider={selectedModelInfo.provider}
          />

          {/* Status bar */}
          {(ollamaLoading || groqLoading || openrouterLoading || fireworksLoading ||
            geminiLoading || openaiLoading || claudeLoading ||
            !providerConfigured) && status && (
            <div className="px-4 py-2 bg-white/5 border-b border-white/10">
              <div className="text-xs text-white/70 text-center">
                {ollamaLoading && "Loading Ollama models..."}
                {groqLoading && "Loading Groq models..."}
                {openrouterLoading && "Loading OpenRouter models..."}
                {fireworksLoading && "Loading Fireworks models..."}
                {geminiLoading && "Loading Gemini models..."}
                {openaiLoading && "Loading OpenAI models..."}
                {claudeLoading && "Loading Claude models..."}
                {!providerConfigured && `${modelInfo.name} needs a ${modelInfo.provider.toUpperCase()} API key`}
              </div>
            </div>
          )}

          {/* Messages - Scrollable area */}
          <div className="flex-1 overflow-y-auto">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              repoName={selectedRepo?.name}
              onTemplateSelect={(prompt) => {
                setInput(prompt);
                requestAnimationFrame(() => chatInputRef.current?.focus());
              }}
              chatMode={chatMode}
            />
          </div>

          {/* Proceed Button */}
          {showProceedButton && (
            <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-t border-white/10 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
              {chatMode === "plan" ? (
                <button
                  type="button"
                  onClick={handleApproveAndBuild}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-none"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Approve Plan & Switch to Build
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleProceedClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-none"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Proceed with Suggestion
                </button>
              )}
            </div>
          )}

          {/* Input - Fixed at bottom */}
          <div className="border-t border-white/10 p-4">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              onStop={stopGenerating}
              textareaRef={chatInputRef}
              attachments={pendingAttachments.map((att) => ({
                id: att.id,
                name: att.name,
                kind: att.kind,
                size: att.size,
                previewUrl: att.previewUrl,
              }))}
              onFilesSelected={addAttachments}
              onRemoveAttachment={removeAttachment}
              onOpenImageGenerator={() => {
                setImageGeneratorError(null);
                setShowImageGenerator(true);
              }}
              onOpenImageHistory={() => {
                setShowImageHistory(true);
              }}
              canGenerateImages={canGenerateImages}
              attachmentError={attachmentError}
              disabled={isLoading}
              loading={isLoading}
              placeholder="What would you like to build?"
            />
          </div>
        </div>
      }
      rightPanel={
        <PreviewPanel
          selectedFile={selectedFile}
          fileContent={fileContent}
        />
      }
    />

    {/* Model Dropdown Portal */}
    {modelDropdown &&
      (isClient
        ? createPortal(modelDropdown, document.body)
        : modelDropdown)}

    {/* Pending Repo Changes - Keep outside layout */}
    {pendingRepoChanges &&
      selectedRepo &&
      pendingRepoChangesRepoFullName === selectedRepo.full_name && (
        <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-white/10 bg-white/5 text-white text-xs sm:text-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">
                📝 Ready to Commit
              </div>
              <div className="text-white/80">
                <strong>{pendingRepoChanges.commitMessage}</strong>
              </div>
              <div className="text-white/60 text-xs mt-1">
                {pendingRepoChanges.files.length} file
                {pendingRepoChanges.files.length === 1 ? "" : "s"} will be
                changed
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingRepoChanges(null);
                  setPendingRepoChangesRepoFullName(null);
                }}
                disabled={applyingRepoChanges}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white/10 text-white text-xs font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => applyPendingRepoChanges()}
                disabled={applyingRepoChanges || !status?.github?.configured}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-medium hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title={
                  status?.github?.configured
                    ? "Apply changes to GitHub"
                    : "Configure GitHub in Settings"
                }
              >
                Apply to GitHub
              </button>
            </div>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-white hover:text-white font-medium">
              Show files ({pendingRepoChanges.files.length})
            </summary>
            <ul className="mt-2 space-y-1 pl-4">
              {pendingRepoChanges.files.map((file, index) => (
                <li key={index} className="text-white font-mono">
                  • {file.path}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

    {applyingRepoChanges && (
      <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-b border-white/10 bg-white/5 text-white/60 text-xs sm:text-sm">
        Applying file changes to GitHub…
      </div>
    )}

    {applyRepoError && (
      <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-b border-red-500/30 bg-red-500/10 text-red-300 text-xs sm:text-sm">
        Failed to apply file changes: {applyRepoError}
      </div>
    )}

    {/* Modals */}
    <ImageGeneratorModal
        open={showImageGenerator}
        providers={imageProviders}
        defaultProvider={defaultImageProvider}
        onClose={() => {
          setShowImageGenerator(false);
          setImageGeneratorError(null);
        }}
        onGenerate={handleGenerateImage}
        loading={imageGeneratorLoading}
        error={imageGeneratorError}
      />

      {/* Image History Panel */}
      <ImageHistoryPanel
        open={showImageHistory}
        onClose={() => setShowImageHistory(false)}
        onReuseImage={(imageData, mimeType) => {
          const blob = dataURLtoBlob(imageData);
          if (blob) {
            const extension = mimeType.split("/")[1] || "png";
            const fileName = `history-${Date.now()}.${extension}`;
            const file = new File([blob], fileName, { type: mimeType });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            addAttachments(dataTransfer.files);
          }
        }}
        onReusePrompt={(prompt, style) => {
          setShowImageGenerator(true);
          // The modal will need to accept initial values - we'll handle this
        }}
      />

      {/* Notification Panel */}
      <NotificationPanel
        deployProgress={deployProgress}
        deployResult={deployResult}
        deployError={deployError}
        deploying={deploying}
        onCancelDeploy={() => {
          deployAbortControllerRef.current?.abort();
          deployAbortControllerRef.current = null;
          setDeployProgress(null);
          setDeploying(false);
        }}
        applyRepoResult={applyRepoResult}
        deployAutoFixProgress={deployAutoFixProgress}
        deployAutoFixError={deployAutoFixError}
        deployAutoFixing={deployAutoFixing}
        onStartAutoFix={undefined}
        onCancelAutoFix={() => {
          deployAutoFixAbortControllerRef.current?.abort();
          deployAbortControllerRef.current?.abort();
        }}
        chatError={chatError}
        fallbackNotice={fallbackNotice}
        onDismissFallback={() => setFallbackNotice(null)}
      />
    </>
  );
}
