import { app, BrowserWindow } from 'electron';
import * as fs from 'fs';
import type { MockupGenerateInput, MockupGenerateResult } from '@kratai-desci/llm';
import { getDeviceToken, KRATAI_WEB_URL, failIfSessionExpired } from './auth.js';

/**
 * Designs one mockup screen: relays to kratai-web, which holds the model key and meters the call against the
 * user's credit, the same way Generate and chat do. The first mockup of a project also gets the project's
 * shared sample data back (made in the same call).
 */
export async function generateMockup(input: MockupGenerateInput): Promise<MockupGenerateResult> {
	const token = getDeviceToken();
	if (!token) throw new Error('Sign in to design a mockup.');

	const res = await fetch(new URL('/api/generate/mockup', KRATAI_WEB_URL), {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
		body: JSON.stringify(input)
	});
	failIfSessionExpired(res);
	const data = await res.json().catch(() => ({} as Record<string, unknown>));
	if (!res.ok) throw new Error((data as { error?: string }).error || `Mockup generation failed (${res.status}).`);
	return data as MockupGenerateResult;
}

/**
 * A picture of a mockup page, for the PDF documents: the page (served by the local view server) is loaded in a
 * hidden window sized to the page - 1280 wide, as tall as the page up to 2000 - and saved as a PNG. Resolves false
 * on any failure; a mockup with no picture is just left out of the documents.
 */
export async function captureMockupImage(info: { url: string; outFile: string }): Promise<boolean> {
	if (!app.isReady()) await app.whenReady();
	const win = new BrowserWindow({ show: false, width: 1280, height: 800, useContentSize: true, webPreferences: { sandbox: true, javascript: false } });
	try {
		await win.loadURL(info.url);
		await new Promise(resolve => setTimeout(resolve, 350));
		const height = await win.webContents.executeJavaScript('Math.max(document.documentElement.scrollHeight, 800)').catch(() => 800) as number;
		win.setContentSize(1280, Math.min(Math.max(Math.round(height), 800), 2000));
		await new Promise(resolve => setTimeout(resolve, 250));
		const image = await win.webContents.capturePage();
		fs.writeFileSync(info.outFile, image.toPNG());
		return true;
	} catch (error) {
		console.warn(`Could not capture a mockup picture: ${error instanceof Error ? error.message : error}`);
		return false;
	} finally {
		win.destroy();
	}
}
