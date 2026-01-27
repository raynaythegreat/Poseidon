"use client";

interface FloatingControlsProps {
  chatMode: "plan" | "build";
  onChatModeChange: (mode: "plan" | "build") => void;
  autoApprove: boolean;
  onAutoApproveToggle: () => void;
  selectedRepo: any;
  onDeploy: (provider: "vercel" | "render") => void;
  isDeploying: boolean;
}

export default function FloatingControls({
  chatMode,
  onChatModeChange,
  autoApprove,
  onAutoApproveToggle,
  selectedRepo,
  onDeploy,
  isDeploying,
}: FloatingControlsProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xl">
      {/* Plan/Build Toggle */}
      <div className="inline-flex rounded-lg bg-white/5 p-0.5">
        <button
          onClick={() => onChatModeChange("plan")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            chatMode === "plan"
              ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-sm"
              : "text-white/60 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          Plan
        </button>
        <button
          onClick={() => onChatModeChange("build")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            chatMode === "build"
              ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-sm"
              : "text-white/60 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          Build
        </button>
      </div>

      {/* Auto Button */}
      <button
        onClick={onAutoApproveToggle}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
          autoApprove
            ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-sm"
            : "bg-white/10 text-white/80 hover:bg-white/15"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Auto
      </button>

      {/* Deploy Buttons - Only when repo selected */}
      {selectedRepo && (
        <>
          <button
            onClick={() => onDeploy("vercel")}
            disabled={isDeploying}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white/80 hover:bg-white/15 disabled:opacity-50 transition-colors"
          >
            Vercel
          </button>
          <button
            onClick={() => onDeploy("render")}
            disabled={isDeploying}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white/80 hover:bg-white/15 disabled:opacity-50 transition-colors"
          >
            Render
          </button>
        </>
      )}
    </div>
  );
}
