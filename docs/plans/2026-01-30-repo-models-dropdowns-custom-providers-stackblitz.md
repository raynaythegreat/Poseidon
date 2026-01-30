# Landing Page Dropdowns, Custom Providers & StackBlitz Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix repo and models buttons on landing page to show dropdowns, add custom provider routing, classify providers by type, integrate StackBlitz preview, remove Nanobanana/Ideogram, auto-restart dev server on API key save.

**Architecture:**
- Replace navigation buttons with dropdown components (RepoSelector, ModelDropdown)
- Add provider category classification in Settings page
- Create StackBlitz preview component that fetches code from GitHub
- Add auto-restart logic to API key save endpoint
- Remove unsupported providers from env mapping and statusItems

**Tech Stack:**
- Next.js 14 App Router
- React hooks (useState, useEffect)
- StackBlitz iframe API (embed mode)
- Process spawning for dev server restart
- Context API for state management

---

## Part 1: Fix Landing Page Dropdowns

### Task 1: Update Landing Page with Repo Selector

**Files:**
- Modify: `/Users/ray/Documents/Poseidon/components/home/LovableLandingPage.tsx:112-121`

**Step 1: Import RepoSelector component**

```tsx
import RepoSelector from "@/components/chat/RepoSelector";
import ModelDropdown from "@/components/chat/ModelDropdown";
```

**Step 2: Add state for selected repo and model**

```tsx
// Add these useState declarations after existing useState (line 20)
const [selectedRepo, setSelectedRepo] = useState<any>(null);
const [selectedModel, setSelectedModel] = useState<any>(null);
```

**Step 3: Replace "Select Repo" button with RepoSelector (lines 112-121)**

```tsx
<RepoSelector
  selectedRepo={selectedRepo}
  onSelect={setSelectedRepo}
/>
```

**Step 4: Replace "Models" button with ModelDropdown**

Find the Models button at lines 124-133 and replace with:

```tsx
<div className="flex items-center gap-2">
  {/* Model Selector - Shows dropdown of available models */}
  <ModelDropdown
    modelInfo={selectedModel || { name: "Claude 3.5 Sonnet", provider: "Claude" }}
    models={[
      { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Claude", description: "Best all-around" },
      { id: "gpt-4", name: "GPT-4", provider: "OpenAI", description: "Most capable" },
      { id: "llama-3", name: "Llama 3", provider: "Ollama", description: "Local option" },
    ]}
    onSelect={setSelectedModel}
  />
</div>
```

**Step 5: Test the changes**

1. Run: `npm run dev`
2. Open http://localhost:1998
3. Click "Select Repo" → should show GitHub repos dropdown
4. Click "Models" → should show model selection dropdown
5. Verify repos load and model selection works

**Step 6: Commit**

```bash
git add components/home/LovableLandingPage.tsx
git commit -m "feat: add repo and model dropdowns to landing page"
```

---

### Task 2: Add Model List Fetching

**Files:**
- Create: `/Users/ray/Documents/Poseidon/app/api/models/route.ts`

**Step 1: Create models API endpoint**

```tsx
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get providers from environment
    const providers = {
      claude: process.env.ANTHROPIC_API_KEY ? true : false,
      openai: process.env.OPENAI_API_KEY ? true : false,
      groq: process.env.GROQ_API_KEY ? true : false,
      openrouter: process.env.OPENROUTER_API_KEY ? true : false,
      fireworks: process.env.FIREWORKS_API_KEY ? true : false,
      gemini: process.env.GEMINI_API_KEY ? true : false,
      ollama: process.env.OLLAMA_BASE_URL ? true : false,
    };

    const models = {
      claude: [
        { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Claude", description: "Best all-around model" },
        { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Claude", description: "Most powerful" },
        { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "Claude", description: "Fast and affordable" },
      ],
      openai: [
        { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI", description: "Most capable" },
        { id: "gpt-4", name: "GPT-4", provider: "OpenAI", description: "Standard GPT-4" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI", description: "Fast and cheap" },
      ],
      groq: [
        { id: "llama3-70b-8192", name: "Llama 3 70B", provider: "Groq", description: "Fast inference" },
        { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "Groq", description: "Mixture of experts" },
      ],
      openrouter: [
        { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenRouter", description: "Via OpenRouter" },
        { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "OpenRouter", description: "Via OpenRouter" },
      ],
      fireworks: [
        { id: "accounts/fireworks/models/llama-v3p70b-instruct", name: "Llama 3 70B", provider: "Fireworks", description: "Fast training" },
      ],
      gemini: [
        { id: "gemini-pro", name: "Gemini Pro", provider: "Google Gemini", description: "Google's flagship model" },
        { id: "gemini-pro-1.5", name: "Gemini Pro 1.5", provider: "Google Gemini", description: "Multimodal" },
      ],
      ollama: [
        { id: "llama3", name: "Llama 3", provider: "Ollama", description: "Local model" },
        { id: "mistral", name: "Mistral", provider: "Ollama", description: "French model" },
      ],
    };

    return NextResponse.json({ providers, models });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch models" },
      { status: 500 }
    );
  }
}
```

