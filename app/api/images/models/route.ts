import { NextResponse } from "next/server";

type ImageModelConfig = {
  models: string[];
  defaultModel: string;
};

function parseModelList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,\\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildModelConfig(
  modelEnv: string | undefined,
  modelsEnv: string | undefined,
  fallbackModels: string[] = [],
): ImageModelConfig {
  const list = parseModelList(modelsEnv);
  const fallback = fallbackModels
    .map((value) => value.trim())
    .filter(Boolean);
  const defaultModel = (modelEnv ?? "").trim();
  let models = list.length > 0 ? list : fallback;
  if (defaultModel && !models.includes(defaultModel)) {
    models = [defaultModel, ...models];
  }
  const uniqueModels = Array.from(new Set(models)).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  return {
    models: uniqueModels,
    defaultModel: defaultModel || uniqueModels[0] || "",
  };
}

export async function GET() {
  const fireworks = buildModelConfig(
    process.env.FIREWORKS_IMAGE_MODEL,
    process.env.FIREWORKS_IMAGE_MODELS,
  );
  const nanobanana = buildModelConfig(
    process.env.NANOBANANA_IMAGE_MODEL,
    process.env.NANOBANANA_IMAGE_MODELS,
    ["pro-diffusion-1", "stable-diffusion-v1.5"],
  );
  const ideogram = buildModelConfig(
    process.env.IDEOGRAM_IMAGE_MODEL,
    process.env.IDEOGRAM_IMAGE_MODELS,
    ["ideogram-v3", "ideogram-v2"],
  );

  return NextResponse.json({
    providers: {
      fireworks,
      nanobanana,
      ideogram,
    },
  });
}
