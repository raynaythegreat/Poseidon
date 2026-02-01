import { NextResponse } from "next/server";

// Pricing data per 1M input tokens (USD, approximate 2025 rates)
const MODEL_PRICING: Record<string, number> = {
  // OpenAI
  'o1-preview': 15,
  'o1-mini': 3,
  'gpt-4o': 5,
  'gpt-4o-mini': 0.15,
  'gpt-4-turbo': 10,
  'gpt-4': 30,
  'gpt-3.5-turbo': 0.5,

  // Claude
  'claude-3-opus': 15,
  'claude-3-5-sonnet': 3,
  'claude-3-5-sonnet-20241022': 3,
  'claude-3-sonnet': 3,
  'claude-3-sonnet-20240229': 3,
  'claude-3-5-haiku': 0.25,
  'claude-3-5-haiku-20241022': 0.25,
  'claude-3-haiku': 0.25,
  'claude-3-haiku-20240307': 0.25,

  // Gemini
  'gemini-2.5-pro-exp': 2.5,
  'gemini-2.5-flash-exp': 0.08,
  'gemini-2.0-flash-exp': 0.08,
  'gemini-2.0-flash-thinking-exp': 0.5,
  'gemini-1.5-pro': 1.25,
  'gemini-1.5-flash': 0.075,
  'gemini-1.5-flash-8b': 0.03,
  'gemini-pro': 0.5,

  // Groq
  'llama-3.3-70b-versatile': 0.59,
  'llama-3.1-70b-versatile': 0.59,
  'llama3-70b-8192': 0.59,
  'llama-3.3-70b': 0.59,
  'llama-3.1-70b': 0.59,
  'mixtral-8x7b-32768': 0.27,
  'mixtral-8x7b': 0.27,
  'gemma2-9b-it': 0.08,
  'gemma-2-9b-it': 0.08,
  'gemma2-9b': 0.08,

  // Ollama (free, local)
  'ollama-default': 0,

  // Fireworks
  'llama-v3p70b-instruct': 0.9,
  'llama-3-70b': 0.9,
};

// Get price for a model, or return default based on provider
function getModelPrice(modelId: string, provider: string): number {
  const normalizedId = modelId.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (MODEL_PRICING[normalizedId] !== undefined) {
    return MODEL_PRICING[normalizedId];
  }
  if (MODEL_PRICING[modelId] !== undefined) {
    return MODEL_PRICING[modelId];
  }

  // Default pricing by provider
  const defaults: Record<string, number> = {
    'OpenAI': 5,
    'Claude': 3,
    'Google Gemini': 0.5,
    'Groq': 0.3,
    'OpenRouter': 1,
    'Ollama': 0,
    'Fireworks': 0.5,
  };
  return defaults[provider] ?? 1;
}

// Helper to fetch models from OpenAI-compatible APIs
async function fetchOpenAIModels(baseUrl: string, apiKey: string): Promise<any[]> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch models from ${baseUrl}:`, response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching models from ${baseUrl}:`, error);
    return [];
  }
}

