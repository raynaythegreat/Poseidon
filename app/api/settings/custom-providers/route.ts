import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ENV_FILE = join(process.cwd(), ".env.local");

// Helper to read and parse .env.local
function readEnvFile(): Record<string, string> {
  if (!existsSync(ENV_FILE)) {
    return {};
  }
  const content = readFileSync(ENV_FILE, "utf-8");
  const env: Record<string, string> = {};

  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=");
      const keyName = key.trim();
      const value = valueParts.join("=").trim();
      env[keyName] = value;
    }
  });

  return env;
}

// Helper to write .env.local file
function writeEnvFile(env: Record<string, string>): string {
  const lines: string[] = [];

  // Sort keys alphabetically for consistency
  const sortedKeys = Object.keys(env).sort();

  sortedKeys.forEach((key) => {
    lines.push(`${key}=${env[key]}`);
  });

  const content = lines.join("\n");
  writeFileSync(ENV_FILE, content, "utf-8");
  return content;
}

// Helper to sanitize provider name for env variable
function sanitizeProviderName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

// GET - Retrieve all custom provider env vars from .env.local
export async function GET() {
  try {
    const env = readEnvFile();
    const customProviders: Record<string, { baseUrl: string; apiKey: string }> = {};

    // Find all custom provider env vars (pattern: CUSTOM_PROVIDER_<NAME>_(BASE_URL|API_KEY))
    Object.keys(env).forEach((key) => {
      const match = key.match(/^CUSTOM_PROVIDER_(.+?)_(BASE_URL|API_KEY)$/);
      if (match) {
        const [, providerName, type] = match;
        if (!customProviders[providerName]) {
          customProviders[providerName] = { baseUrl: "", apiKey: "" };
        }
        if (type === "BASE_URL") {
          customProviders[providerName].baseUrl = env[key];
        } else if (type === "API_KEY") {
          customProviders[providerName].apiKey = env[key];
        }
      }
    });

    return NextResponse.json({ customProviders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve custom providers" },
      { status: 500 }
    );
  }
}

// POST - Save a custom provider to .env.local
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, baseUrl, apiKey } = body;

    if (!id || !name || !baseUrl) {
      return NextResponse.json(
        { error: "ID, name, and baseUrl are required" },
        { status: 400 }
      );
    }

    const env = readEnvFile();
    const sanitizedName = sanitizeProviderName(name);

    // Remove old entries for this provider (in case name changed)
    Object.keys(env).forEach((key) => {
      if (key.startsWith(`CUSTOM_PROVIDER_${sanitizedName}_`) ||
          key.match(/^CUSTOM_PROVIDER_[A-Z0-9_]+_(BASE_URL|API_KEY)$/)) {
        // Check if this env var belongs to this provider ID
        const providerId = env[`${key}_PROVIDER_ID`];
        if (providerId === id) {
          delete env[key];
          delete env[`${key}_PROVIDER_ID`];
        }
      }
    });

    // Add new entries
    const baseUrlKey = `CUSTOM_PROVIDER_${sanitizedName}_BASE_URL`;
    const apiKeyKey = `CUSTOM_PROVIDER_${sanitizedName}_API_KEY`;

    env[baseUrlKey] = baseUrl.trim();
    if (apiKey && apiKey.trim()) {
      env[apiKeyKey] = apiKey.trim();
    }

    // Store provider ID for tracking
    env[`${baseUrlKey}_PROVIDER_ID`] = id;

    writeEnvFile(env);

    return NextResponse.json({
      success: true,
      baseUrlKey,
      apiKeyKey,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save custom provider to .env.local" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a custom provider from .env.local
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and name are required" },
        { status: 400 }
      );
    }

    const env = readEnvFile();
    const sanitizedName = sanitizeProviderName(name);

    // Remove all entries for this provider
    const keysToDelete = [
      `CUSTOM_PROVIDER_${sanitizedName}_BASE_URL`,
      `CUSTOM_PROVIDER_${sanitizedName}_API_KEY`,
      `CUSTOM_PROVIDER_${sanitizedName}_BASE_URL_PROVIDER_ID`,
    ];

    keysToDelete.forEach((key) => {
      if (env[key]) {
        delete env[key];
      }
    });

    // Also search by provider ID in case name changed
    Object.keys(env).forEach((key) => {
      if (key.endsWith("_PROVIDER_ID") && env[key] === id) {
        const baseKey = key.replace("_PROVIDER_ID", "");
        delete env[baseKey];
        delete env[key];
      }
    });

    writeEnvFile(env);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove custom provider from .env.local" },
      { status: 500 }
    );
  }
}
