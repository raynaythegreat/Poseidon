"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import TridentLogo from "@/components/ui/TridentLogo";
import ProviderCard from "@/components/ui/ProviderCard";
import RotatingCardsButton from "@/components/ui/RotatingCardsButton";
import RotatingCardsToggle from "@/components/ui/RotatingCardsToggle";
import CustomProviderSettings from "./CustomProviderSettings";
import ApiKeyModal from "./ApiKeyModal";
import SkillsManager from "./SkillsManager";
import { CustomProviderConfig } from "./CustomProviderSettings";

interface Status {
  runtime?: {
    onVercel: boolean;
    onRender?: boolean;
    vercelEnv: string | null;
    vercelUrl: string | null;
    vercelGitRef: string | null;
  };
  claude: { configured: boolean };
  openai: { configured: boolean };
  gemini: { configured: boolean };
  glm: { configured: boolean };
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
    source?: string | null;
    url?: string | null;
    warning?: string | null;
  };
  github: { configured: boolean; username: string | null };
  vercel: { configured: boolean };
  render?: { configured: boolean };
  customProviders?: CustomProviderConfig[];
}

interface SettingsPageProps {
  onLogout: () => void;
}

interface Status {
  runtime?: {
    onVercel: boolean;
    onRender?: boolean;
    vercelEnv: string | null;
    vercelUrl: string | null;
    vercelGitRef: string | null;
  };
  claude: { configured: boolean };
  openai: { configured: boolean };
  gemini: { configured: boolean };
  glm: { configured: boolean };
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
    source?: string | null;
    url?: string | null;
    warning?: string | null;
  };
  github: { configured: boolean; username: string | null };
  vercel: { configured: boolean };
  render?: { configured: boolean };
}

