"use client";

import { ReactNode } from "react";

interface ProviderCardProps {
  name: string;
  description?: string;
  icon: ReactNode;
  status: "connected" | "disconnected" | "error" | "loading";
  action?: ReactNode;
  onClick?: () => void;
  className?: string;
  error?: string;
  warning?: string;
}

const statusConfig = {
  connected: {
    bg: "bg-green-100 dark:bg-green-500/10",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-500/20",
    dot: "bg-green-500",
    label: "Connected",
  },
  disconnected: {
    bg: "bg-red-100 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-500/20",
    dot: "bg-red-500",
    label: "Not Configured",
  },
  error: {
    bg: "bg-amber-100 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/20",
    dot: "bg-amber-500",
    label: "Error",
  },
  loading: {
    bg: "bg-surface-muted/60",
    text: "text-ink-muted",
    border: "border-line/60",
    dot: "bg-poseidon-teal-light animate-pulse",
    label: "Checking",
  },
};

const colorSchemes = {
  cyan: { rgb: "142, 249, 252", from: "rgba(142, 249, 252, 0.1)", to: "rgba(142, 249, 252, 0.4)" },
  green: { rgb: "142, 252, 204", from: "rgba(142, 252, 204, 0.1)", to: "rgba(142, 252, 204, 0.4)" },
  lime: { rgb: "142, 252, 157", from: "rgba(142, 252, 157, 0.1)", to: "rgba(142, 252, 157, 0.4)" },
  yellow: { rgb: "215, 252, 142", from: "rgba(215, 252, 142, 0.1)", to: "rgba(215, 252, 142, 0.4)" },
  amber: { rgb: "252, 252, 142", from: "rgba(252, 252, 142, 0.1)", to: "rgba(252, 252, 142, 0.4)" },
  orange: { rgb: "252, 208, 142", from: "rgba(252, 208, 142, 0.1)", to: "rgba(252, 208, 142, 0.4)" },
  red: { rgb: "252, 142, 142", from: "rgba(252, 142, 142, 0.1)", to: "rgba(252, 142, 142, 0.4)" },
  pink: { rgb: "252, 142, 239", from: "rgba(252, 142, 239, 0.1)", to: "rgba(252, 142, 239, 0.4)" },
  purple: { rgb: "204, 142, 252", from: "rgba(204, 142, 252, 0.1)", to: "rgba(204, 142, 252, 0.4)" },
  blue: { rgb: "142, 202, 252", from: "rgba(142, 202, 252, 0.1)", to: "rgba(142, 202, 252, 0.4)" },
};

const cards = Object.values(colorSchemes);

export default function ProviderCard({
  name,
  description,
  icon,
  status,
  action,
  onClick,
  className = "",
  error,
  warning,
}: ProviderCardProps) {
  const config = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className={`
        relative group
        card rounded-none p-4
        overflow-hidden
        ${onClick && !action ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}
        ${className}
      `}
    >
      {/* Rotating cards background effect */}
      <div
        className={`
          absolute inset-0 pointer-events-none opacity-0
          group-hover:opacity-100 transition-opacity duration-700
          ${status === "connected" ? "opacity-20" : ""}
        `}
        style={{
          animation: "rotating 12s linear infinite",
        }}
      >
        <div
          className="relative w-full h-full"
          style={{
            perspective: "1000px",
            transformStyle: "preserve-3d" as const,
          }}
        >
          {cards.map((color, index) => (
            <div
              key={index}
              className="absolute inset-0 rounded-none"
              style={{
                background: `radial-gradient(circle at 30% 50%, ${color.from} 0%, ${color.to} 60%, transparent 100%)`,
                transform: `rotateY(${(360 / cards.length) * index}deg) translateZ(30px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Provider Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`
              w-12 h-12 rounded-sm bg-surface-muted/70
              flex items-center justify-center text-ink
              border border-line/40
            `}>
              {icon}
            </div>
            {/* Status dot */}
            <div className={`
              absolute -top-1 -right-1 w-4 h-4 rounded-full
              ${config.dot}
              border-2 border-background
            `} />
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-ink text-base">
              {name}
            </h4>
            {description && (
              <p className="text-sm text-ink-muted mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Error/Warning message */}
        {(error || warning) && (
          <div className={`
            mt-3 px-3 py-2 rounded-sm text-xs
            ${error
              ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300"
              : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
            }
          `}>
            {error || warning}
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-4 pt-3 border-t border-line/60">
          <div className="flex items-center justify-between">
            {/* Status Badge */}
            {!action && (
              <div className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${config.bg} ${config.text}
              `}>
                {config.label}
              </div>
            )}

            {/* Action Button */}
            {action && (
              <div className="flex items-center gap-2">
                <span className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${config.bg} ${config.text}
                `}>
                  {config.label}
                </span>
                {action}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-none bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}
