import { NextRequest, NextResponse } from "next/server";
import { GitHubService } from "@/services/github";

interface Params {
  params: Promise<{ owner: string; repo: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { owner, repo } = await params;
    const body = await request.json();
    const { message, branch, files } = body;

    console.log("[Apply] === STARTING APPLY ===");
    console.log("[Apply] Repository:", `${owner}/${repo}`);
    console.log("[Apply] Branch:", branch || "(default)");
    console.log("[Apply] Commit message:", message);
    console.log("[Apply] Files count:", Array.isArray(files) ? files.length : 0);
    if (Array.isArray(files) && files.length > 0) {
      console.log("[Apply] File paths:", files.map((f: any) => f.path).join(", "));
    }

    if (!message || typeof message !== "string") {
      console.error("[Apply] ERROR: Missing or invalid commit message");
      return NextResponse.json({ error: "Commit message is required" }, { status: 400 });
    }
    if (!Array.isArray(files) || files.length === 0) {
      console.error("[Apply] ERROR: No files provided");
      return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
    }

    const normalizedFiles = files.map((file: { path?: unknown; content?: unknown }) => ({
      path: typeof file.path === "string" ? file.path : "",
      content: typeof file.content === "string" ? file.content : "",
    }));

    console.log("[Apply] Calling GitHubService.commitFiles()...");
    const github = new GitHubService();
    const result = await github.commitFiles(owner, repo, {
      message,
      branch: typeof branch === "string" ? branch : undefined,
      files: normalizedFiles,
    });

    console.log("[Apply] ✅ SUCCESS - Commit created:", result.commitSha);
    console.log("[Apply] Files changed:", result.filesChanged);
    console.log("[Apply] Commit URL:", result.commitUrl);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[Apply] ❌ FAILED - Error:", error);
    console.error("[Apply] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[Apply] Error stack:", error instanceof Error ? error.stack : "(no stack)");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply changes" },
      { status: 500 }
    );
  }
}

