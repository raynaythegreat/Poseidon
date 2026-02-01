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

interface ModelOption {
  id: string;
  name: string;
  provider: Provider;
  description?: string;
  price?: number; // Price per 1M input tokens
}

export default function SimpleChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelInfo, setModelInfo] = useState<{ name: string; provider: Provider }>({ name: "Claude", provider: "claude" });
  const [showSkillAutocomplete, setShowSkillAutocomplete] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useUserSettings();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle auto-start brainstorm/plan mode from URL params
  useEffect(() => {
    const brainstorm = searchParams.get("brainstorm");
    const plan = searchParams.get("plan");
    const promptParam = searchParams.get("prompt");

    if (brainstorm === "true" && messages.length === 0) {
      const brainstormMsg: ChatMessage = {
        role: "user",
        content: "Start brainstorming mode. Ask me questions to understand what I want to build.",
      };
      setMessages([brainstormMsg]);
      // Clean URL
      router.replace("/", { scroll: false });
    } else if (plan === "true" && messages.length === 0) {
      const planMsg: ChatMessage = {
        role: "user",
        content: "Start planning mode. Help me create an implementation plan for what I want to build.",
      };
      setMessages([planMsg]);
      // Clean URL
      router.replace("/", { scroll: false });
    } else if (promptParam && messages.length === 0 && !input) {
      setInput(promptParam + " ");
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

  // Auto-submit initial message from URL params
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "user" && !isLoading) {
      const msg = messages[0];
      // Check if this is an auto-start message
      if (msg.content.includes("Start brainstorming mode") || msg.content.includes("Start planning mode")) {
        handleSubmit(msg);
      }
    }
  }, [messages.length]);

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: modelInfo.name,
          provider: modelInfo.provider,
          skillMode: !!skillMatch,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.content || data.message || "",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
  };

  const handleModelSelect = (model: ModelOption) => {
    setModelInfo({ name: model.name, provider: model.provider });
  };

  const handleCreateRepo = () => {
    router.push("/?tab=repos");
  };

  return (
    <div className="h-full flex flex-col bg-background">
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
              className="w-full px-6 py-5 bg-transparent text-ink placeholder:text-ink-subtle focus:!outline-none focus:!ring-0 resize-none text-lg min-h-[120px]"
              rows={4}
              disabled={isLoading}
            />

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2">
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
                  onClick={() => setInput("/brainstorm ")}
                  disabled={isLoading}
                  className="flex items-center justify-center p-1.5 rounded-md bg-surface hover:bg-surface-muted transition-colors text-ink border border-line cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Brainstorm ideas"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>

                {/* Plan Button */}
                <button
                  onClick={() => setInput("/plan ")}
                  disabled={isLoading}
                  className="flex items-center justify-center p-1.5 rounded-md bg-surface hover:bg-surface-muted transition-colors text-ink border border-line cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Create a plan"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>

              {/* Submit Button */}
              {isLoading ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-surface-strong text-ink-muted font-medium cursor-not-allowed"
                >
                  <span>Sending...</span>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim()}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-black text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Send</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
