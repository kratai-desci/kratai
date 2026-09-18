import { LlmClient, LlmCompletion, LlmError } from './llmClient.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Google AI Studio's Gemini API - a flat API key like Anthropic's (as
 * opposed to Vertex AI's service-account/OAuth auth, which draws on GCP
 * project billing but is a meaningfully different integration). Same
 * plain-fetch approach as AnthropicClient, no SDK dependency.
 */
export class GeminiClient implements LlmClient {
	constructor(
		private readonly apiKey: string,
		private readonly model: string = 'gemini-3.6-flash'
	) {}

	async complete(prompt: string): Promise<LlmCompletion> {
		const url = `${API_BASE}/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
		let response: Response;
		try {
			response = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
			});
		} catch (error) {
			throw new LlmError('Could not reach the Gemini API - check your network connection.', error);
		}

		if (!response.ok) {
			const body = await response.text().catch(() => '');
			let message = `Gemini API request failed (${response.status}).`;
			try {
				const parsed = JSON.parse(body) as { error?: { message?: string } };
				if (parsed.error?.message) message = parsed.error.message;
			} catch {
				// Non-JSON error body - fall back to the generic status message above.
			}
			throw new LlmError(message);
		}

		const data = await response.json() as {
			candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
			usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
		};
		const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('');
		if (!text) throw new LlmError('Gemini API returned no text content.');
		return {
			text,
			usage: {
				inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
				outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0
			},
			model: this.model
		};
	}
}
