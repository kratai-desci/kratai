import { randomUUID } from 'crypto';
import { LlmClient, LlmCompletion, LlmError, ConversationMessage, ToolDefinition, LlmTurn } from './llmClient.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart {
	text?: string;
	functionCall?: { name: string; args?: Record<string, unknown> };
	functionResponse?: { name: string; response: { result: string } };
	/** Required back on a replayed functionCall part - see ToolCall.providerData's
	 * doc comment. Omitting it on the replay is a hard API error, not just
	 * a quality degradation, despite what Gemini's own error message implies. */
	thoughtSignature?: string;
}

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
		const turn = await this.converse([{ role: 'user', text: prompt }]);
		return { text: turn.text, usage: turn.usage, model: turn.model };
	}

	async converse(messages: ConversationMessage[], systemPrompt?: string, tools: ToolDefinition[] = []): Promise<LlmTurn> {
		// Gemini correlates a function response by name, not by a
		// provider-issued call id the way Anthropic does - this resolves our
		// own invented ToolCall.id back to the name it was issued for, by
		// scanning every assistant tool call already in the conversation
		// (stateless per request, so this is rebuilt fresh every call).
		const idToName: Record<string, string> = {};
		messages.forEach(m => {
			m.toolCalls?.forEach(tc => { idToName[tc.id] = tc.name; });
		});

		const contents = messages.map(m => this.toGeminiContent(m, idToName));

		const body: Record<string, unknown> = { contents };
		if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
		if (tools.length > 0) {
			body.tools = [{
				functionDeclarations: tools.map(t => ({ name: t.name, description: t.description, parameters: t.inputSchema }))
			}];
		}

		const url = `${API_BASE}/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
		let response: Response;
		try {
			response = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
		} catch (error) {
			throw new LlmError('Could not reach the Gemini API - check your network connection.', error);
		}

		if (!response.ok) {
			const responseBody = await response.text().catch(() => '');
			let message = `Gemini API request failed (${response.status}).`;
			try {
				const parsed = JSON.parse(responseBody) as { error?: { message?: string } };
				if (parsed.error?.message) message = parsed.error.message;
			} catch {
				// Non-JSON error body - fall back to the generic status message above.
			}
			throw new LlmError(message);
		}

		const data = await response.json() as {
			candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
			usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
		};
		const parts = data.candidates?.[0]?.content?.parts || [];
		const text = parts.filter(p => p.text).map(p => p.text).join('');
		const toolCalls = parts
			.filter(p => p.functionCall)
			.map(p => ({
				id: randomUUID(),
				name: p.functionCall!.name,
				input: p.functionCall!.args || {},
				providerData: p.thoughtSignature
			}));

		if (!text && toolCalls.length === 0) throw new LlmError('Gemini API returned no content.');

		return {
			text,
			toolCalls,
			usage: {
				inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
				outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0
			},
			model: this.model
		};
	}

	private toGeminiContent(m: ConversationMessage, idToName: Record<string, string>): { role: string; parts: GeminiPart[] } {
		if (m.role === 'user' && m.toolResults?.length) {
			return {
				role: 'user',
				parts: m.toolResults.map(r => ({
					functionResponse: { name: idToName[r.toolCallId] || r.toolCallId, response: { result: r.output } }
				}))
			};
		}
		if (m.role === 'assistant' && m.toolCalls?.length) {
			const parts: GeminiPart[] = [];
			if (m.text) parts.push({ text: m.text });
			m.toolCalls.forEach(tc => parts.push({
				functionCall: { name: tc.name, args: tc.input },
				...(typeof tc.providerData === 'string' ? { thoughtSignature: tc.providerData } : {})
			}));
			return { role: 'model', parts };
		}
		return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text || '' }] };
	}
}
