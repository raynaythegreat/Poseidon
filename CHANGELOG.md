# Changelog

All notable changes to Poseidon will be documented in this file.

## [1.2.0] - 2026-01-30

### Added
- **Skills System**: Comprehensive slash-command system for specialized workflows
  - `/brainstorm` - Interactive idea exploration with question-driven refinement
  - `/plan` - Structured implementation planning with task breakdown
  - `/explain` - Code explanations and technical concept breakdowns
  - `/code-review` - Automated code review with best practice feedback
  - Context-aware skill suggestions based on conversation state
  - YAML-based skill definitions in `~/.poseidon/skills/`
  - Developer documentation for creating custom skills

- **Custom Providers with .env.local Persistence**
  - Custom AI providers now save to `.env.local` file
  - Environment format: `CUSTOM_PROVIDER_<NAME>_BASE_URL` and `CUSTOM_PROVIDER_<NAME>_API_KEY`
  - API endpoint `/api/settings/custom-providers` for CRUD operations
  - Syncs across browser sessions and app restarts

- **Settings Page Enhancements**
  - "Get Key" quick links for all provider cards (Claude, OpenAI, Gemini, Groq, OpenRouter, Fireworks, GitHub, Vercel, Render)
  - Direct links to API key documentation pages
  - Improved provider card usability

- **Landing Page Features Section**
  - Six feature cards showcasing core capabilities
  - Features: AI-Powered Chat, GitHub Integration, One-Click Deploy, Skills System, Local & Private, Multi-Provider Support
  - Staggered animations for visual appeal
  - Icons, titles, and descriptions for each feature

- **Brainstorm and Plan Quick Actions**
  - Added brainstorm and plan buttons to chat page toolbar
  - Matching functionality from landing page
  - Quick access to specialized skill workflows

### Changed
- **Navigation Improvements**
  - Removed "Chat" button from landing page top navigation
  - Reduced visual crowding
  - Landing page chat input already directs to actual chat page

- **Repository Dropdown**
  - "Create New Repository" option moved to top of menu
  - Added visual separator for better UX
  - Consistent across landing page and chat page

- **Send Button Styling**
  - Updated to black background with white text (both light and dark themes)
  - Consistent visual appearance

### Fixed
- **SkillsManager Component Error**
  - Fixed "Cannot read properties of undefined (reading 'name')" error
  - API now returns full Skill structure with nested metadata
  - Updated `/api/skills` and `/api/skills/[name]` routes

- **CSS @import Rule Warning**
  - Moved Google Fonts @import before Tailwind directives
  - Resolves "Define @import rules at the top of the stylesheet" warning

- **Electron Content Security Policy Violations**
  - Updated CSP in `public/electron.js` to allow SVG data URLs
  - Fixed `object-src 'none'` → `object-src 'self' blob: data:`
  - Fixed `frame-src` to include `data:` support
  - Added `ELECTRON_DISABLE_SECURITY_WARNINGS` to suppress expected warnings

- **Textarea Focus Border Boldness**
  - Fixed border getting bold on focus in both chat and landing page
  - Added `focus:!outline-none focus:!ring-0` to override global CSS
  - Consistent border appearance when typing

- **YAML Syntax Errors in Skills**
  - Fixed invalid `or` syntax in code-review and explain skill files
  - Changed from quoted strings to proper YAML boolean operators

- **Hover Effects Removed**
  - Removed `hover:shadow-lg` from settings provider cards
  - Removed rotating cards background effect
  - Removed hover glow effect for cleaner UI

### Technical
- **Cross-Platform Compatibility**
  - Updated `poseidon.sh` to use dynamic path detection
  - Works on Linux, macOS, and any Unix-like system
  - No more hardcoded macOS-specific paths

- **API Route Improvements**
  - New `/api/settings/custom-providers` endpoint
  - Improved error handling and response structures
  - Better skill metadata handling

- **Documentation**
  - Created comprehensive `README.md` with installation, usage, and configuration
  - Created `docs/skills.md` user-facing skills documentation
  - Created `~/.poseidon/skills/README.md` developer skills guide

## [1.1.0] - 2026-01-12

### Added
- **Ollama Retry/Refresh Button**: Added a retry connection button when Ollama is offline or models fail to load
  - Appears in warning banners when Ollama connection fails
  - Allows users to retry without refreshing the page
  - Shows loading state while retrying

- **API Usage Tracking**: New comprehensive API usage tracking system
  - Tracks usage per provider (Claude, OpenAI, OpenRouter, Ollama)
  - Shows daily, weekly, and monthly usage statistics
  - Color-coded progress indicators (green/amber/red based on limits)
  - Persistent storage across sessions
  - Expandable panel showing all providers' usage
  - Provider-specific limit information and notes
  - Last request timestamp for each provider
  - Reset functionality to clear usage history

- **API Usage Display Component**: New compact usage indicator in the chat interface
  - Shows current provider usage in the top bar
  - Mobile-optimized banner display
  - Expandable detailed panel with all providers

### Changed
- Improved Ollama error handling with actionable retry options
- Better mobile responsiveness for new features
- Added scale-in animation for dropdown panels

### Technical
- New `ApiUsageContext` for centralized usage tracking
- New `ApiUsageDisplay` component with compact and expanded views
- Usage data persisted to localStorage with 30-day retention
- Automatic cleanup of old usage records

## [1.0.0] - Initial Release

### Features
- AI-powered chat interface with multiple model support
- GitHub repository integration (browse, commit, deploy)
- Vercel deployment with auto-retry strategies
- Multi-provider support: Claude, OpenAI, OpenRouter, Ollama
- Chat history with session management
- File attachments (images and text files)
- Dark mode support
- Mobile-responsive design
