import * as fs from 'fs/promises';
import * as path from 'path';
import { dialog } from 'electron';
import { renderRequirementsPdf, renderProgressPdf, safeFileName, type PdfExportResult } from './pdfExport.js';
import { renderRequirementsDocx, renderProgressDocx } from './docxExport.js';

interface DocumentKind {
	/** The save dialog's title and the start of the suggested file name's description. */
	saveTitle: string;
	fileSuffix: string;
	pdf: (port: number, projectName: string) => Promise<Buffer>;
	docx: (port: number, projectName: string) => Promise<Buffer>;
}

/**
 * One "Download" button for each document, the file type chosen where the file is named: the save
 * dialog offers Word and PDF (a "Format" menu on macOS, "Save as type" on Windows), and the name's
 * extension decides what is built. The document is only generated after the user has picked a
 * place and a type, so cancelling costs nothing.
 */
async function exportDocument(port: number, projectName: string, kind: DocumentKind): Promise<PdfExportResult> {
	try {
		const picked = await dialog.showSaveDialog({
			title: kind.saveTitle,
			defaultPath: `${safeFileName(projectName)}-${kind.fileSuffix}.docx`,
			filters: [
				{ name: 'Word document', extensions: ['docx'] },
				{ name: 'PDF', extensions: ['pdf'] }
			]
		});
		if (picked.canceled || !picked.filePath) return { ok: false };
		// A name typed with no (or another) extension still has to become one of the two.
		const asWord = path.extname(picked.filePath).toLowerCase() === '.docx';
		const filePath = asWord || path.extname(picked.filePath).toLowerCase() === '.pdf' ? picked.filePath : `${picked.filePath}.pdf`;
		const buffer = await (asWord ? kind.docx : kind.pdf)(port, projectName);
		await fs.writeFile(filePath, buffer);
		return { ok: true, path: path.basename(filePath) };
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : String(error) };
	}
}

export function exportRequirements(port: number, projectName: string): Promise<PdfExportResult> {
	return exportDocument(port, projectName, { saveTitle: 'Save Software Requirements Specification', fileSuffix: 'requirements', pdf: renderRequirementsPdf, docx: renderRequirementsDocx });
}

/** The client progress report (the Progress view's "Download Progress" button). */
export function exportProgress(port: number, projectName: string): Promise<PdfExportResult> {
	return exportDocument(port, projectName, { saveTitle: 'Save Progress Report', fileSuffix: 'progress-report', pdf: renderProgressPdf, docx: renderProgressDocx });
}
