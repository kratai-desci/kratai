import { inflateRawSync } from 'zlib';

/**
 * Turns a document the user adds in the new-project wizard into plain text: Markdown and plain text as they are, Word
 * (.docx) by reading the XML inside its zip, PDF through the unpdf library. Everything happens on the user's own
 * computer; only the resulting text is ever sent anywhere, and only when they continue the wizard.
 */

export const MAX_DOCUMENT_FILE_BYTES = 25 * 1024 * 1024;
export const DOCUMENT_EXTENSIONS = ['.md', '.markdown', '.txt', '.docx', '.pdf'];

export class DocumentError extends Error {}

function extensionOf(name: string): string {
	const dot = name.lastIndexOf('.');
	return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

function decodeXmlEntities(s: string): string {
	return s
		.replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => String.fromCodePoint(parseInt(h, 16)))
		.replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(parseInt(d, 10)))
		.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

/** Reads one named file out of a zip (central directory lookup; stored or deflated entries). */
function readZipEntry(zip: Buffer, wanted: string): Buffer | undefined {
	// End of central directory record: the last 22+ bytes, signature 0x06054b50.
	let eocd = -1;
	for (let i = zip.length - 22; i >= Math.max(0, zip.length - 22 - 65535); i--) {
		if (zip.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
	}
	if (eocd === -1) throw new DocumentError('This file does not look like a Word document.');
	const entries = zip.readUInt16LE(eocd + 10);
	let pos = zip.readUInt32LE(eocd + 16);
	for (let n = 0; n < entries; n++) {
		if (pos + 46 > zip.length || zip.readUInt32LE(pos) !== 0x02014b50) break;
		const method = zip.readUInt16LE(pos + 10);
		const compressedSize = zip.readUInt32LE(pos + 20);
		const nameLength = zip.readUInt16LE(pos + 28);
		const extraLength = zip.readUInt16LE(pos + 30);
		const commentLength = zip.readUInt16LE(pos + 32);
		const localOffset = zip.readUInt32LE(pos + 42);
		const name = zip.toString('utf8', pos + 46, pos + 46 + nameLength);
		if (name === wanted) {
			const localNameLength = zip.readUInt16LE(localOffset + 26);
			const localExtraLength = zip.readUInt16LE(localOffset + 28);
			const start = localOffset + 30 + localNameLength + localExtraLength;
			const data = zip.subarray(start, start + compressedSize);
			return method === 0 ? Buffer.from(data) : inflateRawSync(data);
		}
		pos += 46 + nameLength + extraLength + commentLength;
	}
	return undefined;
}

export function docxText(data: Buffer): string {
	const xml = readZipEntry(data, 'word/document.xml');
	if (!xml) throw new DocumentError('This Word file has no readable text (it may be an old .doc file: save it as .docx).');
	const text = xml.toString('utf8')
		.replace(/<w:tab\s*\/>/g, '\t')
		.replace(/<w:(br|cr)\b[^>]*\/>/g, '\n')
		.replace(/<\/w:p>/g, '\n')
		.replace(/<\/w:tc>/g, '\t')
		.replace(/<\/w:tr>/g, '\n')
		.replace(/<[^>]+>/g, '');
	return decodeXmlEntities(text).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function pdfText(data: Buffer): Promise<string> {
	const { getDocumentProxy, extractText } = await import('unpdf');
	const pdf = await getDocumentProxy(new Uint8Array(data));
	const { text } = await extractText(pdf, { mergePages: true });
	const joined = (Array.isArray(text) ? text.join('\n\n') : text).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
	if (joined.length < 20) throw new DocumentError('This PDF has no selectable text (it may be a scan). Save a text version, or paste the content into the description.');
	return joined;
}

/** The text of one uploaded document. Throws DocumentError with a message for the user. */
export async function extractDocumentText(name: string, data: Buffer): Promise<string> {
	if (data.length === 0) throw new DocumentError('That file is empty.');
	if (data.length > MAX_DOCUMENT_FILE_BYTES) throw new DocumentError('That file is larger than 25 MB.');
	const ext = extensionOf(name);
	let text: string;
	if (ext === '.txt' || ext === '.md' || ext === '.markdown') text = data.toString('utf8').replace(/^﻿/, '').trim();
	else if (ext === '.docx') text = docxText(data);
	else if (ext === '.pdf') text = await pdfText(data);
	else throw new DocumentError(`Files of type "${ext || 'unknown'}" are not supported. Use PDF, Word (.docx), Markdown or plain text.`);
	if (!text) throw new DocumentError('No text could be read from that file.');
	return text;
}
