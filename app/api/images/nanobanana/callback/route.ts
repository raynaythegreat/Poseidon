import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (payload) {
    const taskId =
      payload?.data?.taskId ||
      payload?.taskId ||
      payload?.data?.task_id ||
      payload?.task_id ||
      null;
    console.log("[Nanobanana Callback]", {
      taskId,
      status: payload?.data?.status || payload?.status || null,
    });
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
