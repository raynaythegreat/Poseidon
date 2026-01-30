"use client";

import { useState, useEffect } from "react";
import TridentLogo from "@/components/ui/TridentLogo";

interface ApiKeyModalProps {
  provider: string;
  description: string;
  onSave: (apiKey: string) => void;
  onClose: () => void;
}

export default function ApiKeyModal({ provider, description, onSave, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Load existing key from .env.local
    loadApiKey();
  }, [provider]);

  const loadApiKey = async () => {
    try {
      const response = await fetch("/api/settings/api-keys");
      const data = await response.json();

      if (response.ok && data.apiKeys) {
        const key = data.apiKeys[provider];
        if (key) {
          setApiKey(key);
          setHasApiKey(true);
        }
      }
    } catch (error) {
      console.error("Failed to load API key", error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: "error", text: "API key is required" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save API key");
      }

      setHasApiKey(true);
      const wasRestarted = data.restarted || false;
      onSave(apiKey.trim());

      setMessage({
        type: "success",
        text: wasRestarted
          ? `✓ ${provider} API key saved and dev server restarted!`
          : `✓ ${provider} API key saved!`
      });

      // Give user a moment to see the message if restarted
      if (wasRestarted) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      onClose();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save API key"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${provider} API key?`)) return;

    setRemoving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/settings/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove API key");
      }

      setApiKey("");
      setHasApiKey(false);
      setMessage({ type: "success", text: `✓ ${provider} API key removed!` });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to remove API key"
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-line rounded-lg p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-surface-muted/70 border border-line/60 flex items-center justify-center">
            <TridentLogo className="w-5 h-5 text-ink" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink capitalize">{provider} API Key</h3>
            <p className="text-sm text-ink-muted">{description}</p>
          </div>
          {hasApiKey && (
            <button
              onClick={handleRemove}
              disabled={removing}
              className="p-2 rounded-sm hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
              title="Remove API key"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label htmlFor="api-key" className="block text-sm font-medium text-ink">
            {hasApiKey ? "Update API Key" : "API Key"}
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider === "Claude API" ? "sk-ant-..." : provider === "OpenAI API" ? "sk-..." : ""}
            className="w-full px-3 py-2 bg-surface-muted border border-line rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500"
            autoFocus
          />
          <p className="text-xs text-ink-muted">
            This key is saved to .env.local file and will be used by the app.
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mt-3 p-3 rounded text-sm ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading || removing}
            className="flex-1 px-4 py-2 rounded-sm border border-line text-ink hover:bg-surface-muted/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || removing || !apiKey.trim()}
            className="flex-1 px-4 py-2 rounded-sm bg-surface-muted/70 text-ink hover:bg-surface-muted/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : hasApiKey ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
