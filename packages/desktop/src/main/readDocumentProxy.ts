import { getDeviceToken, KRATAI_WEB_URL, failIfSessionExpired } from './auth.js';

/**
 * Sends a scanned document (an image, or a PDF of page pictures) to kratai-web, whose AI reads it into
 * text and bills the tokens - same device-token relay as newProjectProxy.ts. The CLI's view server
 * calls this through runView's readDocument hook, only for files it could not read the text of itself.
 */
export async function readScannedDocument(file: { name: string; mimeType: string; data: string }): Promise<string> {
	const token = getDeviceToken();
	if (!token) throw new Error('Sign in to read scanned documents.');

	const res = await fetch(new URL('/api/document/read', KRATAI_WEB_URL), {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
		body: JSON.stringify(file)
	});
	failIfSessionExpired(res);
	const data = await res.json().catch(() => ({} as Record<string, unknown>));
	if (!res.ok) throw new Error((data as { error?: string }).error || `kratai could not reach its AI service (error ${res.status}). Try again in a moment.`);
	return String((data as { text?: unknown }).text ?? '');
}
