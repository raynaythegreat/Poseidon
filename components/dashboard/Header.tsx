"use client";

const tabTitles: Record<string, { title: string; subtitle: string }> = {
  chat: { title: "AI Chat", subtitle: "Build and improve your web projects with AI" },
  repos: { title: "GitHub Repos", subtitle: "Create, edit, and manage your repositories" },
  deploy: { title: "Deployments", subtitle: "Deploy your projects to Vercel or Render" },
  history: { title: "Chat History", subtitle: "View and resume previous conversations" },
  settings: { title: "Settings", subtitle: "Configure your API keys and preferences" },
};

interface HeaderProps {
  activeTab: string;
}

export default function Header({ activeTab }: HeaderProps) {
  const { title, subtitle } = tabTitles[activeTab] || tabTitles.chat;

  return (
    <header className="flex items-center justify-between px-3 py-2 sm:px-6 sm:py-4 border-b border-line/60 bg-surface/85 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-lg font-semibold gradient-text font-display tracking-wide">
              Poseidon
            </h1>
          </div>
        </div>
        <div className="hidden sm:block w-px h-8 bg-line/60" />
        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="text-xs text-ink-muted">{subtitle}</p>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-line/60 bg-surface/85">
          <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-ink">Online</span>
        </div>
      </div>
    </header>
  );
}
