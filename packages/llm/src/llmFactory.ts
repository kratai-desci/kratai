import { LlmClient } from './llmClient.js';
import { AnthropicClient } from './anthropicClient.js';
import { GeminiClient } from './geminiClient.js';
import { LlmProvider } from './providers.js';

/** The one place that knows which concrete client a provider tag maps to -
 * callers (view.ts's generate route, eventually the chat backend) pick a
 * provider, not a class. */
export function createLlmClient(provider: LlmProvider, apiKey: string): LlmClient {
	switch (provider) {
		case 'gemini': return new GeminiClient(apiKey);
		case 'anthropic': return new AnthropicClient(apiKey);
	}
}
