import { LlmClient, LlmCompletion, LlmError, LlmFile } from './llmClient.js';

/**
 * Reading a scanned document (a PDF made of page pictures, or a photo or screenshot of a page) into
 * text, so it can be used like any other document in the new-project wizard. The AI reads the file
 * itself - there is no separate text-recognition step - which is why this lives beside the other
 * prompts: kratai.com runs it with its own key and bills the tokens like any other call.
 */

/** What can be read, by file type. The extension is what the desktop app has; the model needs the MIME type. */
export const READABLE_SCAN_TYPES: Record<string, string> = {
	'.pdf': 'application/pdf',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.heic': 'image/heic',
	'.heif': 'image/heif'
};

/** The largest file sent for reading. The file travels as base64 inside one request, and the hosting limit is 32 MB. */
export const MAX_SCAN_BYTES = 20 * 1024 * 1024;

export const READ_DOCUMENT_PROMPT = `Transcribe this document into plain text.

- Copy ALL the text, in reading order, exactly as written and in its original language (for example Thai or English). Do not translate, summarize, correct or leave anything out.
- Keep headings, numbered and bulleted lists as lines of text. Write tables as Markdown tables.
- For a diagram, chart, photo or logo that carries information, add one short line in square brackets saying what it shows, for example [Diagram: login flow from the mobile app to the server]. Skip decorations, page numbers, headers and footers that repeat on every page.
- Where text is unreadable, write [unreadable] instead of guessing.
- Output only the transcription, with no introduction or comments.`;

/** The text of a scanned document. Throws LlmError when the provider cannot read files, or reads nothing. */
export async function readDocument(client: LlmClient, file: LlmFile): Promise<LlmCompletion> {
	if (!client.transcribe) throw new LlmError('The AI provider kratai is using cannot read scanned documents.');
	const result = await client.transcribe(file, READ_DOCUMENT_PROMPT);
	const text = result.text.trim();
	if (text.replace(/\[unreadable\]/g, '').trim().length < 10) throw new LlmError('No readable text was found in that file.');
	return { ...result, text };
}
