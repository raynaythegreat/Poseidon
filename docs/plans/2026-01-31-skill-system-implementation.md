# Skill System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a slash-command skill system for Poseidon chat with AI-assisted creation, context-aware suggestions, and continuous improvement.

**Architecture:** Skills stored in `~/.poseidon/skills/` as markdown + optional TypeScript handlers. Chat interface detects "/" and shows filtered autocomplete. Skills execute through `/api/chat` with special mode flag. Users create skills via AI-assisted modal, then improve them through feedback and versioning.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, React hooks, Node.js fs module, YAML frontmatter parsing

---

## Task 1: Create Skill Storage Infrastructure

**Files:**
- Create: `lib/skills/storage.ts`
- Create: `lib/skills/types.ts`
- Create: `lib/skills/registry.ts`

**Step 1: Define skill types**

Create `lib/skills/types.ts`:

```typescript
export interface SkillMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  context: string[];
  suggestionTrigger?: string;
}

export interface Skill {
  metadata: SkillMetadata;
  prompt: string;
  handlerPath?: string;
}

export interface SkillContext {
  messages: Array<{ role: string; content: string }>;
  repo?: { name: string; owner: string };
  userInput: string;
}

export interface SkillExecutionResult {
  response: string;
  followUpQuestions?: string[];
}
```

**Step 2: Create skill storage layer**

Create `lib/skills/storage.ts`:

```typescript
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import type { Skill } from "./types";

const SKILLS_DIR = path.join(process.env.HOME || "", ".poseidon", "skills");

export async function ensureSkillsDir(): Promise<void> {
  await fs.mkdir(SKILLS_DIR, { recursive: true });
}

export async function loadSkill(name: string): Promise<Skill | null> {
  const skillPath = path.join(SKILLS_DIR, name, "skill.md");

  try {
    const content = await fs.readFile(skillPath, "utf-8");
    const frontmatterMatch = content.match(/^---\n(.*?)\n---/s);

    if (!frontmatterMatch) return null;

    const metadata = parse(frontmatterMatch[1]);
    const prompt = content.replace(/^---\n.*?\n---\n/s, "");

    const handlerPath = path.join(SKILLS_DIR, name, "handler.ts");
    let handlerExists = false;
    try {
      await fs.access(handlerPath);
      handlerExists = true;
    } catch {
      // No handler
    }

    return {
      metadata,
      prompt,
      handlerPath: handlerExists ? handlerPath : undefined,
    };
  } catch {
    return null;
  }
}

export async function listAllSkills(): Promise<Skill[]> {
  await ensureSkillsDir();

  const entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
  const skills: Skill[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skill = await loadSkill(entry.name);
      if (skill) skills.push(skill);
    }
  }

  return skills;
}

export async function saveSkill(name: string, skill: Skill): Promise<void> {
  const skillDir = path.join(SKILLS_DIR, name);
  await fs.mkdir(skillDir, { recursive: true });

  const frontmatter = Object.entries(skill.metadata)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `"${v}"`).join(", ")}]`;
      }
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join("\n");

  const content = `---\n${frontmatter}\n---\n\n${skill.prompt}`;
  await fs.writeFile(path.join(skillDir, "skill.md"), content, "utf-8");
}
```

**Step 3: Create skill registry**

Create `lib/skills/registry.ts`:

```typescript
import { listAllSkills, loadSkill } from "./storage";
import type { Skill, SkillContext, SkillExecutionResult } from "./types";

class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;

    const skills = await listAllSkills();
    for (const skill of skills) {
      this.skills.set(skill.metadata.name, skill);
    }
    this.loaded = true;
  }

  list(): Skill[] {
    return Array.from(this.skills.values());
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  async execute(name: string, context: SkillContext): Promise<SkillExecutionResult> {
    const skill = this.get(name);
    if (!skill) {
      throw new Error(`Skill not found: ${name}`);
    }

    // Execute handler if exists
    if (skill.handlerPath) {
      const handler = await import(skill.handlerPath);
      return await handler.execute(context);
    }

    // Return prompt for AI
    return {
      response: skill.prompt,
    };
  }
}

