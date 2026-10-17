import { BrowserWindow } from 'electron';
import {
	AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, LevelFormat,
	Packer, PageBreak, PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType
} from 'docx';

/** One run of text inside a paragraph, list item or table cell. */
interface Run { text: string; bold?: boolean; italic?: boolean; }

/**
 * The document as the page shows it, flattened to the few kinds of block the SRS is made of. Read
 * from the rendered page (see EXTRACT_SCRIPT) rather than rebuilt from the spec, so the Word file
 * always says what the PDF says - a change to the document's wording or order only happens once.
 */
type Block =
	| { t: 'h'; level: 1 | 2 | 3; text: string; pageBreak: boolean }
	| { t: 'p'; runs: Run[]; style: 'body' | 'kicker' | 'label' | 'intro' }
	| { t: 'li'; runs: Run[]; listId: number; ordered: boolean }
	| { t: 'table'; rows: { th: boolean; text: string }[][] }
	| { t: 'fig'; index: number; caption: string };

// Runs inside the hidden page. Walks the document's own markup (headings, paragraphs, lists, tables,
// figures) and ignores everything about how it looks. Text that sits directly in a div (the cover's
// kicker and labels, a use case's "Main flow" label) becomes a paragraph of its own.
const EXTRACT_SCRIPT = `(() => {
	const BLOCK = new Set(['H1','H2','H3','P','UL','OL','TABLE','FIGURE','DIV']);
	const blocks = [];
	let listId = 0;
	let figures = 0;
	const clean = s => s.replace(/\\s+/g, ' ');
	function runsOf(node, base, out) {
		node.childNodes.forEach(n => {
			if (n.nodeType === 3) { out.push(Object.assign({ text: clean(n.textContent) }, base)); return; }
			if (n.nodeType !== 1) return;
			if (n.tagName === 'BR') { out.push(Object.assign({ text: ' ' }, base)); return; }
			if (n.tagName === 'SVG' || n.tagName === 'svg') return;
			const cls = n.classList;
			const bold = n.tagName === 'STRONG' || n.tagName === 'B' || cls.contains('nfr-id') || cls.contains('uc-detail-label');
			const italic = n.tagName === 'EM' || n.tagName === 'I';
			runsOf(n, Object.assign({}, base, bold ? { bold: true } : {}, italic ? { italic: true } : {}), out);
			if (cls.contains('nfr-id')) out.push(Object.assign({ text: ' ' }, base));
		});
		return out;
	}
	function tidy(runs) {
		const joined = runs.filter(r => r.text !== '');
		if (joined.length) joined[0].text = joined[0].text.replace(/^ /, '');
		if (joined.length) joined[joined.length - 1].text = joined[joined.length - 1].text.replace(/ $/, '');
		return joined.filter(r => r.text !== '');
	}
	// textContent, except that a few pieces the page lays out apart are kept apart: a requirement's
	// "For UC-n ..." note sits on its own line in a table cell, a use case's status after its title.
	function textOf(el) {
		let out = '';
		el.childNodes.forEach(n => {
			if (n.nodeType === 3) { out += n.textContent; return; }
			if (n.nodeType !== 1) return;
			const cls = n.classList;
			if (cls.contains('for')) out += '\\n';
			if (cls.contains('uc-status')) out += '  -  ';
			out += textOf(n);
		});
		return out;
	}
	function text(el) { return textOf(el).split('\\n').map(l => clean(l).trim()).filter(Boolean).join('\\n'); }
	function walk(el, newPage) {
		let pending = [];
		const flush = style => {
			const runs = tidy(pending); pending = [];
			if (runs.length) blocks.push({ t: 'p', runs, style: style || 'body' });
		};
		el.childNodes.forEach(n => {
			if (n.nodeType === 3) { pending.push({ text: clean(n.textContent) }); return; }
			if (n.nodeType !== 1) return;
			const tag = n.tagName;
			if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'svg' || tag === 'SVG' || n.id === 'pdf-download') return;
			if (!BLOCK.has(tag)) { runsOf({ childNodes: [n] }, {}, pending); return; }
			flush();
			const cls = n.classList;
			if (tag === 'H1' || tag === 'H2' || tag === 'H3') {
				blocks.push({ t: 'h', level: Number(tag[1]), text: text(n), pageBreak: tag === 'H2' && !!newPage });
			} else if (tag === 'P') {
				const runs = tidy(runsOf(n, {}, []));
				if (runs.length) blocks.push({ t: 'p', runs, style: cls.contains('section-intro') ? 'intro' : 'body' });
			} else if (tag === 'UL' || tag === 'OL') {
				const id = ++listId;
				n.querySelectorAll(':scope > li').forEach(li => {
					const runs = tidy(runsOf(li, {}, []));
					if (runs.length) blocks.push({ t: 'li', runs, listId: id, ordered: tag === 'OL' });
				});
			} else if (tag === 'TABLE') {
				const rows = [...n.querySelectorAll('tr')].map(tr => [...tr.children].map(c => ({ th: c.tagName === 'TH', text: text(c) })));
				if (rows.length) blocks.push({ t: 'table', rows });
			} else if (tag === 'FIGURE') {
				const cap = n.querySelector('figcaption');
				blocks.push({ t: 'fig', index: figures++, caption: cap ? text(cap) : '' });
			} else if (cls.contains('progress-summary')) {
				const cells = [...n.children];
				blocks.push({ t: 'table', rows: [
					cells.map(c => ({ th: true, text: text(c.querySelector('.k')) })),
					cells.map(c => ({ th: false, text: text(c.querySelector('.v')) }))
				] });
			} else if (cls.contains('progress-legend')) {
				const runs = tidy([...n.children].flatMap((c, i) => [{ text: i ? '     ' : '' }, ...runsOf(c, {}, [])]));
				if (runs.length) blocks.push({ t: 'p', runs, style: 'body' });
			} else if (cls.contains('meta-field')) {
				const label = n.querySelector('.meta-label'), value = n.querySelector('.meta-value');
				const v = value ? text(value) : '';
				if (v) blocks.push({ t: 'p', runs: [{ text: (label ? text(label) : '') + ': ', bold: true }, { text: v }], style: 'body' });
			} else {
				const hasBlocks = [...n.children].some(c => BLOCK.has(c.tagName));
				if (hasBlocks) {
					walk(n, cls.contains('section-new-page'));
				} else {
					const runs = tidy(runsOf(n, {}, []));
					if (runs.length) blocks.push({ t: 'p', runs, style: cls.contains('kicker') ? 'kicker' : (cls.contains('cover-label') ? 'label' : 'body') });
				}
			}
		});
		flush();
	}
	walk(document.getElementById('doc'), false);
	return blocks;
})()`;

