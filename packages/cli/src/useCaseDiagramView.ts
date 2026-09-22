import { UseCaseDiagramData, UseCaseActor, UseCaseItem, UseCaseNFR } from './useCaseDiagramData.js';

const UC_RX = 95, UC_RY = 38;
const COL_GAP = 260, ROW_GAP = 116, UC_TOP = 150, UC_COLS = 2;
const ACTOR_GAP_Y = 150, ACTOR_TOP = 130;
const BOUNDARY_PAD_X = 90, BOUNDARY_PAD_TOP = 60, BOUNDARY_PAD_BOTTOM = 70;
const ACTOR_RAIL = 260;
const NFR_PILL_H = 30, NFR_PILL_GAP = 12, NFR_PILL_PAD_X = 16, NFR_ROW_TOP_GAP = 54, NFR_ROW_BOTTOM_MARGIN = 34;

// Rough per-character width for the pill's monospace-ish 10.5px label -
// there's no canvas/DOM text measurement available server-side, so pills
// are sized by character count rather than actual rendered width. Good
// enough for a short glance-able name; not meant to be pixel-exact.
function nfrPillWidth(name: string): number {
	return Math.max(64, Math.round(name.length * 6.4) + NFR_PILL_PAD_X * 2);
}

interface Point { x: number; y: number; }

function ellipseIntersect(cx: number, cy: number, rx: number, ry: number, px: number, py: number): Point {
	const dx = px - cx, dy = py - cy;
	if (dx === 0 && dy === 0) return { x: cx, y: cy };
	const t = 1 / Math.sqrt((dx / rx) * (dx / rx) + (dy / ry) * (dy / ry));
	return { x: cx + dx * t, y: cy + dy * t };
}

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function multilineText(text: string, x: number, extraAttrs = ''): string {
	const lines = text.split('\n');
	const startDy = -((lines.length - 1) / 2);
	return `<text x="${x}" text-anchor="middle" ${extraAttrs}>${lines.map((line, i) =>
		`<tspan x="${x}" dy="${i === 0 ? startDy : 1}em">${escapeXml(line)}</tspan>`).join('')}</text>`;
}

/**
 * 2D UML-style use case diagram - deliberately plain SVG rather than
 * Stack Layer/Knowledge Graph's 3D language, since a use case diagram is
 * inherently a flat, textual, "who does what" chart, not something a 3D
 * scene would clarify. Positions are computed here (server-side) from
 * whatever actor/use-case counts the data has, rather than hardcoded
 * pixel coordinates, so the layout doesn't need rework once real
 * extraction replaces the mock data (useCaseDiagramData.ts) with a
 * different-sized dataset.
 */
