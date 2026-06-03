import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// The OpenRouter SDK types model ids as plain `string` — no typo protection. This union is
// our allowlist of ids confirmed live on OpenRouter. widen it to add a model.
export type OpenRouterModelId = "deepseek/deepseek-v4-pro" | "deepseek/deepseek-v4-flash";

export const GRADER_MODEL: OpenRouterModelId = "deepseek/deepseek-v4-pro";

// Passed through to OpenRouter on the grade call.
export const GRADER_PROVIDER_OPTIONS = {
  openrouter: { reasoning: { effort: "medium" } },
};
