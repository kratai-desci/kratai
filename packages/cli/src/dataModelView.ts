import { DataModelData, DataEntity } from './dataModelData.js';

// PAD_TOP deliberately smaller than PAD_BOTTOM (and matches the Class
// Diagram's own .section { padding: 6px 0 } convention) - equal top/bottom
// padding made the attribute list read as vertically centered in the box
// instead of sitting flush under the header-rule line.
const BOX_WIDTH = 210, HEADER_H = 32, ATTR_H = 20, PAD_TOP = 6, PAD_BOTTOM = 10;
const COLS_GAP = 130, ROWS_GAP = 70, MARGIN = 50;

interface Point { x: number; y: number; }
interface BoxLayout { entity: DataEntity; x: number; y: number; height: number; }

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function boxHeight(entity: DataEntity): number {
	return HEADER_H + PAD_TOP + entity.attributes.length * ATTR_H + PAD_BOTTOM;
}

function edgeIntersect(box: BoxLayout, toward: Point): Point {
	const cx = box.x + BOX_WIDTH / 2, cy = box.y + box.height / 2;
	const dx = toward.x - cx, dy = toward.y - cy;
	if (dx === 0 && dy === 0) return { x: cx, y: cy };
	const halfW = BOX_WIDTH / 2, halfH = box.height / 2;
	const scale = Math.min(Math.abs(halfW / dx) || Infinity, Math.abs(halfH / dy) || Infinity);
	return { x: cx + dx * scale, y: cy + dy * scale };
}

/**
 * Static shape/color rules for the diagram drawn by buildDataModelSvg below
 * - shared verbatim by generateDataModelHTML (which layers its own
 * interactive-only rules - cursor/hover/highlight - on top) and
 * srsDocView.ts (which embeds the same SVG as a plain, non-interactive
 * image). Keeping one copy means the diagram looks identical wherever it
 * appears. Relies on each host page defining --surface, --border, --text,
 * --text-dim, --text-faint, --accent, and --accent-2 (see either page's own
 * :root block) - the Requirements doc already defines all of these for its
 * own use, so embedding this diagram there needs no new CSS variables.
 */
export const DATA_MODEL_SVG_STYLE = `
	.entity-box { fill: var(--surface); stroke: var(--border); stroke-width: 1.5; filter: drop-shadow(0 1px 2px rgba(10, 14, 25, 0.12)); }
	.entity-accent { fill: var(--accent); }
	.entity-name { fill: var(--text); font-size: 13px; font-weight: 650; font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }
	.header-rule { stroke: var(--border); stroke-width: 1; }
	.attr-marker { fill: var(--accent-2); font-size: 9.5px; font-weight: 700; font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }
	.attr-name { fill: var(--text); font-size: 11px; font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }
	.attr-name.pk { font-weight: 650; text-decoration: underline; }
	.attr-type { fill: var(--text-faint); font-size: 10.5px; font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }
	.rel-line { stroke: var(--text-faint); stroke-width: 1.4; }
	.rel-label { fill: var(--text-dim); font-size: 10px; }
`;

export interface DataModelSvg {
	svg: string;
	width: number;
	height: number;
}

/**
 * The 2D ER-style entity-relationship diagram itself - just the <svg>, no
 * page chrome/JS. Layout is computed from whatever entity/attribute counts
 * the data has (grid, roughly square aspect, rather than a single row -
 * a data model with a dozen-plus entities would otherwise produce an
 * unreadably wide canvas) rather than hardcoded pixel coordinates. Shared
 * by generateDataModelHTML (interactive) and srsDocView.ts's Requirements
 * doc (static image) so the diagram is drawn identically in both places.
 */