export const registry = new SkillRegistry();
```

**Step 4: Write tests**

Create `lib/skills/__tests__/storage.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { loadSkill, listAllSkills, saveSkill, ensureSkillsDir } from "../storage";
import { Skill } from "../types";

describe("Skill Storage", () => {
  afterEach(async () => {
    // Cleanup test skills
  });

  it("should load a skill from disk", async () => {
    const skill = await loadSkill("test-skill");
    expect(skill).not.toBeNull();
    expect(skill?.metadata.name).toBe("test-skill");
  });

  it("should list all skills", async () => {
    const skills = await listAllSkills();
    expect(Array.isArray(skills)).toBe(true);
  });

  it("should save a new skill", async () => {
    const skill: Skill = {
      metadata: {
        name: "new-skill",
        description: "Test skill",
        version: "1.0.0",
        author: "test",
        tags: ["test"],
        context: ["chat"],
      },
      prompt: "Do something",
    };

    await saveSkill("new-skill", skill);
    const loaded = await loadSkill("new-skill");
    expect(loaded?.metadata.name).toBe("new-skill");
  });
});
```

**Step 5: Run tests to verify**

Run: `npm test -- lib/skills/__tests__/storage.test.ts`
Expected: Tests pass (or fail appropriately if no skills exist yet)

**Step 6: Commit**

```bash
git add lib/skills/
git commit -m "feat: add skill storage and registry infrastructure"
```

---

## Task 2: Create Built-in Skills

**Files:**
- Create: `~/.poseidon/skills/brainstorm/skill.md`
- Create: `~/.poseidon/skills/plan/skill.md`
- Create: `~/.poseidon/skills/explain/skill.md`
- Create: `~/.poseidon/skills/code-review/skill.md`

**Step 1: Create brainstorm skill**

Create `~/.poseidon/skills/brainstorm/skill.md`:

```yaml
---
name: brainstorm
description: Ask questions to explore and refine your ideas
version: 1.0.0
author: Poseidon
tags: [ideation, planning, requirements]
context: ["landing", "empty-chat"]
suggestionTrigger: "I want to build"
---

# Brainstorming Mode

You are in brainstorming mode. Your goal is to help the user explore and refine their idea through thoughtful questions.

## Process

Ask questions ONE AT A TIME. Wait for the user's answer before asking the next question.

1. **Understand the core problem**: What problem are they solving? What opportunity are they pursuing?

2. **Explore the context**: Who is this for? What are the use cases?

3. **Discuss constraints**: What are the technical, time, or resource constraints?

4. **Summarize and validate**: Present a summary of what you learned and ask if it looks right.

## Tone

- Curious and exploratory
- Non-judgmental
- Help the user think through their idea
```

**Step 2: Create plan skill**

Create `~/.poseidon/skills/plan/skill.md`:

```yaml
---
name: plan
description: Create detailed implementation plans for your projects
version: 1.0.0
author: Poseidon
tags: [planning, architecture, implementation]
context: ["landing", "empty-chat", "has-repo"]
suggestionTrigger: "how do I build"
---

# Planning Mode

You are in planning mode. Help the user create a detailed implementation plan.

## Process

1. **Understand the goal**: What are we building?

2. **Identify components**: What are the main pieces?

3. **Define dependencies**: What depends on what?

4. **Estimate complexity**: What's simple vs complex?

5. **Create step-by-step plan**: Break it down into actionable tasks

## Output Format

Present the plan as:
- Task N: [Component Name]
  - Files to create/modify
  - Implementation steps
  - Testing approach
```

**Step 3: Create explain skill**

Create `~/.poseidon/skills/explain/skill.md`:

```yaml
---
name: explain
description: Get clear explanations of code, concepts, or technical topics
version: 1.0.0
author: Poseidon
tags: [learning, documentation, understanding]
context: ["chat", "has-code"]
suggestionTrigger: "explain" or "how does" or "what is"
---

# Explanation Mode

You are in explanation mode. Help the user understand something clearly.

## What to Explain

