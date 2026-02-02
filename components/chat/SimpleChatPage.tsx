"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { useChatHistory, type ChatMessage } from "@/contexts/ChatHistoryContext";
import MessageList from "./MessageList";
import RepoDropdown from "./RepoDropdown";
import ModelDropdown from "./ModelDropdown";
import SkillAutocomplete from "./SkillAutocomplete";
import type { Skill } from "@/lib/skills/types";
import type { Provider } from "@/contexts/ApiUsageContext";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  default_branch?: string;
}

interface CustomProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: Array<{ id: string; name: string }>;
  enabled: boolean;
}

interface ModelOption {
  id: string;
  name: string;
  provider: Provider;
  description?: string;
  price?: number; // Price per 1M input tokens
  customConfig?: CustomProviderConfig; // For custom provider models
}

// Helper function to find the cheapest available model
function getCheapestAvailableModel(models: ModelOption[]): ModelOption | null {
  if (models.length === 0) return null;

  // Priority 1: Ollama (free, local)
  const ollamaModel = models.find(m => m.provider === "ollama");
  if (ollamaModel) return ollamaModel;

  // Priority 2: Sort by price (cheapest first)
  // Models without price info are treated as expensive (put at end)
  const modelsWithPrice = models.filter(m => typeof m.price === "number");
  const modelsWithoutPrice = models.filter(m => typeof m.price !== "number");

  if (modelsWithPrice.length > 0) {
    // Sort by price ascending
    const sortedByPrice = [...modelsWithPrice].sort((a, b) => {
      const priceA = a.price ?? Infinity;
      const priceB = b.price ?? Infinity;
      return priceA - priceB;
    });
    return sortedByPrice[0];
  }

  // Fallback: first model without price info
  return modelsWithoutPrice[0] || models[0];
}