export function buildDataModelSvg(data: DataModelData): DataModelSvg {
	const cols = Math.max(1, Math.ceil(Math.sqrt(data.entities.length)));
	const rows = Math.max(1, Math.ceil(data.entities.length / cols));

	const rowHeights: number[] = new Array(rows).fill(0);
	data.entities.forEach((entity, i) => {
		const row = Math.floor(i / cols);
		rowHeights[row] = Math.max(rowHeights[row], boxHeight(entity));
	});
	const rowY: number[] = [];
	let acc = MARGIN;
	for (let r = 0; r < rows; r++) {
		rowY[r] = acc;
		acc += rowHeights[r] + ROWS_GAP;
	}

	const layout: Record<string, BoxLayout> = {};
	data.entities.forEach((entity, i) => {
		const col = i % cols, row = Math.floor(i / cols);
		layout[entity.id] = {
			entity,
			x: MARGIN + col * (BOX_WIDTH + COLS_GAP),
			y: rowY[row],
			height: boxHeight(entity)
		};
	});

	const canvasWidth = MARGIN * 2 + cols * BOX_WIDTH + (cols - 1) * COLS_GAP;
	const canvasHeight = acc - ROWS_GAP + MARGIN;

	// Matches the Class Diagram's own card language (.uml-box in
	// classDiagramView.ts) so the two feel like the same product - plain
	// surface fill, a thin accent strip instead of a solid colored header
	// bar, monospace type, left-aligned name - even though this diagram's
	// grid layout doesn't need to match that view's folder-grouped one.
	function renderEntity(box: BoxLayout): string {
		const { entity } = box;
		// dominant-baseline="central", y at each row's *midpoint* - not
		// "hanging" at the row top, which anchors to font ascent and
		// visibly misaligns .attr-marker (9.5px) against .attr-name/
		// .attr-type (11px/10.5px) since they don't share a font size.
		// "central" keeps all three vertically centered on the same line
		// regardless of font size - the same approach the UC-number/NFR-
		// count badges already use in useCaseDiagramView.ts.
		const rows = entity.attributes.map((attr, i) => {
			const y = HEADER_H + PAD_TOP + i * ATTR_H + ATTR_H / 2;
			const marker = attr.isPK ? 'PK' : attr.isFK ? 'FK' : '';
			return `<g class="attr-row" transform="translate(0,${y})">
				${marker ? `<text class="attr-marker" x="14" dominant-baseline="central">${marker}</text>` : ''}
				<text class="attr-name${attr.isPK ? ' pk' : ''}" x="46" dominant-baseline="central">${escapeXml(attr.name)}</text>
				<text class="attr-type" x="${BOX_WIDTH - 12}" text-anchor="end" dominant-baseline="central">${escapeXml(attr.type)}</text>
			</g>`;
		}).join('\n');
		// Two nested <g>s on purpose: the outer one's transform is a plain
		// SVG attribute (grid position, box.x/box.y) - a CSS transform on
		// the *same* element would replace that attribute instead of
		// composing with it, so the hover-lift CSS transform goes on this
		// separate, unpositioned inner <g> instead.
		return `<g class="entity" data-id="${entity.id}" transform="translate(${box.x},${box.y})">
			<g class="entity-shape">
				<clipPath id="entity-clip-${entity.id}"><rect width="${BOX_WIDTH}" height="${box.height}" rx="12"/></clipPath>
				<rect class="entity-box" width="${BOX_WIDTH}" height="${box.height}" rx="12"/>
				<g clip-path="url(#entity-clip-${entity.id})">
					<rect class="entity-accent" width="${BOX_WIDTH}" height="3"/>
				</g>
				<text class="entity-name" x="14" y="${HEADER_H / 2}" dominant-baseline="central">${escapeXml(entity.name)}</text>
				<line class="header-rule" x1="0" y1="${HEADER_H}" x2="${BOX_WIDTH}" y2="${HEADER_H}"/>
				${rows}
			</g>
		</g>`;
	}

	const relEdges = data.relationships.map((rel, i) => {
		const from = layout[rel.fromId], to = layout[rel.toId];
		if (!from || !to) return '';
		const fromCenter = { x: from.x + BOX_WIDTH / 2, y: from.y + from.height / 2 };
		const toCenter = { x: to.x + BOX_WIDTH / 2, y: to.y + to.height / 2 };
		const start = edgeIntersect(from, toCenter);
		const end = edgeIntersect(to, fromCenter);
		const midX = (start.x + end.x) / 2, midY = (start.y + end.y) / 2;
		const cardinality = rel.kind === 'one-to-one' ? '1 — 1' : rel.kind === 'one-to-many' ? '1 — *' : '* — *';
		return `<g class="edge relation-edge" data-edge-id="rel-${i}" data-a="${rel.fromId}" data-b="${rel.toId}">
			<line class="rel-line" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>
			<text class="rel-label" x="${midX}" y="${midY - 8}" text-anchor="middle">${escapeXml(rel.label || '')}${rel.label ? ' &bull; ' : ''}${cardinality}</text>
		</g>`;
	}).join('\n');

	const svg = `<svg id="data-svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
		${relEdges}
		${data.entities.map(e => renderEntity(layout[e.id])).join('\n')}
	</svg>`;

	return { svg, width: canvasWidth, height: canvasHeight };
}

/**
 * The interactive Data Model view - page chrome, hover-to-highlight JS, plus
 * the shared buildDataModelSvg diagram (or an explanatory empty-state note
 * when there are zero entities - see DataModelData's zero-entities design).
 */
export function generateDataModelHTML(data: DataModelData): string {
	const { svg: diagramSvg } = buildDataModelSvg(data);

	const adjacency: Record<string, string[]> = {};
	function link(a: string, b: string): void {
		(adjacency[a] = adjacency[a] || []).push(b);
		(adjacency[b] = adjacency[b] || []).push(a);
	}
	data.relationships.forEach(rel => link(rel.fromId, rel.toId));

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeXml(data.workspaceName)} - data model</title>
<script>
	try {
		var krataiTheme = localStorage.getItem('kratai-theme');
		if (krataiTheme) document.documentElement.setAttribute('data-theme', krataiTheme);
	} catch (e) {}
