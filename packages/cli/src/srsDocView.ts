import { UseCaseDiagramData, UseCaseNFR } from './useCaseDiagramData.js';
import { buildUseCaseDiagramSvg, DIAGRAM_SVG_STYLE } from './useCaseDiagramView.js';
import { DataModelData } from './dataModelData.js';
import { buildDataModelSvg, DATA_MODEL_SVG_STYLE } from './dataModelView.js';

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const DOC_STYLE = `
	:root {
		--bg: #EEF2FA; --surface: #FFFFFF; --text: #17203A; --text-dim: #5C6785; --text-faint: #94A0BE;
		--border: #DCE3F2; --accent: #3459E0; --accent-2: #14A6B8;
		--uc-fill: #FFFFFF; --uc-stroke: #3459E0; --actor-stroke: #5C6785; --boundary-stroke: #B9C4E0;
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
			--uc-fill: #171F38; --uc-stroke: #6D93F5; --actor-stroke: #939CBE; --boundary-stroke: #333E63;
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
		--uc-fill: #171F38; --uc-stroke: #6D93F5; --actor-stroke: #939CBE; --boundary-stroke: #333E63;
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; height: 100%; }
	body {
		background: var(--bg); color: var(--text);
		font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif;
	}
`;

const THEME_SYNC_SCRIPT = `<script>
	try {
		var krataiTheme = localStorage.getItem('kratai-theme');
		if (krataiTheme) document.documentElement.setAttribute('data-theme', krataiTheme);
	} catch (e) {}
</script>`;

/**
 * Software Requirements Specification - a formatted document assembled
 * from real Use Case Model data (see useCaseExtraction.ts's prompt),
 * including the same diagram image the Use Case Model view draws
 * (buildUseCaseDiagramSvg, shared so it looks identical in both places).
 * dataModelData is optional and real too (dataModelExtraction.ts) -
 * its section only appears when there's actually something in it, same
 * skip-empty-sections rule as Overview/Project-wide NFRs below.
 */