The user might ask about:
- A piece of code (they'll paste it or reference a file)
- A technical concept
- How something works
- Why something is done a certain way

## Approach

1. Start with a high-level summary (the "elevator pitch")

2. Break it down into key components or steps

3. Use analogies or examples to make it concrete

4. Avoid jargon unless necessary (and explain it if you do)

5. Check if they understand before moving on

## Tone

- Clear and concise
- Patient and supportive
- Focus on understanding, not showing off
```

**Step 4: Create code-review skill**

Create `~/.poseidon/skills/code-review/skill.md`:

```yaml
---
name: code-review
description: Review code for issues, improvements, and best practices
version: 1.0.0
author: Poseidon
tags: [code-quality, review, improvement]
context: ["has-code", "has-repo"]
suggestionTrigger: "review" or "improve"
---

# Code Review Mode

You are in code review mode. Help the user improve their code.

## Review Checklist

Look for:
1. **Bugs and edge cases**: What could go wrong?
2. **Performance**: Any obvious inefficiencies?
3. **Security**: Common vulnerabilities (XSS, SQL injection, etc.)
4. **Readability**: Is it clear and maintainable?
5. **Best practices**: Following language/framework conventions?

## Feedback Format

Organize feedback as:
- **Critical**: Must fix (bugs, security issues)
- **Important**: Should fix (performance, major improvements)
- **Nice to have**: Style, minor optimizations

## Tone

- Constructive, not critical
- Explain the "why" behind suggestions
- Acknowledge what's done well
```

**Step 5: Verify skills load**

Create test file `lib/skills/__tests__/built-in-skills.test.ts`:

```typescript
import { describe, it, expect } from "@jest/globals";
import { registry } from "../registry";

describe("Built-in Skills", () => {
  beforeAll(async () => {
    await registry.load();
  });

  it("should load brainstorm skill", () => {
    const skill = registry.get("brainstorm");
    expect(skill).toBeDefined();
    expect(skill?.metadata.name).toBe("brainstorm");
  });

  it("should load plan skill", () => {
    const skill = registry.get("plan");
    expect(skill).toBeDefined();
  });

  it("should load explain skill", () => {
    const skill = registry.get("explain");
    expect(skill).toBeDefined();
  });

  it("should load code-review skill", () => {
    const skill = registry.get("code-review");
    expect(skill).toBeDefined();
  });
});
```

**Step 6: Run tests**

Run: `npm test -- lib/skills/__tests__/built-in-skills.test.ts`
Expected: All tests pass

**Step 7: Commit**

```bash
git add lib/skills/__tests__/
git commit -m "feat: add built-in skills (brainstorm, plan, explain, code-review)"
```

---

## Task 3: Create Slash Command Autocomplete Component

**Files:**
- Create: `components/chat/SkillAutocomplete.tsx`
- Modify: `components/chat/SimpleChatPage.tsx`

**Step 1: Create autocomplete component**

Create `components/chat/SkillAutocomplete.tsx`:

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import type { Skill } from "@/lib/skills/types";

interface SkillAutocompleteProps {
  visible: boolean;
  query: string;
  skills: Skill[];
  onSelect: (skill: Skill) => void;
  position: { top: number; left: number };
  contextReason?: string;
}

export default function SkillAutocomplete({
  visible,
  query,
  skills,
  onSelect,
  position,
  contextReason,
}: SkillAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  const filteredSkills = skills.filter(
    (skill) =>
      skill.metadata.name.toLowerCase().includes(query.toLowerCase()) ||
      skill.metadata.description.toLowerCase().includes(query.toLowerCase())
  );

  if (filteredSkills.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] w-80 rounded-xl border border-line bg-surface shadow-xl max-h-64 overflow-y-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {contextReason && (
        <div className="px-3 py-2 text-xs text-ink-muted border-b border-line/60">
          {contextReason}
        </div>
      )}

      {filteredSkills.map((skill) => (
        <button
          key={skill.metadata.name}
          onClick={() => onSelect(skill)}
          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-surface-muted/60 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-400/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">💡</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink">
              /{skill.metadata.name}
            </div>
            <div className="text-xs text-ink-muted truncate">
              {skill.metadata.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Add slash command detection to SimpleChatPage**

Read current `components/chat/SimpleChatPage.tsx` lines 1-50 to understand structure, then modify:

```typescript
// Add new state after existing state declarations
const [showSkillAutocomplete, setShowSkillAutocomplete] = useState(false);
const [skillQuery, setSkillQuery] = useState("");
const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
const textareaRef = useRef<HTMLTextAreaElement>(null);

// Add context filtering
const getContextReason = (): string | undefined => {
  if (messages.length === 0) return "Starting a new conversation";
  if (selectedRepo) return "Working in a repository";
  return undefined;
};

// Modify textarea onChange handler
const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setInput(value);

  // Check for slash command
  const cursorPos = e.target.selectionStart;
  const textBeforeCursor = value.substring(0, cursorPos);
  const lastWordMatch = textBeforeCursor.match(/\/(\w*)$/);

  if (lastWordMatch) {
    setSkillQuery(lastWordMatch[1]);
    setShowSkillAutocomplete(true);

    // Calculate position
    const rect = e.target.getBoundingClientRect();
    setAutocompletePosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });
  } else {
    setShowSkillAutocomplete(false);
  }
};