</script>
<style>
	:root {
		--bg: #EEF2FA; --surface: #FFFFFF; --surface-2: #F4F7FD;
		--text: #17203A; --text-dim: #5C6785; --text-faint: #94A0BE;
		--border: #DCE3F2; --accent: #3459E0; --accent-2: #14A6B8;
		--dot: color-mix(in srgb, var(--text-faint) 55%, transparent);
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
			--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
			--dot: color-mix(in srgb, var(--border) 70%, transparent);
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
		--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
		--dot: color-mix(in srgb, var(--border) 70%, transparent);
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
	body { background: var(--bg); color: var(--text); font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif; }

	#stage {
		position: absolute; inset: 0; padding: 56px 24px 24px;
		background-image: radial-gradient(var(--dot) 1px, transparent 1px);
		background-size: 22px 22px;
	}
	#stage svg { display: block; width: 100%; height: 100%; }

	#empty-note {
		position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
		text-align: center; padding: 0 40px;
	}
	#empty-note p { max-width: 380px; color: var(--text-dim); font-size: 13px; line-height: 1.55; margin: 0; }

	#header {
		position: absolute; top: 0; left: 0; right: 0; padding: 14px 20px;
		display: flex; align-items: baseline; gap: 10px; pointer-events: none; z-index: 5;
	}
	#header h1 { margin: 0; font-size: 15px; font-weight: 650; }
	#header .sub { font-size: 12.5px; color: var(--text-dim); font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }

	#overview-btn {
		border: 1px solid var(--border); background: var(--surface-2); color: var(--text-dim);
		font-size: 11px; font-weight: 650; padding: 4px 10px; border-radius: 100px; cursor: pointer;
		margin-left: 10px; font-family: inherit; pointer-events: auto;
	}
	#overview-btn:hover { border-color: var(--accent); color: var(--accent); }

	/* Same click-to-open popup shape as the Use Case Model view's
	   #detail-overlay (useCaseDiagramView.ts) - one modal, reused verbatim
	   here since this view only ever shows one kind of detail (the
	   relationships narrative), not several node types. */
	#detail-overlay {
		position: fixed; inset: 0; z-index: 100; display: none;
		align-items: center; justify-content: center; padding: 24px;
		background: rgba(10,14,25,0.45);
	}
	#detail-overlay.open { display: flex; }
	#detail-modal {
		background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
		width: 100%; max-width: 440px; max-height: 80vh; overflow-y: auto;
		padding: 24px 26px; box-shadow: 0 20px 60px rgba(0,0,0,0.35);
	}
	#detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
	#detail-kicker { margin: 0 0 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); }
	#detail-title { margin: 0; font-size: 17px; }
	#detail-close {
		flex-shrink: 0; border: none; background: var(--surface-2); color: var(--text-dim);
		width: 26px; height: 26px; border-radius: 8px; cursor: pointer; font-size: 15px; line-height: 1;
	}
	#detail-close:hover { color: var(--accent); }
	#detail-body { margin-top: 14px; }
	.detail-desc { margin: 0; color: var(--text-dim); font-size: 13px; line-height: 1.6; }

${DATA_MODEL_SVG_STYLE}
	.entity-box { transition: filter 0.18s ease, stroke 0.18s ease; }

	.entity { cursor: pointer; }
	.entity-shape { transition: transform 0.18s ease; }
	.entity:hover .entity-shape { transform: translateY(-2px); }
	.entity:hover .entity-box { stroke: var(--accent); filter: drop-shadow(0 8px 16px rgba(10, 14, 25, 0.18)); }

	svg.highlighting .node, svg.highlighting .edge { opacity: 0.22; }
	svg.highlighting .node.hi, svg.highlighting .edge.hi { opacity: 1; }
	svg.highlighting .node.hi .entity-box { stroke: var(--accent); }
	svg.highlighting .edge.hi .rel-line { stroke: var(--accent); }
</style>
</head>
<body>
	<div id="stage">
		${data.entities.length === 0
			? `<div id="empty-note"><p>AI generation found no ORM entities, repositories, or plain data-holder classes in this codebase - no data-model section to show. This is an honest result, not an error.</p></div>`
			: diagramSvg}
	</div>
	<div id="header">
		<h1>${escapeXml(data.workspaceName)}</h1>
		<span class="sub">${data.entities.length} entities &bull; ${data.relationships.length} relationships</span>
		${data.narrative ? `<button id="overview-btn" type="button">Overview</button>` : ''}
	</div>

	<div id="detail-overlay">
		<div id="detail-modal" role="dialog" aria-modal="true">
			<div id="detail-header">
				<div>
					<p id="detail-kicker">OVERVIEW</p>
					<h2 id="detail-title">${escapeXml(data.workspaceName)}</h2>
				</div>
				<button id="detail-close" type="button" aria-label="Close">&times;</button>
			</div>
			<div id="detail-body"><p class="detail-desc">${escapeXml(data.narrative || '')}</p></div>
		</div>
	</div>

