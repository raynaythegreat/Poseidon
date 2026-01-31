"use client";

import { useState } from "react";

interface RotatingCardsToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

const colorSchemes = {
  cyan: { rgb: "142, 249, 252", from: "rgba(142, 249, 252, 0.3)", to: "rgba(142, 249, 252, 0.8)" },
  green: { rgb: "142, 252, 204", from: "rgba(142, 252, 204, 0.3)", to: "rgba(142, 252, 204, 0.8)" },
  lime: { rgb: "142, 252, 157", from: "rgba(142, 252, 157, 0.3)", to: "rgba(142, 252, 157, 0.8)" },
  yellow: { rgb: "215, 252, 142", from: "rgba(215, 252, 142, 0.3)", to: "rgba(215, 252, 142, 0.8)" },
  amber: { rgb: "252, 252, 142", from: "rgba(252, 252, 142, 0.3)", to: "rgba(252, 252, 142, 0.8)" },
  orange: { rgb: "252, 208, 142", from: "rgba(252, 208, 142, 0.3)", to: "rgba(252, 208, 142, 0.8)" },
};

const cards = Object.values(colorSchemes);

export default function RotatingCardsToggle({
  checked: controlledChecked,
  onChange,
  disabled = false,
  label,
  className = "",
}: RotatingCardsToggleProps) {
  const [internalChecked, setInternalChecked] = useState(false);
  const checked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;

    const newChecked = !checked;
    setInternalChecked(newChecked);
    onChange?.(newChecked);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && (
        <span className="text-sm font-medium text-ink">{label}</span>
      )}

      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative w-14 h-8 rounded-full
          transition-all duration-300 ease-in-out
          ${checked ? "bg-gradient-to-r from-cyan-400 to-purple-500" : "bg-surface-muted"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        aria-checked={checked}
        role="switch"
      >
        {/* Rotating cards effect when checked */}
        {checked && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-full"
            style={{
              animation: "rotating 6s linear infinite",
            }}
          >
            <div
              className="relative w-full h-full"
              style={{
                perspective: "800px",
                transformStyle: "preserve-3d" as const,
              }}
            >
              {cards.map((color, index) => (
                <div
                  key={index}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${color.from} 0%, ${color.to} 100%)`,
                    transform: `rotateY(${(360 / cards.length) * index}deg) translateZ(20px)`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Toggle knob */}
        <div
          className={`
            absolute top-1 w-6 h-6 rounded-full
            transition-all duration-300 ease-in-out
            shadow-md
            ${checked ? "left-7 bg-poseidon-gold" : "left-1 bg-surface"}
            ${checked ? "shadow-lg shadow-poseidon-gold/40" : ""}
          `}
        >
          {/* Glow effect when checked */}
          {checked && (
            <div className="absolute inset-0 rounded-full bg-poseidon-gold/40 animate-pulse" />
          )}
        </div>
      </button>
    </div>
  );
}
