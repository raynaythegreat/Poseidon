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

// GET - Retrieve all provider API keys from .env.local
export async function GET() {
  try {
    const env = readEnvFile();
    // Extract common provider API keys
    const apiKeys = {
      CLAUDE_API_KEY: env.CLAUDE_API_KEY,
      OPENAI_API_KEY: env.OPENAI_API_KEY,
      GROQ_API_KEY: env.GROQ_API_KEY,
      OPENROUTER_API_KEY: env.OPENROUTER_API_KEY,
      FIREWORKS_API_KEY: env.FIREWORKS_API_KEY,
      GEMINI_API_KEY: env.GEMINI_API_KEY,
      GLM_API_KEY: env.GLM_API_KEY,
      GITHUB_TOKEN: env.GITHUB_TOKEN,
      GITHUB_USERNAME: env.GITHUB_USERNAME,
      VERCEL_TOKEN: env.VERCEL_TOKEN,
      RENDER_API_KEY: env.RENDER_API_KEY,
    };

    return NextResponse.json({ apiKeys });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve API keys" },
      { status: 500 }
    );
  }
}

// POST - Save an API key to .env.local
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "Provider name and API key are required" },
        { status: 400 }
      );
    }

    const env = readEnvFile();

    // Map provider name to env variable name
    const envKeyMap: Record<string, string> = {
      "Claude API": "CLAUDE_API_KEY",
      "OpenAI API": "OPENAI_API_KEY",
      "Groq": "GROQ_API_KEY",
      "OpenRouter": "OPENROUTER_API_KEY",
      "Fireworks": "FIREWORKS_API_KEY",
      "Google Gemini": "GEMINI_API_KEY",
      "GLM (Zhipu AI)": "GLM_API_KEY",
      "GitHub": "GITHUB_TOKEN",
      "Vercel": "VERCEL_TOKEN",
      "Render": "RENDER_API_KEY",
    };

    const envKey = envKeyMap[provider];

    if (!envKey) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    env[envKey] = apiKey.trim();
    writeEnvFile(env);

    // Restart dev server for Claude, OpenAI, Groq if they were just configured
    const providersNeedingRestart = ["Claude API", "OpenAI API", "Groq"];
    let restarted = false;

    if (providersNeedingRestart.includes(provider)) {
      try {
        // Use poseidon.sh restart command
        const { spawn } = await import("child_process");
        spawn("bash", ["./poseidon.sh", "restart"], {
          cwd: process.cwd(),
          stdio: "ignore",
          detached: false,
        });
        restarted = true;
      } catch (error) {
        console.error("Failed to restart dev server:", error);
      }
    }

    return NextResponse.json({
      success: true,
      key: provider,
      envKey,
      restarted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save API key to .env.local" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an API key from .env.local
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "Provider name is required" },
        { status: 400 }
      );
    }

    const env = readEnvFile();

    // Map provider name to env variable name
    const envKeyMap: Record<string, string> = {
      "Claude API": "CLAUDE_API_KEY",
      "OpenAI API": "OPENAI_API_KEY",
      "Groq": "GROQ_API_KEY",
      "OpenRouter": "OPENROUTER_API_KEY",
      "Fireworks": "FIREWORKS_API_KEY",
      "Google Gemini": "GEMINI_API_KEY",
      "GLM (Zhipu AI)": "GLM_API_KEY",
      "GitHub": "GITHUB_TOKEN",
      "Vercel": "VERCEL_TOKEN",
      "Render": "RENDER_API_KEY",
    };

    const envKey = envKeyMap[provider];

    if (!envKey) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    if (env[envKey]) {
      delete env[envKey];
      writeEnvFile(env);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove API key from .env.local" },
      { status: 500 }
    );
  }
}
