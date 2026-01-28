"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChatInterface from "@/components/chat/ChatInterface";
import HistoryPage from "@/components/chat/HistoryPage";
import ReposPage from "@/components/github/ReposPage";
import DeploymentsPage from "@/components/deploy/DeploymentsPage";
import SettingsPage from "@/components/settings/SettingsPage";
import LoginPage from "@/components/auth/LoginPage";
import HomePage from "@/components/home/HomePage";
import GlassesLogo from "@/components/ui/GlassesLogo";
import { useChatHistory } from "@/contexts/ChatHistoryContext";

export default function MainPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { loadSession, clearCurrentSession } = useChatHistory();

  // Check if running in Electron app
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

  useEffect(() => {
    // Skip auth for Electron app
    if (isElectron) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      checkAuth();
    }
  }, [isElectron]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      clearCurrentSession();
    }
  }, [isLoading, isAuthenticated, clearCurrentSession]);

  const checkAuth = async () => {
    // First check if password is required
    try {
      const checkResponse = await fetch("/api/auth/login");
      const checkData = await checkResponse.json();

      // If no password required, skip auth
      if (!checkData.requiresPassword) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Password check failed:", error);
    }

    const deviceToken = localStorage.getItem("poseidon-device-token");
    const tokenHash = localStorage.getItem("poseidon-token-hash");

    if (!deviceToken || !tokenHash) {
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
      if (data.valid) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("poseidon-device-token");
        localStorage.removeItem("poseidon-token-hash");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        return <ChatInterface />;
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
            <GlassesLogo className="w-9 h-9 text-white" />
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

  // For chat tab, render ChatInterface directly without DashboardLayout wrapper
  // This allows the ThreeColumnLayout to take full viewport
  if (activeTab === "chat") {
    return <ChatInterface />;
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
