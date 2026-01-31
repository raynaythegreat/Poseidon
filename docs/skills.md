# Poseidon Skills

**Version:** 1.0.0
**Last Updated:** 2026-01-31

## Overview

Skills are reusable workflows that help you accomplish common tasks in Poseidon. Invoke them with slash commands (`/skillname`) in the chat interface.

## Using Skills

### Basic Usage

Type `/` in the chat input to see available skills. Select a skill and press Enter to insert it, then add your input.

Example:
```
/brainstorm I want to build a todo app
```

### Context-Aware Suggestions

Poseidon suggests relevant skills based on:
- **Current context:** Landing page, empty chat, active repository
- **Trigger phrases:** "I want to build" suggests brainstorm
- **Recent usage:** Frequently used skills appear first

### Built-in Skills

#### `/brainstorm`
Ask questions to explore and refine your ideas.

**Best for:** New projects, unclear requirements, exploring options

**Example:** `/brainstorm I want to build a weather app`

#### `/plan`
Create detailed implementation plans for your project.

**Best for:** Structured development, breaking down features, team collaboration

**Example:** `/plan Add user authentication to my app`

#### `/explain`
Get clear explanations of code, concepts, or technical topics.

**Best for:** Understanding unfamiliar code, learning new concepts

**Example:** `/explain How does React's useEffect hook work?`

#### `/code-review`
Review code for issues, bugs, and improvements.

**Best for:** Pre-commit checks, learning best practices, improving code quality

**Example:** `/code-review Review the authentication logic`

## Skill Feedback

After using a skill, provide feedback to help improve it:
- **Thumbs up:** Skill was helpful
- **Thumbs down:** Skill missed the mark
- **Comments:** Optional feedback on what could be better

## Managing Skills

### View Skills

Navigate to **Settings → Skills** to see all available skills.

### Delete Skills

1. Go to **Settings → Skills**
2. Find the skill you want to remove
3. Click the delete button

### Creating Custom Skills

Currently, Poseidon includes built-in skills. Custom skill creation is planned for a future release.

## Skill Storage

Skills are stored globally in `~/.poseidon/skills/` and shared across all Poseidon projects.

Built-in skills:
- `~/.poseidon/skills/brainstorm/`
- `~/.poseidon/skills/plan/`
- `~/.poseidon/skills/explain/`
- `~/.poseidon/skills/code-review/`

## Tips

- Type `/` slowly to see skill descriptions
- Skills work with any repository or no repository at all
- Feedback helps improve skills over time
- Check Settings → Skills to see what's available

## Troubleshooting

**Skill not responding:**
- Ensure you're connected to the internet
- Check that your API provider is configured in Settings

**Autocomplete not showing:**
- Type `/` and wait a moment
- Check that JavaScript is enabled

**Skill not found:**
- Verify the skill name spelling
- Check Settings → Skills to confirm it's installed

## Future Enhancements

Planned features:
- AI-assisted skill creation
- Custom skill sharing
- Skill versioning and rollback
- Community skill library
