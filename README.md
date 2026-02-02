# Poseidon

**AI-powered web development command center** for planning, building, and deploying applications with confidence.

![Poseidon](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey)

Poseidon is a cyber-styled AI development environment that combines powerful chat capabilities with GitHub integration, one-click deployment, and a specialized skill system for accelerated development workflows.

## 🚀 Quick Start - One-Click Installation

**Linux Debian/Ubuntu:**

```bash
curl -fsSL https://raw.githubusercontent.com/raynaythegreat/Poseidon/main/install.sh | bash
```

**macOS:**

```bash
curl -fsSL https://raw.githubusercontent.com/raynaythegreat/Poseidon/main/install-mac.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/raynaythegreat/Poseidon/main/install.ps1 | iex
```

All installers will:
- ✅ Install Node.js if needed
- ✅ Fetch the latest version from GitHub
- ✅ Install all dependencies
- ✅ Build for production
- ✅ Create desktop/application menu shortcuts
- ✅ Launch the Electron desktop app automatically

**After installation**, the Poseidon desktop app window will open automatically.

---

**Manual Installation (Any Platform):**

```bash
# Clone the repository
git clone https://github.com/raynaythegreat/Poseidon.git
cd Poseidon

# Install dependencies
npm install

# Start the app
./poseidon.sh start
```

---

## Features

### AI-Powered Development
- Multi-provider support: Claude, OpenAI, Gemini, Groq, OpenRouter, Fireworks, and Ollama
- Context-aware conversations with persistent chat history
- File attachments (images and text files) for richer context
- Custom provider support for self-hosted or specialized models

### Specialized Skills System
Use slash commands for specialized workflows:
- `/brainstorm` - Interactive idea exploration and requirements gathering
- `/plan` - Structured implementation planning with task breakdown
- `/explain` - Code explanations and technical concepts
- `/code-review` - Automated code review with actionable feedback

### GitHub Integration
- Browse and manage your repositories
- Apply AI-generated changes directly to your codebase
- Automatic commits with descriptive messages
- Create pull requests seamlessly

### One-Click Deployment
- Deploy to Vercel or Render with a single click
- Auto-retry strategies for failed deployments
- Monitor deployment status in real-time

### Developer Experience
- Dark mode support with Poseidon Aegean theme
- Mobile-responsive design
- API usage tracking with daily/weekly/monthly statistics
- Cross-platform desktop app (Linux, macOS, Windows)
- Local & private mode with Ollama support

## Screenshots

<!-- Add your screenshots here -->
> *Coming soon - AI chat interface, GitHub integration, deployment workflow*

## Installation

### Prerequisites
- Node.js 18+ and npm
- Git (for GitHub integration)
- (Optional) Ollama for local AI models

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/raynaythegreat/poseidon.git
   cd poseidon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API keys**

   Create a `.env.local` file in the root directory (or copy `.env.example`):
   ```bash
   # Claude (Anthropic)
   CLAUDE_API_KEY=your_key_here

   # OpenAI
   OPENAI_API_KEY=your_key_here

   # Gemini (Google AI)
   GOOGLE_API_KEY=your_key_here

   # Groq
   GROQ_API_KEY=your_key_here

   # OpenRouter
   OPENROUTER_API_KEY=your_key_here

   # Fireworks
   FIREWORKS_API_KEY=your_key_here

   # Ollama (local)
   OLLAMA_BASE_URL=http://localhost:11434

   # GitHub
   GITHUB_TOKEN=ghp_your_token_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open Poseidon**
   - **Option A:** Run `./poseidon.sh start` to launch the Electron desktop app
   - **Option B:** Navigate to [http://localhost:1998](http://localhost:1998) in your browser

## Usage

### Chat with AI
Simply type your question or describe what you want to build. Poseidon supports:
- Code generation and debugging
- Technical explanations
- Architecture discussions
- File attachments for context

### Using Skills
Type `/` to access specialized skills:

**Brainstorm Mode**
```
/brainstorm
I want to build a task management app
```

**Plan Mode**
```
/plan
Create a REST API with Node.js and Express
```

**Explain**
```
/explain
How does React useEffect work?
```

**Code Review**
```
/code-review
Review my component for best practices
```

### GitHub Integration
1. Click the repo selector in the chat toolbar
2. Select or create a repository
3. Poseidon can now read files, apply changes, and create commits

### Deployment
1. Click "Deploy" in the navigation
2. Select Vercel or Render
3. Configure your project
4. Click "Deploy" and monitor progress

### Custom Providers
Add custom AI providers in Settings:
1. Navigate to Settings → Custom Providers
2. Click "Add Custom Provider"
3. Enter provider name, base URL, and API key
4. Custom providers are saved to `.env.local` automatically

## Configuration

### Environment Variables
See `.env.example` for all available configuration options:
- AI provider API keys
- GitHub personal access token
- Ollama base URL
- Vercel/Render API tokens

### Ollama Setup
For local AI models:
```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull codellama
ollama pull llama2
```

Then set `OLLAMA_BASE_URL=http://localhost:11434` in your `.env.local`.