<script>
(function () {
	'use strict';
	var svg = document.getElementById('data-svg');
	if (!svg) return;
	var adjacency = ${JSON.stringify(adjacency)};
	svg.querySelectorAll('.entity').forEach(function (el) { el.classList.add('node'); });

	function applyHighlight(id) {
		if (!id) {
			svg.classList.remove('highlighting');
			svg.querySelectorAll('.hi').forEach(function (el) { el.classList.remove('hi'); });
			return;
		}
		svg.classList.add('highlighting');
		var keep = {}; keep[id] = true;
		(adjacency[id] || []).forEach(function (o) { keep[o] = true; });
		svg.querySelectorAll('.node').forEach(function (el) { el.classList.toggle('hi', !!keep[el.getAttribute('data-id')]); });
		svg.querySelectorAll('.edge').forEach(function (el) {
			var a = el.getAttribute('data-a'), b = el.getAttribute('data-b');
			el.classList.toggle('hi', a === id || b === id);
		});
	}

	svg.querySelectorAll('.node').forEach(function (el) {
		el.addEventListener('mouseenter', function () { applyHighlight(el.getAttribute('data-id')); });
		el.addEventListener('mouseleave', function () { applyHighlight(null); });
	});
})();
</script>
<script>
(function () {
	'use strict';
	var overviewBtn = document.getElementById('overview-btn');
	if (!overviewBtn) return;
	var overlay = document.getElementById('detail-overlay');
	function open() { overlay.classList.add('open'); }
	function close() { overlay.classList.remove('open'); }
	overviewBtn.addEventListener('click', open);
	overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
	document.getElementById('detail-close').addEventListener('click', close);
	document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
</script>
</body>
</html>`;
}

/**
 * Shown instead of generateDataModelHTML's real diagram whenever
 * there's nothing generated yet - copy of
 * generateUseCaseDiagramEmptyHTML's shape (useCaseDiagramView.ts),
 * pointed at the data model's own generate route.
 */
export function generateDataModelEmptyHTML(signedIn: boolean): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Data Model</title>
<script>
	try {
		var krataiTheme = localStorage.getItem('kratai-theme');
		if (krataiTheme) document.documentElement.setAttribute('data-theme', krataiTheme);
	} catch (e) {}
</script>
<style>
	:root {
		--bg: #EEF2FA; --surface: #FFFFFF; --text: #17203A; --text-dim: #5C6785;
		--border: #DCE3F2; --accent: #3459E0;
		--dot: color-mix(in srgb, #94A0BE 55%, transparent);
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --text: #E8ECFB; --text-dim: #939CBE;
			--border: #262E4E; --accent: #6D93F5;
			--dot: color-mix(in srgb, #262E4E 70%, transparent);
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --text: #E8ECFB; --text-dim: #939CBE;
		--border: #262E4E; --accent: #6D93F5;
		--dot: color-mix(in srgb, #262E4E 70%, transparent);
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; height: 100%; }
	body {
		background: var(--bg); color: var(--text);
		font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif;
		display: flex; align-items: center; justify-content: center;
		background-image: radial-gradient(var(--dot) 1px, transparent 1px);
		background-size: 22px 22px;
	}
	#card {
		background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
		padding: 28px 32px; max-width: 340px; text-align: center;
	}
	#card p { color: var(--text-dim); font-size: 13px; line-height: 1.5; margin: 0 0 16px; }
	#card button {
		border: none; background: var(--accent); color: #fff; font-weight: 650;
		font-size: 13px; padding: 9px 18px; border-radius: 8px; cursor: pointer;
	}
	#card button:disabled { opacity: 0.6; cursor: wait; }
	#error { color: #D6455B; font-size: 12px; margin-top: 12px; display: none; }
</style>
</head>
<body>
	<div id="card">
		${signedIn
			? `<p>No data model generated yet.</p><button id="action">Generate</button>`
			: `<p>Sign in to generate a data model from this codebase.</p><button id="action">Sign In</button>`}
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
		fetch('/api/data-model/generate', { method: 'POST' })
			.then(function (r) { return r.json(); })
			.then(function (result) {
				if (result.ok) {
					window.parent.postMessage({ command: 'balanceChanged' }, '*');
					location.reload();
					return;
				}
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
