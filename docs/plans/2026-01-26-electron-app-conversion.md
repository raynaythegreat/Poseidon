# Electron App Conversion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert Poseidon (Next.js app) into a cross-platform Electron app (Linux, Windows, macOS) that bundles and auto-installs Ollama + ngrok, maintains full Vercel deployment compatibility, and provides a desktop-first experience.

**Architecture:**
- Use Next.js standalone output with Electron via `next-electron` or custom Electron main process
- Bundle Ollama binaries for each platform, auto-install on first launch
- Include ngrok binary, configure autostart with detected/supplied auth token
- Preserve all API routes for Vercel compatibility (app runs as web OR desktop)
- Use electron-builder for cross-platform packaging

**Tech Stack:**
- Electron (latest stable), electron-builder
- Next.js standalone output mode
- Platform-specific Ollama binary bundling
- IPC for Electron main/renderer communication
- Cross-platform node modules (node-fetch, fs-extra)

---

## Task 1: Project Structure Setup

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `electron/forge.config.ts`
- Create: `electron/installers/ollama.ts`
- Create: `electron/installers/ngrok.ts`
- Create: `electron/utils/ollama-manager.ts`
- Create: `electron/utils/ngrok-manager.ts`
- Create: `electron/ipc/handlers.ts`
- Create: `electron/ipc/index.ts`
- Modify: `package.json`
- Create: `.env.example`

**Step 1: Initialize Electron dependencies**

Run: `npm install --save-dev electron electron-builder @electron-forge/cli @electron-forge/maker-squirrel @electron-forge/maker-zip @electron-forge/maker-deb @electron-forge/maker-rpm @electron-forge/maker-dmg @types/electron`

Run: `npm install electron-serve cross-env`

Expected: Packages added to package.json devDependencies

**Step 2: Create package.json configuration**

Modify `package.json` - add Electron-specific scripts and config:

```json
{
  "name": "poseidon",
  "main": ".webpack/main",
  "version": "1.0.0",
  "description": "Cyber-styled AI dev command center with GitHub and deployment workflows",
  "scripts": {
    "dev": "next dev -p 1998",
    "dev:electron": "cross-env NODE_ENV=development electron-forge start",
    "build": "next build",
    "build:electron": "electron-forge package",
    "build:electron:all": "electron-forge make",
    "start": "next start -p 1998",
    "lint": "next lint",
    "sync-ngrok": "bash scripts/sync-ngrok.sh",
    "watch-ngrok": "node scripts/watch-ngrok.js",
    "postinstall": "electron-builder install-app-deps"
  },
  "config": {
    "forge": "./electron/forge.config.js"
  },
  "build": {
    "appId": "com.poseidon.app",
    "productName": "Poseidon",
    "directories": {
      "output": "dist",
      "buildResources": "electron/build-resources"
    },
    "files": [
      ".next/**",
      "electron/**",
      "node_modules/**",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "electron/binaries/ollama",
        "to": "ollama",
        "filter": ["**/*"]
      },
      {
        "from": "electron/binaries/ngrok",
        "to": "ngrok",
        "filter": ["**/*"]
      }
    ],
    "mac": {
      "category": "public.app-category.developer-tools",
      "hardenedRuntime": true,
      "poseidonerAssess": false,
      "entitlements": "electron/build-resources/entitlements.mac.plist",
      "entitlementsInherit": "electron/build-resources/entitlements.mac.plist",
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        }
      ]
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "arm64"]
        }
      ]
    },
    "linux": {
      "target": [
        {
          "target": "AppImage",
          "arch": ["x64"]
        },
        {
          "target": "deb",
          "arch": ["x64"]
        }
      ],
      "category": "Development"
    }
  }
}
```

Run: `npm install`

Expected: Dependencies installed

**Step 3: Create Electron main process**

Create `electron/main.ts`:

```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc';
import { OllamaManager } from './utils/ollama-manager';
import { NgrokManager } from './utils/ngrok-manager';

let mainWindow: BrowserWindow | null = null;
const ollamaManager = new OllamaManager();
const ngrokManager = new NgrokManager();

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    title: 'Poseidon',
    backgroundColor: '#0a0a0f',
    show: false,
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:1998');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../.next/server/app/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    initializeServices();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeServices() {
  try {
    // Initialize Ollama (install if needed)
    await ollamaManager.initialize();

    // Initialize ngrok (install if needed)
    await ngrokManager.initialize();

    // Start ngrok tunnel to Ollama
    const tunnelUrl = await ngrokManager.startTunnel(11434);

    if (mainWindow) {
      mainWindow.webContents.send('services-ready', {
        ollama: true,
        ngrok: true,
        tunnelUrl
      });
    }
  } catch (error) {
    console.error('Failed to initialize services:', error);
    if (mainWindow) {
      mainWindow.webContents.send('services-error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

app.whenReady().then(() => {
  registerIpcHandlers(ipcMain, ollamaManager, ngrokManager);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await ngrokManager.stopTunnel();
  await ollamaManager.stop();
});

export { mainWindow };
```

**Step 4: Create Electron preload script**

Create `electron/preload.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Ollama operations
  ollamaStatus: () => ipcRenderer.invoke('ollama:get-status'),
  ollamaInstall: () => ipcRenderer.invoke('ollama:install'),
  ollamaPullModel: (model: string) => ipcRenderer.invoke('ollama:pull-model', model),
  ollamaListModels: () => ipcRenderer.invoke('ollama:list-models'),

  // Ngrok operations
  ngrokStatus: () => ipcRenderer.invoke('ngrok:get-status'),
  ngrokStart: (port: number) => ipcRenderer.invoke('ngrok:start-tunnel', port),
  ngrokStop: () => ipcRenderer.invoke('ngrok:stop-tunnel'),
  ngrokSetToken: (token: string) => ipcRenderer.invoke('ngrok:set-auth-token', token),

  // Platform info
  platform: process.platform,
  arch: process.arch,
  version: process.versions.electron,

  // Events
  onServicesReady: (callback: (data: any) => void) => {
    ipcRenderer.on('services-ready', (_event, data) => callback(data));
  },
  onServicesError: (callback: (data: any) => void) => {
    ipcRenderer.on('services-error', (_event, data) => callback(data));
  },

  // App info
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  getAppPath: () => ipcRenderer.invoke('app:get-path'),
});

export type ElectronAPI = typeof window.electronAPI;
```

**Step 5: Create IPC handlers**

Create `electron/ipc/handlers.ts`:

```typescript
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { OllamaManager } from '../utils/ollama-manager';
import { NgrokManager } from '../utils/ngrok-manager';

export function registerIpcHandlers(
  ipcMain: typeof ipcMain,
  ollamaManager: OllamaManager,
  ngrokManager: NgrokManager
) {
  // Ollama handlers
  ipcMain.handle('ollama:get-status', async () => {
    return await ollamaManager.getStatus();
  });

  ipcMain.handle('ollama:install', async () => {
    return await ollamaManager.install();
  });

  ipcMain.handle('ollama:pull-model', async (_event: IpcMainInvokeEvent, model: string) => {
    return await ollamaManager.pullModel(model, (progress) => {
      // Emit progress event
      if (mainWindow) {
        mainWindow.webContents.send('ollama:pull-progress', { model, progress });
      }
    });
  });

  ipcMain.handle('ollama:list-models', async () => {
    return await ollamaManager.listModels();
  });

  // Ngrok handlers
  ipcMain.handle('ngrok:get-status', async () => {
    return await ngrokManager.getStatus();
  });

  ipcMain.handle('ngrok:start-tunnel', async (_event: IpcMainInvokeEvent, port: number) => {
    return await ngrokManager.startTunnel(port);
  });

  ipcMain.handle('ngrok:stop-tunnel', async () => {
    return await ngrokManager.stopTunnel();
  });

  ipcMain.handle('ngrok:set-auth-token', async (_event: IpcMainInvokeEvent, token: string) => {
    return await ngrokManager.setAuthToken(token);
  });

  // App handlers
  ipcMain.handle('app:get-version', () => {
    return process.versions.electron;
  });

  ipcMain.handle('app:get-path', () => {
    return app.getAppPath();
  });
}
```

