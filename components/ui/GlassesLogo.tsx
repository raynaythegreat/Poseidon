"use client";

interface GlassesLogoProps {
  className?: string;
}

export default function GlassesLogo({ className }: GlassesLogoProps) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Trident shaft */}
      <path
        d="M32 8V56"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Crossbar */}
      <path
        d="M20 24H44"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Left prong */}
      <path
        d="M20 24V12C20 8 24 4 32 4"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center prong */}
      <path
        d="M32 24V4"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Right prong */}
      <path
        d="M44 24V12C44 8 40 4 32 4"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Decorative dots on prongs */}
      <circle cx="32" cy="8" r="2.5" fill="currentColor" />
      <circle cx="20" cy="14" r="2.5" fill="currentColor" />
      <circle cx="44" cy="14" r="2.5" fill="currentColor" />
    </svg>
  );
}
