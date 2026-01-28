"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface LovableChatPageLayoutProps {
  children: ReactNode;
}

export default function LovableChatPageLayout({ children }: LovableChatPageLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-3xl"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
