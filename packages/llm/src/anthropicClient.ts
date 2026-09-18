import { LlmClient, LlmCompletion, LlmError } from './llmClient.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

/**
 * Plain fetch (Node 18+ global) rather than the @anthropic-ai/sdk package -
 * this is one JSON POST with no streaming, tool use, or retries needed, so
 * pulling in a whole SDK dependency for it isn't worth it.
 */
export class AnthropicClient implements LlmClient {
	constructor(
		private readonly apiKey: string,
		private readonly model: string = 'claude-sonnet-5',
		private readonly maxTokens: number = 4096
	) {}

	async complete(prompt: string): Promise<LlmCompletion> {
		let response: Response;
		try {
			response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					'x-api-key': this.apiKey,
					'anthropic-version': API_VERSION
				},
				body: JSON.stringify({
					model: this.model,
					max_tokens: this.maxTokens,
					messages: [{ role: 'user', content: prompt }]
				})
			});
		} catch (error) {
			throw new LlmError('Could not reach the Anthropic API - check your network connection.', error);
		}

		if (!response.ok) {
			const body = await response.text().catch(() => '');
			let message = `Anthropic API request failed (${response.status}).`;
			try {
				const parsed = JSON.parse(body) as { error?: { message?: string } };
				if (parsed.error?.message) message = parsed.error.message;
			} catch {
				// Non-JSON error body - fall back to the generic status message above.
			}
			if (response.status === 401) message = 'Invalid API key. Check the key saved in Settings.';
			throw new LlmError(message);
		}

		const data = await response.json() as {
			content?: Array<{ type: string; text?: string }>;
			usage?: { input_tokens?: number; output_tokens?: number };
		};
		const text = data.content?.find(block => block.type === 'text')?.text;
		if (!text) throw new LlmError('Anthropic API returned no text content.');
		return {
			text,
			usage: {
				inputTokens: data.usage?.input_tokens ?? 0,
				outputTokens: data.usage?.output_tokens ?? 0
			},
			model: this.model
		};
	}
}
