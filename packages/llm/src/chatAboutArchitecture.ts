import { ConversationMessage, LlmClient, LlmUsage, ToolCall } from './llmClient.js';
import { CHAT_TOOL_DEFINITIONS } from './chatToolDefinitions.js';

/** Either a final answer, or tool calls the caller must execute and reply
 * to (see @kratai/cli's view.ts, which owns the actual multi-hop loop -
 * this package only ever does one model turn per call). */
export type ChatStepResult =
	| { done: true; reply: string; usage: LlmUsage; model: string }
	| { done: false; toolCalls: ToolCall[]; assistantText: string; usage: LlmUsage; model: string };

function buildSystemPrompt(workspaceName: string, summary: string): string {
	return `You are explaining the architecture of a codebase called "${workspaceName}" to a developer looking at kratai's visualization of it (class diagram, 3D dependency graph, folder structure). Be concise and specific - reference actual route paths, folder names, or entry-point names rather than generic advice.

You have tools to look up real detail on demand: search_classes, get_class_detail, trace_reachability, what_changed, get_folder_structure. You have a limited number of tool calls per question (a handful, not dozens) - budget them:
- Start from a name you already have (from the summary below, or from the user's own question) rather than guessing at single generic words like "server" or "main" - a vague query returns a long, mostly-irrelevant list and burns a turn for little gain.
- search_classes is for finding an exact name to feed into get_class_detail next, not an end in itself - don't call it more than once or twice per question.
- If you're not converging after 2-3 calls, stop searching and answer with your best synthesis of what you've found, explicitly noting what you couldn't confirm - a grounded partial answer beats exhausting your budget without ever answering.

High-level summary (routes, entry points, folder structure - not full implementation detail):

${summary}`;
}

/**
 * One turn of a tool-capable conversation. The caller owns the loop: if
 * this returns done:false, execute the tool calls (against whatever has
 * the actual codebase data - never this package), append a
 * {role:'user', toolResults} message to the conversation, and call this
 * again with the extended history.
 *
 * No "stop calling tools now" escape hatch here on purpose - an earlier
 * version tried declaring zero tools on a final forced turn, but Gemini
 * doesn't reliably honor that once its own history already shows a
 * tool-calling pattern (it kept emitting function calls, even hallucinating
 * a tool name that was never declared). @kratai/cli's view.ts instead
 * synthesizes a fallback directly from whatever was already gathered when
 * its tool budget runs out, rather than trusting any provider to stop.
 */
export async function chatAboutArchitecture(
	client: LlmClient,
	messages: ConversationMessage[],
	workspaceName: string,
	summary: string
): Promise<ChatStepResult> {
	const turn = await client.converse(messages, buildSystemPrompt(workspaceName, summary), CHAT_TOOL_DEFINITIONS);
	if (turn.toolCalls.length === 0) {
		return { done: true, reply: turn.text, usage: turn.usage, model: turn.model };
	}
	return { done: false, toolCalls: turn.toolCalls, assistantText: turn.text, usage: turn.usage, model: turn.model };
}