const NAVY = '17203A';
const TEXT_WIDTH_PX = 600;   // A4 with 1" margins is ~6.27in wide
const MAX_FIGURE_HEIGHT_PX = 820;

// Every run carries its own font and size: the document defaults alone are ignored by some readers
// (Pages, and Word-compatible viewers on phones), which then show the text at their own default.
const FONT = 'Calibri';
const BODY_SIZE = 22;
const run = (r: Run, extra: { size?: number; color?: string } = {}) => new TextRun({ text: r.text, bold: r.bold, italics: r.italic, font: FONT, size: BODY_SIZE, ...extra });

/** Column widths for a table: share the width by how much text each column holds, within sane bounds. */
function columnWidths(rows: { text: string }[][]): number[] {
	const cols = rows[0].length;
	const weight = Array.from({ length: cols }, (_, c) => Math.min(60, Math.max(12, ...rows.map(r => (r[c]?.text.length ?? 0)))));
	const total = weight.reduce((a, b) => a + b, 0);
	const page = 9000; // twips (A4 text width is ~9026)
	return weight.map(w => Math.round(page * w / total));
}

function buildTable(rows: { th: boolean; text: string }[][]): Table {
	const widths = columnWidths(rows);
	const line = { style: BorderStyle.SINGLE, size: 4, color: 'C9CED8' };
	const borders = { top: line, bottom: line, left: line, right: line };
	return new Table({
		width: { size: 9000, type: WidthType.DXA },
		columnWidths: widths,
		rows: rows.map(cells => new TableRow({
			tableHeader: cells.every(c => c.th),
			cantSplit: true,
			children: cells.map((c, i) => new TableCell({
				width: { size: widths[i], type: WidthType.DXA },
				borders,
				margins: { top: 60, bottom: 60, left: 100, right: 100 },
				shading: c.th ? { type: ShadingType.CLEAR, fill: 'EEF1F6', color: 'auto' } : undefined,
				children: c.text.split('\n').map((line, n) => new Paragraph({ children: [new TextRun({ text: line, bold: c.th, font: FONT, size: n ? 18 : 20, color: n ? '6B7280' : undefined })] }))
			}))
		}))
	});
}

