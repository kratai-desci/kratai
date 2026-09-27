import { LlmClient } from './llmClient.js';
import { AnthropicClient } from './anthropicClient.js';
import { GeminiClient } from './geminiClient.js';
import { LlmProvider } from './providers.js';

/** The one place that knows which concrete client a provider tag maps to -
 * callers (view.ts's generate route, the chat backend) pick a provider, not
 * a class. model is optional - omitted, each client keeps its own default
 * (see geminiClient.ts/anthropicClient.ts); a caller with different quality
 * needs per route (e.g. chat's GEMINI_CHAT_MODEL) passes its own. */
export function createLlmClient(provider: LlmProvider, apiKey: string, model?: string): LlmClient {
	switch (provider) {
		case 'gemini': return model ? new GeminiClient(apiKey, model) : new GeminiClient(apiKey);
		case 'anthropic': return model ? new AnthropicClient(apiKey, model) : new AnthropicClient(apiKey);
	}
}
