"use client";

import HeroSection from "./HeroSection";
import ProjectCardsSection from "./ProjectCardsSection";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <HeroSection />
      <ProjectCardsSection />
    </div>
  );
}
