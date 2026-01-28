"use client";

import { useProjectSync } from "@/lib/projectSync";

/**
 * Component that enables automatic project creation from chat sessions.
 * This should be placed within the providers tree.
 */
export default function ProjectSyncProvider() {
  useProjectSync();
  return null;
}
