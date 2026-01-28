"use client";

import { motion } from "framer-motion";
import { useUserSettings } from "@/contexts/UserSettingsContext";

export default function EpicHeroSection() {
  const { settings } = useUserSettings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-poseidon-ocean border border-poseidon-gold/30 p-12 md:p-20 text-center"
      style={{
        background: "linear-gradient(135deg, #0A1628 0%, #0D2137 50%, #006666 100%)",
      }}
    >
      {/* Animated wave pattern background */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            fill="#D4AF37"
            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Floating trident animation */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10 mb-8"
      >
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-poseidon-gold to-poseidon-gold-dark flex items-center justify-center shadow-2xl border border-poseidon-gold/40">
          <svg className="w-14 h-14 text-poseidon-deep-blue" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L10 8H14L12 2Z"/>
            <rect x="10" y="8" width="4" height="8" rx="0.5"/>
            <path d="M8 14Q6 16 4 20H7.5Q10 16 12 16V14Z"/>
            <path d="M16 14Q18 16 20 20H16.5Q14 16 12 16V14Z"/>
          </svg>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold mb-6"
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #20B2AA 50%, #D4AF37 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Unleash the Power of Poseidon
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-xl text-poseidon-pearl/80 mb-10 max-w-2xl mx-auto"
        >
          Let&apos;s build something epic, {settings.username}
        </motion.p>

        {/* Input field */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative bg-poseidon-deep-blue/50 backdrop-blur-xl rounded-2xl border border-poseidon-teal/30 overflow-hidden group focus-within:border-poseidon-gold/50 transition-colors">
            <input
              type="text"
              placeholder="Ask Poseidon to create a..."
              className="w-full px-6 py-5 bg-transparent text-poseidon-pearl placeholder:text-poseidon-pearl/40 focus:outline-none text-lg"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button className="p-3 hover:bg-poseidon-gold/10 rounded-xl transition-colors group/btn" title="Attach">
                <svg className="w-5 h-5 text-poseidon-teal group-hover/btn:text-poseidon-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button className="p-3 bg-gradient-to-r from-poseidon-coral to-poseidon-coral-light text-poseidon-pearl rounded-xl hover:brightness-110 transition-all shadow-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <button className="px-6 py-3 bg-poseidon-gold hover:bg-poseidon-gold-light text-poseidon-deep-blue rounded-xl text-sm font-semibold transition-all hover:scale-105 shadow-lg">
            Start Creating
          </button>
          <button className="px-6 py-3 bg-poseidon-teal/20 hover:bg-poseidon-teal/30 border border-poseidon-teal/40 text-poseidon-teal-light rounded-xl text-sm font-medium transition-all hover:scale-105">
            View Templates
          </button>
          <button className="px-6 py-3 bg-poseidon-deep-blue/50 hover:bg-poseidon-deep-blue/70 border border-poseidon-pearl/20 text-poseidon-pearl rounded-xl text-sm font-medium transition-all hover:scale-105">
            Documentation
          </button>
        </motion.div>
      </div>

      {/* Floating decorative elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-20 w-16 h-16 rounded-full bg-poseidon-gold/10 blur-xl"
      />
      <motion.div
        animate={{
          y: [0, 15, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-poseidon-teal/10 blur-xl"
      />
    </motion.div>
  );
}
