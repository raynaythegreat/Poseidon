# Lovable.dev-Style Chat Layout Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Poseidon's chat interface with a clean, minimal layout inspired by lovable.dev - consolidating headers, hiding chrome until needed, and focusing on the chat content.

**Architecture:** Single-page React component restructure. We'll consolidate the two-header layout into one minimal bar, move secondary controls into collapsible menus/popovers, and update the background gradient to match lovable.dev's dark aesthetic.

**Tech Stack:** Next.js 14.2.5 (App Router), React hooks, Tailwind CSS, TypeScript

---

## Task 1: Update Global CSS Background

**Files:**
- Modify: `app/globals.css:45-53`

**Step 1: Update body background gradient**

Replace the current subtle radial gradients with lovable.dev's dark gradient style:

```css
body {
  color: rgb(var(--foreground));
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 25%, #2d1b4e 50%, #1a1a3e 75%, #0f0f23 100%);
  background-attachment: fixed;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow-x: hidden;
}
```

**Step 2: Add animated pulse overlay**

Add after the body rule (around line 53):

```css
/* Animated pulse effect like lovable.dev */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent);
  animation: pulse-glow 8s ease-in-out infinite;
  pointer-events: none;
  z-index: -1;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
```

**Step 3: Update grid overlay to be more subtle**

Modify the grid overlay opacity (line 63-64):

```css
  background-image:
    linear-gradient(rgb(var(--grid-color) / 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgb(var(--grid-color) / 0.04) 1px, transparent 1px);
```

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: update background to lovable.dev style with animated pulse"
```

---

## Task 2: Create Minimal Header Component

**Files:**
- Create: `components/chat/MinimalChatHeader.tsx`

**Step 1: Create the minimal header component**

```tsx
"use client";

import { useState } from "react";
import RepoSelector from "./RepoSelector";

interface MinimalChatHeaderProps {
  selectedRepo: { id: number; name: string; full_name: string } | null;
  onRepoSelect: (repo: any) => void;
  modelInfo: { name: string; provider: string };
  onModelClick: () => void;
  onNewChat: () => void;
}

