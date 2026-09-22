import { LlmClient, LlmCompletion, LlmError, ConversationMessage, ToolDefinition, LlmTurn } from './llmClient.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

interface AnthropicContentBlock {
	type: string;
	text?: string;
	id?: string;
	name?: string;
	input?: Record<string, unknown>;
	tool_use_id?: string;
	content?: string;
}

/**
 * Plain fetch (Node 18+ global) rather than the @anthropic-ai/sdk package -
 * no streaming needed, so pulling in a whole SDK dependency isn't worth it.
 */
export class AnthropicClient implements LlmClient {
	constructor(
		private readonly apiKey: string,
		private readonly model: string = 'claude-sonnet-5',
		private readonly maxTokens: number = 4096
	) {}

	async complete(prompt: string): Promise<LlmCompletion> {
		const turn = await this.converse([{ role: 'user', text: prompt }]);
		return { text: turn.text, usage: turn.usage, model: turn.model };
	}

	async converse(messages: ConversationMessage[], systemPrompt?: string, tools: ToolDefinition[] = []): Promise<LlmTurn> {
		const anthropicMessages = messages.map(m => this.toAnthropicMessage(m));

		const body: Record<string, unknown> = {
			model: this.model,
			max_tokens: this.maxTokens,
			messages: anthropicMessages
		};
		if (systemPrompt) body.system = systemPrompt;
		if (tools.length > 0) {
			body.tools = tools.map(t => ({ name: t.name, description: t.description, input_schema: t.inputSchema }));
		}

		let response: Response;
		try {
			response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					'x-api-key': this.apiKey,
					'anthropic-version': API_VERSION
				},
				body: JSON.stringify(body)
			});
		} catch (error) {
			throw new LlmError('Could not reach the Anthropic API - check your network connection.', error);
		}

		if (!response.ok) {
			const responseBody = await response.text().catch(() => '');
			let message = `Anthropic API request failed (${response.status}).`;
			try {
				const parsed = JSON.parse(responseBody) as { error?: { message?: string } };
				if (parsed.error?.message) message = parsed.error.message;
			} catch {
				// Non-JSON error body - fall back to the generic status message above.
			}
			if (response.status === 401) message = 'Invalid Anthropic API key.';
			throw new LlmError(message);
		}

		const data = await response.json() as {
			content?: AnthropicContentBlock[];
			usage?: { input_tokens?: number; output_tokens?: number };
		};
		const blocks = data.content || [];
		const text = blocks.filter(b => b.type === 'text').map(b => b.text || '').join('');
		const toolCalls = blocks
			.filter(b => b.type === 'tool_use')
			.map(b => ({ id: b.id!, name: b.name!, input: b.input || {} }));

		if (!text && toolCalls.length === 0) throw new LlmError('Anthropic API returned no content.');

		return {
			text,
			toolCalls,
			usage: {
				inputTokens: data.usage?.input_tokens ?? 0,
				outputTokens: data.usage?.output_tokens ?? 0
			},
			model: this.model
		};
	}

	private toAnthropicMessage(m: ConversationMessage): { role: string; content: string | AnthropicContentBlock[] } {
		if (m.role === 'user' && m.toolResults?.length) {
			return {
				role: 'user',
				content: m.toolResults.map(r => ({ type: 'tool_result', tool_use_id: r.toolCallId, content: r.output }))
			};
		}
		if (m.role === 'assistant' && m.toolCalls?.length) {
			const content: AnthropicContentBlock[] = [];
			if (m.text) content.push({ type: 'text', text: m.text });
			m.toolCalls.forEach(tc => content.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.input }));
			return { role: 'assistant', content };
		}
		return { role: m.role, content: m.text || '' };
	}
}
