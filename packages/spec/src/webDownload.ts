/**
 * Downloading the SRS and the progress report in the web app. The desktop app builds these files in a
 * hidden Electron window (pdfExport.ts, docxExport.ts there); the web server has no browser to do that
 * in, so the page does it itself: it opens the standalone document in a hidden frame, reads its
 * structure, photographs each diagram and writes the Word file with the `docx` library (loaded from the
 * caller's own address the first time it is needed). A PDF is the browser's own "Save as PDF" on the
 * same frame, which the documents' print rules already lay out (cover page, one section per page).
 *
 * The Word builder is a port of docxExport.ts: the same document, read from the same markup. Keep the
 * two in step when the wording or layout of a document changes.
 */

export interface WebDownloadOptions {
	/** Where the `docx` browser bundle is served (the caller's own address). */
	docxUrl: string;
	projectName: string;
}

/** The two buttons that replace the desktop app's single Download button. */
export const WEB_DOWNLOAD_BUTTONS = `<button id="download-word" type="button">Download Word</button><button id="download-pdf" class="secondary" type="button">Save as PDF</button>`;

export const WEB_DOWNLOAD_CSS = `
	#pdf-download button.secondary { background: transparent; color: var(--text); border: 1px solid var(--border); }
	#pdf-download button.secondary:hover { border-color: var(--accent); color: var(--accent); }`;