// Add skill selection handler
const handleSkillSelect = (skill: Skill) => {
  const currentValue = input;
  const cursorPos = textareaRef.current?.selectionStart || 0;
  const beforeCursor = currentValue.substring(0, cursorPos);
  const afterCursor = currentValue.substring(cursorPos);

  // Replace /partial with /skillname
  const newValue = beforeCursor.replace(/\/\w*$/, `/${skill.metadata.name} `) + afterCursor;
  setInput(newValue);
  setShowSkillAutocomplete(false);

  // Focus textarea
  setTimeout(() => {
    textareaRef.current?.focus();
  }, 0);
};
```

**Step 3: Add ref to textarea**

Modify textarea in JSX:

```tsx
<textarea
  ref={textareaRef}
  value={input}
  onChange={handleInputChange}
  // ... rest of props
/>
```

**Step 4: Add autocomplete component to JSX**

Add after textarea container:

```tsx
{showSkillAutocomplete && (
  <SkillAutocomplete
    visible={showSkillAutocomplete}
    query={skillQuery}
    skills={allSkills}
    onSelect={handleSkillSelect}
    position={autocompletePosition}
    contextReason={getContextReason()}
  />
)}
```

**Step 5: Import skills in SimpleChatPage**

Add to imports:

```typescript
import SkillAutocomplete from "./SkillAutocomplete";
import { registry } from "@/lib/skills/registry";
import type { Skill } from "@/lib/skills/types";
```

Add state for skills:

```typescript
const [allSkills, setAllSkills] = useState<Skill[]>([]);

