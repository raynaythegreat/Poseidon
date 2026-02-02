/**
 * Version detection and update utilities for Poseidon
 * Only active in production builds
 */

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
  };
}

interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  latestCommit?: string;
  currentCommit?: string;
  releaseNotes?: string;
  updateUrl: string;
  isDev: boolean;
}

/**
 * Check if running in production mode
 * Development builds and non-packaged Electron apps should return false
 */
export function isProduction(): boolean {
  // Check for explicit development flag
  if (process.env.NODE_ENV === 'development') {
    return false;
  }

  // Electron: check if running in packaged app
  // @ts-ignore - process.defaultApp is an Electron property
  if (typeof process.defaultApp !== 'undefined' && process.defaultApp === false) {
    return true; // Packaged Electron app
  }

  // @ts-ignore - process.versions.electron is an Electron property
  if (process.versions && process.versions.electron) {
    return false; // Running in Electron development mode
  }

  // Vercel/Render deployment
  if (process.env.VERCEL || process.env.RENDER) {
    return true;
  }

  // Default to production if NODE_ENV is production
  return process.env.NODE_ENV === 'production';
}

/**
 * Get current version from package.json
 */
export function getCurrentVersion(): string {
  try {
    // Try to read from package.json
    const packageJson = require('../../package.json');
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

/**
 * Get current commit SHA from environment or git
 * In production, this should be set at build time
 */
export function getCurrentCommit(): string | null {
  // Check if commit was set at build time
  if (process.env.GIT_COMMIT_SHA) {
    return process.env.GIT_COMMIT_SHA;
  }
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }
  if (process.env.RENDER_GIT_COMMIT) {
    return process.env.RENDER_GIT_COMMIT;
  }
  return null;
}

/**
 * Fetch latest release from GitHub
 */
async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const response = await fetch('https://api.github.com/repos/raynaythegreat/Poseidon/releases/latest', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error('Failed to fetch release:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching latest release:', error);
    return null;
  }
}

/**
 * Fetch latest commit from main branch
 */
async function fetchLatestCommit(): Promise<string | null> {
  try {
    const response = await fetch('https://api.github.com/repos/raynaythegreat/Poseidon/commits/main', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as GitHubCommit;
    return data.sha;
  } catch {
    return null;
  }
}

/**
 * Check for updates
 * Only performs checks in production mode
 */
export async function checkForUpdates(): Promise<UpdateInfo> {
  const production = isProduction();

  if (!production) {
    return {
      hasUpdate: false,
      currentVersion: getCurrentVersion(),
      latestVersion: getCurrentVersion(),
      updateUrl: 'https://github.com/raynaythegreat/Poseidon',
      isDev: true,
    };
  }

  try {
    const [latestRelease, latestCommit, currentCommit] = await Promise.all([
      fetchLatestRelease(),
      fetchLatestCommit(),
      Promise.resolve(getCurrentCommit()),
    ]);

    const currentVersion = getCurrentVersion();
    const latestVersion = latestRelease?.tag_name || currentVersion;

    // Check if update is available
    // Priority 1: Compare commits (most accurate for development)
    // Priority 2: Compare version tags
    let hasUpdate = false;

    if (currentCommit && latestCommit) {
      hasUpdate = currentCommit !== latestCommit;
    } else if (latestRelease && latestRelease.tag_name !== `v${currentVersion}`) {
      hasUpdate = true;
    }

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      latestCommit: latestCommit || undefined,
      currentCommit: currentCommit || undefined,
      releaseNotes: latestRelease?.body,
      updateUrl: 'https://github.com/raynaythegreat/Poseidon/releases/latest',
      isDev: false,
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return {
      hasUpdate: false,
      currentVersion: getCurrentVersion(),
      latestVersion: getCurrentVersion(),
      updateUrl: 'https://github.com/raynaythegreat/Poseidon',
      isDev: false,
    };
  }
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}
