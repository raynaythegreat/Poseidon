"use client";

import { useTheme } from "@/contexts/ThemeContext";
import TridentLogo from "@/components/ui/TridentLogo";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    id: "chat",
    label: "Chat",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
  {
    id: "repos",
    label: "Repos",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
  },
  {
    id: "deploy",
    label: "Deploy",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "History",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ activeTab, onTabChange, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-full border-r border-line/60 bg-surface/90 backdrop-blur-xl">
      {/* Logo */}
      <div
        className={`flex items-center border-b border-line/60 ${
          isCollapsed ? "justify-center px-2 py-4" : "gap-3 px-6 py-5"
        }`}
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-neutral-900 dark:bg-neutral-100 shadow-sm ring-1 ring-white/20 dark:ring-white/10">
          <TridentLogo className="w-6 h-6 text-white dark:text-black" />
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="font-semibold text-lg text-ink">Poseidon</h1>
            <p className="text-xs text-ink-muted">AI Dev Command</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto ${isCollapsed ? "py-4 px-2" : "py-4 px-3"} space-y-1`}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            title={isCollapsed ? item.label : undefined}
            className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors ${
              isCollapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3"
            } ${
              activeTab === item.id
                ? "bg-neutral-900/10 dark:bg-neutral-100/10 text-ink ring-1 ring-neutral-900/25 dark:ring-neutral-100/25"
                : "text-ink-muted hover:bg-surface-muted/60 hover:text-ink"
            }`}
          >
            {item.icon}
            {!isCollapsed && item.label}
          </button>
        ))}
      </nav>

      {/* Theme Toggle, Collapse & Version */}
      <div className={`border-t border-line/60 ${isCollapsed ? "p-2" : "p-4"} space-y-2`}>
        <button
          onClick={toggleTheme}
          title={isCollapsed ? (theme === "dark" ? "Switch to Light" : "Switch to Dark") : undefined}
          className={`w-full flex items-center rounded-lg text-sm font-medium text-ink-muted hover:bg-surface-muted/60 hover:text-ink transition-colors ${
            isCollapsed ? "justify-center px-3 py-3" : "justify-between px-4 py-3"
          }`}
        >
          <span className={`flex items-center ${isCollapsed ? "" : "gap-3"}`}>
            {theme === "dark" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
            {!isCollapsed && (theme === "dark" ? "Light" : "Dark")}
          </span>
        </button>
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={`w-full flex items-center rounded-lg text-sm font-medium text-ink-muted hover:bg-surface-muted/60 hover:text-ink transition-colors ${
            isCollapsed ? "justify-center px-3 py-3" : "justify-between px-4 py-3"
          }`}
        >
          <span className={`flex items-center ${isCollapsed ? "" : "gap-3"}`}>
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                isCollapsed ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {!isCollapsed && "Collapse"}
          </span>
        </button>
        {!isCollapsed && (
          <div className="px-4 text-xs text-ink-subtle text-center">
          v1.0.0
          </div>
        )}
      </div>
    </aside>
  );
}
