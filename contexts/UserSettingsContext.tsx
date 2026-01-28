"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserSettings {
  username: string;
  email?: string;
  theme: "light" | "dark" | "auto";
}

interface UserSettingsContextType {
  settings: UserSettings;
  updateUsername: (username: string) => void;
  updateEmail: (email: string) => void;
  updateTheme: (theme: UserSettings["theme"]) => void;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

const STORAGE_KEY = "poseidon-user-settings";

const DEFAULT_SETTINGS: UserSettings = {
  username: "Developer",
  theme: "dark",
};

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: UserSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setIsLoaded(true);
  }, []);

  const updateUsername = (username: string) => {
    const newSettings = { ...settings, username };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const updateEmail = (email: string) => {
    const newSettings = { ...settings, email };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const updateTheme = (theme: UserSettings["theme"]) => {
    const newSettings = { ...settings, theme };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  if (!isLoaded) return null;

  return (
    <UserSettingsContext.Provider value={{ settings, updateUsername, updateEmail, updateTheme }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("useUserSettings must be used within UserSettingsProvider");
  }
  return context;
}
