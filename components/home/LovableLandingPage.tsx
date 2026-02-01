"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { useChatHistory } from "@/contexts/ChatHistoryContext";
import TridentLogo from "@/components/ui/TridentLogo";

const navItems = [
  { label: "Repos", id: "repos" },
  { label: "Deploy", id: "deploy" },
  { label: "History", id: "history" },
  { label: "Settings", id: "settings" },
];

export default function LovableLandingPage() {
  const router = useRouter();
  const { clearCurrentSession } = useChatHistory();
  const { settings } = useUserSettings();

  const handleGetStarted = () => {
    clearCurrentSession();
    router.push("/?tab=chat");
  };

  const handleNavClick = (tabId: string) => {
    router.push(`/?tab=${tabId}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col overflow-y-auto">
      {/* Minimal Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <TridentLogo className="w-5 h-5 text-white dark:text-black" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Poseidon</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl text-center"
        >
          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
            Build software
            <br />
            <span className="text-gray-400 dark:text-gray-600">at the speed of thought.</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Your AI-powered development companion. From idea to deployment — Poseidon helps you plan, code, debug, and ship faster than ever.
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <button
              onClick={handleGetStarted}
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-lg transition-all hover:opacity-90 hover:scale-105"
            >
              <span>Get Started</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={() => handleNavClick("settings")}
              className="flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-lg transition-all hover:border-gray-300 dark:hover:border-gray-700 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Configure</span>
            </button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-3 mt-12 flex-wrap"
          >
            {["AI-Powered", "GitHub Integrated", "Multi-Provider", "Local & Private", "One-Click Deploy"].map((feature) => (
              <span
                key={feature}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-full text-sm text-gray-600 dark:text-gray-400"
              >
                {feature}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-32 w-full max-w-5xl"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            How it works
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            From initial idea to deployed application in four simple steps
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Describe",
                description: "Tell Poseidon what you want to build in plain English. Use /brainstorm to explore ideas or /plan for detailed implementation guides.",
              },
              {
                step: "02",
                title: "Generate",
                description: "Watch as AI generates clean, production-ready code. Ask questions, request changes, and iterate in real-time.",
              },
              {
                step: "03",
                title: "Integrate",
                description: "Connect your GitHub repository and apply changes directly. Poseidon creates branches, makes commits, and handles pull requests.",
              },
              {
                step: "04",
                title: "Deploy",
                description: "One-click deployment to Vercel or Render. Your application is live and ready for users in minutes.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + (index * 0.1) }}
                className="relative"
              >
                <div className="text-5xl font-bold text-gray-200 dark:text-gray-800 absolute -top-4 -left-2 -z-10">
                  {item.step}
                </div>
                <div className="relative p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 h-full">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-32 w-full max-w-5xl"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Powerful features
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Everything you need to build modern applications
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: "AI-Powered Chat",
                description: "Chat with Claude, GPT-4, Gemini, and more. Generate code, debug issues, and get explanations in real-time.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                ),
                title: "GitHub Integration",
                description: "Connect your repositories and apply changes directly. Create branches, make commits, and manage pull requests.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                ),
                title: "One-Click Deploy",
                description: "Deploy to Vercel or Render with a single click. Automatic builds, previews, and production rollouts.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Skills System",
                description: "Use slash commands like /brainstorm, /plan, /explain for specialized AI workflows and faster development.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "Local & Private",
                description: "Run entirely locally with Ollama. Your code never leaves your machine. Full privacy and control.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                ),
                title: "Multi-Provider",
                description: "Choose from Claude, OpenAI, Groq, Gemini, Fireworks, Ollama, or add your own OpenAI-compatible provider.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 + (index * 0.1) }}
                className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-black dark:bg-white rounded-lg text-white dark:text-black">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Use Cases Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-32 w-full max-w-5xl"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Built for developers
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Whether you&apos;re a startup, agency, or solo developer
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Rapid Prototyping",
                description: "Go from idea to working prototype in minutes. Perfect for hackathons, MVPs, and proof-of-concepts.",
                examples: ["Landing pages", "Dashboards", "APIs", "Microservices"],
              },
              {
                title: "Learning & Exploration",
                description: "Understand new technologies and patterns. Ask questions, get explanations, and see code examples.",
                examples: ["New frameworks", "Best practices", "Code patterns", "Debugging"],
              },
              {
                title: "Productivity Boost",
                description: "Automate repetitive tasks and accelerate development. Focus on what matters most.",
                examples: ["Boilerplate generation", "Refactoring", "Testing", "Documentation"],
              },
              {
                title: "Collaboration",
                description: "Work seamlessly with your team. Share conversations, sync with GitHub, and deploy together.",
                examples: ["Code reviews", "Pair programming", "Knowledge sharing", "Onboarding"],
              },
            ].map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.5 + (index * 0.1) }}
                className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {useCase.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {useCase.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {useCase.examples.map((example) => (
                    <span
                      key={example}
                      className="px-3 py-1 bg-white dark:bg-black rounded-full text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          className="mt-32 w-full max-w-4xl text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Works with your stack
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Poseidon supports all major frameworks, languages, and platforms
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 opacity-60">
            {["React", "Next.js", "Vue", "Svelte", "Node.js", "Python", "TypeScript", "Go", "Rust", "PostgreSQL", "MongoDB", "Redis"].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.0 }}
          className="mt-32 w-full max-w-3xl text-center"
        >
          <div className="p-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to build faster?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of developers shipping better software with AI.
            </p>
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-lg transition-all hover:opacity-90 hover:scale-105"
            >
              <span>Start Building</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.2 }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-gray-400 dark:text-gray-600">
            Powered by Claude • GitHub Integration • One-Click Deployment
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-700 mt-2">
            Open source • Private by default • Built for developers
          </p>
        </motion.div>
      </div>
    </div>
  );
}
