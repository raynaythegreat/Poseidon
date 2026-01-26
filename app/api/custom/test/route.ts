import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { baseUrl, apiKey } = await request.json();

    if (!baseUrl) {
      return NextResponse.json(
        { error: "Base URL is required" },
        { status: 400 }
      );
    }

    // Normalize URL
    let normalizedUrl = baseUrl.trim().replace(/\/+$/, "");
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Append /v1/models if not present (heuristic for OpenAI compatible)
    // But some users might provide the full path. Let's try the base first, then append.
    // Actually, most compatible endpoints are at /v1/models.
    // If the user provided "https://api.openai.com", we want "https://api.openai.com/v1/models".
    // If they provided "https://api.openai.com/v1", we want "https://api.openai.com/v1/models".
    
    // Let's try a few common variations if the first one fails, or just expect standard base URL.
    // Standard convention: Base URL is "https://api.example.com/v1".
    
    const urlToCheck = `${normalizedUrl}/models`;
    
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(urlToCheck, {
        headers,
        method: "GET" 
    });

    if (!response.ok) {
        // Try without /v1 if the user included it or if the server is weird
        // But for now, let's return the error.
        const text = await response.text();
        throw new Error(`Failed to connect: ${response.status} ${text}`);
    }

    const data = await response.json();
    
    // Expecting OpenAI format: { data: [ { id: "..." }, ... ] }
    let models = [];
    if (Array.isArray(data.data)) {
        models = data.data;
    } else if (Array.isArray(data.models)) { // Some variations
        models = data.models;
    } else if (Array.isArray(data)) {
        models = data;
    }

    // Filter for chat models if possible? 
    // The user asked to "pull the ones that could work well with the chat integration".
    // Without metadata, we can't be sure. We'll return all and let the user/frontend filter.
    // We map to a standard format.
    const mappedModels = models.map((m: any) => ({
        id: m.id,
        name: m.id, // Use ID as name if name is missing
        object: m.object
    }));

    return NextResponse.json({ success: true, models: mappedModels });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to test connection" },
      { status: 500 }
    );
  }
}
