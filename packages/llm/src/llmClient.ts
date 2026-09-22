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

export interface ToolDefinition {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
}

export interface ToolCall {
	/** Anthropic issues a real id we just carry through; Gemini has no
	 * equivalent (it correlates by name), so GeminiClient invents one -
	 * either way, ToolResult.toolCallId always matches this. */
	id: string;
	name: string;
	input: Record<string, unknown>;
	/** Opaque, provider-specific continuation data that must be replayed
	 * back unchanged on the next turn for that provider's own API to accept
	 * it - e.g. Gemini's thoughtSignature, required on a replayed
	 * functionCall part or the API rejects the request outright. Ignored by
	 * providers that don't need it (Anthropic). Round-trips through
	 * @kratai/cli's conversation array like everything else on ToolCall,
	 * since no client instance survives between hops (each request is a
	 * fresh, stateless HTTP call). */
	providerData?: unknown;
}

export interface ToolResult {
	toolCallId: string;
	output: string;
}

/**
 * One canonical message shape for both what's sent to the model and what's
 * replayed as history - a superset of plain chat that also carries tool
 * calls/results when present, translated to/from each provider's own wire
 * shape inside the client. `toolCalls` only ever appears on an 'assistant'
 * message; `toolResults` only ever on the 'user' message replying to them.
 */
export interface ConversationMessage {
	role: 'user' | 'assistant';
	text?: string;
	toolCalls?: ToolCall[];
	toolResults?: ToolResult[];
}

export interface LlmTurn {
	text: string;
	toolCalls: ToolCall[];
	usage: LlmUsage;
	model: string;
}

/**
 * Provider-agnostic seam. `complete` is one-shot (use case extraction, no
 * tools, no history). `converse` is multi-turn and tool-capable (the AI
 * chat panel) - tool execution itself never happens in this package (it
 * has no access to a codebase's parsed data), only the request/response
 * shape for it does; see @kratai/cli's chatTools.ts for execution.
 */
export interface LlmClient {
	complete(prompt: string): Promise<LlmCompletion>;
	converse(messages: ConversationMessage[], systemPrompt?: string, tools?: ToolDefinition[]): Promise<LlmTurn>;
}

export class LlmError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = 'LlmError';
	}
}
