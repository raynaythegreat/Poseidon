import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";

/**
 * Get the correct path for .env.local file
 *
 * In production (AppImage/Electron), the app directory is read-only,
 * so we must use a user-writable config directory.
 *
 * - AppImage: ~/.config/poseidon/.env.local
 * - Development: {project}/.env.local
 */
export function getEnvFilePath(): string {
  const cwd = process.cwd();

  // Detect if running in AppImage (mounted read-only filesystem)
  // AppImages mount to /tmp/.mount_<Appname>XXXXXX
  const isAppImage = cwd.includes("/.mount_") ||
                     cwd.includes("tmp/.mount") ||
                     process.env.APPIMAGE !== undefined ||
                     process.env.APPDIR !== undefined;

  if (isAppImage) {
    // Use XDG config directory for user config
    const configDir = join(homedir(), ".config", "poseidon");

    // Ensure config directory exists
    if (!existsSync(configDir)) {
      try {
        mkdirSync(configDir, { recursive: true });
      } catch (error) {
        // Fallback to home directory if config dir creation fails
        console.warn("Failed to create config directory:", error);
        return join(homedir(), ".poseidon.env");
      }
    }

    return join(configDir, ".env.local");
  }

  // Development: use project directory
  return join(cwd, ".env.local");
}

/**
 * Get the base directory for Poseidon config files
 */
export function getConfigDir(): string {
  const cwd = process.cwd();
  const isAppImage = cwd.includes("/.mount_") ||
                     cwd.includes("tmp/.mount") ||
                     process.env.APPIMAGE !== undefined ||
                     process.env.APPDIR !== undefined;

  if (isAppImage) {
    const configDir = join(homedir(), ".config", "poseidon");
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    return configDir;
  }

  return cwd;
}