**Step 2: Use this API in ModelDropdown**

Modify the landing page ModelDropdown to fetch models:

```tsx
const [models, setModels] = useState<any[]>([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  fetchModels();
}, []);

const fetchModels = async () => {
  setLoading(true);
  try {
    const response = await fetch("/api/models");
    const data = await response.json();
    if (data.models) {
      const modelList: any[] = [];
      Object.entries(data.models).forEach(([provider, providerModels]: [string, any[]]) => {
        providerModels.forEach((model: any) => {
          modelList.push({ ...model, provider });
        });
      });
      setModels(modelList);
    }
  } catch (error) {
    console.error("Failed to fetch models:", error);
  } finally {
    setLoading(false);
  }
};
```

**Step 3: Commit**

```bash
git add app/api/models/route.ts
git commit -m "feat: add models API endpoint"
```

---

## Part 2: Provider Type Classification

### Task 3: Add Provider Type to Status Items

**Files:**
- Modify: `/Users/ray/Documents/Poseidon/components/settings/SettingsPage.tsx:390-528`

**Step 1: Define provider types**

Add type definition after StatusItem (line 388):

```tsx
type ProviderCategory = "deployment" | "ai" | "custom";

type StatusItem = {
  name: string;
  description: string;
  configured: boolean | undefined;
  reachable?: boolean | null;
  error?: string | null;
  warning?: string | null;
  icon: JSX.Element;
  category?: ProviderCategory;
};
```

**Step 2: Add category to statusItems**

Update provider entries to include category:

```tsx
const statusItems: StatusItem[] = [
  // Deployment providers
  {
    name: "Vercel",
    description: "Deployment platform",
    configured: status?.vercel?.configured,
    category: "deployment",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 76 65" fill="currentColor">
        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
      </svg>
    ),
  },
  {
    name: "Render",
    description: "Deployment platform",
    configured: status?.render?.configured,
    category: "deployment",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" />
      </svg>
    ),
  },
  // AI providers
  {
    name: "Claude API",
    description: "Anthropic Claude for AI assistance",
    configured: status?.claude?.configured,
    category: "ai",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
  // ... add category to all other providers
];
```

**Step 3: Update header to show categories**

Add category header after "API Configuration" title (around line 657):

```tsx
{/* Provider Categories */}
<div className="mt-8">
  <h4 className="text-sm font-semibold text-ink mb-3 uppercase tracking-wide">Deployment</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {statusItems.filter(item => item.category === "deployment").map(...)}
  </div>

  <h4 className="text-sm font-semibold text-ink mt-6 mb-3 uppercase tracking-wide">AI Chat & Coding</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {statusItems.filter(item => item.category === "ai").map(...)}
  </div>

  <h4 className="text-sm font-semibold text-ink mt-6 mb-3 uppercase tracking-wide">Custom Endpoints</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {statusItems.filter(item => item.category === "custom").map(...)}
  </div>
</div>
```

**Step 4: Commit**

```bash
git add components/settings/SettingsPage.tsx
git commit -m "feat: add provider type classification"
```

---

## Part 3: StackBlitz Preview Integration

### Task 4: Create StackBlitz Preview Component