// Load skills on mount
useEffect(() => {
  registry.load().then(() => {
    setAllSkills(registry.list());
  });
}, []);
```

**Step 6: Test autocomplete**

Run: `npm run dev`
Navigate to http://localhost:3000
- Type "/" in textarea
- Verify dropdown appears with skills
- Type "brain" after "/"
- Verify dropdown filters to show only brainstorm
- Click on a skill
- Verify it inserts "/skillname " into textarea

**Step 7: Commit**

```bash
git add components/chat/
git commit -m "feat: add slash command autocomplete for skills"
```

---

## Task 4: Integrate Skill Execution with Chat API

**Files:**
- Modify: `app/api/chat/route.ts`
- Modify: `components/chat/SimpleChatPage.tsx`

**Step 1: Parse skill commands in handleSubmit**

Modify `handleSubmit` in `SimpleChatPage.tsx`:

```typescript
const handleSubmit = async (messageOverride?: ChatMessage) => {
  const messageToSend = messageOverride || { role: "user" as const, content: input };
  if (!messageToSend.content.trim() || isLoading) return;

  // Check for skill command
  const skillMatch = messageToSend.content.match(/^\/(\w+)\s*(.*)$/s);
  let finalContent = messageToSend.content;

  if (skillMatch) {
    const [, skillName, args] = skillMatch;
    const skill = registry.get(skillName);

    if (skill) {
      finalContent = `[Skill: ${skill.metadata.name}]\n${skill.prompt}\n\nUser input: ${args}`;
    }
  }

  const userMessage: ChatMessage = { ...messageToSend, content: finalContent };
  setMessages((prev) => [...prev, userMessage]);
  if (!messageOverride) setInput("");
  setIsLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, userMessage],
        model: modelInfo.name,
        provider: modelInfo.provider,
        skillMode: !!skillMatch,
      }),
    });

    if (!response.ok) throw new Error("Failed to send message");

    const data = await response.json();
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: data.content || data.message || "",
    };
    setMessages((prev) => [...prev, assistantMessage]);
  } catch (error) {
    console.error("Failed to send message:", error);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Sorry, something went wrong. Please try again." },
    ]);
  } finally {
    setIsLoading(false);
  }
};
```

**Step 2: Update chat API to handle skill mode**

Modify `app/api/chat/route.ts` to accept `skillMode` parameter:

```typescript
export async function POST(request: Request) {
  try {
    const { messages, model, provider, skillMode = false } = await request.json();

    // Build system prompt
    let systemPrompt = "You are Poseidon, an AI development assistant.";

    if (skillMode) {
      systemPrompt += "\n\nYou are in SKILL MODE. Follow the skill's workflow exactly.";
    }

    // Rest of existing code...
    const response = await anthropic.messages.create({
      model: getModelId(model, provider),
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return NextResponse.json({
      content: response.content[0]?.type === "text" ? response.content[0].text : "",
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process chat" },
      { status: 500 }
    );
  }
}
```

**Step 3: Test skill execution**

Run: `npm run dev`
- Navigate to chat
- Type `/brainstorm I want to build a todo app`
- Verify message is formatted correctly
- Verify AI responds in brainstorm mode (asking questions)
- Try `/plan I need a user authentication system`
- Verify AI responds with implementation plan

**Step 4: Commit**

```bash
git add app/api/chat/route.ts components/chat/SimpleChatPage.tsx
git commit -m "feat: integrate skill execution with chat API"
```

---

## Task 5: Remove Old Brainstorm/Plan Buttons from Chat

**Files:**
- Modify: `components/chat/SimpleChatPage.tsx`
- Modify: `components/home/LovableLandingPage.tsx`

**Step 1: Remove skill buttons from SimpleChatPage toolbar**

In `SimpleChatPage.tsx`, remove the Brainstorm and Plan buttons from the toolbar (lines ~300-360):

Keep only:
- Repo Selector
- Model Selector
- Send button

**Step 2: Update landing page buttons to use slash commands**

In `LovableLandingPage.tsx`, modify the brainstorm and plan buttons to navigate to chat with slash command pre-filled:

```typescript
<button
  onClick={() => {
    clearCurrentSession();
    router.push("/?prompt=/brainstorm");
  }}
  // ... rest of props
>
```

**Step 3: Update SimpleChatPage to handle prompt URL param**

Add to `SimpleChatPage.tsx` useEffect:

```typescript
// Handle prompt from URL
useEffect(() => {
  const promptParam = searchParams.get("prompt");
  if (promptParam && messages.length === 0) {
    setInput(promptParam + " ");
    router.replace("/", { scroll: false });
  }
}, []);
```

**Step 4: Test**

Run: `npm run dev`
- Navigate to landing page
- Click Brainstorm button
- Verify it goes to chat with "/brainstorm " pre-filled
- Type your message and submit
- Verify skill executes

**Step 5: Commit**

```bash
git add components/chat/SimpleChatPage.tsx components/home/LovableLandingPage.tsx
git commit -m "refactor: remove old skill buttons, use slash commands instead"
```

---

## Task 6: Add Skill Feedback UI

**Files:**
- Create: `components/chat/SkillFeedback.tsx`
- Modify: `components/chat/MessageList.tsx`

**Step 1: Create feedback component**

Create `components/chat/SkillFeedback.tsx`:

```typescript
"use client";

import { useState } from "react";

interface SkillFeedbackProps {
  skillName: string;
  onSubmit: (feedback: { helpful: boolean; comment?: string }) => void;
}

export default function SkillFeedback({ skillName, onSubmit }: SkillFeedbackProps) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (isHelpful: boolean) => {
    setHelpful(isHelpful);
    setShowComment(true);
  };

  const handleSubmit = () => {
    onSubmit({ helpful: helpful === true, comment: comment || undefined });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-xs text-ink-muted">Thanks for your feedback!</div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-surface-muted/50 rounded-lg">
      <div className="text-sm text-ink mb-2">
        Skill: <span className="font-medium">{skillName}</span> ✓ Completed
      </div>

      {!showComment ? (
        <div>
          <div className="text-xs text-ink-muted mb-2">Was this helpful?</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFeedback(true)}
              className="px-3 py-1.5 rounded-md text-sm bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20 transition-colors"
            >
              👍 Thumbs up
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="px-3 py-1.5 rounded-md text-sm bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
            >
              👎 Thumbs down
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-xs text-ink-muted mb-2">What could be better? (optional)</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us how to improve this skill..."
            className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-md text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
            rows={2}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSubmit}
              className="px-3 py-1.5 rounded-md text-sm bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-colors"
            >
              Send Feedback
            </button>
            <button
              onClick={() => setShowComment(false)}
              className="px-3 py-1.5 rounded-md text-sm text-ink-muted hover:text-ink transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Integrate feedback into MessageList**

Modify `MessageList.tsx` to show feedback after skill responses:

Detect if message contains skill marker and show feedback component.

**Step 3: Test**

Run: `npm run dev`
- Execute a skill command
- After response, verify feedback UI appears
- Test thumbs up/down flow
- Test comment submission

**Step 4: Commit**

```bash
git add components/chat/SkillFeedback.tsx components/chat/MessageList.tsx
git commit -m "feat: add skill feedback UI"
```

---

## Task 7: Create Skill Management API

**Files:**
- Create: `app/api/skills/route.ts`
- Create: `app/api/skills/[name]/route.ts`

**Step 1: Create skills list endpoint**

Create `app/api/skills/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { registry } from "@/lib/skills/registry";

export async function GET() {
  try {
    await registry.load();
    const skills = registry.list();

    return NextResponse.json({
      skills: skills.map((s) => ({
        name: s.metadata.name,
        description: s.metadata.description,
        tags: s.metadata.tags,
        version: s.metadata.version,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load skills" },
      { status: 500 }
    );
  }
}
```

**Step 2: Create individual skill endpoint**

Create `app/api/skills/[name]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { registry } from "@/lib/skills/registry";
import { loadSkill } from "@/lib/skills/storage";

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    await registry.load();
    const skill = registry.get(params.name);

    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: skill.metadata.name,
      description: skill.metadata.description,
      prompt: skill.prompt,
      version: skill.metadata.version,
      tags: skill.metadata.tags,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load skill" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    const skillPath = path.join(
      process.env.HOME || "",
      ".poseidon",
      "skills",
      params.name
    );

    await fs.rm(skillPath, { recursive: true, force: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete skill" },
      { status: 500 }
    );
  }
}
```

**Step 3: Test API**

Run: `npm run dev`

Test list endpoint:
```bash
curl http://localhost:3000/api/skills
```

Test get skill endpoint:
```bash
curl http://localhost:3000/api/skills/brainstorm
```

**Step 4: Commit**

```bash
git add app/api/skills/
git commit -m "feat: add skill management API endpoints"
```

---

## Task 8: Create Skills Settings Page

**Files:**
- Create: `components/settings/SkillsManager.tsx`
- Modify: `components/settings/SettingsPage.tsx`

**Step 1: Create skills manager component**

Create `components/settings/SkillsManager.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import type { Skill } from "@/lib/skills/types";
import { registry } from "@/lib/skills/registry";

export default function SkillsManager() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    await registry.load();
    setSkills(registry.list());
    setLoading(false);
  };

  const handleDeleteSkill = async (name: string) => {
    if (!confirm(`Delete skill "${name}"?`)) return;

    setDeleting(name);
    try {
      await fetch(`/api/skills/${name}`, { method: "DELETE" });
      await loadSkills();
    } catch (error) {
      console.error("Failed to delete skill:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-ink mb-4">
        Skills
      </h3>

      <div className="space-y-3">
        {skills.map((skill) => (
          <div
            key={skill.metadata.name}
            className="card rounded-none p-4 flex items-start justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-ink">
                  /{skill.metadata.name}
                </h4>
                <span className="text-xs text-ink-muted">
                  v{skill.metadata.version}
                </span>
              </div>
              <p className="text-sm text-ink-muted mt-1">
                {skill.metadata.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {skill.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-full bg-surface-muted text-ink-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {!skill.metadata.author.includes("Poseidon") && (
              <button
                onClick={() => handleDeleteSkill(skill.metadata.name)}
                disabled={deleting === skill.metadata.name}
                className="px-3 py-1.5 rounded-md text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {deleting === skill.metadata.name ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        ))}

        {skills.length === 0 && (
          <div className="text-center py-8 text-ink-muted">
            No skills yet. Create your first skill!
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Add to settings page**

Modify `SettingsPage.tsx` to add Skills section after existing sections.

**Step 3: Test**

Run: `npm run dev`
- Navigate to Settings
- Verify Skills section appears
- Verify all skills are listed
- Try deleting a custom skill (not built-in)
- Verify delete works

**Step 4: Commit**

```bash
git add components/settings/SkillsManager.tsx components/settings/SettingsPage.tsx
git commit -m "feat: add skills manager to settings page"
```

---

## Task 9: Documentation and Final Testing

**Files:**
- Create: `docs/skills.md`
- Create: `~/.poseidon/skills/README.md`

**Step 1: Create user documentation**

Create `docs/skills.md`:

```markdown
# Poseidon Skills

Skills are reusable workflows that help you accomplish common tasks in Poseidon.

## Using Skills

Type `/` in the chat to see available skills. Select a skill and add your message.

Example:
```
/brainstorm I want to build a task management app
```

## Built-in Skills

- `/brainstorm` - Explore ideas through questions
- `/plan` - Create implementation plans
- `/explain` - Get clear explanations
- `/code-review` - Review code for issues

## Creating Custom Skills

See `~/.poseidon/skills/README.md` for details on creating your own skills.

## Skill Storage

Skills are stored in `~/.poseidon/skills/`. Each skill has a `skill.md` file with metadata and prompt.
```

**Step 2: Create skill developer documentation**

Create `~/.poseidon/skills/README.md`:

```markdown
# Creating Custom Skills

## Skill Structure

```
~/.poseidon/skills/your-skill/
├── skill.md      # Required: metadata and prompt
└── handler.ts    # Optional: custom execution logic
```

## skill.md Format

```yaml
---
name: your-skill
description: What this skill does
version: 1.0.0
author: Your Name
tags: [category1, category2]
context: ["landing", "chat"]
suggestionTrigger: "keyword that triggers suggestion"
---

# Your Skill Name

Describe what the AI should do when this skill is invoked.

## Instructions

Step-by-step instructions for the AI.
```

## Optional Handler

For advanced skills, add `handler.ts`:

\`\`\`typescript
import type { SkillContext, SkillExecutionResult } from "@/lib/skills/types";

export async function execute(context: SkillContext): Promise<SkillExecutionResult> {
  // Custom logic
  return {
    response: "Modified prompt for AI",
  };
}
\`\`\`
```

**Step 3: End-to-end test**

1. Start fresh: `npm run dev`
2. Navigate to landing page
3. Click Brainstorm button
4. Complete brainstorm session
5. Provide feedback
6. Try `/plan` command
7. Check Settings > Skills page
8. Verify all skills listed
9. Create a test skill manually
10. Verify it appears in autocomplete
11. Delete test skill

**Step 4: Final commit**

```bash
git add docs/
git commit -m "docs: add skill system documentation"
```

---

## Completion Checklist

- [ ] Skill storage infrastructure works
- [ ] Built-in skills (brainstorm, plan, explain, code-review) installed
- [ ] Slash command autocomplete appears on "/"
- [ ] Skills execute correctly in chat
- [ ] Feedback UI appears after skill completion
- [ ] Skills management API works
- [ ] Settings page shows all skills
- [ ] Custom skills can be created and deleted
- [ ] Documentation complete
- [ ] All tests pass
