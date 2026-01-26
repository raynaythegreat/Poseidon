"use client";

import { useMemo } from "react";
import { useDeploymentProvider } from "@/contexts/DeploymentContext";
import VercelDeploymentsPage from "@/components/vercel/DeploymentsPage";
import RenderDeploymentsPage from "@/components/render/DeploymentsPage";

export default function DeploymentsPage() {
  const { provider, setProvider } = useDeploymentProvider();

  const tabs = useMemo(
    () => [
      { id: "vercel" as const, label: "Vercel" },
      { id: "render" as const, label: "Render" },
    ],
    []
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="inline-flex rounded-none border border-line/60 bg-surface/85 p-1 backdrop-blur">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setProvider(tab.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                provider === tab.id
                  ? "gradient-sunset text-white shadow-none ring-1 ring-white/30"
                  : "text-ink-muted hover:bg-surface-muted/60 dark:hover:bg-surface-strong/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {provider === "render" ? <RenderDeploymentsPage /> : <VercelDeploymentsPage />}
      </div>
    </div>
  );
}