export default function SettingsPage({ onLogout }: SettingsPageProps) {
  const { theme, toggleTheme } = useTheme();
  const { settings, updateUsername, updateEmail } = useUserSettings();
  const [status, setStatus] = useState<Status | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [groqSyncing, setGroqSyncing] = useState(false);
  const [groqSyncMessage, setGroqSyncMessage] = useState<{
    kind: "success" | "error";
    text: string;
    deploymentUrl?: string | null;
  } | null>(null);
  const [renderSyncing, setRenderSyncing] = useState(false);
  const [renderSyncMessage, setRenderSyncMessage] = useState<{
    kind: "success" | "error";
    text: string;
    deploymentUrl?: string | null;
  } | null>(null);
  const [ollamaRetrying, setOllamaRetrying] = useState(false);
  const [ollamaNgrokStarting, setOllamaNgrokStarting] = useState(false);
  const [ollamaNgrokSyncing, setOllamaNgrokSyncing] = useState(false);
  const [ollamaRetryMessage, setOllamaRetryMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [ollamaNgrokMessage, setOllamaNgrokMessage] = useState<{
    kind: "success" | "error";
    text: string;
    url?: string | null;
    deploymentUrl?: string | null;
  } | null>(null);

  // API Key Modal state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [configuringProvider, setConfiguringProvider] = useState<{ name: string; description: string } | null>(null);
  const [customProviders, setCustomProviders] = useState<CustomProviderConfig[]>([]);

  // Update state
  const [updateInfo, setUpdateInfo] = useState<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    updateUrl: string;
    isDev: boolean;
  } | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{
    kind: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncGroqToVercel = useCallback(async () => {
    setGroqSyncing(true);
    setGroqSyncMessage(null);
    try {
      const response = await fetch("/api/groq/sync", { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!data?.ok) {
        throw new Error(data?.error || "Failed to sync GROQ_API_KEY to Vercel");
      }

      setGroqSyncMessage({
        kind: "success",
        text: "Synced GROQ_API_KEY to Vercel and started a new deployment.",
        deploymentUrl: typeof data?.url === "string" ? data.url : null,
      });

      await fetchStatus();
    } catch (error) {
      setGroqSyncMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to sync GROQ_API_KEY to Vercel",
        deploymentUrl: null,
      });
    } finally {
      setGroqSyncing(false);
    }
  }, [fetchStatus]);

  const syncRenderToVercel = useCallback(async () => {
    setRenderSyncing(true);
    setRenderSyncMessage(null);
    try {
      const response = await fetch("/api/render/sync", { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!data?.ok) {
        throw new Error(data?.error || "Failed to sync RENDER_API_KEY to Vercel");
      }

      setRenderSyncMessage({
        kind: "success",
        text: "Synced RENDER_API_KEY to Vercel and started a new deployment.",
        deploymentUrl: typeof data?.url === "string" ? data.url : null,
      });

      await fetchStatus();
    } catch (error) {
      setRenderSyncMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to sync RENDER_API_KEY to Vercel",
        deploymentUrl: null,
      });
    } finally {
      setRenderSyncing(false);
    }
  }, [fetchStatus]);

  const retryFetchOllama = useCallback(async () => {
    setOllamaRetrying(true);
    setOllamaRetryMessage(null);
    setOllamaNgrokMessage(null);
    setGroqSyncMessage(null);
    setRenderSyncMessage(null);
    try {
      // Best-effort: when running locally, try to start Ollama + Cloudflare Tunnel.
      const localRetryRes = await fetch("/api/ollama/retry", {
        method: "POST",
      });
      const localRetryData = await localRetryRes.json().catch(() => null);
      const localRetryError =
        localRetryData && typeof localRetryData.error === "string"
          ? (localRetryData.error as string)
          : null;
      const localRetryUnsupported = Boolean(
        localRetryError && /local mac|localhost/i.test(localRetryError),
      );

      const statusResponse = await fetch("/api/status");
      const statusData = (await statusResponse.json()) as Status;
      setStatus(statusData);

      if (!statusData?.ollama?.configured) {
        setOllamaRetryMessage({
          kind: "error",
          text: "Ollama is not configured. Set OLLAMA_BASE_URL (or your tunnel) first.",
        });
        return;
      }

      if (statusData?.ollama?.reachable === false) {
        setOllamaRetryMessage({
          kind: "error",
          text: statusData?.ollama?.error
            ? localRetryUnsupported
              ? `Ollama is still offline: ${statusData.ollama.error} (Open Poseidon on your Mac to restart Ollama/cloudflared.)`
              : `Ollama is still offline: ${statusData.ollama.error}`
            : localRetryData?.attempted
              ? "Ollama is still offline after retry. Start Ollama or check OLLAMA_BASE_URL (or your tunnel)."
              : localRetryUnsupported
                ? "Ollama is offline. This deployment can't restart your tunnel—open Poseidon on your Mac to start Ollama/cloudflared, then retry."
                : "Ollama is still offline. Start Ollama or check OLLAMA_BASE_URL (or your tunnel).",
        });
        return;
      }

      const modelsResponse = await fetch("/api/ollama/models");
      const modelsData = await modelsResponse.json();
      if (!modelsResponse.ok || modelsData?.error) {
        throw new Error(modelsData?.error || "Failed to fetch Ollama models");
      }

      const count = Array.isArray(modelsData?.models)
        ? modelsData.models.length
        : 0;
      setOllamaRetryMessage({
        kind: "success",
        text:
          count > 0
            ? `Loaded ${count} Ollama model${count === 1 ? "" : "s"}.`
            : "Connected, but no models were returned.",
      });
    } catch (error) {
      setOllamaRetryMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to fetch Ollama models",
      });
    } finally {
      setOllamaRetrying(false);
    }
  }, []);

  const startNgrokTunnel = useCallback(async () => {
    setOllamaNgrokStarting(true);
    setOllamaNgrokMessage(null);
    setOllamaRetryMessage(null);
    setRenderSyncMessage(null);
    try {
      const response = await fetch("/api/ollama/ngrok", { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!data?.ok || typeof data?.publicUrl !== "string") {
        throw new Error(data?.error || "Failed to start ngrok");
      }
      setOllamaNgrokMessage({
        kind: "success",
        text:
          "ngrok tunnel is running. Use this URL as OLLAMA_BASE_URL in Vercel, or set OLLAMA_BASE_URL=ngrok locally for auto-refresh.",
        url: data.publicUrl,
        deploymentUrl: null,
      });
    } catch (error) {
      setOllamaNgrokMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Failed to start ngrok",
        url: null,
        deploymentUrl: null,
      });
    } finally {
      setOllamaNgrokStarting(false);
    }
  }, []);

  const syncNgrokToVercel = useCallback(async () => {
    setOllamaNgrokSyncing(true);
    setOllamaNgrokMessage(null);
    setOllamaRetryMessage(null);
    setRenderSyncMessage(null);
    try {
      const response = await fetch("/api/ollama/ngrok/sync", {
        method: "POST",
      });
      const data = await response.json().catch(() => null);
      if (!data?.ok) {
        throw new Error(data?.error || "Failed to sync ngrok to Vercel");
      }
      setOllamaNgrokMessage({
        kind: "success",
        text: "Synced ngrok tunnel to Vercel and started a new deployment.",
        url:
          typeof data?.ngrok?.publicUrl === "string"
            ? data.ngrok.publicUrl
            : null,
        deploymentUrl: typeof data?.url === "string" ? data.url : null,
      });
    } catch (error) {
      setOllamaNgrokMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to sync ngrok to Vercel",
        url: null,
        deploymentUrl: null,
      });
    } finally {
      setOllamaNgrokSyncing(false);
    }
  }, []);

  const handleSaveApiKey = async (apiKey: string) => {
    // API key is saved via the modal's handleSave
    console.log(`API key saved for ${configuringProvider?.name}`);
    // Clear the models cache so new provider models appear immediately
    localStorage.removeItem("poseidon_models_cache");
    localStorage.removeItem("poseidon_models_cache_time");
    // Refresh status to update configurations
    await fetchStatus();
  };

  const handleConfigureProvider = (name: string, description: string) => {
    setConfiguringProvider({ name, description });
    setShowApiKeyModal(true);
  };

  // Update functions
  const checkForUpdates = useCallback(async () => {
    setCheckingUpdate(true);
    setUpdateMessage(null);
    try {
      const response = await fetch("/api/update");
      const data = await response.json();

      setUpdateInfo(data);

      if (data.isDev) {
        setUpdateMessage({
          kind: "info",
          text: "Running in development mode - updates disabled",
        });
      } else if (data.hasUpdate) {
        setUpdateMessage({
          kind: "success",
          text: `Update available: ${data.latestVersion}`,
        });
      } else {
        setUpdateMessage({
          kind: "success",
          text: "You're on the latest version",
        });
      }

      // Update last checked time
      setLastChecked(new Date().toISOString());
      localStorage.setItem("poseidon_last_update_check", new Date().toISOString());
    } catch (error) {
      setUpdateMessage({
        kind: "error",
        text: "Failed to check for updates",
      });
    } finally {
      setCheckingUpdate(false);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!updateInfo?.updateUrl) return;

    setUpdateMessage({
      kind: "info",
      text: "Opening update instructions...",
    });

    // Open the update URL in a new tab
    window.open(updateInfo.updateUrl, "_blank");
  }, [updateInfo]);

  const toggleAutoUpdate = useCallback((enabled: boolean) => {
    setAutoUpdateEnabled(enabled);
    localStorage.setItem("poseidon_auto_update", enabled.toString());
  }, []);

  // Load custom providers on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("poseidon_custom_providers_list");
      if (stored) {
        const configs = JSON.parse(stored) as CustomProviderConfig[];
        setCustomProviders(configs.filter(c => c.id && c.enabled));
      }
    } catch (e) {
      console.error("Failed to load custom providers", e);
    }
  }, []);

  // Add custom provider to status when it changes
  useEffect(() => {
    if (status) {
      status.customProviders = customProviders;
    }
  }, [customProviders, status]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Load auto-update preference and last checked time
  useEffect(() => {
    const autoUpdate = localStorage.getItem("poseidon_auto_update");
    if (autoUpdate) {
      setAutoUpdateEnabled(autoUpdate === "true");
    }

    const lastCheck = localStorage.getItem("poseidon_last_update_check");
    if (lastCheck) {
      setLastChecked(lastCheck);
    }

    // Check for updates on mount if enabled
    if (autoUpdate === "true") {
      // Check if at least 24 hours have passed since last check
      const lastCheckTime = lastCheck ? new Date(lastCheck).getTime() : 0;
      const now = Date.now();
      const hoursSinceLastCheck = (now - lastCheckTime) / (1000 * 60 * 60);

      if (hoursSinceLastCheck >= 24) {
        checkForUpdates();
      }
    }
  }, [checkForUpdates]);

  type ProviderCategory = "deployment" | "ai" | "custom";

  type StatusItem = {
    name: string;
    description: string;
    configured: boolean | undefined;
    reachable?: boolean | null;
    error?: string | null;
    warning?: string | null;
    icon: JSX.Element;
    category?: ProviderCategory;
    apiKeyUrl?: string;
  };

  const statusItems: StatusItem[] = [
    {
      name: "Claude API",
      description: "Anthropic Claude for AI assistance",
      configured: status?.claude?.configured,
      category: "ai",
      apiKeyUrl: "https://console.anthropic.com/settings/keys",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
    },
    {
      name: "OpenAI API",
      description: "OpenAI GPT models",
      configured: status?.openai?.configured,
      category: "ai",
      apiKeyUrl: "https://platform.openai.com/api-keys",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" />
        </svg>
      ),
    },
    {
      name: "Google Gemini",
      description: "Google Gemini models",
      configured: status?.gemini?.configured,
      category: "ai",
      apiKeyUrl: "https://aistudio.google.com/app/apikey",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 19.7778H22L12 2ZM12 5.68889L17.5111 16H6.48889L12 5.68889Z" />
        </svg>
      ),
    },
    {
      name: "GLM (Zhipu AI)",
      description: "Z.ai GLM coding plan API for coding tasks",
      configured: status?.glm?.configured,
      category: "ai",
      apiKeyUrl: "https://z.ai/manage-apikey/apikey-list",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6z" />
        </svg>
      ),
    },
    {
      name: "Groq",
      description: "Groq (free-tier rate limits apply)",
      configured: status?.groq?.configured,
      category: "ai",
      apiKeyUrl: "https://console.groq.com/keys",
      warning: status?.groq?.warning || null,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3A1 1 0 0013 14v-7z" />
        </svg>
      ),
    },
    {
      name: "OpenRouter",
      description: "Free & paid AI models",
      configured: status?.openrouter?.configured,
      category: "ai",
      apiKeyUrl: "https://openrouter.ai/keys",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      name: "Fireworks",
      description: "Image generation",
      configured: status?.fireworks?.configured,
      category: "ai",
      apiKeyUrl: "https://fireworks.ai/account/api-keys",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l1.6 4.9 5.1.1-4.1 3 1.6 4.9-4.2-3-4.2 3 1.6-4.9-4.1-3 5.1-.1L12 2z" />
        </svg>
      ),
    },
    {
      name: "Ollama",
      description: "Local or hosted Ollama models",
      configured: status?.ollama?.configured,
      category: "ai",
      reachable: status?.ollama?.reachable,
      error: status?.ollama?.error,
      warning: status?.ollama?.warning || null,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 5a1 1 0 00-1 1v3H8a1 1 0 000 2h3v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V8a1 1 0 00-1-1z" />
        </svg>
      ),
    },
    {
      name: "GitHub",
      description: status?.github?.username
        ? `@${status.github.username}`
        : "Repository management",
      configured: status?.github?.configured,
      category: "deployment",
      apiKeyUrl: "https://github.com/settings/tokens",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      ),
    },
    {
      name: "Vercel",
      description: "Deployment platform",
      configured: status?.vercel?.configured,
      category: "deployment",
      apiKeyUrl: "https://vercel.com/account/tokens",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 76 65" fill="currentColor">
          <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
        </svg>
      ),
    },
    {
      name: "Render",
      description: "Deployment platform",
      configured: status?.render?.configured,
      category: "deployment",
      apiKeyUrl: "https://dashboard.render.com/user/settings/tokens",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" />
        </svg>
      ),
    },
    // Custom providers
    ...customProviders.map((provider) => ({
      name: provider.name,
      description: `${provider.baseUrl} ${provider.apiKey ? '✓ Configured' : ''}`,
      configured: provider.enabled && provider.apiKey ? true : false,
      category: "custom" as const,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    })),
  ];

  const runtimeLabel = (() => {
    const runtime = status?.runtime;
    if (!runtime) return null;
    if (runtime.onVercel) {
      const envLabel = runtime.vercelEnv
        ? runtime.vercelEnv.toUpperCase()
        : "VERCEL";
      const parts = [`Runtime: ${envLabel}`];
      if (runtime.vercelGitRef) parts.push(`ref: ${runtime.vercelGitRef}`);
      if (runtime.vercelUrl) parts.push(runtime.vercelUrl);
      return parts.join(" · ");
    }

    if (runtime.onRender) return "Runtime: RENDER";
    return "Runtime: Local";
  })();

  const inlineCodeClass =
    "px-1.5 py-0.5 bg-surface-muted/70 text-ink rounded";

  const groqSetupHint = (() => {
    const runtime = status?.runtime;
    if (runtime?.onVercel) {
      if (runtime.vercelEnv === "preview") {
        return (
          <>
            You are on a Preview deployment. Set{" "}
            <code className={inlineCodeClass}>
              GROQ_API_KEY
            </code>{" "}
            in Vercel Environment Variables (Preview), then redeploy.
          </>
        );
      }

      if (runtime.vercelEnv === "production") {
        return (
          <>
            You are on Production. Set{" "}
            <code className={inlineCodeClass}>
              GROQ_API_KEY
            </code>{" "}
            in Vercel Environment Variables (Production), then redeploy.
          </>
        );
      }

      return (
        <>
          Set{" "}
          <code className={inlineCodeClass}>
            GROQ_API_KEY
          </code>{" "}
          in Vercel Environment Variables (Production + Preview), then redeploy.
        </>
      );
    }

    if (runtime?.onRender) {
      return (
        <>
          Set{" "}
          <code className={inlineCodeClass}>
            GROQ_API_KEY
          </code>{" "}
          in Render Environment Variables, then redeploy.
        </>
      );
    }

    return (
      <>
        Set{" "}
        <code className={inlineCodeClass}>
          GROQ_API_KEY
        </code>{" "}
        in{" "}
        <code className={inlineCodeClass}>
          .env.local
        </code>
        , then restart the dev server.
      </>
    );
  })();

  const renderSetupHint = (() => {
    const runtime = status?.runtime;
    if (runtime?.onVercel) {
      if (runtime.vercelEnv === "preview") {
        return (
          <>
            You are on a Preview deployment. Set{" "}
            <code className={inlineCodeClass}>
              RENDER_API_KEY
            </code>{" "}
            in Vercel Environment Variables (Preview), then redeploy.
          </>
        );
      }

      if (runtime.vercelEnv === "production") {
        return (
          <>
            You are on Production. Set{" "}
            <code className={inlineCodeClass}>
              RENDER_API_KEY
            </code>{" "}
            in Vercel Environment Variables (Production), then redeploy.
          </>
        );
      }

      return (
        <>
          Set{" "}
          <code className={inlineCodeClass}>
            RENDER_API_KEY
          </code>{" "}
          in Vercel Environment Variables (Production + Preview), then redeploy.
        </>
      );
    }

    if (runtime?.onRender) {
      return (
        <>
          Set{" "}
          <code className={inlineCodeClass}>
            RENDER_API_KEY
          </code>{" "}
          in Render Environment Variables, then redeploy.
        </>
      );
    }

    return (
      <>
        Set{" "}
        <code className={inlineCodeClass}>
          RENDER_API_KEY
        </code>{" "}
        in{" "}
        <code className={inlineCodeClass}>
          .env.local
        </code>
        , then restart the dev server.
      </>
    );
  })();

  const ollamaSetupHint = (() => {
    const runtime = status?.runtime;
    if (!runtime?.onVercel && !runtime?.onRender) {
      return (
        <>
          Start Ollama locally (default{" "}
          <code className={inlineCodeClass}>
            http://localhost:11434
          </code>
          ), then refresh.
        </>
      );
    }

    if (runtime?.onRender) {
      return (
        <>
          Set{" "}
          <code className={inlineCodeClass}>
            OLLAMA_BASE_URL
          </code>{" "}
          to your public tunnel URL in Render Environment Variables, then
          redeploy.
        </>
      );
    }

    if (runtime.vercelEnv === "preview") {
      return (
        <>
          You are on a Preview deployment. Set{" "}
          <code className={inlineCodeClass}>
            OLLAMA_BASE_URL
          </code>{" "}
          to your public tunnel URL in Vercel Environment Variables (Preview),
          then redeploy.
        </>
      );
    }

    if (runtime.vercelEnv === "production") {
      return (
        <>
          You are on Production. Set{" "}
          <code className={inlineCodeClass}>
            OLLAMA_BASE_URL
          </code>{" "}
          to your public tunnel URL in Vercel Environment Variables
          (Production), then redeploy.
        </>
      );
    }

    return (
      <>
        Set{" "}
        <code className={inlineCodeClass}>
          OLLAMA_BASE_URL
        </code>{" "}
        to your public tunnel URL in Vercel Environment Variables (Production +
        Preview), then redeploy.
      </>
    );
  })();

  // Group providers by category
  const deploymentProviders = statusItems.filter(item => item.category === "deployment");
  const aiProviders = statusItems.filter(item => item.category === "ai");
  const customProviders_items = statusItems.filter(item => item.category === "custom");

  // Helper function to render provider card
  const renderProviderCard = (item: typeof statusItems[0]) => {
    const showOffline =
      item.name === "Ollama" &&
      item.configured &&
      item.reachable === false;
    const showChecking =
      item.name === "Ollama" &&
      item.configured &&
      item.reachable === null;

    const providerStatus = showOffline
      ? ("error" as const)
      : showChecking
        ? ("loading" as const)
        : item.configured
          ? ("connected" as const)
          : ("disconnected" as const);

    let errorMessage: string | undefined;
    let warningMessage: string | undefined;

    if (showOffline && item.error) {
      errorMessage = item.error;
    } else if (item.warning) {
      warningMessage = item.warning;
    }

    return (
      <ProviderCard
        key={item.name}
        name={item.name}
        description={item.description}
        icon={item.icon}
        status={providerStatus}
        error={errorMessage}
        warning={warningMessage}
        action={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Get API Key Link */}
            {item.apiKeyUrl && (
              <a
                href={item.apiKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-ink border border-line hover:bg-surface-muted transition-colors"
                title={`Get ${item.name} API key`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Get Key
              </a>
            )}
            {item.name === "Ollama" && showOffline && (
              <button
                type="button"
                onClick={retryFetchOllama}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => handleConfigureProvider(item.name, item.description)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 dark:bg-blue-500 text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              title="Configure API Key"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Configure
            </button>
          </div>
        }
      />
    );
  };



  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* API Status */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-ink">
              API Configuration
            </h3>
            <button
              onClick={fetchStatus}
              className="px-3 py-1.5 rounded-sm text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
          {runtimeLabel && (
            <p className="text-sm text-ink-muted mb-3">{runtimeLabel}</p>
          )}
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg
                  className="animate-spin h-6 w-6 text-ink-muted"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : (
              <>
                {/* Deployment */}
                {deploymentProviders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-ink mb-3 uppercase tracking-wide">Deployment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {deploymentProviders.map(renderProviderCard)}
                    </div>
                  </div>
                )}

                {/* AI Chat & Coding */}
                {aiProviders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-ink mb-3 uppercase tracking-wide">AI Chat & Coding</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {aiProviders.map(renderProviderCard)}
                    </div>
                  </div>
                )}

                {/* Custom Endpoints */}
                {customProviders_items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-ink mb-3 uppercase tracking-wide">Custom Endpoints</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {customProviders_items.map(renderProviderCard)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hints Section */}
          {(groqSyncMessage || renderSyncMessage || ollamaRetryMessage || ollamaNgrokMessage ||
            (!status?.groq?.configured) || (!status?.render?.configured) || (!status?.ollama?.configured)) && (
            <div className="mt-4 space-y-2">
              {groqSyncMessage && (
                <div className={`p-3 rounded-sm text-sm ${
                  groqSyncMessage.kind === "success"
                    ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }`}>
                  <p>{groqSyncMessage.text}</p>
                  {groqSyncMessage.deploymentUrl && (
                    <p className="mt-1">
                      <a
                        href={groqSyncMessage.deploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Open deployment
                      </a>
                    </p>
                  )}
                </div>
              )}
              {renderSyncMessage && (
                <div className={`p-3 rounded-sm text-sm ${
                  renderSyncMessage.kind === "success"
                    ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }`}>
                  <p>{renderSyncMessage.text}</p>
                  {renderSyncMessage.deploymentUrl && (
                    <p className="mt-1">
                      <a
                        href={renderSyncMessage.deploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Open deployment
                      </a>
                    </p>
                  )}
                </div>
              )}
              {ollamaRetryMessage && (
                <div className={`p-3 rounded-sm text-sm ${
                  ollamaRetryMessage.kind === "success"
                    ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }`}>
                  {ollamaRetryMessage.text}
                </div>
              )}
              {ollamaNgrokMessage && (
                <div className={`p-3 rounded-sm text-sm ${
                  ollamaNgrokMessage.kind === "success"
                    ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }`}>
                  <p>{ollamaNgrokMessage.text}</p>
                  {ollamaNgrokMessage.url && (
                    <p className="mt-1">
                      <code className={inlineCodeClass}>{ollamaNgrokMessage.url}</code>
                    </p>
                  )}
                  {ollamaNgrokMessage.deploymentUrl && (
                    <p className="mt-1">
                      <a
                        href={ollamaNgrokMessage.deploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Open deployment
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="mt-3 text-sm text-ink-muted">
            Local: configure keys in{" "}
            <code className={inlineCodeClass}>
              .env.local
            </code>
            . Vercel: set them in Project Settings → Environment Variables.
          </p>

          <div className="mt-8">
            <CustomProviderSettings />
          </div>
        </section>

        {/* Security */}
        <section>
          <h3 className="text-lg font-semibold text-ink mb-4">
            Security
          </h3>
          <div className="card rounded-none p-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-ink">
                  Password Protection
                </h4>
                <p className="text-sm text-ink-muted mt-1">
                  The downloaded Electron app doesn&apos;t require a password. For Vercel deployments, you can set a custom password.
                </p>
              </div>
              {status?.runtime?.onVercel ? (
                <div className="p-3 rounded-sm bg-surface-muted/50 border border-line/40">
                  <p className="text-sm text-ink mb-2">
                    To set a password for your Vercel deployment:
                  </p>
                  <ol className="text-sm text-ink-muted space-y-1 list-decimal list-inside">
                    <li>Go to your Vercel Project Settings</li>
                    <li>Navigate to Environment Variables</li>
                    <li>Add <code className={inlineCodeClass}>APP_PASSWORD</code> with your desired password</li>
                    <li>Redeploy your application</li>
                  </ol>
                  <p className="text-xs text-ink-muted mt-3">
                    If APP_PASSWORD is not set, the default password is &quot;password&quot;
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-sm bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ Running locally - no password required
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Profile */}
        <section>
          <h3 className="text-lg font-semibold text-ink mb-4">
            Profile
          </h3>
          <div className="card rounded-none p-4">
            {!isEditingProfile ? (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-ink">
                    {settings.username}
                  </h4>
                  <p className="text-sm text-ink-muted">
                    {settings.email || "No email set"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditingProfile(true);
                    setProfileUsername(settings.username);
                    setProfileEmail(settings.email || "");
                  }}
                  className="px-4 py-2 rounded-none text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-ink mb-1">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your username"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
                    Email (optional)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <RotatingCardsButton
                    onClick={() => {
                      updateUsername(profileUsername);
                      if (profileEmail) updateEmail(profileEmail);
                      setIsEditingProfile(false);
                    }}
                    disabled={!profileUsername.trim()}
                    className="px-4 py-2 rounded-none text-sm"
                    variant="gold"
                  >
                    Save
                  </RotatingCardsButton>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 rounded-none text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h3 className="text-lg font-semibold text-ink mb-4">
            Appearance
          </h3>
          <div className="card rounded-none p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-ink">
                  Theme
                </h4>
                <p className="text-sm text-ink-muted">
                  {theme === "dark" ? "Dark mode enabled" : "Light mode enabled"}
                </p>
              </div>
              <RotatingCardsToggle
                checked={theme === "dark"}
                onChange={toggleTheme}
                label=""
              />
            </div>
          </div>
        </section>

        {/* Updates */}
        <section>
          <h3 className="text-lg font-semibold text-ink mb-4">
            Updates
          </h3>
          <div className="card rounded-none p-4 space-y-4">
            {/* Current version and check button */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-ink">
                  Current Version
                </h4>
                <p className="text-sm text-ink-muted">
                  {updateInfo?.currentVersion || "Loading..."}
                  {updateInfo?.isDev && " (dev)"}
                </p>
              </div>
              <button
                onClick={checkForUpdates}
                disabled={checkingUpdate}
                className="px-3 py-1.5 rounded-sm text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingUpdate ? "Checking..." : "Check for Updates"}
              </button>
            </div>

            {/* Update message */}
            {updateMessage && (
              <div className={`p-3 rounded-sm text-sm ${
                updateMessage.kind === "success"
                  ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300"
                  : updateMessage.kind === "error"
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
              }`}>
                {updateMessage.text}
              </div>
            )}

            {/* Update available notification */}
            {updateInfo?.hasUpdate && !updateInfo.isDev && (
              <div className="p-3 rounded-sm bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  New version available: {updateInfo.latestVersion}
                </p>
                <button
                  onClick={applyUpdate}
                  className="mt-2 px-4 py-2 rounded-sm text-sm font-medium bg-green-600 dark:bg-green-500 text-white dark:text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                >
                  Get Update
                </button>
              </div>
            )}

            {/* Auto-update toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-line/40">
              <div>
                <h4 className="font-medium text-ink">
                  Auto-update
                </h4>
                <p className="text-sm text-ink-muted">
                  Automatically check for updates daily
                </p>
              </div>
              <RotatingCardsToggle
                checked={autoUpdateEnabled}
                onChange={toggleAutoUpdate}
                label=""
              />
            </div>

            {/* Last checked */}
            {lastChecked && (
              <p className="text-xs text-ink-muted">
                Last checked: {new Date(lastChecked).toLocaleString()}
              </p>
            )}
          </div>
        </section>

        {/* Account */}
        <section>
          <h3 className="text-lg font-semibold text-ink mb-4">
            Account
          </h3>
          <div className="card rounded-none p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-ink">
                  Sign Out
                </h4>
                <p className="text-sm text-ink-muted">
                  Sign out of your current session
                </p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-none text-sm font-medium bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h3 className="text-lg font-semibold text-ink mb-4">
            About
          </h3>
          <div className="card rounded-none p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-none bg-surface-muted/70 border border-line/60 flex items-center justify-center shadow-md">
                <TridentLogo className="w-7 h-7 text-ink" />
              </div>
              <div>
                <h4 className="font-semibold text-ink">
                  Poseidon
                </h4>
                <p className="text-sm text-ink-muted">Version 1.0.0</p>
                <p className="text-xs text-ink-muted mt-1">
                  AI-powered web development assistant
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section>
          <SkillsManager />
        </section>

        {/* API Key Modal */}
        {showApiKeyModal && configuringProvider && (
          <ApiKeyModal
            provider={configuringProvider.name}
            description={configuringProvider.description}
            onSave={handleSaveApiKey}
            onClose={() => setShowApiKeyModal(false)}
          />
        )}
      </div>
    </div>
  );
}
