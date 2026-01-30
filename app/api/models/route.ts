import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get providers from environment
    const providers = {
      claude: process.env.ANTHROPIC_API_KEY ? true : false,
      openai: process.env.OPENAI_API_KEY ? true : false,
      groq: process.env.GROQ_API_KEY ? true : false,
      openrouter: process.env.OPENROUTER_API_KEY ? true : false,
      fireworks: process.env.FIREWORKS_API_KEY ? true : false,
      gemini: process.env.GEMINI_API_KEY ? true : false,
      ollama: process.env.OLLAMA_BASE_URL ? true : false,
    };

    const models = {
      claude: [
        { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Claude", description: "Best all-around model" },
        { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Claude", description: "Most powerful" },
        { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "Claude", description: "Fast and affordable" },
      ],
      openai: [
        { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI", description: "Most capable" },
        { id: "gpt-4", name: "GPT-4", provider: "OpenAI", description: "Standard GPT-4" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI", description: "Fast and cheap" },
      ],
      groq: [
        { id: "llama3-70b-8192", name: "Llama 3 70B", provider: "Groq", description: "Fast inference" },
        { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "Groq", description: "Mixture of experts" },
      ],
      openrouter: [
        { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenRouter", description: "Via OpenRouter" },
        { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "OpenRouter", description: "Via OpenRouter" },
      ],
      fireworks: [
        { id: "accounts/fireworks/models/llama-v3p70b-instruct", name: "Llama 3 70B", provider: "Fireworks", description: "Fast training" },
      ],
      gemini: [
        { id: "gemini-pro", name: "Gemini Pro", provider: "Google Gemini", description: "Google's flagship model" },
        { id: "gemini-pro-1.5", name: "Gemini Pro 1.5", provider: "Google Gemini", description: "Multimodal" },
      ],
      ollama: [
        { id: "llama3", name: "Llama 3", provider: "Ollama", description: "Local model" },
        { id: "mistral", name: "Mistral", provider: "Ollama", description: "French model" },
      ],
    };

    return NextResponse.json({ providers, models });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch models" },
      { status: 500 }
    );
  }
}
