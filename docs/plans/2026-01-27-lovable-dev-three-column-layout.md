# Lovable.dev-Style Three-Column Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Poseidon's chat interface into a three-column IDE layout matching lovable.dev: file tree (left) | chat (center) | preview/inspector (right), with a minimal top bar for controls.

**Architecture:** Complete layout restructure using CSS Grid/Flexbox for three-column responsive layout. Left sidebar (250px, collapsible) for repo file tree, center (flex-1) for chat messages, right sidebar (350px, collapsible) for code preview/file inspector. Minimal top bar (48px) with model selector, repo name, and key actions.

**Tech Stack:** React, Tailwind CSS, TypeScript, Next.js 14.2.5 (App Router)

---

## Task 1: Create New Layout Shell Component

**Files:**
- Create: `components/chat/ThreeColumnLayout.tsx`

**Step 1: Create the layout shell component**

```tsx
"use client";

import { useState } from "react";

interface ThreeColumnLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  topBar: React.ReactNode;
}

export default function ThreeColumnLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  topBar,
}: ThreeColumnLayoutProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white">
      {/* Minimal Top Bar - 48px */}
      <div className="h-12 border-b border-white/10 flex items-center px-4 bg-[#0a0a0f]">
        {topBar}
      </div>

      {/* Three Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - File Tree */}
        {!leftCollapsed && (
          <div className="w-64 border-r border-white/10 flex-shrink-0 overflow-y-auto bg-[#0f0f15]">
            {leftPanel}
          </div>
        )}

        {/* Left Collapse Toggle */}
        <button
          onClick={() => setLeftCollapsed(!leftCollapsed)}
          className="w-6 h-6 flex items-center justify-center hover:bg-white/5 border-l border-r border-white/10 flex-shrink-0"
        >
          <svg className="w-3 h-3 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {leftCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>

        {/* Center Panel - Chat */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {centerPanel}
        </div>

        {/* Right Collapse Toggle */}
        <button
          onClick={() => setRightCollapsed(!rightCollapsed)}
          className="w-6 h-6 flex items-center justify-center hover:bg-white/5 border-l border-r border-white/10 flex-shrink-0"
        >
          <svg className="w-3 h-3 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {rightCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            )}
          </svg>
        </button>

        {/* Right Panel - Preview/Inspector */}
        {!rightCollapsed && (
          <div className="w-80 border-l border-white/10 flex-shrink-0 overflow-y-auto bg-[#0f0f15]">
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Build to verify**

Run: `npm run build`
Expected: TypeScript compiles successfully

**Step 3: Commit**

```bash
git add components/chat/ThreeColumnLayout.tsx
git commit -m "feat: create three-column layout shell component"
```

---

## Task 2: Create Minimal Top Bar Component

**Files:**
- Create: `components/chat/MinimalTopBar.tsx`

**Step 1: Create the top bar component**

```tsx
"use client";

import { useState } from "react";

interface MinimalTopBarProps {
  selectedRepo: { id: number; name: string; full_name: string } | null;
  modelInfo: { name: string; provider: string };
  onRepoClick: () => void;
  onModelClick: () => void;
  onNewChat: () => void;
}

