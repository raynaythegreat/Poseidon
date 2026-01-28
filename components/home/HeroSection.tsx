"use client";

import { useUserSettings } from "@/contexts/UserSettingsContext";
import { motion } from "framer-motion";

export default function HeroSection() {
  const { settings } = useUserSettings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-12 md:p-16 text-center"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Let's build something, {settings.username}
        </h1>

        {/* Input field */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <input
              type="text"
              placeholder="Ask Poseidon to create a..."
              className="w-full px-6 py-4 bg-transparent text-white placeholder-white/60 focus:outline-none text-lg"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Attach">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button className="p-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-colors border border-white/20">
            Attach
          </button>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-colors border border-white/20">
            Theme
          </button>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-colors border border-white/20">
            Plan
          </button>
        </div>
      </div>
    </motion.div>
  );
}
