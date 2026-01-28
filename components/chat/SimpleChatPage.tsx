"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { useChatHistory } from "@/contexts/ChatHistoryContext";
import ChatHeaderBubble from "./ChatHeaderBubble";
import MessageList from "./MessageList";
import ApiUsageDisplay from "./ApiUsageDisplay";
import RepoDropdown from "./RepoDropdown";
import ModelDropdown from "./ModelDropdown";
import RepoSelector from "./RepoSelector";
import type { Provider } from "@/contexts/ApiUsageContext";

const navItems = [
  { label: "Chat", id: "chat" },
  { label: "Repos", id: "repos" },
  { label: "Deploy", id: "deploy" },
  { label: "History", id: "history" },
  { label: "Settings", id: "settings" },
];

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
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function SimpleChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
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

  const handleNavClick = (tabId: string) => {
    router.push(`/?tab=${tabId}`);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
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
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Minimal Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 100 100" fill="none" className="w-5 h-5 text-white dark:text-black">
                <path d="M50 15 L50 65" stroke="currentColor" strokeWidth="6" strokeLinecap="square"/>
                <path d="M50 30 L28 15 M50 45 L35 35" stroke="currentColor" strokeWidth="5" strokeLinecap="square"/>
                <path d="M50 30 L72 15 M50 45 L65 35" stroke="currentColor" strokeWidth="5" strokeLinecap="square"/>
              </svg>
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

          {/* API Usage Display */}
          <ApiUsageDisplay currentProvider={modelInfo.provider} compact />
        </div>
      </nav>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col px-6 pt-32 pb-6 max-w-4xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-6">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Start building, {settings.username || "Developer"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
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
          <div className="relative bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl">
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
              className="w-full px-6 py-5 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none text-lg min-h-[120px]"
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
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-400 text-white font-medium cursor-not-allowed"
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
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
