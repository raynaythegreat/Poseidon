"use client";

interface TridentLogoProps {
  className?: string;
}

/**
 * Poseidon Trident Logo - Bold Greek Mythology Design
 *
 * Design principles:
 * - Filled shapes for boldness and small-size visibility
 * - Circular medallion container (ancient coin/seal motif)
 * - Ornate wave flourishes (sea god symbolism)
 * - Sharp geometric precision (Greek aesthetic)
 * - Uses currentColor for theme compatibility
 */
export default function TridentLogo({ className }: TridentLogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circular medallion border - Greek key inspired */}
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle
        cx="60"
        cy="60"
        r="48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Decorative wave elements - left side */}
      <path
        d="M12 60 Q 8 52 12 44 Q 16 52 12 60 Z"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M12 68 Q 8 76 12 84 Q 16 76 12 68 Z"
        fill="currentColor"
        opacity="0.8"
      />

      {/* Decorative wave elements - right side */}
      <path
        d="M108 60 Q 112 52 108 44 Q 104 52 108 60 Z"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M108 68 Q 112 76 108 84 Q 104 76 108 68 Z"
        fill="currentColor"
        opacity="0.8"
      />

      {/* Main trident shaft - filled, not stroked */}
      <rect x="55" y="38" width="10" height="54" rx="1" />

      {/* Pommel - decorative base */}
      <path d="M 46 92 L 60 86 L 74 92 L 74 98 L 46 98 Z" />

      {/* Center prong - bold filled shape */}
      <path d="M 55 38 L 55 16 L 60 8 L 65 16 L 65 38 Z" />

      {/* Left prong - curved outward with ornate barb */}
      <path
        d="M 55 32 Q 50 24 42 18 L 40 12 L 46 14 Q 52 18 56 26 Z"
        fill="currentColor"
      />
      {/* Left barb - decorative flourish */}
      <path
        d="M 42 20 Q 32 18 26 22 L 24 20 Q 30 14 42 16 Z"
        fill="currentColor"
      />

      {/* Right prong - curved outward with ornate barb */}
      <path
        d="M 65 32 Q 70 24 78 18 L 80 12 L 74 14 Q 68 18 64 26 Z"
        fill="currentColor"
      />
      {/* Right barb - decorative flourish */}
      <path
        d="M 78 20 Q 88 18 94 22 L 96 20 Q 90 14 78 16 Z"
        fill="currentColor"
      />

      {/* Spear tips - sharp geometric points */}
      <path d="M 60 6 L 56 14 L 60 12 L 64 14 Z" />
      <path d="M 42 10 L 39 16 L 42 14 L 46 16 Z" />
      <path d="M 78 10 L 74 16 L 78 14 L 81 16 Z" />

      {/* Decorative dots - Greek inspired */}
      <circle cx="60" cy="48" r="2" />
      <circle cx="60" cy="56" r="1.5" />
      <circle cx="60" cy="63" r="1" />
    </svg>
  );
}
