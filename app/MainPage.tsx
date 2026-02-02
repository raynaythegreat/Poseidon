"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SimpleChatPage from "@/components/chat/SimpleChatPage";
import HistoryPage from "@/components/chat/HistoryPage";
import ReposPage from "@/components/github/ReposPage";
import DeploymentsPage from "@/components/deploy/DeploymentsPage";
import SettingsPage from "@/components/settings/SettingsPage";
import LoginPage from "@/components/auth/LoginPage";
import HomePage from "@/components/home/HomePage";
import TridentLogo from "@/components/ui/TridentLogo";
import { useChatHistory } from "@/contexts/ChatHistoryContext";

export default function MainPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { loadSession, clearCurrentSession } = useChatHistory();

  // Define checkAuth before using it in useEffect
  const checkAuth = async () => {
    console.log("[Auth] Starting auth check...");
    // First check if password is required
    try {
      const checkResponse = await fetch("/api/auth/login");
      const checkData = await checkResponse.json();
      console.log("[Auth] Password check response:", checkData);

      // If no password required, skip auth
      if (!checkData.requiresPassword) {
        console.log("[Auth] No password required, skipping auth");
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("[Auth] Password check failed:", error);
    }

    const deviceToken = localStorage.getItem("poseidon-device-token");
    const tokenHash = localStorage.getItem("poseidon-token-hash");

    if (!deviceToken || !tokenHash) {
      console.log("[Auth] No device tokens found");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken, tokenHash }),
      });

      const data = await response.json();
      console.log("[Auth] Token validation response:", data);
      if (data.valid) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("poseidon-device-token");
        localStorage.removeItem("poseidon-token-hash");
      }
    } catch (error) {
      console.error("[Auth] Auth check failed:", error);
    } finally {
      console.log("[Auth] Auth check complete, setting isLoading=false");
      setIsLoading(false);
    }
  };

  // Handle tab from URL search params
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const promptParam = searchParams.get("prompt");
    const brainstormParam = searchParams.get("brainstorm");
    const planParam = searchParams.get("plan");

    // If there's a prompt, brainstorm, or plan param, switch to chat tab
    if (promptParam || brainstormParam === "true" || planParam === "true") {
      setActiveTab("chat");
    } else if (tabParam && ["chat", "repos", "deploy", "history", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Check if running in Electron app using the flag set by Electron
    // Also check for electronAPI as fallback
    const isElectron = typeof window !== 'undefined' &&
      ((window as any).__IS_ELECTRON__ === true || !!(window as any).electronAPI);
    console.log("[Page] Auth effect running, isElectron:", isElectron);

    // Skip auth for Electron app
    if (isElectron) {
      console.log("[Page] Electron detected, setting authenticated=true");
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      console.log("[Page] Not Electron, running checkAuth");
      checkAuth();

      // Safety timeout: if auth check doesn't complete in 3 seconds, render anyway
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        setIsAuthenticated(true);
        console.warn("[Auth] Auth check timeout - rendering page anyway");
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      clearCurrentSession();
    }
  }, [isLoading, isAuthenticated, clearCurrentSession]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("poseidon-device-token");
    localStorage.removeItem("poseidon-token-hash");
    setIsAuthenticated(false);
  };

  const handleResumeChat = (sessionId: string) => {
    setActiveTab("chat");
    // The ChatInterface will load the session
  };

  const handleNewChat = () => {
    clearCurrentSession();
    setActiveTab("chat");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "chat":
        return <SimpleChatPage />;
      case "history":
        return <HistoryPage onResumeChat={handleResumeChat} onNewChat={handleNewChat} />;
      case "repos":
        return <ReposPage />;
      case "deploy":
        return <DeploymentsPage />;
      case "settings":
        return <SettingsPage onLogout={handleLogout} />;
      default:
        return <HomePage />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-sunset flex items-center justify-center shadow-xl animate-gradient ring-1 ring-white/40 dark:ring-white/10">
            <TridentLogo className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-center gap-2 text-ink-muted">
            <svg className="animate-spin h-5 w-5 text-gold-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Login page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // For home tab, render HomePage directly without DashboardLayout wrapper
  // This allows the lovable.dev-style landing page to take full viewport with its own navigation
  if (activeTab === "home") {
    return <HomePage />;
  }

  // All other pages (including chat) use DashboardLayout with sidebar
  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