**Step 6: Create IPC index**

Create `electron/ipc/index.ts`:

```typescript
export { registerIpcHandlers } from './handlers';
```

**Step 7: Create Electron Forge config**

Create `electron/forge.config.ts`:

```typescript
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Poseidon',
    executableName: 'poseidon',
    icon: './electron/build-resources/icon',
    asar: true,
    extraResource: [
      './electron/binaries/ollama',
      './electron/binaries/ngrok',
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'poseidon',
      setupIcon: './electron/build-resources/icon.ico',
    }),
    new MakerZIP({}, ['darwin', 'win32']),
    new MakerDMG({
      format: 'ULFO',
      background: './electron/build-resources/dmg-background.png',
      icon: './electron/build-resources/icon.icns',
    }),
    new MakerDeb({
      options: {
        maintainer: 'raynaythegreat',
        homepage: 'https://github.com/raynaythegreat/poseidon',
      },
    }),
    new MakerRpm({
      options: {
        homepage: 'https://github.com/raynaythegreat/poseidon',
      },
    }),
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig: './electron/webpack.main.config.js',
      renderer: {
        config: './electron/webpack.renderer.config.js',
        entryPoints: [
          {
            html: './electron/_redirect.html',
            js: './electron/renderer.ts',
            name: 'main_window',
            preload: {
              js: './electron/preload.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default config;
```

**Step 6: Commit**

```bash
git add package.json electron/
git commit -m "feat: initialize Electron project structure"
```

---

## Task 2: Ollama Manager Implementation

**Files:**
- Create: `electron/utils/ollama-manager.ts`
- Create: `electron/installers/ollama.ts`
- Create: `electron/binaries/.gitkeep`

**Step 1: Create Ollama installer**

Create `electron/installers/ollama.ts`:

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface OllamaInstallOptions {
  platform: string;
  arch: string;
  targetDir: string;
  onProgress?: (stage: string, percent: number) => void;
}

export class OllamaInstaller {
  private downloadUrls = {
    darwin: {
      arm64: 'https://ollama.com/download/ollama-darwin-arm64',
      x64: 'https://ollama.com/download/ollama-darwin',
    },
    win32: {
      x64: 'https://ollama.com/download/OllamaSetup.exe',
      arm64: 'https://ollama.com/download/OllamaSetup-arm64.exe',
    },
    linux: {
      x64: 'https://ollama.com/download/ollama-linux-amd64',
      arm64: 'https://ollama.com/download/ollama-linux-arm64',
    },
  };

  async install(options: OllamaInstallOptions): Promise<string> {
    const { platform, arch, targetDir, onProgress } = options;

    onProgress?.('Preparing installation', 0);
    await fs.mkdir(targetDir, { recursive: true });

    const url = this.downloadUrls[platform as keyof typeof this.downloadUrls]?.[arch as keyof typeof this.downloadUrls.darwin];

    if (!url) {
      throw new Error(`Unsupported platform/arch: ${platform}/${arch}`);
    }

    const filename = this.getFilename(platform, arch);
    const targetPath = path.join(targetDir, filename);

    // Check if already installed
    try {
      await fs.access(targetPath);
      await this.makeExecutable(targetPath, platform);
      onProgress?.('Already installed', 100);
      return targetPath;
    } catch {
      // Not installed, proceed
    }

    onProgress?.('Downloading Ollama...', 10);
    await this.downloadFile(url, targetPath, (percent) => {
      onProgress?.('Downloading...', 10 + percent * 0.8);
    });

    onProgress?.('Installing...', 90);
    await this.makeExecutable(targetPath, platform);

    onProgress?.('Complete', 100);
    return targetPath;
  }

  private getFilename(platform: string, arch: string): string {
    if (platform === 'win32') {
      return arch === 'arm64' ? 'OllamaSetup-arm64.exe' : 'OllamaSetup.exe';
    }
    return platform === 'darwin' ? 'ollama' : 'ollama-linux';
  }

  private downloadFile(url: string, targetPath: string, onProgress: (percent: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const file = require('fs').createWriteStream(targetPath);
      let totalBytes = 0;
      let downloadedBytes = 0;

      protocol.get(url, (response: any) => {
        totalBytes = parseInt(response.headers['content-length'], 10);

        response.pipe(file);

        response.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length;
          onProgress(downloadedBytes / totalBytes);
        });

        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err: any) => {
        require('fs').unlink(targetPath, () => {});
        reject(err);
      });
    });
  }

  private async makeExecutable(filePath: string, platform: string): Promise<void> {
    if (platform !== 'win32') {
      await fs.chmod(filePath, '755');
    }
  }
}
```

**Step 2: Create Ollama manager**

Create `electron/utils/ollama-manager.ts`:

```typescript
import * as path from 'path';
import { app } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import { OllamaInstaller } from '../installers/ollama';
import * as fs from 'fs/promises';
import * as os from 'os';

export interface OllamaStatus {
  installed: boolean;
  running: boolean;
  version?: string;
  binaryPath?: string;
  models: string[];
}

export class OllamaManager {
  private process: ChildProcess | null = null;
  private installer = new OllamaInstaller();
  private binaryPath: string | null = null;
  private readonly binaryDir: string;

  constructor() {
    this.binaryDir = path.join(app.getPath('userData'), 'binaries');
  }

  async initialize(): Promise<void> {
    // Check if Ollama is installed
    const status = await this.getStatus();

    if (!status.installed) {
      await this.install();
    }

    if (!status.running) {
      await this.start();
    }
  }

  async getStatus(): Promise<OllamaStatus> {
    const binaryPath = await this.findBinary();
    const models = await this.listModels();

    return {
      installed: !!binaryPath,
      running: await this.isRunning(),
      version: binaryPath ? await this.getVersion(binaryPath) : undefined,
      binaryPath: binaryPath || undefined,
      models,
    };
  }

  async install(): Promise<string> {
    const platform = process.platform;
    const arch = process.arch;

    this.binaryPath = await this.installer.install({
      platform,
      arch,
      targetDir: this.binaryDir,
      onProgress: (stage, percent) => {
        console.log(`[Ollama Install] ${stage}: ${Math.round(percent * 100)}%`);
      },
    });

    return this.binaryPath;
  }

