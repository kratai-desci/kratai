export interface LlmUsage {
	inputTokens: number;
	outputTokens: number;
}

export interface LlmCompletion {
	text: string;
	usage: LlmUsage;
	/** The concrete model string that actually served the request - callers
	 * that meter/bill (never this package - see providers.ts's comment on
	 * where pricing belongs) need this alongside the provider tag to look
	 * up a $/token rate. */
	model: string;
}

/**
 * Provider-agnostic seam - kept generic on purpose even though
 * AnthropicClient is the only implementation today, since the AI chat
 * panel already scaffolded in the view shell will call through this same
 * interface once its backend is wired up, not reimplement its own client.
 */
export interface LlmClient {
	complete(prompt: string): Promise<LlmCompletion>;
}

export class LlmError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = 'LlmError';
	}
}
