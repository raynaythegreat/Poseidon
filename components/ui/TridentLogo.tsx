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
      {/* Trident design - central prong and two side prongs with barbs */}
      {/* Main shaft */}
      <path
        d="M50 10 L50 65"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Left prong with barb */}
      <path
        d="M50 30 L30 15 M50 45 L35 35"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right prong with barb */}
      <path
        d="M50 30 L70 15 M50 45 L65 35"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center decorative element */}
      <circle cx="50" cy="55" r="4" fill="currentColor" />
      {/* Bottom crossbar */}
      <path
        d="M40 75 L60 75"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Bottom tines */}
      <path
        d="M45 75 L40 90 M50 75 L50 92 M55 75 L60 90"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