/** Takes a picture of each figure (diagram plus its requirement tags) exactly as the page draws it. */
async function captureFigures(win: BrowserWindow, count: number): Promise<{ png: Buffer; width: number; height: number }[]> {
	const out: { png: Buffer; width: number; height: number }[] = [];
	for (let i = 0; i < count; i++) {
		const rect = await win.webContents.executeJavaScript(`(() => {
			const el = document.querySelectorAll('#doc figure')[${i}];
			el.scrollIntoView({ block: 'start' });
			const r = el.getBoundingClientRect();
			return { x: Math.floor(r.left), y: Math.floor(r.top), width: Math.ceil(r.width), height: Math.ceil(r.height) };
		})()`) as { x: number; y: number; width: number; height: number };
		// Window tall enough to hold the whole figure, or the picture is cut off at the bottom.
		const [w] = win.getContentSize();
		win.setContentSize(w, Math.max(900, rect.height + 120));
		await new Promise(r => setTimeout(r, 150));
		const rect2 = await win.webContents.executeJavaScript(`(() => {
			const el = document.querySelectorAll('#doc figure')[${i}];
			el.scrollIntoView({ block: 'start' });
			const r = el.getBoundingClientRect();
			return { x: Math.floor(r.left), y: Math.floor(r.top), width: Math.ceil(r.width), height: Math.ceil(r.height) };
		})()`) as { x: number; y: number; width: number; height: number };
		const image = await win.webContents.capturePage(rect2);
		out.push({ png: image.toPNG(), width: rect2.width, height: rect2.height });
	}
	return out;
}