export function generateSrsDocHTML(useCaseData: UseCaseDiagramData, dataModelData?: DataModelData): string {
	const { svg: diagramSvg } = buildUseCaseDiagramSvg(useCaseData);

	const projectNfrs = (useCaseData.nfrs || []).filter(n => n.useCaseId === null);
	const nfrsByUseCase: Record<string, UseCaseNFR[]> = {};
	(useCaseData.nfrs || []).forEach(n => {
		if (n.useCaseId === null) return;
		(nfrsByUseCase[n.useCaseId] = nfrsByUseCase[n.useCaseId] || []).push(n);
	});
	// Numbered globally across ALL nfrs (project-wide + use-case-scoped) in
	// declaration order - the same scheme useCaseDiagramView.ts's popups
	// use, so "NFR-3" means the same thing in both views.
	const nfrNumberById: Record<string, number> = {};
	(useCaseData.nfrs || []).forEach((n, i) => { nfrNumberById[n.id] = i + 1; });

	function useCasesForActor(actorId: string): string[] {
		return useCaseData.associations
			.filter(a => a.actorId === actorId)
			.map(a => useCaseData.useCases.find(u => u.id === a.useCaseId)?.name.replace(/\n/g, ' ') || '')
			.filter(Boolean);
	}

	// A section only appears if it has something to say - Overview and
	// Project-wide NFRs are both genuinely optional data (unlike Actors/Use
	// Cases, which real generation can't produce empty - see
	// useCaseSchema.ts's validateUseCaseModelOutput). Numbered by array
	// position rather than a fixed "5." etc, so skipping one never leaves a
	// gap in the numbering.
	const sections: { title: string; body: string }[] = [];
	if (useCaseData.overview) {
		sections.push({ title: 'Overview', body: `<p>${escapeXml(useCaseData.overview)}</p>` });
	}
	sections.push({
		title: 'Use Case Diagram',
		body: (useCaseData.narrative ? `<p>${escapeXml(useCaseData.narrative)}</p>` : '') +
			`<figure class="diagram-wrap">${diagramSvg}<figcaption>Figure 1: Use Case Diagram</figcaption></figure>`
	});
	sections.push({
		title: 'Actors &amp; roles',
		body: `<table>
			<tr><th>Actor</th><th>Role</th><th>Description</th><th>Use cases</th></tr>
			${useCaseData.actors.map(a => `<tr>
				<td>${escapeXml(a.name.replace(/\n/g, ' '))}</td>
				<td>${escapeXml(a.role || '—')}</td>
				<td>${escapeXml(a.description || '—')}</td>
				<td>${escapeXml(useCasesForActor(a.id).join(', ') || '—')}</td>
			</tr>`).join('\n')}
		</table>`
	});
	sections.push({
		title: 'Use cases',
		body: useCaseData.useCases.map((u, i) => {
			const nfrs = nfrsByUseCase[u.id] || [];
			return `<div class="use-case-item">
				<h3>UC-${i + 1}: ${escapeXml(u.name.replace(/\n/g, ' '))}</h3>
				<p>${escapeXml(u.description || 'No description captured yet.')}</p>
				${nfrs.length > 0 ? `<ul class="use-case-nfrs">${nfrs.map(n => `<li><span class="nfr-id">NFR-${nfrNumberById[n.id]}</span><strong>${escapeXml(n.name)}:</strong> ${escapeXml(n.text)}</li>`).join('\n')}</ul>` : ''}
			</div>`;
		}).join('\n')
	});
	if (dataModelData && dataModelData.entities.length > 0) {
		const { svg: dataModelSvg } = buildDataModelSvg(dataModelData);
		const entityName = (id: string) => dataModelData.entities.find(e => e.id === id)?.name || id;
		sections.push({
			title: 'Data model',
			body: (dataModelData.narrative ? `<p>${escapeXml(dataModelData.narrative)}</p>` : '') +
				`<figure class="diagram-wrap">${dataModelSvg}<figcaption>Figure 2: Data Model Entity-Relationship Diagram</figcaption></figure>` +
				dataModelData.entities.map(e => `<div class="entity-block">
				<h3>${escapeXml(e.name)}</h3>
				<table>
					<tr><th>Attribute</th><th>Type</th><th>Key</th></tr>
					${e.attributes.map(attr => `<tr><td class="mono">${escapeXml(attr.name)}</td><td class="mono">${escapeXml(attr.type)}</td><td>${attr.isPK ? 'PK' : attr.isFK ? 'FK' : ''}</td></tr>`).join('\n')}
				</table>
			</div>`).join('\n') + (dataModelData.relationships.length > 0
				? `<ul>${dataModelData.relationships.map(r => `<li>${escapeXml(entityName(r.fromId))} &rarr; ${escapeXml(entityName(r.toId))} (${escapeXml(r.kind)}${r.label ? ` - ${escapeXml(r.label)}` : ''})</li>`).join('\n')}</ul>`
				: '')
		});
	}
	if (projectNfrs.length > 0) {
		sections.push({
			title: 'Project-wide non-functional requirements',
			body: `<ul>${projectNfrs.map(n => `<li><span class="nfr-id">NFR-${nfrNumberById[n.id]}</span><strong>${escapeXml(n.name)}:</strong> ${escapeXml(n.text)}</li>`).join('\n')}</ul>`
		});
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeXml(useCaseData.workspaceName)} - Software Requirements Specification</title>
${THEME_SYNC_SCRIPT}
<style>
${DOC_STYLE}
	#doc { max-width: 760px; margin: 0 auto; padding: 48px 28px 60px; }
	#doc-header { margin-bottom: 8px; }
	#doc-header .kicker { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); font-weight: 700; }
	#doc-header h1 { margin: 4px 0 0; font-size: 24px; }
	.doc-meta { display: flex; gap: 24px; margin-top: 14px; flex-wrap: wrap; }
	.meta-field { font-size: 12.5px; color: var(--text-dim); }
	.meta-label { color: var(--text-faint); margin-right: 6px; }
	.meta-value {
		outline: none; border-bottom: 1px dashed var(--border); padding: 1px 2px; cursor: text; color: var(--text);
	}
	.meta-value:hover, .meta-value:focus { border-bottom-color: var(--accent); }
	.meta-value:empty:before { content: attr(data-placeholder); color: var(--text-faint); }
	.section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px 26px; margin-top: 18px; }
	.section h2 { margin: 0 0 12px; font-size: 14px; }
	.section p { color: var(--text-dim); font-size: 13px; line-height: 1.6; margin: 0; }
	table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
	th { text-align: left; color: var(--text-faint); font-weight: 650; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.03em; padding: 4px 8px; }
	td { padding: 8px; border-top: 1px solid var(--border); vertical-align: top; }
	ul { margin: 0; padding-left: 18px; color: var(--text-dim); font-size: 12.5px; line-height: 1.7; }
	.use-case-item { margin-bottom: 14px; }
	.use-case-item:last-child { margin-bottom: 0; }
	.use-case-item h3 { margin: 0 0 4px; font-size: 13px; }
	.use-case-item p { margin: 0; }
	.use-case-nfrs { margin: 8px 0 0; padding-left: 18px; color: var(--text-dim); font-size: 12px; line-height: 1.6; }
	.nfr-id { display: inline-block; font-size: 10px; font-family: ui-monospace, monospace; color: var(--accent-2); margin-right: 6px; }
	/* Explicit gap rather than relying on each diagram's own internal
	   canvas padding for breathing room - buildDataModelSvg happens to pad
	   its content ~50px from the canvas edge, but buildUseCaseDiagramSvg's
	   boundary box sits flush at y=0, so without this the text-to-diagram
	   gap was inconsistent between the two sections (fine in one, none in
	   the other). */
	.diagram-wrap { margin: 28px 0 0; }
	/* max-height, not a fixed height - a diagram with few actors/use cases
	   should stay its natural (smaller) size, not stretch up to fill this.
	   width/height: auto (not width: 100%) so the SVG's own viewBox aspect
	   ratio drives the scaling - capping height alone while forcing
	   width:100% would leave blank space inside the SVG's box instead of
	   actually shrinking it. 400px, tuned against a real exported PDF (a
	   diagram with 3 actors/8 use cases plus its heading+narrative above
	   and caption below, on a US Letter page with pdfExport.ts's margins
	   and header/footer) - the first attempt at 560px still didn't leave
	   enough of the page free to avoid a break. The print-only
	   .diagram-wrap break-inside: avoid rule further down only works
	   *because* this keeps it small enough to reliably fit one page; it'd
	   just strand a whole page mostly blank again otherwise (see that
	   rule's own comment). */
	.diagram-wrap svg { display: block; max-width: 100%; max-height: 400px; width: auto; height: auto; margin: 0 auto; }
	.diagram-wrap figcaption {
		margin-top: 10px; text-align: center; font-size: 11.5px; font-style: italic; color: var(--text-faint);
	}
	.entity-block { margin-bottom: 14px; }
	.entity-block:last-of-type { margin-bottom: 0; }
	.entity-block h3 { margin: 0 0 6px; font-size: 13px; }
	.mono { font-family: ui-monospace, monospace; color: var(--text-faint); font-size: 11px; }
