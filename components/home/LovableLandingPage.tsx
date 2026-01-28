"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  { label: "Design", href: "/frontend-design" },
  { label: "UI/UX", href: "/frontend-ui-ux" },
  { label: "Brainstorm", href: "/superpowers:brainstorm" },
  { label: "Write Plan", href: "/superpowers:write-plan" },
];

export default function LovableLandingPage() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    if (input.trim()) {
      router.push(`/chat?prompt=${encodeURIComponent(input)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Minimal Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 100 100" fill="none" className="w-5 h-5 text-white dark:text-black">
                <path d="M50 15 L50 65" stroke="currentColor" strokeWidth="6" strokeLinecap="square"/>
                <path d="M50 30 L28 15 M50 45 L35 35" stroke="currentColor" strokeWidth="5" strokeLinecap="square"/>
                <path d="M50 30 L72 15 M50 45 L65 35" stroke="currentColor" strokeWidth="5" strokeLinecap="square"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Poseidon</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section - Lovable.dev Style */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-3xl"
        >
          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-center text-gray-900 dark:text-white mb-8 leading-tight">
            Ship apps
            <br />
            <span className="text-gray-400 dark:text-gray-600">with the speed of thought.</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">
            Describe what you want to build. Poseidon handles the rest — from planning to deployment.
          </p>

          {/* Chat Input - Lovable.dev Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Describe the app you want to build..."
                className="w-full px-6 py-5 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none text-lg min-h-[140px]"
                rows={5}
              />

              {/* Bottom Toolbar */}
              <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex items-center gap-2">
                  {/* Model Selector */}
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Claude 3.5</span>
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Generate</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20 -z-10" />
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-3 mt-8 flex-wrap"
          >
            {["Web Apps", "Mobile Apps", "APIs", "Databases", "UI Components"].map((feature) => (
              <span
                key={feature}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-full text-sm text-gray-600 dark:text-gray-400"
              >
                {feature}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Social Proof - Optional */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-gray-400 dark:text-gray-600">
            Powered by Claude • No credit card required
          </p>
        </motion.div>
      </div>
    </div>
  );
}