export default function SimpleChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  // Initial state - will be updated when models load
  const [modelInfo, setModelInfo] = useState<{ name: string; provider: Provider; customConfig?: CustomProviderConfig }>({
    name: "",
    provider: "openai",
  });
  const [showSkillAutocomplete, setShowSkillAutocomplete] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pendingURLMessage, setPendingURLMessage] = useState<ChatMessage | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useUserSettings();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle auto-start brainstorm/plan mode from URL params
  useEffect(() => {
    const brainstorm = searchParams.get("brainstorm");
    const plan = searchParams.get("plan");
    const promptParam = searchParams.get("prompt");
    const modelParam = searchParams.get("model");
    const providerParam = searchParams.get("provider");
    const repoParam = searchParams.get("repo");

    console.log("[Chat] URL params:", { brainstorm, plan, promptParam, modelParam, providerParam, repoParam });

    // Set model if provided (need to look it up from the models list to get customConfig)
    if (modelParam && providerParam && models.length > 0) {
      const model = models.find(m => m.name === modelParam && m.provider === providerParam);
      if (model) {
        console.log("[Chat] Setting model:", modelParam, "provider:", providerParam, "customConfig:", !!model.customConfig);
        setModelInfo({
          name: model.name,
          provider: model.provider,
          customConfig: model.customConfig,
        });
      } else {
        console.log("[Chat] Model not found in list, using provided params:", modelParam, providerParam);
        setModelInfo({ name: modelParam, provider: providerParam as Provider });
      }
    }

    // Set repo if provided (need to look it up from the repos list)
    if (repoParam && repos.length > 0) {
      const repo = repos.find(r => r.id === parseInt(repoParam, 10));
      if (repo) {
        console.log("[Chat] Setting repo:", repo);
        setSelectedRepo(repo);
      }
    }

    // Handle mode + prompt combination
    if ((brainstorm === "true" || plan === "true") && promptParam && messages.length === 0) {
      const mode = brainstorm === "true" ? "brainstorm" : "plan";
      const userMsg: ChatMessage = {
        role: "user",
        content: `/${mode} ${promptParam}`,
      };
      console.log("[Chat] Setting mode+prompt message:", userMsg);
      setPendingURLMessage(userMsg);
      router.replace("/", { scroll: false });
    } else if (brainstorm === "true" && messages.length === 0) {
      const brainstormMsg: ChatMessage = {
        role: "user",
        content: "Start brainstorming mode. Ask me questions to understand what I want to build.",
      };
      setPendingURLMessage(brainstormMsg);
      router.replace("/", { scroll: false });
    } else if (plan === "true" && messages.length === 0) {
      const planMsg: ChatMessage = {
        role: "user",
        content: "Start planning mode. Help me create an implementation plan for what I want to build.",
      };
      setPendingURLMessage(planMsg);
      router.replace("/", { scroll: false });
    } else if (promptParam && messages.length === 0) {
      const userMsg: ChatMessage = {
        role: "user",
        content: promptParam,
      };
      setPendingURLMessage(userMsg);
      router.replace("/", { scroll: false });
    }
  }, []); // Run only on mount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getContextReason = (): string | undefined => {
    if (messages.length === 0) return "Starting a new conversation";
    if (selectedRepo) return "Working in a repository";
    return undefined;
  };

  const handleSkillSelect = (skill: Skill) => {
    const currentValue = input;
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const beforeCursor = currentValue.substring(0, cursorPos);
    const afterCursor = currentValue.substring(cursorPos);

    const newValue = beforeCursor.replace(/\/\w*$/, `/${skill.metadata.name} `) + afterCursor;
    setInput(newValue);
    setShowSkillAutocomplete(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastWordMatch = textBeforeCursor.match(/\/(\w*)$/);

    if (lastWordMatch) {
      setSkillQuery(lastWordMatch[1]);
      setShowSkillAutocomplete(true);

      const rect = e.target.getBoundingClientRect();
      setAutocompletePosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    } else {
      setShowSkillAutocomplete(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setSelectedRepo(null);
    setIsLoading(false);
    // Reset to cheapest available model
    const defaultModel = getCheapestAvailableModel(models);
    if (defaultModel) {
      setModelInfo({
        name: defaultModel.name,
        provider: defaultModel.provider,
        customConfig: defaultModel.customConfig,
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load repos on mount
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

  // Handle repo from URL params after repos are loaded
  useEffect(() => {
    const repoParam = searchParams.get("repo");
    if (repoParam && repos.length > 0 && !selectedRepo) {
      const repo = repos.find(r => r.id === parseInt(repoParam, 10));
      if (repo) {
        console.log("[Chat] Setting repo from URL after repos loaded:", repo);
        setSelectedRepo(repo);
      }
    }
  }, [repos, searchParams, selectedRepo]);

  // Handle model from URL params after models are loaded
  useEffect(() => {
    const modelParam = searchParams.get("model");
    const providerParam = searchParams.get("provider");
    // Only set if we haven't already set a model (check if modelInfo is still empty default)
    const isDefaultModel = !modelInfo.name || modelInfo.name === "";
    if (modelParam && providerParam && models.length > 0 && isDefaultModel) {
      const model = models.find(m => m.name === modelParam && m.provider === providerParam);
      if (model) {
        console.log("[Chat] Setting model from URL after models loaded:", modelParam, "customConfig:", !!model.customConfig);
        setModelInfo({
          name: model.name,
          provider: model.provider,
          customConfig: model.customConfig,
        });
      }
    }
  }, [models, searchParams, modelInfo]);

  // Load skills on mount
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetch("/api/skills");
        if (response.ok) {
          const data = await response.json();
          setAllSkills(data.skills || []);
        }
      } catch (error) {
        console.error("Failed to load skills:", error);
      }
    };
    loadSkills();
  }, []);

  // Auto-submit initial message from URL params (brainstorm, plan, or prompt)
  useEffect(() => {
    if (pendingURLMessage && messages.length === 0 && !isLoading) {
      // Clear the pending flag and submit
      setPendingURLMessage(null);
      handleSubmit(pendingURLMessage);
    }
  }, [pendingURLMessage, messages.length, isLoading]);

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch("/api/models");
        const data = await response.json();
        if (data.models && data.providers) {
          const modelList: ModelOption[] = [];

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
              const customProviders = JSON.parse(customProvidersStr) as CustomProviderConfig[];
              customProviders.forEach((provider) => {
                if (provider.enabled && provider.models && Array.isArray(provider.models)) {
                  provider.models.forEach((model) => {
                    modelList.push({
                      id: model.id,
                      name: model.name || model.id,
                      provider: provider.name as Provider,
                      description: "Custom provider",
                      customConfig: provider, // Store full config for API call
                    });
                  });
                }
              });
            }
          } catch (e) {
            console.error("Failed to load custom providers:", e);
          }

          setModels(modelList);

          // Set default model to cheapest available if no model is currently set
          // or if current model is the empty initial state
          if (modelList.length > 0 && (!modelInfo.name || modelInfo.name === "")) {
            const cheapestModel = getCheapestAvailableModel(modelList);
            if (cheapestModel) {
              console.log("[Chat] Setting default model to cheapest:", cheapestModel.name, "provider:", cheapestModel.provider, "price:", cheapestModel.price);
              setModelInfo({
                name: cheapestModel.name,
                provider: cheapestModel.provider,
                customConfig: cheapestModel.customConfig,
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to load models:", error);
      }
    };
    loadModels();
  }, []);

  const handleSubmit = async (messageOverride?: ChatMessage) => {
    const messageToSend = messageOverride || { role: "user" as const, content: input };
    if (!messageToSend.content.trim() || isLoading) return;

    // Check for skill command
    const skillMatch = messageToSend.content.match(/^\/(\w+)\s*([\s\S]*)$/);
    let finalContent = messageToSend.content;

    if (skillMatch) {
      const [, skillName, args] = skillMatch;
      try {
        const response = await fetch(`/api/skills/${encodeURIComponent(skillName)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.skill) {
            finalContent = `[Skill: ${data.skill.metadata.name}]\n${data.skill.prompt}\n\nUser input: ${args}`;
          }
        }
      } catch (error) {
        console.error("Failed to load skill:", error);
        // If skill loading fails, use original content
      }
    }

    const userMessage: ChatMessage = { ...messageToSend, content: finalContent };
    setMessages((prev) => [...prev, userMessage]);
    if (!messageOverride) setInput("");
    setIsLoading(true);

    try {
      // For custom providers, use "custom" as provider and include config
      const isCustomProvider = !!modelInfo.customConfig;
      const requestBody = {
        messages: [...messages, userMessage],
        model: modelInfo.name,
        provider: isCustomProvider ? "custom" : modelInfo.provider,
        customConfig: isCustomProvider ? {
          baseUrl: modelInfo.customConfig!.baseUrl,
          apiKey: modelInfo.customConfig!.apiKey,
          model: modelInfo.name,
        } : undefined,
        skillMode: !!skillMatch,
      };
      console.log("[Chat] Sending request:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("[Chat] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Chat] API error response:", response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      // Create assistant message for streaming updates
      const assistantMessageIndex = messages.length + 1;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        console.log("[Chat] Received chunk:", chunk);

        // Parse Server-Sent Events (SSE) format
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            if (jsonStr.trim() === "") continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.type === "text") {
                accumulatedContent += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  if (newMessages[assistantMessageIndex]) {
                    newMessages[assistantMessageIndex] = {
                      role: "assistant",
                      content: accumulatedContent,
                    };
                  }
                  return newMessages;
                });
              } else if (data.type === "done") {
                console.log("[Chat] Stream complete");
              } else if (data.type === "error") {
                throw new Error(data.error || "Stream error");
              }
            } catch (parseError) {
              console.error("[Chat] Failed to parse SSE data:", jsonStr, parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("[Chat] Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong. Please try again.\n\nError: ${error instanceof Error ? error.message : String(error)}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
  };

  const handleModelSelect = (model: ModelOption) => {
    setModelInfo({
      name: model.name,
      provider: model.provider,
      customConfig: model.customConfig,
    });
  };

  const handleCreateRepo = () => {
    router.push("/?tab=repos");
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Floating New Chat Button - Top Right (Desktop Only) */}
      <button
        onClick={handleNewChat}
        className="hidden sm:flex absolute top-4 right-4 z-50 items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
        title="New Chat"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-medium">New Chat</span>
      </button>

      <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-6 min-h-0">
          {/* Mode Indicator */}
          {messages.length > 0 && (
            <div className="mb-4">
              {messages[0].content.includes("brainstorming mode") && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-300 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="font-medium">Brainstorm Mode Active</span>
                </div>
              )}
              {messages[0].content.includes("planning mode") && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 text-blue-800 dark:text-blue-300 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Planning Mode Active</span>
                </div>
              )}
            </div>
          )}
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-ink mb-4">
                Start building, {settings.username || "Developer"}
              </h2>
              <p className="text-ink-muted">
                Describe what you want to create or ask a question to get started.
              </p>
            </motion.div>
          ) : (
            <MessageList
              messages={messages}
              isLoading={isLoading}
              repoName={selectedRepo?.name}
              onTemplateSelect={(prompt) => setInput(prompt)}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="relative bg-surface/90 rounded-2xl border border-line/60 shadow-sm backdrop-blur-xl focus-within:border-line/60 focus-within:ring-0 focus-within:shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Describe what you want to build or ask a question..."
              className="w-full px-3 sm:px-6 py-3 sm:py-5 bg-transparent text-ink placeholder:text-ink-subtle focus:!outline-none focus:!ring-0 resize-none text-base sm:text-lg min-h-[100px] sm:min-h-[120px]"
              rows={4}
              disabled={isLoading}
            />

            {/* Bottom Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* New Chat Button (Mobile Only) */}
                <button
                  onClick={handleNewChat}
                  className="sm:hidden flex items-center justify-center p-2 rounded-md transition-colors border border-line cursor-pointer bg-surface hover:bg-surface-muted text-ink"
                  title="New Chat"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {/* Repo Selector */}
                <RepoDropdown
                  selectedRepo={selectedRepo}
                  repos={repos}
                  onSelect={handleRepoSelect}
                  onCreateRepo={handleCreateRepo}
                />

                {/* Model Selector */}
                <ModelDropdown
                  modelInfo={modelInfo}
                  models={models}
                  onSelect={handleModelSelect}
                />

                {/* Brainstorm Button */}
                <button
                  onClick={() => {
                    if (input.trim()) {
                      setInput(`/brainstorm ${input}`);
                    } else {
                      setInput("/brainstorm ");
                    }
                    // Focus the textarea
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  disabled={isLoading}
                  className={`flex items-center justify-center p-2 sm:p-1.5 rounded-md transition-colors border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    searchParams.get("brainstorm") === "true" || (messages.length > 0 && messages[0].content.includes("brainstorming mode"))
                      ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/50"
                      : "bg-surface hover:bg-surface-muted text-ink border-line"
                  }`}
                  title="Brainstorm ideas"
                >
                  <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.287l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>

                {/* Plan Button */}
                <button
                  onClick={() => {
                    if (input.trim()) {
                      setInput(`/plan ${input}`);
                    } else {
                      setInput("/plan ");
                    }
                    // Focus the textarea
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  disabled={isLoading}
                  className={`flex items-center justify-center p-2 sm:p-1.5 rounded-md transition-colors border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    searchParams.get("plan") === "true" || (messages.length > 0 && messages[0].content.includes("planning mode"))
                      ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/50"
                      : "bg-surface hover:bg-surface-muted text-ink border-line"
                  }`}
                  title="Create a plan"
                >
                  <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>

              {/* Submit Button */}
              {isLoading ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-surface-strong text-ink-muted font-medium cursor-not-allowed text-sm sm:text-base"
                >
                  <span>Sending...</span>
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim()}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <span>Send</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {showSkillAutocomplete && (
            <SkillAutocomplete
              visible={showSkillAutocomplete}
              query={skillQuery}
              skills={allSkills}
              onSelect={handleSkillSelect}
              position={autocompletePosition}
              contextReason={getContextReason()}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