${DIAGRAM_SVG_STYLE}
${DATA_MODEL_SVG_STYLE}

	#pdf-download {
		position: fixed; top: 18px; right: 22px; z-index: 10;
		display: flex; align-items: center; gap: 8px;
	}
	#pdf-download button {
		border: none; background: var(--accent); color: #fff; font-weight: 650;
		font-size: 12.5px; padding: 8px 16px; border-radius: 8px; cursor: pointer;
		display: flex; align-items: center; gap: 6px;
	}
	#pdf-download button:disabled { opacity: 0.6; cursor: wait; }
	#pdf-status { font-size: 12px; color: var(--text-dim); max-width: 220px; text-align: right; }
	#pdf-status.error { color: #D6455B; }

	/* Applies when Electron's printToPDF renders this page (see
	   pdfExport.ts) - it goes through the same print pipeline as a browser
	   print preview, so @media print is the right hook to strip anything
	   that only makes sense on screen and keep the PDF a clean, standalone
	   document a client could receive directly. */
	@media print {
		:root, :root[data-theme="dark"], :root:not([data-theme="light"]) {
			--bg: #ffffff; --surface: #ffffff; --text: #111111; --text-dim: #333333; --text-faint: #666666;
			--border: #cccccc; --accent: #17203A; --accent-2: #17203A;
		}
		#pdf-download { display: none; }
		.meta-value { border-bottom: none; }
		.meta-field:has(.meta-value:empty) { display: none; }
		/* A whole section (e.g. every use case) is often taller than one
		   page - avoiding a break on the *section* pushes the entire block
		   to the next page rather than letting it flow, stranding
		   whatever page it didn't fit on mostly blank. Keep only the small
		   atomic pieces (one use case, one table row, and now one diagram -
		   safe only because it's height-capped above - from splitting. */
		.section { border: none; box-shadow: none; }
		.use-case-item, tr, .diagram-wrap { break-inside: avoid; }
	}
