"use client";

import { useState, useEffect } from "react";

interface CustomModel {
  id: string;
  name: string;
}

export interface CustomProviderConfig {
  id: string; // Unique ID for the provider config
  name: string;
  baseUrl: string;
  apiKey: string;
  models: CustomModel[];
  enabled: boolean;
  // For UI state
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
}


function Instructions() {
  const [isOpen, setIsOpen] = useState(false);

  const liClass = "list-disc list-inside text-xs text-ink-muted";
  const codeClass = "px-1 py-0.5 bg-surface-strong/60 rounded text-xs";

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs font-medium text-ink hover:underline"
      >
        {isOpen ? "Hide" : "Show"} Instructions
      </button>
      {isOpen && (
        <div className="mt-2 space-y-3 p-3 border border-line rounded bg-surface-muted/30">
          <p className="text-xs text-ink-muted">
            This allows you to connect to any service that provides an OpenAI-compatible API. You will need two pieces of information:
          </p>
          <ul className="space-y-2">
            <li>
              <strong className="text-xs text-ink">Base URL</strong>: The main address for the API. It typically ends with <code className={codeClass}>/v1</code>.
            </li>
            <li>
              <strong className="text-xs text-ink">API Key</strong>: Your secret key for the service. Leave blank if not needed (e.g., for some local models).
            </li>
          </ul>
          <p className="text-xs font-semibold text-ink">Examples:</p>
          <ul className="space-y-3">
            <li>
              <strong className="text-xs text-ink">Perplexity AI</strong>:
              <ul className={liClass}>
                <li>Base URL: <code className={codeClass}>https://api.perplexity.ai</code></li>
                <li>API Key: Find it in your Perplexity account settings.</li>
              </ul>
            </li>
            <li>
              <strong className="text-xs text-ink">Together AI</strong>:
              <ul className={liClass}>
                <li>Base URL: <code className={codeClass}>https://api.together.xyz/v1</code></li>
                <li>API Key: Find it in your TogetherAI account settings.</li>
              </ul>
            </li>
            <li>
              <strong className="text-xs text-ink">Ollama (local)</strong>:
              <ul className={liClass}>
                 <li>Base URL: <code className={codeClass}>http://localhost:11434/v1</code></li>
                 <li>API Key: Can be anything (e.g., <code className={codeClass}>ollama</code>).</li>
                 <li>Requires running <code className={codeClass}>ollama serve</code>.</li>
              </ul>
            </li>
             <li>
              <strong className="text-xs text-ink">LM Studio (local)</strong>:
              <ul className={liClass}>
                 <li>Start a server in LM Studio.</li>
                 <li>Base URL: Use the address shown in the LM Studio server logs (e.g., <code className={codeClass}>http://localhost:1234/v1</code>).</li>
                 <li>API Key: Not needed.</li>
              </ul>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}


function ProviderForm({ provider, onSave, onRemove }: { provider: CustomProviderConfig, onSave: (config: CustomProviderConfig) => Promise<void>, onRemove: (id: string) => void }) {
    const [name, setName] = useState(provider.name);
    const [baseUrl, setBaseUrl] = useState(provider.baseUrl);
    const [apiKey, setApiKey] = useState(provider.apiKey);

    const handleSave = () => {
        onSave({ ...provider, name, baseUrl, apiKey });
    };
    
    return (
        <div className="p-3 border border-line rounded-md space-y-3">
            <div className="flex justify-between items-center">
                 <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. My Private LLM"
                    className="font-medium text-ink bg-transparent focus:outline-none focus:bg-surface-muted/50 rounded px-1"
                />
                <button onClick={() => onRemove(provider.id)} className="text-xs text-ink-muted hover:text-red-500">Remove</button>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full px-3 py-2 bg-surface-muted/30 border border-line rounded text-sm text-ink focus:outline-none focus:border-accent-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">API Key (Optional)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-surface-muted/30 border border-line rounded text-sm text-ink focus:outline-none focus:border-accent-500"
              />
            </div>
             <button
              onClick={handleSave}
              disabled={provider.isLoading || !baseUrl}
              className="btn-primary w-full text-sm py-2"
            >
              {provider.isLoading ? "Connecting..." : "Test & Save"}
            </button>
            {provider.error && (
              <div className="text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded">
                {provider.error}
              </div>
            )}
             {provider.success && (
              <div className="space-y-2">
                <div className="text-xs text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded">
                    {provider.success}
                </div>
                
                 {provider.models.length > 0 && (
                    <div className="max-h-32 overflow-y-auto text-xs border border-line rounded p-2 bg-surface-muted/20">
                        <p className="font-semibold mb-1">Available Models:</p>
                        <ul className="space-y-1">
                            {provider.models.map(m => (
                                <li key={m.id} className="text-ink-muted truncate">{m.id}</li>
                            ))}
                        </ul>
                    </div>
                 )}
              </div>
            )}
        </div>
    )
}

const STORAGE_KEY = "poseidon_custom_providers_list";

export default function CustomProviderSettings() {
    const [providers, setProviders] = useState<CustomProviderConfig[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const configs = JSON.parse(stored) as CustomProviderConfig[];
                setProviders(configs.filter(c => c.id)); // Ensure configs have an ID
            }
        } catch (e) {
            console.error("Failed to load custom providers list", e);
        }
    }, []);

    const saveProviders = (updatedProviders: CustomProviderConfig[]) => {
        setProviders(updatedProviders);
        // Don't save UI state to localStorage
        const toStore = updatedProviders.map(({ isLoading, error, success, ...rest }) => rest);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
        window.dispatchEvent(new Event("customProviderUpdated"));
    };

    const handleAddNew = () => {
        const newProvider: CustomProviderConfig = {
            id: `custom-${Date.now()}`,
            name: `Custom Provider ${providers.length + 1}`,
            baseUrl: "",
            apiKey: "",
            models: [],
            enabled: true,
        };
        setProviders([...providers, newProvider]);
    };

    const handleRemove = (id: string) => {
        const updated = providers.filter(p => p.id !== id);
        saveProviders(updated);
    };

    const handleSave = async (config: CustomProviderConfig) => {
        const updatedProviders = providers.map(p => p.id === config.id ? { ...p, isLoading: true, error: null, success: null } : p);
        setProviders(updatedProviders);

        try {
            const response = await fetch("/api/custom/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ baseUrl: config.baseUrl, apiKey: config.apiKey }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to connect");
            }
            
            const finalConfig = {
                ...config,
                isLoading: false,
                success: `Successfully connected! Found ${data.models.length} models.`,
                models: data.models,
                enabled: true,
            };
            saveProviders(providers.map(p => p.id === config.id ? finalConfig : p));

        } catch (err) {
            const finalConfig = {
                ...config,
                isLoading: false,
                error: err instanceof Error ? err.message : "Connection failed",
                models: [],
            };
            setProviders(providers.map(p => p.id === config.id ? finalConfig : p));
        }
    };

    return (
        <div className="card rounded-none p-4 space-y-4">
          <div>
            <h4 className="font-medium text-ink">Custom Endpoints</h4>
            <p className="text-sm text-ink-muted">
              Connect to any OpenAI-compatible API endpoint. You can add multiple providers.
            </p>
          </div>

          <div className="space-y-4">
            <Instructions />
            <div className="space-y-4">
                {providers.map(provider => (
                    <ProviderForm key={provider.id} provider={provider} onSave={handleSave} onRemove={handleRemove} />
                ))}
            </div>
            <button onClick={handleAddNew} className="btn-secondary w-full text-sm py-2">
                + Add New Endpoint
            </button>
          </div>
        </div>
    )
}