**Files:**
- Create: `/Users/ray/Documents/Poseidon/components/chat/StackBlitzPreview.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState, useEffect } from "react";

interface StackBlitzPreviewProps {
  repo: string; // format: owner/name
  branch?: string;
  title?: string;
}

export default function StackBlitzPreview({ repo, branch = "main", title = "Live Preview" }: StackBlitzPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [repo, branch]);

  const stackblitzUrl = `https://stackblitz.com/github/${repo}?file=index.html&embed=1&theme=dark`;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <a
          href={stackblitzUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-ink-muted hover:text-ink transition-colors flex items-center gap-1"
        >
          Open in StackBlitz
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center bg-surface-muted/30 rounded-lg">
          <div className="text-center">
            <svg className="animate-spin h-6 w-6 text-ink-muted mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-ink-muted">Loading preview...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <iframe
          src={stackblitzUrl}
          className="flex-1 w-full rounded-lg border border-line bg-white"
          style={{ minHeight: "400px" }}
          loading="lazy"
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git git add components/chat/StackBlitzPreview.tsx
git commit -m "feat: add StackBlitz preview component"
```

---

## Part 4: Remove Nanobanana and Ideogram

### Task 5: Remove from .env.local Mapping

**Files:**
- Modify: `/Users/ray/Documents/Poseidon/app/api/settings/api-keys/route.ts:52-57, 86-94, 136-146`

**Step 1: Remove from envKeyMap**

Delete lines 91-92 (Nanobanana) and lines 144-145 (Ideogram) from the envKeyMap:

```tsx
const envKeyMap: Record<string, string> = {
  "Claude API": "ANTHROPIC_API_KEY",
  "OpenAI API": "OPENAI_API_KEY",
  "Groq": "GROQ_API_KEY",
  "OpenRouter": "OPENROUTER_API_KEY",
  "Fireworks": "FIREWORKS_API_KEY",
  "Google Gemini": "GEMINI_API_KEY",
  // Nanobanana and Ideogram removed
};
```

**Step 2: Remove from GET endpoint**

Delete lines 56-57 from the GET function.

**Step 3: Commit**

```bash
git add app/api/settings/api-keys/route.ts
git commit -m "refactor: remove Nanobanana and Ideogram providers"
```

---

## Part 5: Auto Restart Dev Server on API Key Save

### Task 6: Add Dev Server Restart Logic

**Files:**
- Modify: `/Users/ray/Documents/Poseidon/app/api/settings/api-keys/route.ts:105-112`

**Step 1: Add restart logic after saving API key**

Replace lines 105-112 with:

```tsx
env[envKey] = apiKey.trim();
writeEnvFile(env);

// Restart dev server for Claude, OpenAI, Groq if they were just configured
const providersNeedingRestart = ["Claude API", "OpenAI API", "Groq"];
if (providersNeedingRestart.includes(provider)) {
  try {
    // Use poseidon.sh restart command
    const { spawn } = await import("child_process");
    spawn("bash", ["./poseidon.sh", "restart"], {
      cwd: process.cwd(),
      stdio: "ignore",
      detached: false,
    });
  } catch (error) {
    console.error("Failed to restart dev server:", error);
  }
}

return NextResponse.json({
  success: true,
  key: provider,
  envKey,
  restarted: providersNeedingRestart.includes(provider),
});
```

**Step 2: Update ApiKeyModal to show restart status**

Modify `/Users/ray/Documents/Poseidon/components/settings/ApiKeyModal.tsx:64-66`:

```tsx
setHasApiKey(true);
const wasRestarted = data.restarted || false;
onSave(apiKey.trim());
if (wasRestarted) {
  // Give user a moment to restart
  await new Promise(resolve => setTimeout(resolve, 1500));
}
onClose();
```

**Step 3: Add success message if restarted**

Update the success message in the modal (around line 98):

```tsx
setMessage({
  type: "success",
  text: wasRestarted
    ? `✓ ${provider} API key saved and dev server restarted!`
    : `✓ ${provider} API key saved!`
});
```

**Step 4: Commit**

```bash
git add app/api/settings/api-keys/route.ts components/settings/ApiKeyModal.tsx
git commit -m "feat: auto-restart dev server when Claude/OpenAI/Groq API key is saved"
```

---

## Testing Checklist

After completing all tasks:

1. **Landing Page Dropdowns**
   - Open http://localhost:1998
   - Click "Select Repo" → verify GitHub repos load
   - Click "Models" → verify models dropdown shows
   - Test repo creation and model selection

2. **Provider Categories**
   - Go to Settings → API Configuration
   - Verify providers grouped by: Deployment, AI Chat & Coding, Custom Endpoints

3. **StackBlitz Preview**
   - Test StackBlitzPreview component with valid repo
   - Verify iframe loads correctly
   - Test "Open in StackBlitz" link

4. **Provider Removal**
   - Verify Nanobanana and Ideogram not in .env.key mapping
   - Verify they don't appear in Settings provider cards

5. **Auto Restart**
   - Save Claude API key
   - Verify dev server restarts automatically
   - Verify new key is immediately available

---

## Git Commits Summary

```bash
git add components/home/LovableLandingPage.tsx
git commit -m "feat: add repo and model dropdowns to landing page"

git add app/api/models/route.ts
git commit -m "feat: add models API endpoint"

git add components/settings/SettingsPage.tsx
git commit -m "feat: add provider type classification"

git add components/chat/StackBlitzPreview.tsx
git commit -m "feat: add StackBlitz preview component"

git add app/api/settings/api-keys/route.ts components/settings/ApiKeyModal.tsx
git commit -m "feat: auto-restart dev server when Claude/OpenAI/Groq API key is saved"
```

---

## Part 6: Fix Layout Styling for New Dropdowns

### Task 7: Fix Landing Page Dropdown Layout

**Files:**
- Modify: `/Users/ray/Documents/Poseidon/components/home/LovableLandingPage.tsx:116-132`

**Issue:** The RepoSelector and ModelDropdown components may look out of place in the landing page toolbar.

**Step 1: Test current appearance**

1. Run: `npm run dev`
2. Open http://localhost:1998
3. Observe the dropdown styling
4. Check Dev Tools for any errors

**Step 2: Apply styling fixes**

Add custom styling wrapper to match landing page design:

```tsx
<div className="flex items-center gap-2">
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <RepoSelector
      selectedRepo={selectedRepo}
      onSelect={setSelectedRepo}
    />
  </div>
</div>
```

**Step 3: Test the changes**

1. Verify dropdowns match landing page aesthetic
2. Ensure responsive design works on mobile
3. Check Dev Tools console for errors

**Step 4: Commit**

```bash
git add components/home/LovableLandingPage.tsx
git commit -m "fix: improve landing page dropdown layout and styling"
```

---

**Plan complete. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
