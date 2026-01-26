"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type ImageProviderId = "fireworks" | "nanobanana" | "ideogram";

export interface ImageProviderOption {
  id: ImageProviderId;
  label: string;
  description: string;
  configured: boolean;
  models?: string[];
  defaultModel?: string;
}

interface ImageGeneratorModalProps {
  open: boolean;
  providers: ImageProviderOption[];
  defaultProvider?: ImageProviderId;
  onClose: () => void;
  onGenerate: (params: {
    provider: ImageProviderId;
    prompt: string;
    size: string;
    model?: string;
    style?: string;
  }) => Promise<boolean>;
  loading: boolean;
  error?: string | null;
}

const SIZE_OPTIONS = [
  { value: "1024x1024", label: "Square (1:1)" },
  { value: "768x1024", label: "Mobile Portrait (3:4)" },
  { value: "1024x768", label: "Mobile Landscape (4:3)" },
  { value: "1024x576", label: "Desktop (16:9)" },
];

const STYLE_OPTIONS = [
  { value: "", label: "None (Provider Default)" },
  { value: "realistic", label: "Realistic Photo" },
  { value: "digital-art", label: "Digital Art" },
  { value: "anime", label: "Anime" },
  { value: "cartoon", label: "Cartoon" },
  { value: "3d-render", label: "3D Render" },
  { value: "oil-painting", label: "Oil Painting" },
  { value: "watercolor", label: "Watercolor" },
  { value: "sketch", label: "Sketch/Drawing" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "fantasy", label: "Fantasy Art" },
  { value: "minimalist", label: "Minimalist" },
];

export default function ImageGeneratorModal({
  open,
  providers,
  defaultProvider,
  onClose,
  onGenerate,
  loading,
  error,
}: ImageGeneratorModalProps) {
  const providerFallback = providers[0]?.id ?? "fireworks";
  const [provider, setProvider] = useState<ImageProviderId>(
    defaultProvider ?? providerFallback,
  );
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [style, setStyle] = useState("");
  const [model, setModel] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const prevOpenRef = useRef(open);

  const currentProviderConfig = useMemo(
    () => providers.find((item) => item.id === provider),
    [provider, providers],
  );
  const modelOptions = currentProviderConfig?.models ?? [];
  const defaultModelValue = currentProviderConfig?.defaultModel ?? "";

  const hasConfiguredProvider = useMemo(
    () => providers.some((item) => item.configured),
    [providers],
  );

  useEffect(() => {
    // Only reset form when modal is first opened (transition from closed → open)
    const justOpened = open && !prevOpenRef.current;
    if (justOpened) {
      setLocalError(null);
      setPrompt("");
      setSize("1024x1024");
      setStyle("");
      const nextProvider = defaultProvider ?? providerFallback;
      setProvider(nextProvider);
      const initialProvider = providers.find((item) => item.id === nextProvider);
      setModel(initialProvider?.defaultModel ?? "");
    }
    // Update ref to track current open state
    prevOpenRef.current = open;
  }, [open, defaultProvider, providerFallback, providers]);

  useEffect(() => {
    if (!open) return;
    setModel(defaultModelValue);
  }, [defaultModelValue, open, provider]);

  if (!open) return null;

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setLocalError("Prompt is required.");
      return;
    }

    if (!hasConfiguredProvider) {
      setLocalError("No image providers are configured yet.");
      return;
    }

    setLocalError(null);
    const success = await onGenerate({
      provider,
      prompt: trimmedPrompt,
      size,
      model: model.trim() || undefined,
      style: style.trim() || undefined,
    });
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="card w-full max-w-xl p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Generate Image
            </h2>
            <p className="text-xs text-ink-muted">
              Generated images attach to your next message.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-sm hover:bg-surface-muted/70 dark:hover:bg-surface-strong/70 text-ink-muted hover:text-ink  transition-colors"
            aria-label="Close image generator"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink mb-2">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as ImageProviderId)}
              className="w-full rounded-none border border-line/60 bg-surface/90 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
            >
              {providers.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                  disabled={!item.configured}
                >
                  {item.label}
                  {item.configured ? "" : " (not configured)"}
                </option>
              ))}
            </select>
            <div className="mt-1 text-[11px] text-ink-muted">
              {providers.find((item) => item.id === provider)?.description ||
                "OpenAI-compatible image endpoint."}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full rounded-none border border-line/60 bg-surface/90 px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
              placeholder="Describe the image you want to generate..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-2">
              Style Template (optional)
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full rounded-none border border-line/60 bg-surface/90 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
            >
              {STYLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-1 text-[11px] text-ink-muted">
              Apply an artistic style to enhance your prompt
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink mb-2">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full rounded-none border border-line/60 bg-surface/90 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
              >
                {SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-2">
                Model (optional)
              </label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                list={modelOptions.length > 0 ? `image-models-${provider}` : undefined}
                className="w-full rounded-none border border-line/60 bg-surface/90 px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
              />
              {modelOptions.length > 0 && (
                <datalist id={`image-models-${provider}`}>
                  {modelOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              )}
            </div>
          </div>
        </div>

        {(localError || error) && (
          <div className="mt-4 text-xs text-red-600 dark:text-red-400">
            {localError || error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="btn-gold px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