export default function MinimalTopBar({
  selectedRepo,
  modelInfo,
  onRepoClick,
  onModelClick,
  onNewChat,
}: MinimalTopBarProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left: Logo and Repo */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
          Poseidon
        </h1>
        {selectedRepo && (
          <button
            onClick={onRepoClick}
            className="text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            {selectedRepo.name}
          </button>
        )}
      </div>

      {/* Center: Model Selector */}
      <button
        onClick={onModelClick}
        className="px-3 py-1 text-xs rounded-md bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white/90 transition-all"
      >
        {modelInfo.name}
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-white/80 transition-colors"
          title="New chat"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-white/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl z-50">
              <div className="p-2 border-b border-white/10">
                <div className="text-xs text-white/50 px-2 py-1">MODE</div>
                <div className="flex gap-1 p-1">
                  <button className="flex-1 px-2 py-1 text-xs rounded bg-white/10 text-white">Plan</button>
                  <button className="flex-1 px-2 py-1 text-xs rounded text-white/60 hover:text-white">Build</button>
                </div>
              </div>
              <div className="p-2">
                <button className="w-full px-2 py-1.5 text-xs text-left text-white/70 hover:bg-white/5 rounded flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Auto-approve
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Build to verify**

Run: `npm run build`
Expected: TypeScript compiles successfully

**Step 3: Commit**

```bash
git add components/chat/MinimalTopBar.tsx
git commit -m "feat: create minimal top bar component"
```

---

## Task 3: Create File Tree Sidebar Component

**Files:**
- Create: `components/chat/FileTreeSidebar.tsx`

**Step 1: Create the file tree component**

```tsx
"use client";

import { useState } from "react";

interface FileNode {
  path: string;
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
}

interface FileTreeSidebarProps {
  files?: FileNode[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  repoName?: string | null;
}

export default function FileTreeSidebar({
  files,
  selectedFile,
  onFileSelect,
  repoName,
}: FileTreeSidebarProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderFile = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer transition-colors ${
            isSelected
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
          onClick={() => {
            if (node.type === "directory") {
              toggleDir(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
        >
          {node.type === "directory" ? (
            <>
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="truncate">{node.name}</span>
            </>
          ) : (
            <>
              <div className="w-4" />
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{node.name}</span>
            </>
          )}
        </div>
        {node.type === "directory" && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderFile(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="text-xs font-medium text-white/50 uppercase tracking-wide">
          Explorer
        </div>
        {repoName && (
          <div className="text-sm text-white/80 mt-1 truncate">{repoName}</div>
        )}
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {files && files.length > 0 ? (
          files.map((file) => renderFile(file))
        ) : (
          <div className="px-3 py-4 text-sm text-white/40 text-center">
            No repository selected
          </div>
        )}
      </div>

      {/* Footer - Quick Actions */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button className="w-full px-3 py-2 text-xs text-left text-white/60 hover:bg-white/5 rounded-md transition-colors flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload File
        </button>
        <button className="w-full px-3 py-2 text-xs text-left text-white/60 hover:bg-white/5 rounded-md transition-colors flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New File
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Build to verify**

Run: `npm run build`
Expected: TypeScript compiles successfully

**Step 3: Commit**

```bash
git add components/chat/FileTreeSidebar.tsx
git commit -m "feat: create file tree sidebar component"
```

---

## Task 4: Create Preview Panel Component

**Files:**
- Create: `components/chat/PreviewPanel.tsx`

**Step 1: Create the preview panel component**

```tsx
"use client";

interface PreviewPanelProps {
  selectedFile: string | null;
  fileContent?: string;
  fileType?: string;
}

export default function PreviewPanel({
  selectedFile,
  fileContent,
  fileType,
}: PreviewPanelProps) {
  const getLanguageFromPath = (path: string) => {
    const ext = path.split(".").pop();
    const langMap: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TypeScript",
      js: "JavaScript",
      jsx: "JavaScript",
      py: "Python",
      rs: "Rust",
      go: "Go",
      java: "Java",
      cpp: "C++",
      c: "C",
      css: "CSS",
      html: "HTML",
      json: "JSON",
      md: "Markdown",
      yaml: "YAML",
      yml: "YAML",
    };
    return langMap[ext || ""] || "Text";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="text-xs font-medium text-white/50 uppercase tracking-wide mb-1">
          Inspector
        </div>
        {selectedFile && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/80 truncate flex-1" title={selectedFile}>
              {selectedFile.split("/").pop()}
            </div>
            <div className="text-xs text-white/40 ml-2">
              {getLanguageFromPath(selectedFile)}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedFile ? (
          <div className="h-full flex items-center justify-center text-sm text-white/40">
            Select a file to preview
          </div>
        ) : fileContent ? (
          <pre className="p-4 text-sm text-white/80 font-mono whitespace-pre-wrap">
            {fileContent}
          </pre>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/40">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-sm">File content not loaded</div>
          </div>
        )}
      </div>

      {/* Footer - File Stats */}
      {selectedFile && (
        <div className="p-3 border-t border-white/10">
          <div className="text-xs text-white/40">
            {fileContent ? `${fileContent.split("\n").length} lines` : "Binary file"}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Build to verify**

Run: `npm run build`
Expected: TypeScript compiles successfully

**Step 3: Commit**

```bash
git add components/chat/PreviewPanel.tsx
git commit -m "feat: create preview panel component"
```

---

## Task 5: Update ChatInterface to Use New Three-Column Layout

**Files:**
- Modify: `components/chat/ChatInterface.tsx:1-100`

**Step 1: Add new imports at top of file**

```tsx
import ThreeColumnLayout from "@/components/chat/ThreeColumnLayout";
import MinimalTopBar from "@/components/chat/MinimalTopBar";
import FileTreeSidebar from "@/components/chat/FileTreeSidebar";
import PreviewPanel from "@/components/chat/PreviewPanel";
```

**Step 2: Add state for selected file and file tree**

Find the state declarations (around line 300) and add:

```tsx
const [selectedFile, setSelectedFile] = useState<string | null>(null);
const [fileTree, setFileTree] = useState<any[]>([]);
```

**Step 3: Replace the entire return statement**

Find the main return statement (starts with `return (` around line 4290) and replace the entire JSX with:

```tsx
  return (
    <ThreeColumnLayout
      topBar={
        <MinimalTopBar
          selectedRepo={selectedRepo}
          modelInfo={modelInfo}
          onRepoClick={() => {/* Show repo selector */}}
          onModelClick={() => {
            setShowModelDropdown(!showModelDropdown);
          }}
          onNewChat={handleNewChat}
        />
      }
      leftPanel={
        <FileTreeSidebar
          files={fileTree}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          repoName={selectedRepo?.name}
        />
      }
      centerPanel={
        <div className="flex flex-col h-full">
          {/* Status bar */}
          {(ollamaLoading || groqLoading || openrouterLoading || fireworksLoading ||
            geminiLoading || openaiLoading || claudeLoading ||
            !providerConfigured) && status && (
            <div className="px-4 py-2 bg-white/5 border-b border-white/10">
              <div className="text-xs text-white/70 text-center">
                {ollamaLoading && "Loading Ollama models..."}
                {groqLoading && "Loading Groq models..."}
                {openrouterLoading && "Loading OpenRouter models..."}
                {fireworksLoading && "Loading Fireworks models..."}
                {geminiLoading && "Loading Gemini models..."}
                {openaiLoading && "Loading OpenAI models..."}
                {claudeLoading && "Loading Claude models..."}
                {!providerConfigured && `${modelInfo.name} needs a ${modelInfo.provider.toUpperCase()} API key`}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-3xl mx-auto">
              <MessageList
                messages={messages}
                isLoading={isLoading}
                repoName={selectedRepo?.name}
                onTemplateSelect={(prompt) => {
                  setValue(prompt);
                  handleSubmit();
                }}
                chatMode={chatMode}
              />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-4">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                value={value}
                onChange={setValue}
                onSubmit={handleSubmit}
                onStop={handleStop}
                textareaRef={textareaRef}
                attachments={pendingAttachments}
                onFilesSelected={handleFileSelect}
                onRemoveAttachment={removeAttachment}
                onOpenImageGenerator={() => setShowImageGenerator(true)}
                onOpenImageHistory={() => setShowImageHistory(true)}
                disabled={disabled}
                loading={isLoading}
                placeholder="What would you like to build?"
              />
            </div>
          </div>
        </div>
      }
      rightPanel={
        <PreviewPanel
          selectedFile={selectedFile}
          fileContent={/* Get file content from repo context */}
        />
      }
    />
  );
```

**Step 4: Add model dropdown portal**

After the ThreeColumnLayout closing tag, add:

```tsx
  {/* Model Dropdown Portal */}
  {modelDropdown &&
    (isClient
      ? createPortal(modelDropdown, document.body)
      : modelDropdown)}
```

**Step 5: Keep all existing modals after the layout**

After the model dropdown portal, add back all the modal components:

```tsx
    <ImageGeneratorModal
      isOpen={showImageGenerator}
      onClose={() => setShowImageGenerator(false)}
      onGenerate={handleImageGenerate}
    />

    {showImageHistory && (
      <ImageHistoryPanel
        onClose={() => setShowImageHistory(false)}
      />
    )}

    <ApiUsageDisplay />

    <NotificationPanel />
```

**Step 6: Build and verify**

Run: `npm run build`
Expected: Build succeeds (may need additional fixes)

**Step 7: Commit**

```bash
git add components/chat/ChatInterface.tsx
git commit -m "feat: integrate three-column layout into ChatInterface"
```

---

## Task 6: Update Global Styling for Dark Theme

**Files:**
- Modify: `app/globals.css:45-70`

**Step 1: Update body and background styles**

Replace the body styles with:

```css
body {
  color: rgb(var(--foreground));
  background: #0a0a0f;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow: hidden;
}

/* Remove old grid overlay */
body::before {
  display: none;
}

/* Remove old pulse effect */
body::after {
  display: none;
}
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: update global styles for three-column dark theme"
```

---

## Task 7: Update MessageList for Center Column

**Files:**
- Modify: `components/chat/MessageList.tsx:31-136`

**Step 1: Update message bubble styles for center column**

Find the MessageBubble component and update the bubble styling:

```tsx
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 ${
          message.role === "user"
            ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-white/90 ml-auto"
            : "bg-white/5 border border-white/10 text-white/90"
        }`}
      >
```

**Step 2: Update template cards styling**

Find the template button styling and update:

```tsx
                className="group relative px-4 py-4 text-left bg-white/5 border border-white/10 hover:border-pink-500/50 rounded-2xl transition-all duration-200"
```

**Step 3: Update text colors**

Replace all `text-ink` with `text-white/90` and `text-ink-muted` with `text-white/60`.

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add components/chat/MessageList.tsx
git commit -m "style: update message styles for three-column layout"
```

---

## Task 8: Update ChatInput for Bottom Placement

**Files:**
- Modify: `components/chat/ChatInput.tsx:90-280`

**Step 1: Update container for bottom placement**

Replace the outer div with:

```tsx
    <div className="border-t border-white/10 bg-white/5 p-4">
```

**Step 2: Update input box styling**

Replace the input box div with:

```tsx
        <div
          className="flex items-end gap-2 bg-white/10 rounded-2xl border border-white/10 p-2 focus-within:ring-2 focus-within:ring-pink-500/30 focus-within:border-pink-500/50 transition-all"
```

**Step 3: Update all text colors to white variants**

Replace `text-ink` with `text-white/90`, `text-ink-muted` with `text-white/60`, `text-ink-subtle` with `text-white/50`.

**Step 4: Update attachment styling**

Replace rounded-none with rounded-xl for attachments.

**Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add components/chat/ChatInput.tsx
git commit -m "style: update chat input for three-column layout"
```

---

## Task 9: Add File Context Loading Logic

**Files:**
- Modify: `components/chat/ChatInterface.tsx:500-700`

**Step 1: Add effect to load file tree when repo selected**

Find the effects section and add:

```tsx
  // Load file tree when repo selected
  useEffect(() => {
    if (!selectedRepo) {
      setFileTree([]);
      return;
    }

    const loadFileTree = async () => {
      try {
        const response = await fetch(
          `/api/github/repos/${selectedRepo.full_name}/structure`
        );
        if (response.ok) {
          const structure = await response.json();
          // Convert structure to FileNode format
          const buildTree = (path: string, nodes: any[]): any[] => {
            return nodes.map((node) => ({
              path: node.path,
              name: node.name || node.path.split("/").pop(),
              type: node.type === "tree" ? "directory" : "file",
              children: node.children ? buildTree(node.path, node.children) : undefined,
            }));
          };
          setFileTree(buildTree("", structure || []));
        }
      } catch (error) {
        console.error("Failed to load file tree:", error);
      }
    };

    loadFileTree();
  }, [selectedRepo]);
```

**Step 2: Add effect to load file content when file selected**

Add after the previous effect:

```tsx
  // Load file content when file selected
  useEffect(() => {
    if (!selectedFile || !selectedRepo) return;

    const loadFileContent = async () => {
      try {
        const response = await fetch(
          `/api/github/repos/${selectedRepo.full_name}/files?path=${encodeURIComponent(selectedFile)}`
        );
        if (response.ok) {
          const data = await response.json();
          // Store file content for preview panel
          setFileContent(data.content);
        }
      } catch (error) {
        console.error("Failed to load file content:", error);
      }
    };

    loadFileContent();
  }, [selectedFile, selectedRepo]);
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add components/chat/ChatInterface.tsx
git commit -m "feat: add file tree and content loading logic"
```

---

## Task 10: Final Polish and Testing

**Step 1: Run full build**

Run: `npm run build`
Expected: Complete build with no errors

**Step 2: Test in development**

Run: `npm run dev`
Navigate to the app and verify:
- Three-column layout displays correctly
- Left sidebar shows file tree when repo selected
- Center column shows chat messages with input at bottom
- Right sidebar shows file preview when file selected
- Collapse toggles work for both sidebars
- Top bar is minimal and functional
- All existing features still work (model selection, chat, deploy, etc.)

**Step 3: Build Electron app**

Run: `npm run dist:mac`
Expected: Electron app builds successfully with new layout

**Step 4: Update app in Applications**

Run:
```bash
rm -rf /Applications/Poseidon.app
cp -R dist/mac/Poseidon.app /Applications/
```

**Step 5: Final commit**

```bash
git add .
git commit -m "chore: final polish for three-column lovable.dev layout"
```

---

## Testing Checklist

After implementation, verify:
- [ ] Three-column layout renders correctly (file tree | chat | preview)
- [ ] Left sidebar collapsible with toggle button
- [ ] Right sidebar collapsible with toggle button
- [ ] File tree displays repo structure when selected
- [ ] File selection shows content in preview panel
- [ ] Chat input at bottom of center column
- [ ] Minimal top bar with all controls
- [ ] Model dropdown still works
- [ ] Plan/Build mode toggle accessible
- [ ] All deploy functionality still works
- [ ] Dark theme consistent across all panels
- [ ] Responsive on smaller screens (sidebars collapse)
- [ ] No console errors in browser
- [ ] Build succeeds for both web and Electron