export default function MinimalChatHeader({
  selectedRepo,
  onRepoSelect,
  modelInfo,
  onModelClick,
  onNewChat,
}: MinimalChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative z-20 px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left: Logo/Brand */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Poseidon
          </h1>
          {selectedRepo && (
            <span className="text-sm text-white/60">/ {selectedRepo.name}</span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Model Selector - Minimal */}
          <button
            onClick={onModelClick}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white/80 hover:bg-white/15 transition-colors"
          >
            {modelInfo.name}
          </button>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
              aria-label="Menu"
            >
              <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-xl overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onNewChat();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Build to verify types**

Run: `npm run build`
Expected: TypeScript compiles successfully

**Step 3: Commit**

```bash
git add components/chat/MinimalChatHeader.tsx
git commit -m "feat: create minimal header component"
```

---

## Task 3: Create Floating Controls Popover

**Files:**
- Create: `components/chat/FloatingControls.tsx`

**Step 1: Create floating controls component**

This will house Plan/Build toggle, Auto button, and Deploy buttons - shown on demand:

```tsx
"use client";

interface FloatingControlsProps {
  chatMode: "plan" | "build";
  onChatModeChange: (mode: "plan" | "build") => void;
  autoApprove: boolean;
  onAutoApproveToggle: () => void;
  selectedRepo: any;
  onDeploy: (provider: "vercel" | "render") => void;
  isDeploying: boolean;
}

export default function FloatingControls({
  chatMode,
  onChatModeChange,
  autoApprove,
  onAutoApproveToggle,
  selectedRepo,
  onDeploy,
  isDeploying,
}: FloatingControlsProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xl">
      {/* Plan/Build Toggle */}
      <div className="inline-flex rounded-lg bg-white/5 p-0.5">
        <button
          onClick={() => onChatModeChange("plan")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            chatMode === "plan"
              ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-sm"
              : "text-white/60 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          Plan
        </button>
        <button
          onClick={() => onChatModeChange("build")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            chatMode === "build"
              ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-sm"
              : "text-white/60 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          Build
        </button>
      </div>

      {/* Auto Button */}
      <button
        onClick={onAutoApproveToggle}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
          autoApprove
            ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-sm"
            : "bg-white/10 text-white/80 hover:bg-white/15"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Auto
      </button>

      {/* Deploy Buttons - Only when repo selected */}
      {selectedRepo && (
        <>
          <button
            onClick={() => onDeploy("vercel")}
            disabled={isDeploying}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white/80 hover:bg-white/15 disabled:opacity-50 transition-colors"
          >
            Vercel
          </button>
          <button
            onClick={() => onDeploy("render")}
            disabled={isDeploying}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white/80 hover:bg-white/15 disabled:opacity-50 transition-colors"
          >
            Render
          </button>
        </>
      )}
    </div>
  );
}
```

**Step 2: Build to verify types**

Run: `npm run build`
Expected: TypeScript compiles successfully

**Step 3: Commit**

```bash
git add components/chat/FloatingControls.tsx
git commit -m "feat: create floating controls component"
```

---

## Task 4: Update ChatInterface to Use New Layout

**Files:**
- Modify: `components/chat/ChatInterface.tsx:4284-5000`

**Step 1: Add imports**

Add at the top with other imports (around line 30):

```tsx
import MinimalChatHeader from "@/components/chat/MinimalChatHeader";
import FloatingControls from "@/components/chat/FloatingControls";
```

**Step 2: Add state for controls visibility**

Add with other state declarations (around line 300):

```tsx
const [showFloatingControls, setShowFloatingControls] = useState(false);
```

**Step 3: Replace header section**

Replace the entire header section (lines 4286-4604) with:

```tsx
      {/* Minimal Header */}
      <MinimalChatHeader
        selectedRepo={selectedRepo}
        onRepoSelect={setSelectedRepo}
        modelInfo={modelInfo}
        onModelClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModelDropdown(!showModelDropdown);
        }}
        onNewChat={handleNewChat}
      />

      {/* Floating Controls - Toggle with keyboard shortcut */}
      {showFloatingControls && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
          <FloatingControls
            chatMode={chatMode}
            onChatModeChange={setChatMode}
            autoApprove={autoApprove}
            onAutoApproveToggle={() => {
              const nextAutoApprove = !autoApprove;
              setAutoApprove(nextAutoApprove);
              if (nextAutoApprove && chatMode === "plan" && pendingRepoChanges && !applyingRepoChanges) {
                void applyPendingRepoChanges();
              }
            }}
            selectedRepo={selectedRepo}
            onDeploy={(provider) => {
              if (provider === "vercel") {
                handleVercelDeploy();
              } else {
                handleRenderDeploy();
              }
            }}
            isDeploying={deployProgress !== undefined}
          />
        </div>
      )}
```

**Step 4: Add keyboard shortcut for controls**

Add to the keyboard handler (around line 1558):

```tsx
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "C") {
        setShowFloatingControls((prev) => !prev);
      }
```

**Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds (may have additional fixes needed)

**Step 6: Commit**

```bash
git add components/chat/ChatInterface.tsx
git commit -m "feat: integrate minimal header and floating controls"
```

---

## Task 5: Update Status Banners to be Less Prominent

**Files:**
- Modify: `components/chat/ChatInterface.tsx:4606-4693`

**Step 1: Consolidate status banners**

Replace individual status banners with a unified minimal status bar. Replace all the loading/error status divs (lines 4606-4693) with:

```tsx
      {/* Unified Status Bar */}
      {(ollamaLoading || groqLoading || openrouterLoading || fireworksLoading ||
        geminiLoading || openaiLoading || claudeLoading ||
        ollamaError || groqError || openrouterError || fireworksError ||
        geminiError || openaiError || claudeError ||
        (!providerConfigured && status)) && (
        <div className="px-4 py-2 bg-white/5 border-b border-white/10">
          <div className="max-w-4xl mx-auto text-xs text-white/70 text-center">
            {ollamaLoading && "Loading Ollama models..."}
            {groqLoading && "Loading Groq models..."}
            {openrouterLoading && "Loading OpenRouter models..."}
            {fireworksLoading && "Loading Fireworks models..."}
            {geminiLoading && "Loading Gemini models..."}
            {openaiLoading && "Loading OpenAI models..."}
            {claudeLoading && "Loading Claude models..."}
            {ollamaError && `Ollama: ${ollamaError}`}
            {groqError && `Groq: ${groqError}`}
            {openrouterError && `OpenRouter: ${openrouterError}`}
            {fireworksError && `Fireworks: ${fireworksError}`}
            {geminiError && `Gemini: ${geminiError}`}
            {openaiError && `OpenAI: ${openaiError}`}
            {claudeError && `Claude: ${claudeError}`}
            {!providerConfigured && status && `${modelInfo.name} needs a ${modelInfo.provider.toUpperCase()} API key`}
          </div>
        </div>
      )}
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/chat/ChatInterface.tsx
git commit -m "refactor: consolidate status banners into minimal unified bar"
```

---

## Task 6: Update ChatInput Styling

**Files:**
- Modify: `components/chat/ChatInput.tsx:90-156`

**Step 1: Update input container styling**

Replace the outer div className (line 91) to use lovable.dev-style glass morphism:

```tsx
    <div className="border-t border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-4 backdrop-blur-xl">
```

**Step 2: Update input box styling**

Replace the input box div className (line 148) to be more minimal:

```tsx
        <div
          className="flex items-end gap-2 bg-white/10 rounded-2xl border border-white/10 p-2 focus-within:ring-2 focus-within:ring-cyan-500/30 focus-within:border-cyan-500/50 transition-all"
```

**Step 3: Update attachment button styling**

Replace attachment button className (line 177) to match new aesthetic:

```tsx
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
```

**Step 4: Update placeholder text color**

Update textarea className (line 237) placeholder color:

```tsx
            className="flex-1 bg-transparent text-base md:text-sm text-white placeholder:text-white/40 resize-none focus:outline-none px-2 py-2 max-h-[200px]"
```

**Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add components/chat/ChatInput.tsx
git commit -m "style: update chat input to lovable.dev glass aesthetic"
```

---

## Task 7: Update MessageList Styling

**Files:**
- Modify: `components/chat/MessageList.tsx` (read first to find exact structure)

**Step 1: Read MessageList to understand structure**

Run: `head -100 components/chat/MessageList.tsx`
Note: This file may vary - adjust the following steps based on actual structure

**Step 2: Update message container background**

Find the main message container and update to use transparent/glass styling. Look for classes like `bg-surface` and replace with `bg-white/5` or remove background entirely.

**Step 3: Update message bubble styling**

Make user and AI message bubbles more subtle with glass morphism:
- User messages: `bg-gradient-to-r from-cyan-500/20 to-purple-500/20`
- AI messages: Transparent with subtle border

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add components/chat/MessageList.tsx
git commit -m "style: update message styling to match lovable.dev aesthetic"
```

---

## Task 8: Final Polish and Testing

**Step 1: Run full build**

Run: `npm run build`
Expected: Complete build with no errors

**Step 2: Test in development**

Run: `npm run dev`
Navigate to the app and verify:
- Background gradient appears with animated pulse
- Header is minimal and consolidated
- Floating controls work with Cmd+Shift+C
- Status banners are unified and subtle
- Chat input has glass morphism effect
- Messages are clean and minimal

**Step 3: Build Electron app**

Run: `npm run dist:mac`
Expected: Electron app builds successfully

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: final polish for lovable.dev-style layout redesign"
```

---

## Testing Checklist

After implementation, verify:
- [ ] Background gradient animation is smooth
- [ ] Header consolidates repo and model selection
- [ ] Floating controls toggle with keyboard shortcut
- [ ] All existing functionality still works (deploy, plan/build, etc.)
- [ ] Status messages are less intrusive
- [ ] Chat input has proper glass morphism
- [ ] Messages are clean and readable
- [ ] Build succeeds for both web and Electron
- [ ] No console errors in browser

---

## Notes

- The keyboard shortcut `Cmd+Shift+C` (or `Ctrl+Shift+C`) toggles the floating controls
- Status banners are now unified into a single bar to reduce chrome
- Model dropdown still uses createPortal for proper z-index
- All gradient colors use Tailwind's cyan/purple spectrum to match lovable.dev
- Glass morphism achieved with `bg-white/X` and `backdrop-blur` utilities
