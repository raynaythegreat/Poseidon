"use client";

import { useState } from "react";

interface RotatingCardsToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

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
          ${checked ? "bg-blue-500" : "bg-surface-muted"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        aria-checked={checked}
        role="switch"
      >
        {/* Toggle knob */}
        <div
          className={`
            absolute top-1 w-6 h-6 rounded-full
            transition-all duration-300 ease-in-out
            shadow-md
            ${checked ? "left-7 bg-white" : "left-1 bg-surface"}
          `}
        />
      </button>
    </div>
  );
}
