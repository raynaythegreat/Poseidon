"use client";

import { ReactNode, useEffect } from "react";

interface RotatingCardsButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "gold";
}

const colorSchemes = {
  cyan: { rgb: "142, 249, 252", from: "rgba(142, 249, 252, 0.2)", to: "rgba(142, 249, 252, 0.9)" },
  green: { rgb: "142, 252, 204", from: "rgba(142, 252, 204, 0.2)", to: "rgba(142, 252, 204, 0.9)" },
  lime: { rgb: "142, 252, 157", from: "rgba(142, 252, 157, 0.2)", to: "rgba(142, 252, 157, 0.9)" },
  yellow: { rgb: "215, 252, 142", from: "rgba(215, 252, 142, 0.2)", to: "rgba(215, 252, 142, 0.9)" },
  amber: { rgb: "252, 252, 142", from: "rgba(252, 252, 142, 0.2)", to: "rgba(252, 252, 142, 0.9)" },
  orange: { rgb: "252, 208, 142", from: "rgba(252, 208, 142, 0.2)", to: "rgba(252, 208, 142, 0.9)" },
  red: { rgb: "252, 142, 142", from: "rgba(252, 142, 142, 0.2)", to: "rgba(252, 142, 142, 0.9)" },
  pink: { rgb: "252, 142, 239", from: "rgba(252, 142, 239, 0.2)", to: "rgba(252, 142, 239, 0.9)" },
  purple: { rgb: "204, 142, 252", from: "rgba(204, 142, 252, 0.2)", to: "rgba(204, 142, 252, 0.9)" },
  blue: { rgb: "142, 202, 252", from: "rgba(142, 202, 252, 0.2)", to: "rgba(142, 202, 252, 0.9)" },
};

const cards = Object.values(colorSchemes);

export default function RotatingCardsButton({
  children,
  onClick,
  disabled = false,
  className = "",
  variant = "primary",
}: RotatingCardsButtonProps) {
  const variantColors = {
    primary: "from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400",
    secondary: "from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500",
    gold: "from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400",
  };

  // Inject animation keyframes on client-side only
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes rotating {
        from {
          transform: perspective(1000px) rotateX(-15deg) rotateY(0deg);
        }
        to {
          transform: perspective(1000px) rotateX(-15deg) rotateY(360deg);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-6 py-3 font-medium text-white rounded-none
        bg-gradient-to-r ${variantColors[variant]}
        shadow-lg hover:shadow-xl
        transform hover:scale-105 active:scale-95
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        overflow-hidden group
        ${className}
      `}
    >
      {/* Rotating cards background effect */}
      <div
        className={`
          absolute inset-0 pointer-events-none
          opacity-0 group-hover:opacity-30
          transition-opacity duration-500
        `}
        style={{
          animation: "rotating 8s linear infinite",
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
              className="absolute inset-0 rounded-none border-2 border-white/20"
              style={{
                background: `radial-gradient(circle, ${color.from} 0%, ${color.to} 80%, rgba(${color.rgb}, 0.95) 100%)`,
                transform: `rotateY(${(360 / cards.length) * index}deg) translateZ(40px)`,
                borderRadius: "8px",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <span className="relative z-10">{children}</span>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-none bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}
