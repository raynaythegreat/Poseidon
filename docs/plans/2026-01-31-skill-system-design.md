# Poseidon Skill System Design

**Date:** 2026-01-31
**Status:** Design Phase
**Author:** AI + User Collaboration

## Overview

Poseidon needs a skill system similar to Claude Code's superpowers. Users invoke skills via slash commands (`/skillname`) in chat. Skills execute multi-step workflows with AI interactions, API calls, and file operations. Users create skills through natural language descriptions, then improve them based on feedback.

## Architecture

### Components

**1. Skill Storage**
- Location: `~/.poseidon/skills/`
- Structure: One folder per skill
- Each skill contains:
  - `skill.md` - Metadata, description, prompt template
  - `handler.ts` (optional) - Custom execution logic

**2. Skill Registry**
- Loads all skills on startup
- Runtime API:
  - `listSkills()` - Get all available skills
  - `getSkill(name)` - Retrieve specific skill
  - `executeSkill(name, context)` - Run skill with context

**3. Chat Integration**
- Textarea detects "/" keypress
- Shows context-aware autocomplete dropdown
- Inserts skill invocation on selection
- Sends to `/api/chat` with skill metadata

## Skill Definition Format

### skill.md Schema

```yaml
---
name: brainstorm
description: Ask questions to explore and refine ideas
version: 1.0.0
author: Poseidon
tags: [ideation, planning, requirements]
context: ["landing", "empty-chat"]
suggestionTrigger: "I want to build"
---

# Brainstorming Mode

Ask clarifying questions one at a time to understand what the user wants to build.

## Process
1. Ask about the core problem or opportunity
2. Explore target audience and use cases
3. Discuss technical constraints
4. Present a summary and ask if it looks right
```

### Optional handler.ts

```typescript
export interface SkillContext {
  messages: ChatMessage[];
  repo?: Repository;
  userInput: string;
}

export async function execute(context: SkillContext): Promise<string> {
  // Custom logic before AI prompt
  return `Starting brainstorming about: ${context.userInput}`;
}
```

## Slash Command Interface

### Autocomplete Dropdown

**Position:** Below textarea, anchored to cursor

**Content:**
```
┌─────────────────────────────────────┐
│ Suggested because you said "build"  │
├─────────────────────────────────────┤
│ 💡 /brainstorm                      │
│    Ask questions to refine ideas    │
├─────────────────────────────────────┤
│ 📋 /plan                            │
│    Create implementation plans      │
├─────────────────────────────────────┤
│ 🔍 /code-review                     │
│    Review code for issues           │
└─────────────────────────────────────┘
```

**Interaction:**
1. User types "/"
2. Dropdown appears with filtered skills
3. User selects or types to filter
4. Press Enter → inserts `/skillname ` into textarea
5. User continues typing message
6. Submit → executes skill

### Context-Aware Filtering

Skills show based on:
- **Context:** Landing page, empty chat, has code, has repo
- **Triggers:** Phrases in recent messages ("build", "fix", "explain")
- **Usage frequency:** More-used skills rank higher
- **Tags:** Category matching

**Examples:**
- New user lands → Shows `brainstorm`, `plan`
- User types "I want to build" → Shows `brainstorm` (trigger matches)
- User has code open → Shows `code-review`, `explain-function`
- Mid-conversation → Shows no suggestions unless triggered

## Skill Execution Flow

**User submits:** `/brainstorm I want to build a todo app`

1. Parse skill name and arguments
2. Load skill definition
3. Build context object:
   - Chat history
   - Selected repo
   - User input after command
4. Execute handler (if exists)
5. Send to AI with skill prompt
6. AI follows skill workflow
7. Return response to chat

**API payload:**
```json
{
  "messages": [
    ...history,
    {
      "role": "user",
      "content": "[Skill: brainstorm]\nStart brainstorming about: I want to build a todo app"
    }
  ],
  "model": "claude-3-5-sonnet",
  "provider": "claude",
  "skillMode": true
}
```

## AI-Assisted Skill Creation

### Creation Flow

1. User opens "Create Skill" modal
2. Describes desired skill in natural language
3. AI generates complete skill definition:
   - Name and description
   - Prompt template
   - Context triggers
   - Optional handler code
4. User reviews and edits
5. Tests in sandbox
6. Saves to `~/.poseidon/skills/`

### Modal UI

```
┌─────────────────────────────────────────────┐
│ Create New Skill              [×]           │
├─────────────────────────────────────────────┤
│                                             │
│ Describe what you want the skill to do:     │
│ ┌─────────────────────────────────────────┐ │
│ │ Review my code for security issues and   │ │
│ │ suggest fixes                           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Generate Skill]                            │
│                                             │
│ (AI generates, shows preview...)            │
├─────────────────────────────────────────────┤
│ [Cancel]              [Save & Test Skill]   │
└─────────────────────────────────────────────┘
```

## Skill Improvement System

### Feedback Collection

After each skill execution, show:

```
┌─────────────────────────────────────────────┐
│ Skill: brainstorm         ✓ Completed       │
├─────────────────────────────────────────────┤
│ Was this helpful?                             │
│  [👍 Thumbs up]  [👎 Thumbs down]            │
│                                             │
│ What could be better? (optional)            │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Send Feedback]  [Skip]                     │
└─────────────────────────────────────────────┘
```

### AI-Powered Suggestions

System tracks:
- Usage frequency
- Thumbs up/down ratio
- Common user edits
- Error rates

AI analyzes patterns and suggests improvements:

```
💡 Suggestion for "brainstorm" skill:

Users often edit your questions to be more specific.
Consider adding technical stack detection.

[Apply Suggestion]  [Dismiss]  [Customize]
```

### Version History

- Each skill has version number in frontmatter
- Improvements increment version (1.0.0 → 1.1.0)
- Old versions backed up to `.history/` folder
- Users can rollback if needed

### Iteration Command

`/improve <skillname>` opens editor with:
- Current skill definition
- AI suggestions pre-loaded
- Diff view of changes
- Test sandbox

## Built-in Skills

Initial skill set to ship with Poseidon:

1. **brainstorm** - Explore ideas through questions
2. **plan** - Create implementation plans
3. **code-review** - Review code for issues
4. **explain** - Explain code or concepts
5. **refactor** - Suggest code improvements
6. **test** - Generate test cases
7. **debug** - Help debug issues
8. **commit** - Write commit messages

## Implementation Phases

**Phase 1: Core Infrastructure**
- Skill storage structure
- Skill registry
- Basic execution flow

**Phase 2: Chat Integration**
- "/" detection
- Autocomplete dropdown
- Context filtering

**Phase 3: Creation & Improvement**
- AI-assisted creation modal
- Feedback system
- Version history

**Phase 4: Polish**
- Built-in skill library
- Documentation
- Testing

## Success Criteria

- Users can create skills without writing code
- Skills suggest themselves at relevant moments
- Skills improve over time based on feedback
- System feels magical, not manual
