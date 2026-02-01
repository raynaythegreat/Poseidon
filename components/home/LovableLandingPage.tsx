"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { useChatHistory } from "@/contexts/ChatHistoryContext";
import TridentLogo from "@/components/ui/TridentLogo";
import RepoSelector from "@/components/chat/RepoSelector";
import ModelDropdown from "@/components/chat/ModelDropdown";

const navItems = [
  { label: "Repos", id: "repos" },
  { label: "Deploy", id: "deploy" },
  { label: "History", id: "history" },
  { label: "Settings", id: "settings" },
];

export default function LovableLandingPage() {
  const [input, setInput] = useState("");
  const router = useRouter();
  const { clearCurrentSession } = useChatHistory();
  const { settings } = useUserSettings();
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<{ name: string; provider: string; price?: number } | null>(null);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = useCallback(async () => {
    // Check cache first (1 minute cache)
    const cached = localStorage.getItem("poseidon_models_cache");
    const cachedTime = localStorage.getItem("poseidon_models_cache_time");
    const now = Date.now();

    if (cached && cachedTime) {
      const cacheAge = now - parseInt(cachedTime, 10);
      // Use cache if less than 1 minute old
      if (cacheAge < 1 * 60 * 1000) {
        setModels(JSON.parse(cached));
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/models");
      const data = await response.json();
      if (data.models && data.providers) {
        const modelList: any[] = [];

        // Only load models from configured providers
        const sortedProviders = Object.keys(data.models).sort();
        sortedProviders.forEach((providerKey) => {
          // Check if this provider is configured
          if (data.providers[providerKey]) {
            const providerModels = data.models[providerKey] as any[];
            providerModels.forEach((model: any) => {
              // Use providerKey for consistency, model.provider may be capitalized
              modelList.push({ ...model, provider: model.provider || providerKey });
            });
          }
        });

        // Load custom providers from localStorage
        try {
          const customProvidersStr = localStorage.getItem("poseidon_custom_providers_list");
          if (customProvidersStr) {
            const customProviders = JSON.parse(customProvidersStr);
            customProviders.forEach((provider: any) => {
              if (provider.enabled && provider.models && Array.isArray(provider.models)) {
                provider.models.forEach((model: any) => {
                  modelList.push({
                    id: model.id,
                    name: model.name || model.id,
                    provider: provider.name,
                    description: "Custom provider",
                  });
                });
              }
            });
          }
        } catch (e) {
          console.error("Failed to load custom providers:", e);
        }

        setModels(modelList);
        // Cache the results (1 minute cache)
        localStorage.setItem("poseidon_models_cache", JSON.stringify(modelList));
        localStorage.setItem("poseidon_models_cache_time", now.toString());
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = () => {
    if (input.trim()) {
      clearCurrentSession();
      router.push(`/?prompt=${encodeURIComponent(input)}`);
    }
  };

  const handleNavClick = (tabId: string) => {
    router.push(`/?tab=${tabId}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col overflow-y-auto">
      {/* Minimal Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <TridentLogo className="w-5 h-5 text-white dark:text-black" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Poseidon</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section - Lovable.dev Style */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-3xl"
        >
          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-center text-gray-900 dark:text-white mb-8 leading-tight">
            Ship apps
            <br />
            <span className="text-gray-400 dark:text-gray-600">with the speed of thought.</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">
            Describe what you want to build, {settings.username || "Developer"}. Poseidon handles the rest — from planning to deployment.
          </p>

          {/* Chat Input - Lovable.dev Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl focus-within:border-gray-200 dark:focus-within:border-gray-800 focus-within:ring-0 focus-within:shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Describe the app you want to build..."
                className="w-full px-6 py-5 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:!outline-none focus:!ring-0 resize-none text-lg min-h-[140px]"
                rows={5}
              />

              {/* Bottom Toolbar */}
              <div className="flex items-center justify-between px-3 pb-3 flex-wrap gap-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Repo Selector - Dropdown to select/create repository */}
                  <div className="relative">
                    <RepoSelector
                      selectedRepo={selectedRepo}
                      onSelect={setSelectedRepo}
                    />
                  </div>

                  {/* Model Selector - Shows dropdown of available models */}
                  <ModelDropdown
                    modelInfo={selectedModel || { name: "Claude 3.5 Sonnet", provider: "Claude" }}
                    models={models.length > 0 ? models : [
                      { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Claude", description: "Best all-around", price: 3 },
                    ]}
                    onSelect={setSelectedModel}
                  />

                  {/* Brainstorm */}
                  <button
                    onClick={() => {
                      clearCurrentSession();
                      router.push("/?brainstorm=true");
                    }}
                    className="flex items-center justify-center p-1.5 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 cursor-pointer"
                    title="Brainstorm ideas"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </button>

                  {/* Write Plan */}
                  <button
                    onClick={() => {
                      clearCurrentSession();
                      router.push("/?plan=true");
                    }}
                    className="flex items-center justify-center p-1.5 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 cursor-pointer"
                    title="Create a plan"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium text-xs transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Generate</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20 -z-10" />
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-3 mt-8 flex-wrap"
          >
            {["Web Apps", "Mobile Apps", "APIs", "Databases", "UI Components"].map((feature) => (
              <span
                key={feature}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-full text-sm text-gray-600 dark:text-gray-400"
              >
                {feature}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 w-full max-w-4xl"
        >
          <h3 className="text-center text-lg font-semibold text-gray-900 dark:text-white mb-8">
            Everything you need to build
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: "AI-Powered Chat",
                description: "Chat with Claude to generate code, debug issues, and get explanations"
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                ),
                title: "GitHub Integration",
                description: "Connect your repos and apply changes directly from the chat"
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                ),
                title: "One-Click Deploy",
                description: "Deploy to Vercel or Render with a single click"
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Skills System",
                description: "Use slash commands like /brainstorm and /plan for specialized workflows"
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "Local & Private",
                description: "Run locally with Ollama or use your own API keys"
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                ),
                title: "Multi-Provider Support",
                description: "Choose from Claude, OpenAI, Groq, Gemini, Ollama, and custom providers"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + (index * 0.1) }}
                className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-black dark:bg-white rounded-lg text-white dark:text-black">
                    {feature.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-gray-400 dark:text-gray-600">
            Powered by Claude • GitHub Integration • One-Click Deployment
          </p>
        </motion.div>
      </div>
    </div>
  );
}
