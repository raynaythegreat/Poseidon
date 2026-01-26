import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getRuntimeEnv } from "@/lib/runtime";
import { ensureNgrokTunnel } from "@/lib/ngrok";
import { createSubprocessEnv, resolveCommand } from "@/lib/command";
import { VercelService } from "@/services/vercel";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

function parseGitHubRepo(remoteUrl: string): string | null {
  const trimmed = remoteUrl.trim();
  if (!trimmed) return null;

  const normalize = (value: string) => value.replace(/\.git$/, "").replace(/^\/+/, "");

  if (trimmed.startsWith("git@github.com:")) {
    return normalize(trimmed.slice("git@github.com:".length));
  }

  const sshPrefix = "ssh://git@github.com/";
  if (trimmed.startsWith(sshPrefix)) {
    return normalize(trimmed.slice(sshPrefix.length));
  }

  const httpsPrefix = "https://github.com/";
  if (trimmed.startsWith(httpsPrefix)) {
    return normalize(trimmed.slice(httpsPrefix.length));
  }

  const httpsWwwPrefix = "https://www.github.com/";
  if (trimmed.startsWith(httpsWwwPrefix)) {
    return normalize(trimmed.slice(httpsWwwPrefix.length));
  }

  return null;
}

async function detectRepoFromGit(): Promise<string | null> {
  const gitPath = resolveCommand("git");
  if (!gitPath) return null;
  try {
    const result = await execFileAsync(gitPath, ["config", "--get", "remote.origin.url"], {
      timeout: 2000,
      env: createSubprocessEnv(),
    });
    const repo = parseGitHubRepo(result?.stdout?.toString?.() ?? "");
    return repo;
  } catch {
    return null;
  }
}

async function detectBranchFromGit(): Promise<string | null> {
  const gitPath = resolveCommand("git");
  if (!gitPath) return null;
  try {
    const result = await execFileAsync(gitPath, ["rev-parse", "--abbrev-ref", "HEAD"], {
      timeout: 2000,
      env: createSubprocessEnv(),
    });
    const name = (result.stdout?.toString?.() ?? "").trim();
    return name ? name : null;
  } catch {
    return null;
  }
}

async function updateOllamaBaseUrlIfNeeded(publicUrl: string) {
  // Try to determine repository/project from git or env
  const repositoryFromGit = await detectRepoFromGit();
  const repositoryFromEnv = (process.env.AI_AGENT_WEEB_REPOSITORY || "").trim();
  const repository = repositoryFromGit || repositoryFromEnv;

  if (!repository || !/^[^/]+\/[^/]+$/.test(repository)) {
    // If we can't determine repository, skip auto-update
    return;
  }
  const projectName = repository.split("/")[1];
  const branchFromGit = await detectBranchFromGit();
  const branch = branchFromGit || "main";
  const targets = ["production", "preview"];

  try {
    const vercel = new VercelService();
    await vercel.updateProjectEnvironmentVariables(projectName, [
      {
        key: "OLLAMA_BASE_URL",
        value: publicUrl,
        target: targets,
      },
    ]);
  } catch {
    // Ignore errors for automatic propagation to Vercel
  }
}

function isLocalHostRequest(request: NextRequest) {
  const host = request.headers.get("host") || "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("0.0.0.0");
}


export async function POST(request: NextRequest) {
  const { onCloud } = getRuntimeEnv();
  if (onCloud) {
    return NextResponse.json(
      { ok: false, error: "This action can only run on your local machine (not on a cloud deployment)." },
      { status: 200 }
    );
  }

  if (!isLocalHostRequest(request)) {
    return NextResponse.json({ ok: false, error: "This endpoint is only available from localhost." }, { status: 403 });
  }

  const port = 11434;
  const started = await ensureNgrokTunnel(port);
  // If ngrok started and a public URL is available, propagate to Vercel for online access
  if (started.publicUrl) {
    // Fire-and-forget update to Vercel to sync Ollama_BASE_URL
    updateOllamaBaseUrlIfNeeded(String(started.publicUrl)).catch(() => {
      // ignore failures in the background
    });
  }
  if (!started.publicUrl) {
    return NextResponse.json(
      { ok: false, error: started.error || "Failed to start ngrok", started: started.started, port },
      { status: 200 }
    );
  }

  return NextResponse.json({
    ok: true,
    port,
    started: started.started,
    publicUrl: started.publicUrl,
  });
}