## Development

### Project Structure
```
poseidon/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── chat/              # Chat page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── chat/             # Chat components
│   ├── settings/         # Settings components
│   └── ui/               # UI components
├── contexts/             # React contexts
├── docs/                 # Documentation
├── lib/                  # Utilities
├── public/               # Static files
└── skills/               # User skills directory
```

### Running Locally
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Shell Script Management
```bash
# Start all services (dev server + Electron)
./poseidon.sh start

# Stop all services
./poseidon.sh stop

# Restart services
./poseidon.sh restart
```

## Building for Distribution

### Desktop App (Electron)
Build desktop applications for all platforms:

```bash
# Build for current platform
npm run dist

# Build for specific platforms
npm run dist:mac    # macOS (DMG, x64 + arm64)
npm run dist:win    # Windows (NSIS, x64)
npm run dist:linux  # Linux (AppImage, x64)
```

Built artifacts are placed in the `dist/` directory.

### Linux Installation
```bash
# Build AppImage
npm run dist:linux

# Install
chmod +x dist/Poseidon-1.0.0.AppImage
./dist/Poseidon-1.0.0.AppImage --install
```

### macOS Installation
```bash
# Build DMG
npm run dist:mac

# Open DMG and drag to Applications
open dist/Poseidon-1.0.0.dmg
```

### Windows Installation
```bash
# Build installer
npm run dist:win

# Run the installer
dist\Poseidon Setup 1.0.0.exe
```

## Cross-Platform Support

Poseidon supports three major platforms with one-click installers:

| Platform | Installer Command | Status |
|----------|-------------------|--------|
| Linux Debian/Ubuntu | `curl ...install.sh \| bash` | ✅ Full support |
| macOS | `curl ...install-mac.sh \| bash` | ✅ Full support |
| Windows | `irm ...install.ps1 \| iex` | ✅ Full support |

### Production Binaries

Production builds are available as downloadable binaries from [GitHub Releases](https://github.com/raynaythegreat/Poseidon/releases):

| Platform | Format |
|----------|--------|
| Linux | AppImage, deb, rpm |
| macOS | DMG (Intel + Apple Silicon) |
| Windows | NSIS Installer |

## API Usage Tracking

Poseidon tracks your API usage across providers:
- **Daily/Weekly/Monthly** statistics per provider
- **Progress indicators** based on typical limits
- **Last request** timestamps
- **Reset functionality** to clear history

View usage in Settings → API Usage.

## Troubleshooting

### Ollama Connection Issues
If Ollama models fail to load:
1. Check Ollama is running: `ps aux | grep ollama`
2. Verify base URL: `curl http://localhost:11434/api/tags`
3. Click "Retry Connection" in the warning banner

### GitHub Token Permissions
Your GitHub token needs these scopes:
- `repo` (full repository access)
- `user:email` (read user email)

### CSP Warnings (Electron)
Content Security Policy warnings in Electron are expected and can be safely ignored. The app uses `unsafe-inline` and `unsafe-eval` for React/Next.js functionality.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to the main branch.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Desktop app powered by [Electron](https://www.electronjs.org/)
- AI providers: [Anthropic](https://www.anthropic.com/), [OpenAI](https://openai.com/), [Google](https://ai.google.dev/), [Groq](https://groq.com/), and more
- Deployment: [Vercel](https://vercel.com/), [Render](https://render.com/)

---

**Made with ❤️ by raynaythegreat**

Ship apps with the speed of thought. ⚡
