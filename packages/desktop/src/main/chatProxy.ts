import { ConversationMessage, ChatStepResult } from '@kratai/llm';
import { getDeviceToken, KRATAI_WEB_URL } from './auth.js';

/**
 * Same relay shape as generateProxy.ts's generateUseCaseDiagram, but one
 * model turn per call (see view.ts's ViewOptions.chat doc comment for why -
 * kratai-web can request a tool call, which only view.ts's process can
 * execute, so the loop lives there, not here). This function is a single,
 * stateless HTTP round trip; it has no idea whether it's mid-loop or not.
 */
export async function chatStep(messages: ConversationMessage[], workspaceName: string, summary: string): Promise<ChatStepResult> {
	const token = getDeviceToken();
	if (!token) throw new Error('Sign in to chat about this architecture.');

	const res = await fetch(new URL('/api/chat', KRATAI_WEB_URL), {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
		body: JSON.stringify({ messages, workspaceName, summary })
	});
	const data = await res.json().catch(() => ({} as Record<string, unknown>));
	if (!res.ok) throw new Error((data as { error?: string }).error || `Chat request failed (${res.status}).`);
	return data as ChatStepResult;
}
