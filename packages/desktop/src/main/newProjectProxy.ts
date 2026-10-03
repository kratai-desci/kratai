import type { NewProjectStep } from '@kratai-desci/llm';
import { getDeviceToken, KRATAI_WEB_URL } from './auth.js';

/**
 * Relays one step of the new-project wizard (the CLI's view server calls this
 * through runView's newProjectAi hook) to kratai-web, which runs the prompt
 * and bills it - same device-token relay as generateProxy.ts. Resolves to the
 * step's suggestions, or for 'draft' the details the spec is assembled from.
 */
export async function runNewProjectStep(step: NewProjectStep, input: unknown, workspaceName: string): Promise<unknown> {
	const token = getDeviceToken();
	if (!token) throw new Error('Sign in to set up a new project.');

	const res = await fetch(new URL('/api/wizard', KRATAI_WEB_URL), {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
		body: JSON.stringify({ step, input, workspaceName })
	});
	const data = await res.json().catch(() => ({} as Record<string, unknown>));
	if (!res.ok) throw new Error((data as { error?: string }).error || `kratai could not reach its AI service (error ${res.status}). Try again in a moment.`);
	return (data as { data?: unknown }).data;
}