// Helper to fetch models from Ollama
async function fetchOllamaModels(baseUrl: string): Promise<any[]> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch Ollama models:`, response.status);
      return [];
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error(`Error fetching Ollama models:`, error);
    return [];
  }
}

// Helper to fetch models from OpenRouter
async function fetchOpenRouterModels(apiKey: string): Promise<any[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch OpenRouter models:`, response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching OpenRouter models:`, error);
    return [];
  }
}

// Claude/Anthropic doesn't have a public models endpoint, so we use known models
const CLAUDE_MODELS = [
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "Claude", description: "Best all-around model" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "Claude", description: "Fast and efficient" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "Claude", description: "Most powerful" },
  { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", provider: "Claude", description: "Balanced performance" },
  { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: "Claude", description: "Fastest" },
];

// Gemini has a limited set of models, we use known ones
const GEMINI_MODELS = [
  { id: "gemini-2.5-flash-exp", name: "Gemini 2.5 Flash Exp", provider: "Google Gemini", description: "Latest experimental Flash" },
  { id: "gemini-2.5-pro-exp", name: "Gemini 2.5 Pro Exp", provider: "Google Gemini", description: "Latest experimental Pro" },
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash Exp", provider: "Google Gemini", description: "Experimental" },
  { id: "gemini-2.0-flash-thinking-exp", name: "Gemini 2.0 Flash Thinking Exp", provider: "Google Gemini", description: "Reasoning model" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google Gemini", description: "Multimodal" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google Gemini", description: "Fast and efficient" },
  { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash 8B", provider: "Google Gemini", description: "Lightweight Flash" },
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google Gemini", description: "Google's flagship model" },
];

// Map model IDs to friendly names
function getModelName(id: string, provider: string): string {
  // OpenAI model names
  const openaiNames: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'o1-preview': 'o1-preview',
    'o1-mini': 'o1-mini',
  };

  // Groq model names
  const groqNames: Record<string, string> = {
    'llama-3.3-70b-versatile': 'Llama 3.3 70B',
    'llama-3.1-70b-versatile': 'Llama 3.1 70B',
    'llama3-70b-8192': 'Llama 3 70B',
    'mixtral-8x7b-32768': 'Mixtral 8x7B',
    'gemma2-9b-it': 'Gemma 2 9B',
  };

  if (provider === 'OpenAI' && openaiNames[id]) return openaiNames[id];
  if (provider === 'Groq' && groqNames[id]) return groqNames[id];

  // Default: return the ID with nice formatting
  return formatModelName(id);
}

// Format model names nicely (for Ollama and other providers)
function formatModelName(id: string): string {
  // Remove common prefixes
  const cleanName = id.replace(/^(hf\.|hf-|^chat-|^instruct-)/i, '');

  // Handle tag format (e.g., "model:tag" or "model:tag")
  if (cleanName.includes(':')) {
    const [model, tag] = cleanName.split(':');
    // Format tag nicely (e.g., "3b" -> "3B", "latest" -> "Latest")
    const formattedTag = tag.replace(/(\d)b$/, '$1B').replace(/^(\d)/, (match) => match.toUpperCase());
    return formatBaseName(model) + (tag !== 'latest' ? ` (${formattedTag})` : '');
  }

  return formatBaseName(cleanName);
}

// Format the base model name
function formatBaseName(name: string): string {
  // Split by common separators
  const parts = name.split(/[-_/]/);

  // Format each part
  const formattedParts = parts.map((part, index) => {
    // Skip empty parts
    if (!part) return '';

    // Handle version numbers (e.g., "3", "3.2", "3.2.1")
    if (/^\d+(\.\d+)*$/.test(part)) {
      return part.toUpperCase();
    }

    // Handle size suffixes (e.g., "70b", "8b")
    if (/^\d+b$/i.test(part)) {
      return part.toUpperCase();
    }

    // Capitalize first letter of each word
    if (index === 0) {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
    return part.toLowerCase();
  });

  // Join with spaces and clean up
  return formattedParts.filter(Boolean).join(' ');
}

// Get provider display name
function getProviderName(providerKey: string): string {
  const names: Record<string, string> = {
    claude: 'Claude',
    openai: 'OpenAI',
    groq: 'Groq',
    openrouter: 'OpenRouter',
    fireworks: 'Fireworks',
    gemini: 'Google Gemini',
    ollama: 'Ollama',
  };
  return names[providerKey] || providerKey;
}

export async function GET() {
  try {
    // Get providers from environment
    const providers = {
      claude: process.env.CLAUDE_API_KEY ? true : false,
      openai: process.env.OPENAI_API_KEY ? true : false,
      groq: process.env.GROQ_API_KEY ? true : false,
      openrouter: process.env.OPENROUTER_API_KEY ? true : false,
      fireworks: process.env.FIREWORKS_API_KEY ? true : false,
      gemini: process.env.GEMINI_API_KEY ? true : false,
      ollama: process.env.OLLAMA_BASE_URL ? true : false,
    };

    const models: Record<string, any[]> = {
      claude: [],
      openai: [],
      groq: [],
      openrouter: [],
      fireworks: [],
      gemini: [],
      ollama: [],
    };

    // Fetch Claude models (hardcoded list)
    if (providers.claude) {
      models.claude = CLAUDE_MODELS.map(m => ({
        ...m,
        price: getModelPrice(m.id, m.provider),
      }));
    }

    // Fetch OpenAI models
    if (providers.openai) {
      const openaiModels = await fetchOpenAIModels('https://api.openai.com/v1', process.env.OPENAI_API_KEY!);
      models.openai = openaiModels
        .filter((m: any) => m.id.startsWith('gpt') || m.id.startsWith('o1'))
        .map((m: any) => ({
          id: m.id,
          name: getModelName(m.id, 'OpenAI'),
          provider: 'OpenAI',
          description: m.owned_by === 'openai' ? 'OpenAI model' : 'Via OpenAI',
          price: getModelPrice(m.id, 'OpenAI'),
        }));
    }

    // Fetch Groq models
    if (providers.groq) {
      const groqModels = await fetchOpenAIModels('https://api.groq.com/openai/v1', process.env.GROQ_API_KEY!);
      models.groq = groqModels
        .filter((m: any) => !m.id.includes('whisper'))
        .map((m: any) => ({
          id: m.id,
          name: getModelName(m.id, 'Groq'),
          provider: 'Groq',
          description: 'Fast inference',
          price: getModelPrice(m.id, 'Groq'),
        }));
    }

    // Fetch OpenRouter models
    if (providers.openrouter) {
      const orModels = await fetchOpenRouterModels(process.env.OPENROUTER_API_KEY!);
      models.openrouter = orModels
        .filter((m: any) => !m.id.includes('whisper'))
        .map((m: any) => {
          // Parse OpenRouter pricing (format: "0.00015" for $0.15/1M)
          let price = 1;
          if (m.pricing?.prompt) {
            const promptPrice = parseFloat(m.pricing.prompt);
            if (!isNaN(promptPrice)) {
              price = promptPrice * 1000000; // Convert to per 1M tokens
            }
          }
          return {
            id: m.id,
            name: m.name || getModelName(m.id, 'OpenRouter'),
            provider: 'OpenRouter',
            description: `Pricing: $${m.pricing?.prompt || 'N/A'}/1M tokens`,
            price,
          };
        });
    }

    // Fetch Fireworks models (if they have an API endpoint)
    if (providers.fireworks) {
      try {
        const fwModels = await fetchOpenAIModels('https://api.fireworks.ai/inference/v1', process.env.FIREWORKS_API_KEY!);
        models.fireworks = fwModels.map((m: any) => ({
          id: m.id,
          name: getModelName(m.id, 'Fireworks'),
          provider: 'Fireworks',
          description: 'Fast inference',
          price: getModelPrice(m.id, 'Fireworks'),
        }));
      } catch (e) {
        // Fallback to hardcoded list if API fails
        models.fireworks = [
          { id: "accounts/fireworks/models/llama-v3p70b-instruct", name: "Llama 3 70B", provider: "Fireworks", description: "Fast training", price: getModelPrice('llama-v3p70b-instruct', 'Fireworks') },
        ];
      }
    }

    // Fetch Gemini models (hardcoded list)
    if (providers.gemini) {
      models.gemini = GEMINI_MODELS.map(m => ({
        ...m,
        price: getModelPrice(m.id, m.provider),
      }));
    }

    // Fetch Ollama models
    if (providers.ollama) {
      const ollamaBaseUrl = process.env.OLLAMA_BASE_URL!.replace(/\/$/, '');
      const ollamaModels = await fetchOllamaModels(ollamaBaseUrl);
      models.ollama = ollamaModels.map((m: any) => ({
        id: m.name,
        name: formatModelName(m.name), // Use formatted name
        provider: 'Ollama',
        description: `Size: ${m.size ? Math.round(m.size / 1024 / 1024 / 1024) + 'GB' : 'Unknown'}`,
        price: 0, // Local models are free
      }));
    }

    return NextResponse.json({ providers, models });
  } catch (error) {
    console.error('Error in /api/models:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch models" },
      { status: 500 }
    );
  }
}
