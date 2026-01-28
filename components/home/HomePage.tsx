"use client";

import { motion } from "framer-motion";
import EpicHeroSection from "./EpicHeroSection";

export default function HomePage() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "AI-Powered Chat",
      description: "Natural conversation interface for generating code and solving problems",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      title: "Code Generation",
      description: "Generate, modify, and understand code with intelligent assistance",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      title: "Deploy Anywhere",
      description: "Ship your projects to Vercel, Railway, Koyeb, and more",
    },
  ];

  return (
    <div className="min-h-dvh bg-poseidon-deep-blue">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <EpicHeroSection />
      </div>

      {/* Floating Feature Cards */}
      <div className="container mx-auto px-4 pb-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="relative group"
            >
              <div className="relative h-full bg-poseidon-ocean border border-poseidon-teal/20 rounded-2xl p-6 transition-all duration-300 hover:border-poseidon-gold/40 hover:shadow-2xl hover:shadow-poseidon-gold/10">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-poseidon-gold/0 to-poseidon-teal/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-poseidon-gold/10 flex items-center justify-center mb-4 group-hover:bg-poseidon-gold/20 transition-colors">
                    <div className="text-poseidon-gold">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-poseidon-pearl mb-2">{feature.title}</h3>
                  <p className="text-sm text-poseidon-pearl/70 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