  async start(): Promise<void> {
    const binaryPath = await this.findBinary();
    if (!binaryPath) {
      throw new Error('Ollama not installed');
    }

    if (await this.isRunning()) {
      return; // Already running
    }

    return new Promise((resolve, reject) => {
      this.process = spawn(binaryPath, ['serve'], {
        detached: true,
        stdio: 'ignore',
      });

      this.process.unref();

      // Wait for Ollama to be ready
      const checkReady = async () => {
        try {
          const response = await fetch('http://127.0.0.1:11434/api/tags');
          if (response.ok) {
            resolve();
          } else {
            setTimeout(checkReady, 500);
          }
        } catch {
          setTimeout(checkReady, 500);
        }
      };

      setTimeout(checkReady, 1000);

      this.process.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  async pullModel(model: string, onProgress?: (progress: number) => void): Promise<void> {
    const binaryPath = await this.findBinary();
    if (!binaryPath) {
      throw new Error('Ollama not installed');
    }

    return new Promise((resolve, reject) => {
      const process = spawn(binaryPath, ['pull', model]);

      process.stderr.on('data', (data) => {
        // Parse progress from stderr
        const match = data.toString().match(/(\d+)%/);
        if (match) {
          onProgress?.(parseInt(match[1], 10) / 100);
        }
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to pull model: exit code ${code}`));
        }
      });
    });
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch('http://127.0.0.1:11434/api/tags');
      if (!response.ok) return [];

      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }

  private async findBinary(): Promise<string | null> {
    // Check stored path first
    if (this.binaryPath) {
      try {
        await fs.access(this.binaryPath);
        return this.binaryPath;
      } catch {
        this.binaryPath = null;
      }
    }

    // Check system paths
    const possiblePaths = this.getSystemBinaryPaths();
    for (const testPath of possiblePaths) {
      try {
        await fs.access(testPath);
        this.binaryPath = testPath;
        return testPath;
      } catch {
        continue;
      }
    }

    // Check installed binaries directory
    const platform = process.platform;
    const arch = process.arch;
    const filename = this.getBinaryFilename(platform, arch);
    const installedPath = path.join(this.binaryDir, filename);

    try {
      await fs.access(installedPath);
      this.binaryPath = installedPath;
      return installedPath;
    } catch {
      return null;
    }
  }

  private getSystemBinaryPaths(): string[] {
    const platform = process.platform;

    if (platform === 'darwin') {
      return [
        '/usr/local/bin/ollama',
        '/opt/homebrew/bin/ollama',
      ];
    } else if (platform === 'linux') {
      return [
        '/usr/local/bin/ollama',
        '/usr/bin/ollama',
      ];
    } else if (platform === 'win32') {
      return [
        path.join(process.env.PROGRAMFILES || '', 'Ollama', 'ollama.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Ollama', 'ollama.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Ollama', 'ollama.exe'),
      ];
    }

    return [];
  }

  private getBinaryFilename(platform: string, arch: string): string {
    if (platform === 'win32') {
      return arch === 'arm64' ? 'OllamaSetup-arm64.exe' : 'OllamaSetup.exe';
    }
    return 'ollama';
  }

  private async isRunning(): Promise<boolean> {
    try {
      const response = await fetch('http://127.0.0.1:11434/api/tags');
      return response.ok;
    } catch {
      return false;
    }
  }

  private async getVersion(binaryPath: string): Promise<string | undefined> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const { stdout } = await execAsync(`"${binaryPath}" --version`);
      const match = stdout.match(/version is ([0-9.]+)/);
      return match?.[1];
    } catch {
      return undefined;
    }
  }
}
```

**Step 3: Create binaries directory placeholder**

Create `electron/binaries/.gitkeep`:

```
# Ollama and ngrok binaries will be downloaded here during build
# These are large binary files and should not be committed to git
```

**Step 4: Commit**

```bash
git add electron/
git commit -m "feat: implement Ollama manager with auto-install"
```

---

## Task 3: Ngrok Manager Implementation

**Files:**
- Create: `electron/utils/ngrok-manager.ts`
- Create: `electron/installers/ngrok.ts`

**Step 1: Create Ngrok installer**

Create `electron/installers/ngrok.ts`:

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { extract } from 'tar';
import { https } from 'follow-redirects';
import * as zlib from 'zlib';

export interface NgrokInstallOptions {
  platform: string;
  arch: string;
  targetDir: string;
  onProgress?: (stage: string, percent: number) => void;
}

export class NgrokInstaller {
  private downloadUrls = {
    darwin: {
      arm64: 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-arm64.tgz',
      x64: 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.tgz',
    },
    win32: {
      x64: 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip',
      arm64: 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-arm64.zip',
    },
    linux: {
      x64: 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz',
      arm64: 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz',
    },
  };

  async install(options: NgrokInstallOptions): Promise<string> {
    const { platform, arch, targetDir, onProgress } = options;

    onProgress?.('Preparing installation', 0);
    await fs.mkdir(targetDir, { recursive: true });

    const url = this.downloadUrls[platform as keyof typeof this.downloadUrls]?.[arch as keyof typeof this.downloadUrls.darwin];

    if (!url) {
      throw new Error(`Unsupported platform/arch: ${platform}/${arch}`);
    }

    const binaryName = platform === 'win32' ? 'ngrok.exe' : 'ngrok';
    const targetPath = path.join(targetDir, binaryName);

    // Check if already installed
    try {
      await fs.access(targetPath);
      await this.makeExecutable(targetPath, platform);
      onProgress?.('Already installed', 100);
      return targetPath;
    } catch {
      // Not installed, proceed
    }

    onProgress?.('Downloading ngrok...', 10);

    const downloadPath = path.join(targetDir, `ngrok-${platform}-${arch}${platform === 'win32' ? '.zip' : '.tgz'}`);
    await this.downloadFile(url, downloadPath, (percent) => {
      onProgress?.('Downloading...', 10 + percent * 0.7);
    });

    onProgress?.('Extracting...', 80);
    await this.extract(downloadPath, targetDir, platform);
    await fs.unlink(downloadPath);

    const extractedPath = path.join(targetDir, binaryName);
    await this.makeExecutable(extractedPath, platform);

    onProgress?.('Complete', 100);
    return extractedPath;
  }

  private downloadFile(url: string, targetPath: string, onProgress: (percent: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(targetPath);
      let totalBytes = 0;
      let downloadedBytes = 0;

      https.get(url, (response: any) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          this.downloadFile(response.headers.location, targetPath, onProgress)
            .then(resolve)
            .catch(reject);
          return;
        }

        totalBytes = parseInt(response.headers['content-length'], 10);

        response.pipe(file);

        response.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            onProgress(downloadedBytes / totalBytes);
          }
        });

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err: any) => {
          require('fs').unlink(targetPath, () => {});
          reject(err);
        });
      }).on('error', reject);
    });
  }

  private async extract(archivePath: string, targetDir: string, platform: string): Promise<void> {
    if (platform === 'win32') {
      // Use a simple unzip implementation or require a package
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(archivePath);
      zip.extractAllTo(targetDir, true);
    } else {
      // Extract tar.gz
      await extract({
        file: archivePath,
        cwd: targetDir,
        strip: 1, // Remove the top-level directory
      });
    }
  }

  private async makeExecutable(filePath: string, platform: string): Promise<void> {
    if (platform !== 'win32') {
      await fs.chmod(filePath, '755');
    }
  }
}
```

**Step 2: Create Ngrok manager**

Create `electron/utils/ngrok-manager.ts`:

```typescript
import * as path from 'path';
import { app } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import { NgrokInstaller } from '../installers/ngrok';
import * as fs from 'fs/promises';
import * as os from 'os';

export interface NgrokStatus {
  installed: boolean;
  running: boolean;
  tunnelUrl?: string;
  authToken?: boolean;
  binaryPath?: string;
}

export class NgrokManager {
  private process: ChildProcess | null = null;
  private installer = new NgrokInstaller();
  private binaryPath: string | null = null;
  private currentTunnelUrl: string | null = null;
  private readonly binaryDir: string;
  private readonly configPath: string;

  constructor() {
    this.binaryDir = path.join(app.getPath('userData'), 'binaries');
    this.configPath = path.join(app.getPath('userData'), 'ngrok.yml');
  }

  async initialize(): Promise<void> {
    const status = await this.getStatus();

    if (!status.installed) {
      await this.install();
    }

    // Check for auth token
    const hasToken = await this.hasAuthToken();
    if (!hasToken) {
      console.warn('Ngrok auth token not set. Please set your auth token.');
    }
  }