/** Page script: defines krataiWireDownloads(getDocument), which makes the two buttons work. */
export const WEB_DOWNLOAD_SCRIPT = String.raw`
function krataiWireDownloads(config, getDocument) {
	'use strict';
	var wordButton = document.getElementById('download-word');
	var pdfButton = document.getElementById('download-pdf');
	var status = document.getElementById('pdf-status');
	var FONT = 'Calibri', NAVY = '17203A', BODY_SIZE = 22, TEXT_WIDTH_PX = 600, MAX_FIGURE_HEIGHT_PX = 820;

	function fail(err) {
		status.textContent = (err && err.message) || String(err);
		status.classList.add('error');
	}

	function openFrame(url) {
		return new Promise(function (resolve, reject) {
			var frame = document.createElement('iframe');
			frame.setAttribute('aria-hidden', 'true');
			frame.style.cssText = 'position:fixed;left:-12000px;top:0;width:1100px;height:1400px;border:0;';
			var timer = setTimeout(function () { frame.remove(); reject(new Error('The document took too long to open.')); }, 30000);
			frame.addEventListener('load', function () {
				clearTimeout(timer);
				var doc = frame.contentDocument;
				// Documents are for white paper, whatever theme the app is showing.
				doc.documentElement.setAttribute('data-theme', 'light');
				var buttons = doc.getElementById('pdf-download');
				if (buttons) buttons.style.display = 'none';
				setTimeout(function () { resolve(frame); }, 250);
			});
			frame.src = url;
			document.body.appendChild(frame);
		});
	}

	function loadDocx() {
		if (window.docx) return Promise.resolve(window.docx);
		return new Promise(function (resolve, reject) {
			var script = document.createElement('script');
			script.src = config.docxUrl;
			script.onload = function () { resolve(window.docx); };
			script.onerror = function () { reject(new Error('Could not load the Word export. Check your connection and try again.')); };
			document.head.appendChild(script);
		});
	}

	// ---- the document's structure, read from its own markup (docxExport.ts's EXTRACT_SCRIPT) ----
	function extract(root) {
		var BLOCK = { H1: 1, H2: 1, H3: 1, P: 1, UL: 1, OL: 1, TABLE: 1, FIGURE: 1, DIV: 1 };
		var blocks = [];
		var listId = 0;
		var figures = 0;
		var clean = function (s) { return s.replace(/\s+/g, ' '); };
		function runsOf(node, base, out) {
			node.childNodes.forEach(function (n) {
				if (n.nodeType === 3) { out.push(Object.assign({ text: clean(n.textContent) }, base)); return; }
				if (n.nodeType !== 1) return;
				if (n.tagName === 'BR') { out.push(Object.assign({ text: ' ' }, base)); return; }
				if (n.tagName === 'SVG' || n.tagName === 'svg') return;
				var cls = n.classList;
				var bold = n.tagName === 'STRONG' || n.tagName === 'B' || cls.contains('nfr-id') || cls.contains('uc-detail-label');
				var italic = n.tagName === 'EM' || n.tagName === 'I';
				runsOf(n, Object.assign({}, base, bold ? { bold: true } : {}, italic ? { italic: true } : {}), out);
				if (cls.contains('nfr-id')) out.push(Object.assign({ text: ' ' }, base));
			});
			return out;
		}
		function tidy(runs) {
			var joined = runs.filter(function (r) { return r.text !== ''; });
			if (joined.length) joined[0].text = joined[0].text.replace(/^ /, '');
			if (joined.length) joined[joined.length - 1].text = joined[joined.length - 1].text.replace(/ $/, '');
			return joined.filter(function (r) { return r.text !== ''; });
		}
		function textOf(el) {
			var out = '';
			el.childNodes.forEach(function (n) {
				if (n.nodeType === 3) { out += n.textContent; return; }
				if (n.nodeType !== 1) return;
				var cls = n.classList;
				if (cls.contains('for')) out += '\n';
				if (cls.contains('uc-status')) out += '  -  ';
				out += textOf(n);
			});
			return out;
		}
		function text(el) { return textOf(el).split('\n').map(function (l) { return clean(l).trim(); }).filter(Boolean).join('\n'); }
		function walk(el, newPage) {
			var pending = [];
			function flush(style) {
				var runs = tidy(pending); pending = [];
				if (runs.length) blocks.push({ t: 'p', runs: runs, style: style || 'body' });
			}
			el.childNodes.forEach(function (n) {
				if (n.nodeType === 3) { pending.push({ text: clean(n.textContent) }); return; }
				if (n.nodeType !== 1) return;
				var tag = n.tagName;
				if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'svg' || tag === 'SVG' || n.id === 'pdf-download') return;
				if (!BLOCK[tag]) { runsOf({ childNodes: [n] }, {}, pending); return; }
				flush();
				var cls = n.classList;
				if (tag === 'H1' || tag === 'H2' || tag === 'H3') {
					blocks.push({ t: 'h', level: Number(tag[1]), text: text(n), pageBreak: tag === 'H2' && !!newPage });
				} else if (tag === 'P') {
					var pruns = tidy(runsOf(n, {}, []));
					if (pruns.length) blocks.push({ t: 'p', runs: pruns, style: cls.contains('section-intro') ? 'intro' : 'body' });
				} else if (tag === 'UL' || tag === 'OL') {
					var id = ++listId;
					n.querySelectorAll(':scope > li').forEach(function (li) {
						var lruns = tidy(runsOf(li, {}, []));
						if (lruns.length) blocks.push({ t: 'li', runs: lruns, listId: id, ordered: tag === 'OL' });
					});
				} else if (tag === 'TABLE') {
					var rows = Array.prototype.map.call(n.querySelectorAll('tr'), function (tr) {
						return Array.prototype.map.call(tr.children, function (c) { return { th: c.tagName === 'TH', text: text(c) }; });
					});
					if (rows.length) blocks.push({ t: 'table', rows: rows });
				} else if (tag === 'FIGURE') {
					var cap = n.querySelector('figcaption');
					// A figure's project-wide requirement tags are HTML under the picture: they go in as text.
					var tagEls = n.querySelectorAll('.nfr-tag');
					var tags = Array.prototype.map.call(tagEls, function (t) { return text(t); }).join('  ·  ');
					blocks.push({ t: 'fig', index: figures++, caption: cap ? text(cap) : '', tags: tags });
				} else if (cls.contains('progress-summary')) {
					var cells = Array.prototype.slice.call(n.children);
					blocks.push({ t: 'table', rows: [
						cells.map(function (c) { return { th: true, text: text(c.querySelector('.k')) }; }),
						cells.map(function (c) { return { th: false, text: text(c.querySelector('.v')) }; })
					] });
				} else if (cls.contains('progress-legend')) {
					var items = Array.prototype.slice.call(n.children);
					var lg = [];
					items.forEach(function (c, i) { lg.push({ text: i ? '     ' : '' }); runsOf(c, {}, lg); });
					var lgruns = tidy(lg);
					if (lgruns.length) blocks.push({ t: 'p', runs: lgruns, style: 'body' });
				} else if (cls.contains('meta-field')) {
					var label = n.querySelector('.meta-label'), value = n.querySelector('.meta-value');
					var v = value ? text(value) : '';
					if (v) blocks.push({ t: 'p', runs: [{ text: (label ? text(label) : '') + ': ', bold: true }, { text: v }], style: 'body' });
				} else {
					var hasBlocks = Array.prototype.some.call(n.children, function (c) { return BLOCK[c.tagName]; });
					if (hasBlocks) {
						walk(n, cls.contains('section-new-page'));
					} else {
						var oruns = tidy(runsOf(n, {}, []));
						if (oruns.length) blocks.push({ t: 'p', runs: oruns, style: cls.contains('kicker') ? 'kicker' : (cls.contains('cover-label') ? 'label' : 'body') });
					}
				}
			});
			flush();
		}
		walk(root, false);
		return blocks;
	}

	// ---- a picture of each diagram ----
	var SVG_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin',
		'opacity', 'display', 'visibility', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'letter-spacing', 'text-decoration'];
	function figurePicture(svg) {
		var win = svg.ownerDocument.defaultView;
		var rect = svg.getBoundingClientRect();
		var width = Math.max(1, Math.ceil(rect.width)), height = Math.max(1, Math.ceil(rect.height));
		var clone = svg.cloneNode(true);
		// The page's stylesheet does not travel with a standalone SVG, so each element carries its look with it.
		var from = [svg].concat(Array.prototype.slice.call(svg.querySelectorAll('*')));
		var to = [clone].concat(Array.prototype.slice.call(clone.querySelectorAll('*')));
		from.forEach(function (el, i) {
			var computed = win.getComputedStyle(el);
			to[i].setAttribute('style', SVG_PROPS.map(function (p) { return p + ':' + computed.getPropertyValue(p); }).join(';'));
		});
		clone.setAttribute('width', width);
		clone.setAttribute('height', height);
		clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
		return new Promise(function (resolve, reject) {
			var img = new Image();
			img.onload = function () {
				var canvas = document.createElement('canvas');
				canvas.width = width * 2; canvas.height = height * 2;
				var ctx = canvas.getContext('2d');
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				canvas.toBlob(function (blob) {
					if (!blob) { reject(new Error('Could not draw a diagram.')); return; }
					blob.arrayBuffer().then(function (buf) { resolve({ png: new Uint8Array(buf), width: width, height: height }); }, reject);
				}, 'image/png');
			};
			img.onerror = function () { reject(new Error('Could not draw a diagram.')); };
			img.src = url;
		});
	}

	// ---- the Word file (docxExport.ts's buildDocument) ----
	function buildDocument(D, blocks, figures, projectName, docType) {
		var run = function (r, extra) { return new D.TextRun(Object.assign({ text: r.text, bold: r.bold, italics: r.italic, font: FONT, size: BODY_SIZE }, extra || {})); };
		function columnWidths(rows) {
			var cols = rows[0].length;
			var weight = [];
			for (var c = 0; c < cols; c++) {
				var longest = 0;
				rows.forEach(function (r) { longest = Math.max(longest, r[c] ? r[c].text.length : 0); });
				weight.push(Math.min(60, Math.max(12, longest)));
			}
			var total = weight.reduce(function (a, b) { return a + b; }, 0);
			return weight.map(function (w) { return Math.round(9000 * w / total); });
		}
		function buildTable(rows) {
			var widths = columnWidths(rows);
			var line = { style: D.BorderStyle.SINGLE, size: 4, color: 'C9CED8' };
			var borders = { top: line, bottom: line, left: line, right: line };
			return new D.Table({
				width: { size: 9000, type: D.WidthType.DXA },
				columnWidths: widths,
				rows: rows.map(function (cells) {
					return new D.TableRow({
						tableHeader: cells.every(function (c) { return c.th; }),
						cantSplit: true,
						children: cells.map(function (c, i) {
							return new D.TableCell({
								width: { size: widths[i], type: D.WidthType.DXA },
								borders: borders,
								margins: { top: 60, bottom: 60, left: 100, right: 100 },
								shading: c.th ? { type: D.ShadingType.CLEAR, fill: 'EEF1F6', color: 'auto' } : undefined,
								children: c.text.split('\n').map(function (l, n) {
									return new D.Paragraph({ children: [new D.TextRun({ text: l, bold: c.th, font: FONT, size: n ? 18 : 20, color: n ? '6B7280' : undefined })] });
								})
							});
						})
					});
				})
			});
		}
		var children = [];
		var afterTitle = false, firstSection = true;
		blocks.forEach(function (b) {
			if (b.t === 'h') {
				if (b.level === 1) {
					children.push(new D.Paragraph({ heading: D.HeadingLevel.TITLE, spacing: { before: 1200, after: 300 }, children: [new D.TextRun({ text: b.text, bold: true, font: FONT, size: 56, color: NAVY })] }));
					afterTitle = true;
				} else {
					var startsPage = b.pageBreak || (b.level === 2 && afterTitle && firstSection);
					if (b.level === 2) firstSection = false;
					children.push(new D.Paragraph({
						heading: b.level === 2 ? D.HeadingLevel.HEADING_1 : D.HeadingLevel.HEADING_2,
						keepNext: true,
						spacing: { before: b.level === 2 ? 360 : 240, after: 120 },
						children: (startsPage ? [new D.PageBreak()] : []).concat([new D.TextRun({ text: b.text, bold: true, font: FONT, size: b.level === 2 ? 32 : 26, color: NAVY })])
					}));
				}
			} else if (b.t === 'p') {
				var p = b.style;
				children.push(new D.Paragraph(Object.assign(p === 'intro' ? { keepNext: true } : {}, {
					spacing: { before: p === 'label' ? 480 : 0, after: 120 },
					children: b.runs.map(function (r) { return run(r, p === 'kicker' ? { size: 22, color: '6B7280' } : p === 'label' ? { size: 18, color: '6B7280' } : {}); })
				})));
			} else if (b.t === 'li') {
				children.push(new D.Paragraph(Object.assign(b.ordered ? { numbering: { reference: 'ordered', level: 0, instance: b.listId } } : { bullet: { level: 0 } }, {
					spacing: { after: 60 },
					children: b.runs.map(function (r) { return run(r); })
				})));
			} else if (b.t === 'table') {
				children.push(buildTable(b.rows), new D.Paragraph({ spacing: { after: 120 }, children: [] }));
			} else if (b.t === 'fig') {
				var f = figures[b.index];
				if (f) {
					var scale = Math.min(1, TEXT_WIDTH_PX / f.width, MAX_FIGURE_HEIGHT_PX / f.height);
					children.push(new D.Paragraph({
						alignment: D.AlignmentType.CENTER,
						keepNext: true,
						children: [new D.ImageRun({ type: 'png', data: f.png, transformation: { width: Math.round(f.width * scale), height: Math.round(f.height * scale) }, altText: { name: b.caption || 'Figure', title: b.caption || 'Figure', description: b.caption || 'Figure' } })]
					}));
				}
				if (b.tags) children.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, keepNext: true, spacing: { after: 60 }, children: [new D.TextRun({ text: 'Project-wide NFRs: ' + b.tags, font: FONT, size: 18, color: '6B7280' })] }));
				if (b.caption) children.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 240 }, children: [new D.TextRun({ text: b.caption, italics: true, font: FONT, size: 20, color: '6B7280' })] }));
			}
		});
		var headerText = projectName + '  ·  ' + docType;
		return new D.Document({
			creator: 'kratai',
			title: projectName + ' - ' + docType,
			styles: { default: { document: { run: { font: FONT, size: BODY_SIZE } } } },
			numbering: { config: [{ reference: 'ordered', levels: [{ level: 0, format: D.LevelFormat.DECIMAL, text: '%1.', alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
			sections: [{
				properties: { titlePage: true, page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1300, left: 1440, right: 1440 } } },
				headers: {
					first: new D.Header({ children: [new D.Paragraph({ children: [] })] }),
					'default': new D.Header({ children: [new D.Paragraph({ alignment: D.AlignmentType.RIGHT, children: [new D.TextRun({ text: headerText.toUpperCase(), font: FONT, size: 16, color: NAVY })] })] })
				},
				footers: {
					first: new D.Footer({ children: [new D.Paragraph({ children: [] })] }),
					'default': new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.RIGHT, children: [new D.TextRun({ children: ['Page ', D.PageNumber.CURRENT, ' of ', D.PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: '999999' })] })] })
				},
				children: children
			}]
		});
	}

	function safeFileName(name) { return String(name).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'project'; }

	function saveBlob(blob, fileName) {
		var a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
	}

	function downloadWord(spec) {
		return Promise.all([loadDocx(), openFrame(spec.docUrl)]).then(function (loaded) {
			var D = loaded[0], frame = loaded[1];
			var doc = frame.contentDocument;
			var root = doc.getElementById('doc');
			if (!root) { frame.remove(); throw new Error('There is nothing to download yet.'); }
			// Captions go into the file as real, editable Word text, not as part of the picture.
			doc.querySelectorAll('#doc figcaption').forEach(function (c) { c.style.display = 'none'; });
			var blocks = extract(root);
			var svgs = Array.prototype.map.call(doc.querySelectorAll('#doc figure'), function (fig) { return fig.querySelector('svg'); });
			var pictures = [];
			var chain = Promise.resolve();
			svgs.forEach(function (svg, i) {
				chain = chain.then(function () { return svg ? figurePicture(svg) : null; }).then(function (pic) { pictures[i] = pic; });
			});
			return chain.then(function () {
				var document_ = buildDocument(D, blocks, pictures, config.projectName, spec.docType);
				return D.Packer.toBlob(document_);
			}).then(function (blob) {
				frame.remove();
				saveBlob(blob, safeFileName(config.projectName) + '-' + spec.fileSuffix + '.docx');
			}, function (err) { frame.remove(); throw err; });
		});
	}

	function downloadPdf(spec) {
		return openFrame(spec.docUrl).then(function (frame) {
			var win = frame.contentWindow;
			win.addEventListener('afterprint', function () { setTimeout(function () { frame.remove(); }, 500); });
			win.focus();
			win.print();
		});
	}

	function start(button, label, working, action) {
		button.addEventListener('click', function () {
			var spec = getDocument();
			wordButton.disabled = true; pdfButton.disabled = true;
			button.textContent = working;
			status.textContent = ''; status.classList.remove('error');
			action(spec).catch(fail).then(function () {
				wordButton.disabled = false; pdfButton.disabled = false;
				button.textContent = label;
			});
		});
	}
	start(wordButton, 'Download Word', 'Preparing...', downloadWord);
	start(pdfButton, 'Save as PDF', 'Opening...', downloadPdf);
}
`;

/** The script block that goes into a page: the shared code plus this page's own settings. */
export function webDownloadScriptTag(options: WebDownloadOptions): string {
	const config = JSON.stringify({ docxUrl: options.docxUrl, projectName: options.projectName }).replace(/</g, '\\u003c');
	return `<script>var KRATAI_DOWNLOAD = ${config};${WEB_DOWNLOAD_SCRIPT}</script>`;
}