function buildDocument(blocks: Block[], figures: { png: Buffer; width: number; height: number }[], projectName: string, docType: string): Document {
	const children: (Paragraph | Table)[] = [];
	// The cover sits on its own page, as in the PDF: the first section heading after the title starts page 2.
	let afterTitle = false;
	let firstSection = true;
	for (const b of blocks) {
		if (b.t === 'h') {
			if (b.level === 1) {
				children.push(new Paragraph({ heading: HeadingLevel.TITLE, spacing: { before: 1200, after: 300 }, children: [new TextRun({ text: b.text, bold: true, font: FONT, size: 56, color: NAVY })] }));
				afterTitle = true;
			} else {
				const startsPage = b.pageBreak || (b.level === 2 && afterTitle && firstSection);
				if (b.level === 2) firstSection = false;
				children.push(new Paragraph({
					heading: b.level === 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
					keepNext: true,
					spacing: { before: b.level === 2 ? 360 : 240, after: 120 },
					// An explicit page break rather than the "page break before" paragraph setting: Pages and a few
					// other readers handle that setting inconsistently, a break in the text is read the same everywhere.
					children: [
						...(startsPage ? [new PageBreak()] : []),
						new TextRun({ text: b.text, bold: true, font: FONT, size: b.level === 2 ? 32 : 26, color: NAVY })
					]
				}));
			}
		} else if (b.t === 'p') {
			const p = b.style;
			children.push(new Paragraph({
				...(p === 'intro' ? { keepNext: true } : {}),
				spacing: { before: p === 'label' ? 480 : 0, after: 120 },
				children: b.runs.map(r => run(r, p === 'kicker' ? { size: 22, color: '6B7280' } : p === 'label' ? { size: 18, color: '6B7280' } : {}))
			}));
		} else if (b.t === 'li') {
			children.push(new Paragraph({
				...(b.ordered ? { numbering: { reference: 'ordered', level: 0, instance: b.listId } } : { bullet: { level: 0 } }),
				spacing: { after: 60 },
				children: b.runs.map(r => run(r))
			}));
		} else if (b.t === 'table') {
			children.push(buildTable(b.rows), new Paragraph({ spacing: { after: 120 }, children: [] }));
		} else if (b.t === 'fig') {
			const f = figures[b.index];
			if (f) {
				const scale = Math.min(1, TEXT_WIDTH_PX / f.width, MAX_FIGURE_HEIGHT_PX / f.height);
				children.push(new Paragraph({
					alignment: AlignmentType.CENTER,
					keepNext: true,
					children: [new ImageRun({ type: 'png', data: f.png, transformation: { width: Math.round(f.width * scale), height: Math.round(f.height * scale) }, altText: { name: b.caption || 'Figure', title: b.caption || 'Figure', description: b.caption || 'Figure' } })]
				}));
			}
			if (b.caption) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: b.caption, italics: true, font: FONT, size: 20, color: '6B7280' })] }));
		}
	}
	const headerText = `${projectName}  ·  ${docType}`;
	return new Document({
		creator: 'kratai',
		title: `${projectName} - ${docType}`,
		styles: {
			default: { document: { run: { font: FONT, size: BODY_SIZE } } }
		},
		numbering: {
			config: [{ reference: 'ordered', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }]
		},
		sections: [{
			properties: { titlePage: true, page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1300, left: 1440, right: 1440 } } },
			headers: {
				first: new Header({ children: [new Paragraph({ children: [] })] }),
				default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: headerText.toUpperCase(), font: FONT, size: 16, color: NAVY })] })] })
			},
			footers: {
				first: new Footer({ children: [new Paragraph({ children: [] })] }),
				default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: '999999' })] })] })
			},
			children
		}]
	});
}

/** A document the desktop app can write as Word: the standalone page on the view server it is read from. */
interface DocxDocument {
	urlPath: string;
	/** Printed in the running header, and used in the file's title. */
	docType: string;
}

/**
 * A document as a Word file the client can edit. Loads the same standalone page the PDF is printed
 * from into a hidden window, reads its structure, takes a picture of each diagram, and writes the
 * .docx. The file is a deliverable, not a second source of truth: edits made in Word do not flow
 * back into the spec.
 */
async function renderDocx(port: number, projectName: string, doc: DocxDocument): Promise<Buffer> {
	const win = new BrowserWindow({
		show: false,
		width: 1100,
		height: 1400,
		webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false }
	});
	try {
		await win.loadURL(`http://localhost:${port}${doc.urlPath}`);
		await win.webContents.executeJavaScript("document.documentElement.setAttribute('data-theme', 'light')");
		// The page's floating download buttons (the SRS page has them) would otherwise be photographed along
		// with the diagrams, and so would the captions - those go into the file as real, editable Word text.
		await win.webContents.executeJavaScript(`(() => {
			const buttons = document.getElementById('pdf-download');
			if (buttons) buttons.style.display = 'none';
			document.querySelectorAll('#doc figcaption').forEach(c => { c.style.display = 'none'; });
		})()`);
		const blocks = await win.webContents.executeJavaScript(EXTRACT_SCRIPT) as Block[];
		const figureCount = blocks.filter(b => b.t === 'fig').length;
		const figures = await captureFigures(win, figureCount);
		return await Packer.toBuffer(buildDocument(blocks, figures, projectName, doc.docType));
	} finally {
		if (!win.isDestroyed()) win.destroy();
	}
}

export function renderRequirementsDocx(port: number, projectName: string): Promise<Buffer> {
	return renderDocx(port, projectName, { urlPath: '/srs-preview', docType: 'Software Requirements Specification' });
}

/** The client progress report (the Progress view's "Download Progress" button). */
export function renderProgressDocx(port: number, projectName: string): Promise<Buffer> {
	return renderDocx(port, projectName, { urlPath: '/progress-report', docType: 'Progress report' });
}