  async getStatus(): Promise<NgrokStatus> {
    const binaryPath = await this.findBinary();

    return {
      installed: !!binaryPath,
      running: this.process !== null,
      tunnelUrl: this.currentTunnelUrl || undefined,
      authToken: await this.hasAuthToken(),
      binaryPath: binaryPath || undefined,
    };
  }

  async install(): Promise<string> {
    const platform = process.platform;
    const arch = process.arch;

    this.binaryPath = await this.installer.install({
      platform,
      arch,
      targetDir: this.binaryDir,
      onProgress: (stage, percent) => {
        console.log(`[Ngrok Install] ${stage}: ${Math.round(percent * 100)}%`);
      },
    });

    return this.binaryPath;
  }

  async startTunnel(port: number, authToken?: string): Promise<string> {
    const binaryPath = await this.findBinary();
    if (!binaryPath) {
      throw new Error('Ngrok not installed');
    }

    if (authToken) {
      await this.setAuthToken(authToken);
    }

    // Stop existing tunnel if running
    if (this.process) {
      await this.stopTunnel();
    }

    return new Promise((resolve, reject) => {
      const configArgs = [
        'tunnel',
        '--log', 'stdout',
        '--scheme', 'http',
        `http://localhost:${port}`
      ];

      this.process = spawn(binaryPath, configArgs, {
        env: {
          ...process.env,
          NGROK_CONFIG_PATH: this.configPath,
        },
      });

      let tunnelUrl = '';

      this.process.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log('[Ngrok]', output);

        // Parse tunnel URL from output
        const urlMatch = output.match(/https?:\/\/[a-z0-9\-]+\.ngrok(-[a-z]+)?\.io/);
        if (urlMatch && !tunnelUrl) {
          tunnelUrl = urlMatch[0];
          this.currentTunnelUrl = tunnelUrl;
          resolve(tunnelUrl);
        }
      });

      this.process.stderr?.on('data', (data) => {
        console.error('[Ngrok Error]', data.toString());
      });

      this.process.on('error', (err) => {
        console.error('[Ngrok Process Error]', err);
        reject(err);
      });

      this.process.on('close', (code) => {
        console.log(`[Ngrok] Process exited with code ${code}`);
        this.process = null;
        if (!tunnelUrl && code !== 0) {
          reject(new Error(`Ngrok exited with code ${code}`));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!tunnelUrl) {
          this.process?.kill();
          reject(new Error('Timeout waiting for ngrok tunnel URL'));
        }
      }, 30000);
    });
  }

  async stopTunnel(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.currentTunnelUrl = null;
    }
  }

  async setAuthToken(token: string): Promise<void> {
    const binaryPath = await this.findBinary();
    if (!binaryPath) {
      throw new Error('Ngrok not installed');
    }

    return new Promise((resolve, reject) => {
      const process = spawn(binaryPath, ['config', 'add-authtoken', token]);

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to set auth token: exit code ${code}`));
        }
      });

      process.on('error', reject);
    });
  }

  private async hasAuthToken(): Promise<boolean> {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      return configContent.includes('authtoken');
    } catch {
      return false;
    }
  }

  private async findBinary(): Promise<string | null> {
    if (this.binaryPath) {
      try {
        await fs.access(this.binaryPath);
        return this.binaryPath;
      } catch {
        this.binaryPath = null;
      }
    }

    const binaryName = process.platform === 'win32' ? 'ngrok.exe' : 'ngrok';
    const installedPath = path.join(this.binaryDir, binaryName);

    try {
      await fs.access(installedPath);
      this.binaryPath = installedPath;
      return installedPath;
    } catch {
      return null;
    }
  }
}
```

**Step 3: Install additional dependencies**

Run: `npm install tar adm-zip follow-redirects`

Run: `npm install --save-dev @types/tar`

Expected: Packages added to package.json

**Step 4: Commit**

```bash
git add electron/
git commit -m "feat: implement Ngrok manager with auto-install"
```

---

## Task 4: Frontend Integration - Setup Wizard Component

**Files:**
- Create: `components/electron/SetupWizard.tsx`
- Create: `components/electron/SetupWizard/OllamaSetup.tsx`
- Create: `components/electron/SetupWizard/NgrokSetup.tsx`
- Create: `components/electron/SetupWizard/SetupComplete.tsx`
- Create: `components/electron/SetupWizard/types.ts`

**Step 1: Create types**

Create `components/electron/SetupWizard/types.ts`:

```typescript
export interface ElectronAPI {
  ollamaStatus: () => Promise<OllamaStatus>;
  ollamaInstall: () => Promise<string>;
  ollamaPullModel: (model: string) => Promise<void>;
  ollamaListModels: () => Promise<string[]>;
  ngrokStatus: () => Promise<NgrokStatus>;
  ngrokStart: (port: number) => Promise<string>;
  ngrokStop: () => Promise<void>;
  ngrokSetToken: (token: string) => Promise<void>;
  platform: string;
  arch: string;
  version: string;
  onServicesReady: (callback: (data: ServicesReadyData) => void) => void;
  onServicesError: (callback: (data: ServicesErrorData) => void) => void;
}

export interface OllamaStatus {
  installed: boolean;
  running: boolean;
  version?: string;
  binaryPath?: string;
  models: string[];
}

export interface NgrokStatus {
  installed: boolean;
  running: boolean;
  tunnelUrl?: string;
  authToken?: boolean;
  binaryPath?: string;
}

export interface ServicesReadyData {
  ollama: boolean;
  ngrok: boolean;
  tunnelUrl?: string;
}

export interface ServicesErrorData {
  error: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
```

**Step 2: Create main SetupWizard component**

Create `components/electron/SetupWizard.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import GlassesLogo from "@/components/ui/GlassesLogo";
import OllamaSetup from "./SetupWizard/OllamaSetup";
import NgrokSetup from "./SetupWizard/NgrokSetup";
import SetupComplete from "./SetupWizard/SetupComplete";

type SetupStep = "ollama" | "ngrok" | "complete";

export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState<SetupStep>("ollama");
  const [isElectron, setIsElectron] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if running in Electron
    if (typeof window !== "undefined" && window.electronAPI) {
      setIsElectron(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-sunset flex items-center justify-center shadow-xl animate-gradient ring-1 ring-white/40">
            <GlassesLogo className="w-9 h-9 text-white" />
          </div>
          <div className="text-slate-400 text-sm">Loading Poseidon...</div>
        </div>
      </div>
    );
  }

  if (!isElectron) {
    // Not running in Electron - this shouldn't show the wizard
    return null;
  }

  const handleStepComplete = (step: SetupStep) => {
    const stepOrder: SetupStep[] = ["ollama", "ngrok", "complete"];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-sunset shadow-xl animate-gradient ring-1 ring-white/40 mb-6">
            <GlassesLogo className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Poseidon</h1>
          <p className="text-slate-400">Let's get your AI command center set up</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`flex items-center ${currentStep === "ollama" ? "text-gold-500" : "text-emerald-500"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "ollama" ? "bg-gold-500/20 ring-1 ring-gold-500/50" : "bg-emerald-500/20 ring-1 ring-emerald-500/50"}`}>
              <span className="text-sm font-bold">1</span>
            </div>
            <span className="ml-2 text-sm font-medium">Ollama</span>
          </div>
          <div className="w-12 h-px bg-slate-700" />
          <div className={`flex items-center ${currentStep === "ngrok" ? "text-gold-500" : currentStep === "complete" ? "text-emerald-500" : "text-slate-500"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "ngrok" ? "bg-gold-500/20 ring-1 ring-gold-500/50" : currentStep === "complete" ? "bg-emerald-500/20 ring-1 ring-emerald-500/50" : "bg-slate-700/50 ring-1 ring-slate-600"}`}>
              <span className="text-sm font-bold">2</span>
            </div>
            <span className="ml-2 text-sm font-medium">Ngrok</span>
          </div>
          <div className="w-12 h-px bg-slate-700" />
          <div className={`flex items-center ${currentStep === "complete" ? "text-emerald-500" : "text-slate-500"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "complete" ? "bg-emerald-500/20 ring-1 ring-emerald-500/50" : "bg-slate-700/50 ring-1 ring-slate-600"}`}>
              <span className="text-sm font-bold">3</span>
            </div>
            <span className="ml-2 text-sm font-medium">Complete</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          {currentStep === "ollama" && (
            <OllamaSetup onComplete={() => handleStepComplete("ollama")} />
          )}
          {currentStep === "ngrok" && (
            <NgrokSetup onComplete={() => handleStepComplete("ngrok")} />
          )}
          {currentStep === "complete" && <SetupComplete />}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create OllamaSetup component**

Create `components/electron/SetupWizard/OllamaSetup.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import type { ElectronAPI, OllamaStatus } from "../types";

interface Props {
  onComplete: () => void;
}

export default function OllamaSetup({ onComplete }: Props) {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [isPullingModel, setIsPullingModel] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const electronAPI = typeof window !== "undefined" ? window.electronAPI : undefined;

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    if (!electronAPI) return;

    try {
      const result = await electronAPI.ollamaStatus();
      setStatus(result);

      // If already installed and running, check for models
      if (result.installed && result.running) {
        if (result.models.length > 0) {
          // All setup complete
          onComplete();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check Ollama status");
    }
  };

  const handleInstall = async () => {
    if (!electronAPI) return;

    setIsInstalling(true);
    setError(null);

    try {
      await electronAPI.ollamaInstall();
      setInstallProgress(100);
      await checkStatus();

      // Auto-start after install
      if (status?.installed && !status?.running) {
        // Will auto-start via main process
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Installation failed");
    } finally {
      setIsInstalling(false);
    }
  };

  const handlePullModel = async () => {
    if (!electronAPI) return;

    setIsPullingModel(true);
    setError(null);
    setModelProgress(0);

    try {
      // Pull llama2 as default
      await electronAPI.ollamaPullModel("llama2");
      setModelProgress(100);
      await checkStatus();

      if ((await electronAPI.ollamaStatus()).models.length > 0) {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pull model");
    } finally {
      setIsPullingModel(false);
    }
  };

  if (!status) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-400">Checking Ollama status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Ollama Setup</h2>
        <p className="text-slate-400 text-sm">
          Ollama runs AI models locally on your machine. Poseidon will install it for you.
        </p>
      </div>

      {/* Status Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
          <span className="text-slate-300">Installed</span>
          <span className={`font-medium ${status.installed ? "text-emerald-400" : "text-amber-400"}`}>
            {status.installed ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
          <span className="text-slate-300">Running</span>
          <span className={`font-medium ${status.running ? "text-emerald-400" : "text-amber-400"}`}>
            {status.running ? "Yes" : "No"}
          </span>
        </div>
        {status.installed && status.version && (
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <span className="text-slate-300">Version</span>
            <span className="font-medium text-slate-300">{status.version}</span>
          </div>
        )}
      </div>

      {/* Install Button */}
      {!status.installed && !isInstalling && (
        <button
          onClick={handleInstall}
          className="w-full py-3 px-4 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-gold-500/25"
        >
          Install Ollama
        </button>
      )}

      {/* Install Progress */}
      {isInstalling && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Installing...</span>
            <span className="text-gold-400">{Math.round(installProgress)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-600 to-gold-500 transition-all duration-300"
              style={{ width: `${installProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Pull Model Section */}
      {status.installed && status.running && status.models.length === 0 && !isPullingModel && (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">
            Ollama is ready but you need to download at least one AI model.
          </p>
          <button
            onClick={handlePullModel}
            className="w-full py-3 px-4 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-gold-500/25"
          >
            Download Llama 2 Model
          </button>
        </div>
      )}

      {/* Model Pull Progress */}
      {isPullingModel && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Downloading model...</span>
            <span className="text-gold-400">{Math.round(modelProgress)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-600 to-gold-500 transition-all duration-300"
              style={{ width: `${modelProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">This may take a few minutes (4GB download)</p>
        </div>
      )}

      {/* Models List */}
      {status.installed && status.models.length > 0 && (
        <div className="space-y-2">
          <p className="text-emerald-400 text-sm font-medium">Models installed:</p>
          <ul className="space-y-1">
            {status.models.map((model) => (
              <li key={model} className="text-slate-300 text-sm pl-4">• {model}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Continue Button */}
      {status.installed && status.running && status.models.length > 0 && (
        <button
          onClick={onComplete}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all duration-200"
        >
          Continue
        </button>
      )}
    </div>
  );
}
```

**Step 4: Create NgrokSetup component**

Create `components/electron/SetupWizard/NgrokSetup.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import type { ElectronAPI, NgrokStatus } from "../types";

interface Props {
  onComplete: () => void;
}

export default function NgrokSetup({ onComplete }: Props) {
  const [status, setStatus] = useState<NgrokStatus | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [authToken, setAuthToken] = useState("");
  const [isSettingToken, setIsSettingToken] = useState(false);
  const [isStartingTunnel, setIsStartingTunnel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const electronAPI = typeof window !== "undefined" ? window.electronAPI : undefined;

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    if (!electronAPI) return;

    try {
      const result = await electronAPI.ngrokStatus();
      setStatus(result);

      // If tunnel is already running, proceed
      if (result.running && result.tunnelUrl) {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check ngrok status");
    }
  };

  const handleInstall = async () => {
    if (!electronAPI) return;

    setIsInstalling(true);
    setError(null);

    try {
      await electronAPI.ngrokInstall();
      setInstallProgress(100);
      await checkStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Installation failed");
    } finally {
      setIsInstalling(false);
    }
  };

  const handleSetToken = async () => {
    if (!electronAPI || !authToken.trim()) return;

    setIsSettingToken(true);
    setError(null);

    try {
      await electronAPI.ngrokSetToken(authToken.trim());
      await checkStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set auth token");
    } finally {
      setIsSettingToken(false);
    }
  };

  const handleStartTunnel = async () => {
    if (!electronAPI) return;

    setIsStartingTunnel(true);
    setError(null);

    try {
      const tunnelUrl = await electronAPI.ngrokStart(11434);
      setStatus((prev) => ({ ...prev!, running: true, tunnelUrl }));

      // Wait a moment then proceed
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start tunnel");
      setIsStartingTunnel(false);
    }
  };

  if (!status) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-400">Checking ngrok status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Ngrok Setup</h2>
        <p className="text-slate-400 text-sm">
          Ngrok creates a secure tunnel to your local Ollama, allowing you to access it from Vercel deployments.
        </p>
      </div>

      {/* Status Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
          <span className="text-slate-300">Installed</span>
          <span className={`font-medium ${status.installed ? "text-emerald-400" : "text-amber-400"}`}>
            {status.installed ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
          <span className="text-slate-300">Auth Token</span>
          <span className={`font-medium ${status.authToken ? "text-emerald-400" : "text-amber-400"}`}>
            {status.authToken ? "Set" : "Not Set"}
          </span>
        </div>
        {status.running && status.tunnelUrl && (
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <span className="text-slate-300">Tunnel URL</span>
            <span className="font-mono text-sm text-gold-400">{status.tunnelUrl}</span>
          </div>
        )}
      </div>

      {/* Install Button */}
      {!status.installed && !isInstalling && (
        <button
          onClick={handleInstall}
          className="w-full py-3 px-4 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-gold-500/25"
        >
          Install Ngrok
        </button>
      )}

      {/* Install Progress */}
      {isInstalling && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Installing...</span>
            <span className="text-gold-400">{Math.round(installProgress)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-600 to-gold-500 transition-all duration-300"
              style={{ width: `${installProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Auth Token Input */}
      {status.installed && !status.authToken && !isSettingToken && (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">
            Ngrok requires an auth token. Get yours free at{" "}
            <a href="https://dashboard.ngrok.com/get-started/your-authtoken"
               target="_blank"
               rel="noopener noreferrer"
               className="text-gold-400 hover:text-gold-300 underline">
              dashboard.ngrok.com
            </a>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="Enter your ngrok auth token"
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
            />
            <button
              onClick={handleSetToken}
              disabled={!authToken.trim()}
              className="px-6 py-2 bg-gold-600 hover:bg-gold-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-all duration-200"
            >
              Set Token
            </button>
          </div>
        </div>
      )}

      {/* Setting Token */}
      {isSettingToken && (
        <div className="text-center py-4">
          <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Setting auth token...</p>
        </div>
      )}

      {/* Start Tunnel Button */}
      {status.installed && status.authToken && !status.running && !isStartingTunnel && (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">
            Ready to create a tunnel to your local Ollama (port 11434).
          </p>
          <button
            onClick={handleStartTunnel}
            className="w-full py-3 px-4 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-gold-500/25"
          >
            Start Ngrok Tunnel
          </button>
        </div>
      )}

      {/* Starting Tunnel */}
      {isStartingTunnel && (
        <div className="text-center py-4">
          <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Starting tunnel...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
```

**Step 5: Create SetupComplete component**

Create `components/electron/SetupWizard/SetupComplete.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";

export default function SetupComplete() {
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  const electronAPI = typeof window !== "undefined" ? window.electronAPI : undefined;

  useEffect(() => {
    // Listen for services ready
    if (electronAPI) {
      electronAPI.onServicesReady((data) => {
        if (data.tunnelUrl) {
          setTunnelUrl(data.tunnelUrl);
        }
      });
    }

    // Auto-launch after a delay
    const timer = setTimeout(() => {
      handleLaunch();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleLaunch = () => {
    setIsLaunching(true);
    // Reload the app to show main interface
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="text-center space-y-6 py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/50 mb-4">
        <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Setup Complete!</h2>
        <p className="text-slate-400">
          Poseidon is ready to use. Your local AI is now accessible online.
        </p>
      </div>

      {tunnelUrl && (
        <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
          <p className="text-slate-400 text-sm">Your ngrok tunnel URL:</p>
          <p className="font-mono text-gold-400 break-all">{tunnelUrl}</p>
          <p className="text-xs text-slate-500">
            Use this URL in your Vercel environment variables as OLLAMA_BASE_URL
          </p>
        </div>
      )}

      {isLaunching ? (
        <div className="space-y-2">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-emerald-400 text-sm">Launching Poseidon...</p>
        </div>
      ) : (
        <button
          onClick={handleLaunch}
          className="py-3 px-8 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25"
        >
          Launch Poseidon
        </button>
      )}
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add components/electron/
git commit -m "feat: add Electron setup wizard components"
```

---

## Task 5: Integrate Setup Wizard into Main App

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/settings/SettingsPage.tsx`

**Step 1: Update main page to show setup wizard in Electron**

Modify `app/page.tsx` - add setup wizard detection:

```typescript
// Add near top of file
import { useEffect, useState } from "react";
import SetupWizard from "@/components/electron/SetupWizard";

// In HomePage component, add state:
const [showSetupWizard, setShowSetupWizard] = useState(false);
const [isElectron, setIsElectron] = useState(false);

// Add in useEffect:
useEffect(() => {
  // Check if running in Electron
  if (typeof window !== "undefined" && (window as any).electronAPI) {
    setIsElectron(true);

    // Check if setup is needed
    checkSetupStatus();
  }
}, []);

const checkSetupStatus = async () => {
  const electronAPI = (window as any).electronAPI;
  if (!electronAPI) return;

  try {
    const [ollamaStatus, ngrokStatus] = await Promise.all([
      electronAPI.ollamaStatus(),
      electronAPI.ngrokStatus(),
    ]);

    // Show wizard if services aren't fully configured
    if (!ollamaStatus.installed || !ngrokStatus.installed || !ngrokStatus.authToken || ollamaStatus.models.length === 0) {
      setShowSetupWizard(true);
    }
  } catch (err) {
    console.error('Failed to check setup status:', err);
  }
};

// In render, before the loading check:
if (isElectron && showSetupWizard) {
  return <SetupWizard />;
}
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: integrate setup wizard into main app"
```

---

## Task 6: Next.js Configuration for Electron

**Files:**
- Modify: `next.config.js`
- Create: `electron/_redirect.html`

**Step 1: Update Next.js config for Electron standalone output**

Modify `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for Electron
  images: {
    domains: ['avatars.githubusercontent.com', 'github.com'],
  },
  // Electron-specific config
  experimental: {
    // Disable some optimizations that don't work well in Electron
    cpus: 1,
  },
  env: {
    IS_ELECTRON: process.env.IS_ELECTRON || 'false',
  },
};

module.exports = nextConfig;
```

**Step 2: Create redirect file for Electron**

Create `electron/_redirect.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Poseidon</title>
  <script>
    // Redirect to the Next.js app
    if (window.location.protocol === 'file:') {
      // In production, load from built files
      window.location.href = '../.next/server/app/index.html';
    } else {
      // In development, load from dev server
      window.location.href = 'http://localhost:1998';
    }
  </script>
</head>
<body>
  <p>Loading Poseidon...</p>
</body>
</html>
```

**Step 3: Commit**

```bash
git add next.config.js electron/_redirect.html
git commit -m "feat: configure Next.js for Electron standalone output"
```

---

## Task 7: API Routes Preservation for Vercel

**Files:**
- Verify all existing `app/api/**/*.ts` routes are preserved

**Step 1: Verify API routes exist**

Run: `find ./app/api -name "*.ts" -type f | wc -l`

Expected: Number of API route files (should be > 0)

**Step 2: Test that all API routes are accessible (no changes needed)**

All existing API routes in `app/api/` should work unchanged. The Electron app will:
1. In development: proxy requests to http://localhost:1998/api/*
2. In production: serve from the bundled Next.js app

**Step 3: Document the dual-mode architecture**

Create `docs/electron-vercel-compatibility.md`:

```markdown
# Electron + Vercel Compatibility

Poseidon maintains full compatibility with both Electron desktop app and Vercel web deployment.

## How It Works

### Development Mode
- Electron loads from `http://localhost:1998` (Next.js dev server)
- API routes work via the dev server
- Hot reloading works normally

### Production Electron Mode
- Electron loads from built Next.js standalone output
- API routes are bundled and served internally
- No external server needed

### Vercel Deployment
- Same codebase deploys to Vercel without changes
- All API routes work as serverless functions
- Ollama access requires ngrok tunnel URL in environment variables

## API Routes

All API routes in `app/api/` work in both modes:
- `/api/chat/*` - AI chat endpoints
- `/api/ollama/*` - Ollama model management
- `/api/github/*` - GitHub integration
- `/api/vercel/*` - Vercel deployment
- etc.

## Environment Variables

For Vercel deployment, set:
- `OLLAMA_BASE_URL` - Your ngrok tunnel URL (e.g., `https://abc123.ngrok.io`)
- `OLLAMA_CUSTOM_HEADERS` - Optional headers for ngrok

For Electron, these are configured automatically by the app.
```

**Step 4: Commit**

```bash
git add docs/electron-vercel-compatibility.md
git commit -m "docs: document Electron + Vercel compatibility"
```

---

## Task 8: Build and Packaging Configuration

**Files:**
- Create: `electron/build-resources/entitlements.mac.plist`
- Create: `electron/webpack.main.config.js`
- Create: `electron/webpack.renderer.config.js`
- Create: `scripts/download-binaries.js`

**Step 1: Create macOS entitlements for code signing**

Create `electron/build-resources/entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
</dict>
</plist>
```

**Step 2: Create webpack main config**

Create `electron/webpack.main.config.js`:

```javascript
const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  target: 'electron-main',
  entry: './electron/main.ts',
  output: {
    path: path.resolve(__dirname, '.webpack/main'),
    filename: 'index.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
```

**Step 3: Create webpack renderer config**

Create `electron/webpack.renderer.config.js`:

```javascript
const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  target: 'electron-renderer',
  entry: './electron/renderer.ts',
  output: {
    path: path.resolve(__dirname, '.webpack/renderer'),
    filename: 'renderer.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
```

**Step 4: Create script to download binaries during build**

Create `scripts/download-binaries.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const binariesDir = path.join(__dirname, '..', 'electron', 'binaries');
const ollamaDir = path.join(binariesDir, 'ollama');
const ngrokDir = path.join(binariesDir, 'ngrok');

// Create directories
fs.mkdirSync(ollamaDir, { recursive: true });
fs.mkdirSync(ngrokDir, { recursive: true });

console.log('Binary directories created:');
console.log(`- ${ollamaDir}`);
console.log(`- ${ngrokDir}`);
console.log('\nNote: Binaries will be downloaded at runtime or during build.');
console.log('They are not included in git to keep repository size manageable.');
```

**Step 5: Add .gitignore for binaries**

Add to `.gitignore`:

```
# Electron binaries (downloaded at runtime/build)
electron/binaries/ollama/
electron/binaries/ngrok/
*.dmg
*.exe
*.deb
*.rpm
*.AppImage
dist/
.out/
```

**Step 6: Commit**

```bash
git add electron/build-resources/ electron/webpack.*.js scripts/download-binaries.js .gitignore
git commit -m "feat: add build configuration for Electron packaging"
```

---

## Task 9: Create README for Electron Build Instructions

**Files:**
- Create: `README-ELECTRON.md`

**Step 1: Create comprehensive Electron README**

Create `README-ELECTRON.md`:

```markdown
# Poseidon Electron App

Cross-platform desktop application for Poseidon AI command center.

## Features

- **Desktop-First Experience**: Native window, menus, and system integration
- **Local AI**: Ollama integration with automatic installation
- **Online Access**: Ngrok tunnel with auto-configuration
- **Vercel Compatible**: Deploy to web with same codebase
- **Cross-Platform**: Windows, macOS, and Linux support

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- (Optional) Git for cloning

### Development

```bash
# Install dependencies
npm install

# Run in Electron (development mode)
npm run dev:electron

# Or run web version (development mode)
npm run dev
```

### Building for Distribution

```bash
# Build Next.js for production
npm run build

# Package Electron app for current platform
npm run build:electron

# Build for all platforms (requires platform-specific tools)
npm run build:electron:all
```

### Output

Built applications are in `dist/`:
- macOS: `Poseidon-x.y.z.dmg` or `Poseidon-x.y.z-arm64.dmg`
- Windows: `Poseidon Setup x.y.z.exe`
- Linux: `poseidon-x.y.z.AppImage` and `poseidon-x.y.z.deb`

## First Run Setup

On first launch, Poseidon will guide you through:

1. **Ollama Installation** - Downloads and installs Ollama for your platform
2. **Model Download** - Pulls a default AI model (Llama 2)
3. **Ngrok Setup** - Configures ngrok tunnel for online access

### Ngrok Auth Token

You'll need a free ngrok account:
1. Sign up at https://dashboard.ngrok.com/signup
2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
3. Enter it in the setup wizard

## Platform-Specific Notes

### macOS

- Apple Silicon (M1/M2) and Intel supported
- Code signed for distribution (requires Apple Developer account for proper signing)
- May need to allow app from unidentified developer on first run

### Windows

- SmartScreen warning may appear on first run
- Windows Defender may flag the app (false positive)
- Run with administrator rights if you encounter permission issues

### Linux

- AppImage format - no installation required
- DEB package for Debian/Ubuntu-based distros
- May need to install dependencies: `sudo apt install libgtk-3-0`

## Environment Variables

For Electron app, these are configured automatically:
- `OLLAMA_BASE_URL` - Auto-detected local Ollama
- `OLLAMA_CUSTOM_HEADERS` - Auto-configured for ngrok

For Vercel deployment, set these manually:
- `OLLAMA_BASE_URL` - Your ngrok tunnel URL
- `GITHUB_TOKEN` - For GitHub integration
- `VERCEL_TOKEN` - For Vercel deployment

## Troubleshooting

### Ollama Won't Start

- Check if port 11434 is available: `lsof -i :11434` (macOS/Linux) or `netstat -ano | findstr :11434` (Windows)
- Try stopping Ollama manually: `pkill ollama` (macOS/Linux) or taskkill (Windows)
- Reinstall via Settings > Reset Ollama

### Ngrok Tunnel Fails

- Verify your auth token is valid
- Check ngrok account status (free tier has limits)
- Try restarting ngrok: Settings > Restart Ngrok

### App Won't Open

- Check logs in `~/Library/Logs/Poseidon` (macOS) or `%APPDATA%\Poseidon\logs` (Windows)
- Try running from terminal with debugging: `Poseidon.app/Contents/MacOS/Poseidon --enable-logging`
- Ensure you have sufficient disk space

### Models Not Appearing

- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- Try pulling manually: `ollama pull llama2`
- Check available disk space (models are 4GB+ each)

## Development

### Project Structure

```
electron/
├── main.ts              # Electron main process
├── preload.ts           # Context bridge for IPC
├── ipc/                 # IPC handlers
├── utils/               # Ollama/Ngrok managers
├── installers/          # Platform-specific installers
├── binaries/            # Downloaded binaries (gitignored)
└── build-resources/     # Icons, entitlements, etc.
```

### Adding New Features

1. Add IPC handler in `electron/ipc/handlers.ts`
2. Expose in `electron/preload.ts` with proper TypeScript types
3. Use in renderer via `window.electronAPI.featureName()`
4. Test in both Electron and web mode

### Debugging

```bash
# Enable DevTools in development
npm run dev:electron

# View main process logs
# macOS: ~/Library/Logs/Poseidon/main.log
# Windows: %APPDATA%\Poseidon\logs\main.log
# Linux: ~/.config/Poseidon/logs/main.log
```

## Building from Source

### Prerequisites for Building

- macOS: Xcode Command Line Tools
- Windows: Visual Studio Build Tools
- Linux: build-essential, libgtk-3-dev

### Build Steps

```bash
# 1. Clone repository
git clone https://github.com/raynaythegreat/poseidon.git
cd poseidon

# 2. Install dependencies
npm install

# 3. Build for current platform
npm run build:electron

# Output is in dist/
```

### Cross-Platform Builds

To build for platforms other than your current OS, you'll need:
- Docker or VM for the target platform
- Platform-specific build tools
- Code signing certificates (for distribution)

## Security

- Ollama runs locally, no data leaves your machine
- Ngrok tunnel is encrypted (HTTPS)
- No tracking or telemetry
- All API keys stored locally

## License

MIT License - see LICENSE file for details

## Support

- GitHub Issues: https://github.com/raynaythegreat/poseidon/issues
- Documentation: See full README.md
```

**Step 2: Commit**

```bash
git add README-ELECTRON.md
git commit -m "docs: add comprehensive Electron build instructions"
```

---

## Task 10: Update Main README with Electron Info

**Files:**
- Create/Modify: `README.md` (if doesn't exist, create it; if exists, add Electron section)

**Step 1: Add Electron section to README**

Create or update `README.md`:

```markdown
# Poseidon

Cyber-styled AI dev command center with GitHub and deployment workflows.

## Features

- 🤖 **Multi-Provider AI Chat**: Claude, OpenAI, OpenRouter, Ollama
- 🐙 **GitHub Integration**: Browse repos, commit changes, manage files
- 🚀 **One-Click Deploy**: Vercel deployment with auto-retry strategies
- 💬 **Chat History**: Persistent sessions with export capability
- 📎 **File Attachments**: Images and text files in conversations
- 🌙 **Dark Mode**: Cyberpunk-inspired aesthetic
- 📱 **Mobile Responsive**: Works on all screen sizes

## Quick Start

### Web Version

```bash
# Clone and install
git clone https://github.com/raynaythegreat/poseidon.git
cd poseidon
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### Desktop App (Electron)

Poseidon is also available as a cross-platform desktop app with:
- Local AI via Ollama (bundled)
- Ngrok tunnel for online access (bundled)
- Native desktop experience

See [README-ELECTRON.md](README-ELECTRON.md) for full instructions.

```bash
# Run in Electron
npm run dev:electron

# Build desktop app
npm run build:electron
```

## Environment Variables

Create `.env.local`:

```bash
# AI Providers
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
OPENROUTER_API_KEY=your_openrouter_key

# Ollama (for web deployment)
OLLAMA_BASE_URL=https://your-ngrok-url.ngrok.io

# GitHub
GITHUB_TOKEN=your_github_token

# Vercel
VERCEL_TOKEN=your_vercel_token
```

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Ngrok + Ollama

For Vercel deployments to access local Ollama:

```bash
# Start Ollama
ollama serve

# Start ngrok
ngrok http 11434

# Sync to Vercel (automatic)
npm run watch-ngrok
```

## Project Structure

```
poseidon/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   ├── page.tsx     # Main page
│   └── layout.tsx   # Root layout
├── components/      # React components
├── contexts/        # React contexts
├── electron/        # Electron desktop app
├── lib/            # Utilities
├── services/       # External services
└── types/          # TypeScript types
```

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT License - see LICENSE for details.
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Electron info to main README"
```

---

## Task 11: Final Testing and Verification

**Files:**
- No file changes - testing task

**Step 1: Verify TypeScript compilation**

Run: `npx tsc --noEmit`

Expected: No TypeScript errors

**Step 2: Test development mode**

Run: `npm run dev` (in one terminal)

Expected: Next.js dev server starts on port 1998

**Step 3: Verify web app still works**

Open: http://localhost:1998

Expected: Full Poseidon app loads and functions

**Step 4: Test Electron development mode**

Run: `npm run dev:electron` (in separate terminal)

Expected: Electron window opens, loads app from localhost:1998

**Step 5: Test production build**

Run: `npm run build`

Expected: Next.js builds successfully

**Step 6: Test Electron packaging**

Run: `npm run build:electron`

Expected: Electron packages app for current platform

**Step 7: Verify Vercel deployment still works**

Run: `vercel --prod`

Expected: App deploys to Vercel with all API routes functional

**Step 8: Check for any issues**

- [ ] TypeScript compilation passes
- [ ] Development server starts
- [ ] Web app loads in browser
- [ ] Electron window opens
- [ ] Production build succeeds
- [ ] Electron packaging succeeds
- [ ] Vercel deployment works
- [ ] All API routes functional

**Step 9: Final commit if any fixes needed**

```bash
git add .
git commit -m "fix: [description of any fixes]"
```

---

## Task 12: Documentation and Handoff

**Files:**
- Create: `docs/electron-architecture.md`
- Create: `docs/troubleshooting.md`

**Step 1: Create architecture documentation**

Create `docs/electron-architecture.md`:

```markdown
# Electron Architecture

## Overview

Poseidon Electron app wraps the existing Next.js application, providing native desktop capabilities while maintaining full web compatibility.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Electron App                          │
├─────────────────────────────────────────────────────────────┤
│  Main Process (electron/main.ts)                           │
│  - Window management                                        │
│  - Ollama installer & manager                               │
│  - Ngrok installer & manager                                │
│  - IPC handlers                                             │
├─────────────────────────────────────────────────────────────┤
│  Preload Script (electron/preload.ts)                      │
│  - Context bridge                                           │
│  - Secure API exposure                                      │
├─────────────────────────────────────────────────────────────┤
│  Renderer Process (Next.js app)                            │
│  - React components                                         │
│  - API routes (in production)                               │
│  - Setup wizard                                             │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌────────────────┐            ┌─────────────────┐
│   Ollama       │            │     Ngrok       │
│  (Local AI)    │────────────│   (Tunnel)      │
└────────────────┘            └─────────────────┘
```

## Key Components

### Main Process

**File**: `electron/main.ts`

Responsibilities:
- Create and manage BrowserWindow
- Initialize services (Ollama, Ngrok)
- Handle IPC from renderer
- Manage app lifecycle

### Preload Script

**File**: `electron/preload.ts`

Responsibilities:
- Expose safe API to renderer via contextBridge
- Provide type-safe interface
- Prevent direct Node.js access

### IPC Handlers

**Directory**: `electron/ipc/`

Handlers for:
- `ollama:*` - Ollama operations
- `ngrok:*` - Ngrok operations
- `app:*` - App information

### Service Managers

#### OllamaManager (`electron/utils/ollama-manager.ts`)
- Detect/install Ollama
- Start/stop Ollama server
- Pull models
- List models

#### NgrokManager (`electron/utils/ngrok-manager.ts`)
- Detect/install ngrok
- Start/stop tunnels
- Manage auth token

### Installers

#### OllamaInstaller (`electron/installers/ollama.ts`)
- Download platform-specific binaries
- Install to userData directory
- Set executable permissions

#### NgrokInstaller (`electron/installers/ngrok.ts`)
- Download and extract ngrok
- Install to userData directory
- Configure auth token

## Communication Flow

```
Renderer (React)              Preload                   Main Process
     │                          │                            │
     │ window.electronAPI       │                            │
     │ .ollamaStatus()          │                            │
     ├─────────────────────────>│                            │
     │                          │ ipcRenderer.invoke         │
     │                          ├───────────────────────────>│
     │                          │                            │ OllamaManager
     │                          │                            │ .getStatus()
     │                          │<───────────────────────────┤
     │                          │ Promise<Status>            │
     │<─────────────────────────┤                            │
     │ Promise<Status>          │                            │
```

## Setup Wizard Flow

```
App Start
    │
    ▼
Check Electron environment
    │
    ▼
Check services status
    │
    ├─> Ollama not installed?
    │   └─> Show Ollama setup
    │       ├─> Install
    │       ├─> Start
    │       └─> Pull model
    │
    ├─> Ngrok not installed?
    │   └─> Show Ngrok setup
    │       ├─> Install
    │       ├─> Set token
    │       └─> Start tunnel
    │
    └─> All ready?
        └─> Show main app
```

## Build Process

1. **Development**:
   - Next.js runs on `localhost:1998`
   - Electron loads from dev server
   - Hot reload enabled

2. **Production Build**:
   - Next.js builds to `.next/`
   - Webpack bundles main/preload scripts
   - Electron Builder packages everything

3. **Output**:
   - macOS: DMG with code signature
   - Windows: NSIS installer
   - Linux: AppImage + DEB

## Security Considerations

- Context isolation enabled
- Node integration disabled
- Secure IPC via contextBridge
- No remote code execution
- Local-only AI processing

## Performance

- Standalone Next.js output for faster startup
- Lazy loading of service binaries
- Async service initialization
- Minimal main process overhead
