"use client";

interface TridentLogoProps {
  className?: string;
}

export default function TridentLogo({ className }: TridentLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Poseidon's trident mark (clean + recognizable at small sizes) */}
      {/* Shaft */}
      <path
        d="M50 90V26"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Prongs */}
      <path
        d="M50 26V12"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M50 30C46 22 42 17 36 14V12"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50 30C54 22 58 17 64 14V12"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Spear tips */}
      <path d="M50 6L44 16L50 13L56 16Z" fill="currentColor" />
      <path d="M36 8L32 16L36 14L40 16Z" fill="currentColor" />
      <path d="M64 8L60 16L64 14L68 16Z" fill="currentColor" />

      {/* Side barbs */}
      <path
        d="M36 18L28 14"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M64 18L72 14"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Pommel */}
      <path
        d="M40 90H60"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