</style>
</head>
<body>
	<div id="pdf-download">
		<span id="pdf-status"></span>
		<button id="pdf-btn">Download PDF</button>
	</div>
	<div id="doc">
		<div id="doc-header">
			<div class="kicker">Software Requirements Specification</div>
			<h1>${escapeXml(useCaseData.workspaceName)}</h1>
			<div class="doc-meta">
				<div class="meta-field"><span class="meta-label">Prepared by</span><span class="meta-value" contenteditable="true" data-field="preparedBy" data-placeholder="add name or company">${escapeXml(useCaseData.preparedBy || '')}</span></div>
				<div class="meta-field"><span class="meta-label">Client</span><span class="meta-value" contenteditable="true" data-field="clientName" data-placeholder="add client (optional)">${escapeXml(useCaseData.clientName || '')}</span></div>
			</div>
		</div>

		${sections.map((s, i) => `<div class="section">
			<h2>${i + 1}. ${s.title}</h2>
			${s.body}
		</div>`).join('\n')}
	</div>

<script>
(function () {
	'use strict';
	document.querySelectorAll('.meta-value').forEach(function (el) {
		el.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
		});
		el.addEventListener('blur', function () {
			var field = el.getAttribute('data-field');
			var payload = {};
			payload[field] = el.textContent.trim();
			fetch('/api/requirements/metadata', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			}).catch(function () {});
		});
	});

	var pdfBtn = document.getElementById('pdf-btn');
	var pdfStatus = document.getElementById('pdf-status');
	pdfBtn.addEventListener('click', function () {
		pdfBtn.disabled = true;
		pdfBtn.textContent = 'Generating...';
		pdfStatus.textContent = '';
		pdfStatus.classList.remove('error');
		fetch('/api/requirements/export-pdf', { method: 'POST' })
			.then(function (r) { return r.json(); })
			.then(function (result) {
				if (!result.ok && result.error) throw new Error(result.error);
				// ok with no path means the user cancelled the save dialog -
				// not a failure, nothing to show.
				if (result.ok && result.path) {
					pdfStatus.textContent = 'Saved ' + result.path;
				}
			})
			.catch(function (err) {
				pdfStatus.textContent = err.message || String(err);
				pdfStatus.classList.add('error');
			})
			.finally(function () {
				pdfBtn.disabled = false;
				pdfBtn.textContent = 'Download PDF';
			});
	});
})();
</script>
</body>
</html>`;
}

/**
 * Shown instead of the real document whenever nothing's been generated yet
 * - this view is entirely derived from the Use Case Model, so it offers
 * the same sign-in/generate action generateUseCaseDiagramEmptyHTML does,
 * just styled as a document rather than a diagram card.
 */
export function generateSrsEmptyHTML(signedIn: boolean): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Software Requirements Specification</title>
${THEME_SYNC_SCRIPT}
<style>
${DOC_STYLE}
	body { display: flex; align-items: center; justify-content: center; }
	#doc { max-width: 420px; padding: 0 28px; text-align: center; }
	.kicker { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); font-weight: 700; margin-bottom: 6px; }
	p { color: var(--text-dim); font-size: 13px; line-height: 1.6; margin: 0 0 16px; }
	button {
		border: none; background: var(--accent); color: #fff; font-weight: 650;
		font-size: 13px; padding: 9px 18px; border-radius: 8px; cursor: pointer;
	}
	button:disabled { opacity: 0.6; cursor: wait; }
	#error { color: #D6455B; font-size: 12px; margin-top: 12px; display: none; }
</style>
</head>
<body>
	<div id="doc">
		<div class="kicker">Software Requirements Specification</div>
		${signedIn
			? `<p>Generate the Use Case Model first - this document is built from it.</p><button id="action">Generate</button>`
			: `<p>Sign in to generate a Use Case Model, which this document is built from.</p><button id="action">Sign In</button>`}
		<div id="error"></div>
	</div>
<script>
(function () {
	'use strict';
	var signedIn = ${JSON.stringify(signedIn)};
	var btn = document.getElementById('action');
	var errEl = document.getElementById('error');

	btn.addEventListener('click', function () {
		if (!signedIn) {
			window.parent.postMessage({ command: 'startSignIn' }, '*');
			return;
		}
		btn.disabled = true;
		btn.textContent = 'Generating...';
		errEl.style.display = 'none';
		fetch('/api/use-case-diagram/generate', { method: 'POST' })
			.then(function (r) { return r.json(); })
			.then(function (result) {
				if (result.ok) { location.reload(); return; }
				throw new Error(result.error || 'Generation failed.');
			})
			.catch(function (err) {
				btn.disabled = false;
				btn.textContent = 'Retry';
				errEl.textContent = err.message || String(err);
				errEl.style.display = 'block';
			});
	});
})();
</script>
</body>
</html>`;
}
