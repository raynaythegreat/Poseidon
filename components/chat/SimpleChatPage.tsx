"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { useChatHistory, type ChatMessage } from "@/contexts/ChatHistoryContext";
import MessageList from "./MessageList";
import RepoDropdown from "./RepoDropdown";
import ModelDropdown from "./ModelDropdown";
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
}

export default function SimpleChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [models] = useState<ModelOption[]>([]);
  const [modelInfo, setModelInfo] = useState<{ name: string; provider: Provider }>({ name: "Claude", provider: "claude" });

  const router = useRouter();
  const { settings } = useUserSettings();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: modelInfo.name,
          provider: modelInfo.provider,
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
          <div className="relative bg-surface/90 rounded-2xl border border-line/60 overflow-hidden shadow-sm backdrop-blur-xl">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Describe what you want to build or ask a question..."
              className="w-full px-6 py-5 bg-transparent text-ink placeholder:text-ink-subtle focus:outline-none resize-none text-lg min-h-[120px]"
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
                  darkTheme
                  compact
                />

                {/* Model Selector */}
                <ModelDropdown
                  modelInfo={modelInfo}
                  models={models}
                  onSelect={handleModelSelect}
                  darkTheme
                  compact
                />
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
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg gradient-sunset text-white font-medium transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed ring-1 ring-white/20 dark:ring-white/10"
                >
                  <span>Send</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