export function generateUseCaseDiagramHTML(data: UseCaseDiagramData, options: { mock?: boolean; signedIn?: boolean } = {}): string {
	const leftActors = data.actors.filter(a => a.side === 'left');
	const rightActors = data.actors.filter(a => a.side === 'right');
	const rows = Math.max(1, Math.ceil(data.useCases.length / UC_COLS));

	const boundaryWidth = COL_GAP * (UC_COLS - 1) + 2 * (UC_RX + BOUNDARY_PAD_X - COL_GAP / 2);
	const boundaryLeft = ACTOR_RAIL;
	const boundaryTop = 0;
	const boundaryHeight = BOUNDARY_PAD_TOP + UC_TOP + (rows - 1) * ROW_GAP + UC_RY + BOUNDARY_PAD_BOTTOM;

	// Project-wide NFRs render as their own row of clickable pills below the
	// boundary (see renderNfrPill) rather than a sidebar list - the canvas
	// has to grow to fit them. Each pill is sized to its own name (not a
	// fixed width), so x-positions are accumulated left to right rather
	// than evenly spaced.
	const projectNfrs = (data.nfrs || []).filter(n => n.useCaseId === null);
	const nfrPillWidths = projectNfrs.map(n => nfrPillWidth(n.name));
	const nfrRowWidth = nfrPillWidths.reduce((a, b) => a + b, 0) + Math.max(0, projectNfrs.length - 1) * NFR_PILL_GAP;
	const nfrRowY = boundaryTop + boundaryHeight + NFR_ROW_TOP_GAP;
	const nfrRowStartX = boundaryLeft + boundaryWidth / 2 - nfrRowWidth / 2;
	const nfrPillX: number[] = [];
	{
		let accX = nfrRowStartX;
		projectNfrs.forEach((_, i) => { nfrPillX[i] = accX; accX += nfrPillWidths[i] + NFR_PILL_GAP; });
	}
	const contentBottom = projectNfrs.length > 0 ? nfrRowY + NFR_PILL_H + NFR_ROW_BOTTOM_MARGIN : boundaryTop + boundaryHeight;

	const actorCount = Math.max(leftActors.length, rightActors.length, 1);
	const canvasHeight = Math.max(contentBottom, boundaryTop + ACTOR_TOP + (actorCount - 1) * ACTOR_GAP_Y + 90) + 40;
	const canvasWidth = boundaryLeft + boundaryWidth + ACTOR_RAIL;

	const ucPos: Record<string, Point> = {};
	data.useCases.forEach((uc, i) => {
		const col = i % UC_COLS, row = Math.floor(i / UC_COLS);
		ucPos[uc.id] = {
			x: boundaryLeft + boundaryWidth / 2 + (col - (UC_COLS - 1) / 2) * COL_GAP,
			y: boundaryTop + BOUNDARY_PAD_TOP + UC_TOP + row * ROW_GAP
		};
	});

	function actorPositions(actors: UseCaseActor[], railX: number): Record<string, Point> {
		const pos: Record<string, Point> = {};
		const n = actors.length;
		const totalH = (n - 1) * ACTOR_GAP_Y;
		const startY = (canvasHeight - totalH) / 2;
		actors.forEach((a, i) => { pos[a.id] = { x: railX, y: startY + i * ACTOR_GAP_Y }; });
		return pos;
	}
	const leftPos = actorPositions(leftActors, 60);
	const rightPos = actorPositions(rightActors, canvasWidth - 60);
	const actorPos: Record<string, Point> = { ...leftPos, ...rightPos };

	function renderActor(a: UseCaseActor): string {
		const p = actorPos[a.id];
		return `<g class="actor" data-id="${a.id}" transform="translate(${p.x},${p.y})">
			<circle class="actor-shape" cx="0" cy="-38" r="13"/>
			<line class="actor-shape" x1="0" y1="-25" x2="0" y2="16"/>
			<line class="actor-shape" x1="-19" y1="-8" x2="19" y2="-8"/>
			<line class="actor-shape" x1="0" y1="16" x2="-17" y2="44"/>
			<line class="actor-shape" x1="0" y1="16" x2="17" y2="44"/>
			${multilineText(a.name, 0, 'class="actor-label" y="64"')}
		</g>`;
	}

	const nfrsByUseCase: Record<string, UseCaseNFR[]> = {};
	(data.nfrs || []).forEach(nfr => {
		if (nfr.useCaseId === null) return;
		(nfrsByUseCase[nfr.useCaseId] = nfrsByUseCase[nfr.useCaseId] || []).push(nfr);
	});

	function renderUseCase(uc: UseCaseItem, index: number): string {
		const p = ucPos[uc.id];
		const nfrs = nfrsByUseCase[uc.id] || [];
		const nfrBadge = nfrs.length > 0
			? `<g class="nfr-badge" transform="translate(${UC_RX - 10},${-UC_RY + 6})"><title>${escapeXml(nfrs.map(n => n.name).join(', '))}</title><circle r="9"/><text>${nfrs.length}</text></g>`
			: '';
		const numberBadge = `<g class="uc-number" transform="translate(${-UC_RX + 10},${-UC_RY + 6})"><circle r="9"/><text>${index + 1}</text></g>`;
		return `<g class="usecase" data-id="${uc.id}" transform="translate(${p.x},${p.y})">
			<ellipse class="uc-shape" cx="0" cy="0" rx="${UC_RX}" ry="${UC_RY}"/>
			${numberBadge}
			${nfrBadge}
			${multilineText(uc.name, 0, 'class="uc-label" y="0" dominant-baseline="middle"')}
		</g>`;
	}

	function renderNfrPill(nfr: UseCaseNFR, index: number): string {
		const x = nfrPillX[index];
		const w = nfrPillWidths[index];
		return `<g class="nfr-pill" data-nfr-id="${nfr.id}" transform="translate(${x},${nfrRowY})">
			<rect width="${w}" height="${NFR_PILL_H}" rx="15"/>
			<text x="${w / 2}" y="${NFR_PILL_H / 2}" text-anchor="middle" dominant-baseline="central">${escapeXml(nfr.name)}</text>
		</g>`;
	}

	const associationEdges = data.associations.map((assoc, i) => {
		const a = actorPos[assoc.actorId];
		const uc = ucPos[assoc.useCaseId];
		const isLeft = !!leftPos[assoc.actorId];
		const actorAnchor: Point = { x: a.x + (isLeft ? 24 : -24), y: a.y - 8 };
		const ucEnd = ellipseIntersect(uc.x, uc.y, UC_RX, UC_RY, actorAnchor.x, actorAnchor.y);
		return {
			id: `assoc-${i}`, a: assoc.actorId, b: assoc.useCaseId,
			svg: `<line class="edge assoc-edge" data-edge-id="assoc-${i}" data-a="${assoc.actorId}" data-b="${assoc.useCaseId}"
				x1="${actorAnchor.x}" y1="${actorAnchor.y}" x2="${ucEnd.x}" y2="${ucEnd.y}"/>`
		};
	});

	const relationEdges = data.relations.map((rel, i) => {
		const from = ucPos[rel.fromId], to = ucPos[rel.toId];
		const start = ellipseIntersect(from.x, from.y, UC_RX, UC_RY, to.x, to.y);
		const end = ellipseIntersect(to.x, to.y, UC_RX, UC_RY, from.x, from.y);
		const midX = (start.x + end.x) / 2, midY = (start.y + end.y) / 2;
		return {
			id: `rel-${i}`, a: rel.fromId, b: rel.toId,
			svg: `<g class="edge relation-edge" data-edge-id="rel-${i}" data-a="${rel.fromId}" data-b="${rel.toId}">
				<line class="rel-line" marker-end="url(#arrow)" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>
				<text class="rel-label" x="${midX}" y="${midY - 8}" text-anchor="middle">&laquo;${rel.kind}&raquo;</text>
			</g>`
		};
	});

	// id -> ids of every node one hop away, across both edge kinds - drives
	// the hover/click highlight (dim everything not connected to a node).
	const adjacency: Record<string, string[]> = {};
	function link(a: string, b: string): void {
		(adjacency[a] = adjacency[a] || []).push(b);
		(adjacency[b] = adjacency[b] || []).push(a);
	}
	associationEdges.forEach(e => link(e.a, e.b));
	relationEdges.forEach(e => link(e.a, e.b));

	const adjacencyJSON = JSON.stringify(adjacency);

	// Detail-popup content, precomputed server-side and embedded as JSON
	// (same pattern as adjacency above) rather than re-derived client-side -
	// the click handlers below just look up by id.
	const ucDetails = data.useCases.map((uc, i) => ({
		id: uc.id,
		number: i + 1,
		name: uc.name.replace(/\n/g, ' '),
		description: uc.description || '',
		actors: data.associations.filter(a => a.useCaseId === uc.id)
			.map(a => data.actors.find(x => x.id === a.actorId)?.name.replace(/\n/g, ' ') || '').filter(Boolean),
		// {id, name} only - clicking a chip opens its own full detail via
		// NFR_DETAILS/openNfrDetail rather than dumping text inline here.
		nfrs: (nfrsByUseCase[uc.id] || []).map(n => ({ id: n.id, name: n.name }))
	}));
	const actorDetails = data.actors.map(a => ({
		id: a.id,
		name: a.name.replace(/\n/g, ' '),
		role: a.role || '',
		description: a.description || '',
		useCases: data.associations.filter(x => x.actorId === a.id)
			.map(x => data.useCases.find(u => u.id === x.useCaseId)?.name.replace(/\n/g, ' ') || '').filter(Boolean)
	}));
	// Numbered across ALL nfrs (project-wide + use-case-scoped) in
	// declaration order, not just the project-wide ones - both the pill
	// row and a use-case popup's NFR chips resolve through this same list.
	const nfrDetails = (data.nfrs || []).map((n, i) => ({
		id: n.id,
		number: i + 1,
		name: n.name,
		text: n.text,
		scope: n.useCaseId === null ? 'Project-wide' : (data.useCases.find(u => u.id === n.useCaseId)?.name.replace(/\n/g, ' ') || 'Use case')
	}));

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeXml(data.workspaceName)} - use case diagram</title>
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
		--uc-fill: #FFFFFF; --uc-stroke: #3459E0; --actor-stroke: #5C6785;
		--boundary-stroke: #B9C4E0;
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
			--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
			--dot: color-mix(in srgb, var(--border) 70%, transparent);
			--uc-fill: #171F38; --uc-stroke: #6D93F5; --actor-stroke: #939CBE;
			--boundary-stroke: #333E63;
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
		--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
		--dot: color-mix(in srgb, var(--border) 70%, transparent);
		--uc-fill: #171F38; --uc-stroke: #6D93F5; --actor-stroke: #939CBE;
		--boundary-stroke: #333E63;
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
	body { background: var(--bg); color: var(--text); font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif; }

	#stage {
		position: absolute; inset: 0; padding: 56px 24px 40px;
		background-image: radial-gradient(var(--dot) 1px, transparent 1px);
		background-size: 22px 22px;
	}
	#stage svg { display: block; width: 100%; height: 100%; }

	#header {
		position: absolute; top: 0; left: 0; right: 0; padding: 14px 20px;
		display: flex; align-items: baseline; gap: 10px; pointer-events: none; z-index: 5;
	}
	#header h1 { margin: 0; font-size: 15px; font-weight: 650; }
	#header .sub { font-size: 12.5px; color: var(--text-dim); font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }

	#hint {
		position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 5;
		font-size: 12px; color: var(--text-faint); font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		pointer-events: none;
	}

	.boundary { fill: none; stroke: var(--boundary-stroke); stroke-width: 1.5; }
	.boundary-label { fill: var(--text-dim); font-size: 13px; font-weight: 650; }

	.actor-shape { fill: none; stroke: var(--actor-stroke); stroke-width: 2.2; stroke-linecap: round; }
	.actor-label { fill: var(--text); font-size: 12.5px; }

	.uc-shape { fill: var(--uc-fill); stroke: var(--uc-stroke); stroke-width: 1.8; transition: stroke-width 0.12s; }
	.uc-label { fill: var(--text); font-size: 12px; }

	.assoc-edge { stroke: var(--text-faint); stroke-width: 1.4; }
	.rel-line { stroke: var(--text-faint); stroke-width: 1.4; stroke-dasharray: 5 4; }
	.rel-label { fill: var(--text-dim); font-size: 10px; font-style: italic; }

	.actor, .usecase { cursor: pointer; }
	.actor:hover .actor-shape, .usecase:hover .uc-shape { stroke: var(--accent); }

	/* Set on #stage svg while a node is hovered/focused - dims everything
	   not adjacent to it so a busy diagram still reads as "what connects
	   to this" at a glance. */
	svg.highlighting .node, svg.highlighting .edge { opacity: 0.22; }
	svg.highlighting .node.hi, svg.highlighting .edge.hi { opacity: 1; }
	svg.highlighting .node.hi .uc-shape, svg.highlighting .node.hi .actor-shape { stroke: var(--accent); }
	svg.highlighting .edge.hi .assoc-edge, svg.highlighting .edge.hi .rel-line { stroke: var(--accent); }

	.nfr-badge circle { fill: var(--accent-2); }
	.nfr-badge text { fill: #fff; font-size: 9.5px; font-weight: 700; text-anchor: middle; dominant-baseline: central; }

	.uc-number circle { fill: var(--surface); stroke: var(--uc-stroke); stroke-width: 1.5; }
	.uc-number text { fill: var(--uc-stroke); font-size: 9.5px; font-weight: 700; text-anchor: middle; dominant-baseline: central; }

	.nfr-pill { cursor: pointer; }
	.nfr-pill rect { fill: var(--surface); stroke: var(--accent-2); stroke-width: 1.5; transition: fill 0.12s; }
	.nfr-pill text { fill: var(--accent-2); font-size: 10.5px; font-weight: 650; transition: fill 0.12s; }
	.nfr-pill:hover rect { fill: var(--accent-2); }
	.nfr-pill:hover text { fill: #fff; }
	.nfr-row-label { fill: var(--text-faint); font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-anchor: middle; }

	#overview-btn {
		border: 1px solid var(--border); background: var(--surface-2); color: var(--text-dim);
		font-size: 11px; font-weight: 650; padding: 4px 10px; border-radius: 100px; cursor: pointer;
		margin-left: 10px; font-family: inherit;
	}
	#overview-btn:hover { border-color: var(--accent); color: var(--accent); }

	/* ---- click-to-open detail popup: actors, use cases, and project-wide
	   NFRs all open the same modal shape rather than cramming everything
	   into a permanent sidebar - see the click handlers below for what
	   fills #detail-kicker/#detail-title/#detail-body per node type. ---- */
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
	.detail-section { margin-top: 16px; }
	.detail-section h3 { margin: 0 0 6px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-faint); }
	.detail-section p, .detail-section ul { margin: 0; color: var(--text-dim); font-size: 12.5px; line-height: 1.6; }
	.detail-section ul { padding-left: 18px; }
	.nfr-chips { display: flex; flex-wrap: wrap; gap: 6px; }
	.nfr-chip {
		border: 1px solid var(--accent-2); background: none; color: var(--accent-2);
		font-size: 11px; font-weight: 650; font-family: inherit; padding: 4px 10px;
		border-radius: 100px; cursor: pointer; transition: background 0.12s, color 0.12s;
	}
	.nfr-chip:hover { background: var(--accent-2); color: #fff; }
</style>
</head>
<body>
	<div id="stage">
		<svg id="uc-svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
					<path d="M0,0 L10,5 L0,10 z" fill="var(--text-faint)"/>
				</marker>
			</defs>
			<rect class="boundary" x="${boundaryLeft}" y="${boundaryTop}" width="${boundaryWidth}" height="${boundaryHeight}" rx="18"/>
			<text class="boundary-label" x="${boundaryLeft + boundaryWidth / 2}" y="${boundaryTop + 30}" text-anchor="middle">${escapeXml(data.systemName)}</text>
			${associationEdges.map(e => e.svg).join('\n')}
			${relationEdges.map(e => e.svg).join('\n')}
			${data.actors.map(renderActor).join('\n')}
			${data.useCases.map((uc, i) => renderUseCase(uc, i)).join('\n')}
			${projectNfrs.length > 0 ? `<text class="nfr-row-label" x="${boundaryLeft + boundaryWidth / 2}" y="${nfrRowY - 14}">PROJECT-WIDE NFRs</text>` : ''}
			${projectNfrs.map((n, i) => renderNfrPill(n, i)).join('\n')}
		</svg>
	</div>
	<div id="header">
		<h1>${escapeXml(data.workspaceName)}</h1>
		<span class="sub">${data.actors.length} actors &bull; ${data.useCases.length} use cases${options.mock ? ' &bull; mock data' : ''}</span>
		${data.overview ? `<button id="overview-btn" type="button" style="pointer-events:auto;">Project Overview</button>` : ''}
		${options.mock && options.signedIn !== undefined ? `<button id="gen-real" style="pointer-events:auto;margin-left:8px;border:1px solid var(--border);background:var(--surface);color:var(--accent);font-size:11px;font-weight:650;padding:4px 10px;border-radius:100px;cursor:pointer;">${options.signedIn ? 'Generate from this codebase' : 'Sign in to generate'}</button>` : ''}
	</div>
	<div id="hint">click an actor, use case, or NFR for detail &bull; hover to trace connections</div>

	<div id="detail-overlay">
		<div id="detail-modal" role="dialog" aria-modal="true">
			<div id="detail-header">
				<div>
					<p id="detail-kicker"></p>
					<h2 id="detail-title"></h2>
				</div>
				<button id="detail-close" type="button" aria-label="Close">&times;</button>
			</div>
			<div id="detail-body"></div>
		</div>
	</div>

<script>
(function () {
	'use strict';
	var svg = document.getElementById('uc-svg');
	var adjacency = ${adjacencyJSON};
	// True while the detail popup covers the diagram - hover events on the
	// SVG underneath aren't reliable once an overlay is sitting on top of
	// it (no mouse movement happens to fire a real mouseleave), so this is
	// an explicit switch rather than trusting mouseenter/mouseleave to
	// stay in sync with what's actually visible.
	var modalOpen = false;

	svg.querySelectorAll('.actor, .usecase').forEach(function (el) { el.classList.add('node'); });

	function idsToHighlight(id) {
		var set = {};
		set[id] = true;
		(adjacency[id] || []).forEach(function (other) { set[other] = true; });
		return set;
	}

	function applyHighlight(id) {
		if (!id) {
			svg.classList.remove('highlighting');
			svg.querySelectorAll('.hi').forEach(function (el) { el.classList.remove('hi'); });
			return;
		}
		svg.classList.add('highlighting');
		var keep = idsToHighlight(id);
		svg.querySelectorAll('.node').forEach(function (el) {
			el.classList.toggle('hi', !!keep[el.getAttribute('data-id')]);
		});
		svg.querySelectorAll('.edge').forEach(function (el) {
			var a = el.getAttribute('data-a'), b = el.getAttribute('data-b');
			el.classList.toggle('hi', a === id || b === id);
		});
	}

	// ---- detail popup: click an actor, use case, or project-wide NFR pill
	// to read about it in the middle of the screen instead of a permanent
	// sidebar (see the CSS comment on #detail-overlay). ----
	var UC_DETAILS = ${JSON.stringify(ucDetails)};
	var ACTOR_DETAILS = ${JSON.stringify(actorDetails)};
	var NFR_DETAILS = ${JSON.stringify(nfrDetails)};

	var detailOverlay = document.getElementById('detail-overlay');
	var detailKicker = document.getElementById('detail-kicker');
	var detailTitle = document.getElementById('detail-title');
	var detailBody = document.getElementById('detail-body');

	function escapeHtml(s) {
		var d = document.createElement('div');
		d.textContent = s;
		return d.innerHTML;
	}

	function openDetail(kicker, title, bodyHTML) {
		modalOpen = true;
		applyHighlight(null);
		detailKicker.textContent = kicker;
		detailTitle.textContent = title;
		detailBody.innerHTML = bodyHTML;
		detailOverlay.classList.add('open');
	}
	function closeDetail() {
		modalOpen = false;
		detailOverlay.classList.remove('open');
	}
	detailOverlay.addEventListener('click', function (e) { if (e.target === detailOverlay) closeDetail(); });
	document.getElementById('detail-close').addEventListener('click', closeDetail);
	document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDetail(); });

	function openUseCaseDetail(id) {
		var uc = UC_DETAILS.filter(function (u) { return u.id === id; })[0];
		if (!uc) return;
		var html = uc.description ? '<p class="detail-desc">' + escapeHtml(uc.description) + '</p>' : '<p class="detail-desc">No description yet.</p>';
		if (uc.actors.length) html += '<div class="detail-section"><h3>Actors</h3><p>' + escapeHtml(uc.actors.join(', ')) + '</p></div>';
		if (uc.nfrs.length) html += '<div class="detail-section"><h3>Non-functional requirements</h3><div class="nfr-chips">' + uc.nfrs.map(function (n) { return '<button type="button" class="nfr-chip" data-nfr-chip="' + n.id + '">' + escapeHtml(n.name) + '</button>'; }).join('') + '</div></div>';
		openDetail('USE CASE UC-' + uc.number, uc.name, html);
	}
	function openActorDetail(id) {
		var a = ACTOR_DETAILS.filter(function (x) { return x.id === id; })[0];
		if (!a) return;
		var html = a.description ? '<p class="detail-desc">' + escapeHtml(a.description) + '</p>' : '<p class="detail-desc">No description yet.</p>';
		if (a.useCases.length) html += '<div class="detail-section"><h3>Involved in</h3><p>' + escapeHtml(a.useCases.join(', ')) + '</p></div>';
		openDetail(a.role ? 'ACTOR \\u00b7 ' + a.role.toUpperCase() : 'ACTOR', a.name, html);
	}
	function openNfrDetail(nfrId) {
		var n = NFR_DETAILS.filter(function (x) { return x.id === nfrId; })[0];
		if (!n) return;
		openDetail('NFR-' + n.number + ' \\u00b7 ' + n.scope.toUpperCase(), n.name, '<p class="detail-desc">' + escapeHtml(n.text) + '</p>');
	}

	// Use-case popups render their NFRs as chips (see openUseCaseDetail) -
	// delegated rather than bound per-chip, since the popup body is
	// replaced wholesale on every open.
	detailBody.addEventListener('click', function (e) {
		var chip = e.target.closest('[data-nfr-chip]');
		if (chip) openNfrDetail(chip.getAttribute('data-nfr-chip'));
	});

	svg.querySelectorAll('.nfr-pill').forEach(function (el) {
		el.addEventListener('click', function (e) {
			e.stopPropagation();
			openNfrDetail(el.getAttribute('data-nfr-id'));
		});
	});

	var overviewBtn = document.getElementById('overview-btn');
	if (overviewBtn) {
		overviewBtn.addEventListener('click', function () {
			openDetail('OVERVIEW', ${JSON.stringify(data.workspaceName)}, '<p class="detail-desc">' + escapeHtml(${JSON.stringify(data.overview || '')}) + '</p>');
		});
	}

	var genRealBtn = document.getElementById('gen-real');
	if (genRealBtn) {
		genRealBtn.addEventListener('click', function () {
			if (${JSON.stringify(!!options.signedIn)} !== true) {
				window.parent.postMessage({ command: 'startSignIn' }, '*');
				return;
			}
			genRealBtn.disabled = true;
			genRealBtn.textContent = 'Generating...';
			fetch('/api/use-case-diagram/generate', { method: 'POST' })
				.then(function (r) { return r.json(); })
				.then(function (result) {
					if (result.ok) { location.reload(); return; }
					throw new Error(result.error || 'Generation failed.');
				})
				.catch(function (err) {
					genRealBtn.disabled = false;
					genRealBtn.textContent = 'Retry';
				});
		});
	}

	// Hover traces connections (applyHighlight); click opens the detail
	// popup - kept as two separate, non-competing interactions rather than
	// also pinning a persistent highlight on click, which used to fight
	// with the popup opening at the same time (both firing off one click).
	svg.querySelectorAll('.node').forEach(function (el) {
		el.addEventListener('mouseenter', function () { if (!modalOpen) applyHighlight(el.getAttribute('data-id')); });
		el.addEventListener('mouseleave', function () { if (!modalOpen) applyHighlight(null); });
		el.addEventListener('click', function () {
			var id = el.getAttribute('data-id');
			if (el.classList.contains('usecase')) openUseCaseDetail(id);
			else openActorDetail(id);
		});
	});
})();
</script>
</body>
</html>`;
}

/**
 * Shown instead of generateUseCaseDiagramHTML's real diagram whenever
 * there's nothing generated yet - either not signed in (triggers sign-in
 * via postMessage, since the account button/poll loop lives in the shell,
 * not this iframe) or signed in with no cached result yet (a "Generate"
 * button that POSTs to /api/use-case-diagram/generate directly, same-
 * origin, no parent needed).
 */
export function generateUseCaseDiagramEmptyHTML(signedIn: boolean): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Use Case Diagram</title>
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
			? `<p>No use case diagram generated yet.</p><button id="action">Generate</button>`
			: `<p>Sign in to generate a use case diagram from this codebase.</p><button id="action">Sign In</button>`}
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
