import { UseCaseDiagramData, UseCaseActor, UseCaseItem } from './useCaseDiagramData.js';

const UC_RX = 95, UC_RY = 38;
const COL_GAP = 260, ROW_GAP = 116, UC_TOP = 150, UC_COLS = 2;
const ACTOR_GAP_Y = 150, ACTOR_TOP = 130;
const BOUNDARY_PAD_X = 90, BOUNDARY_PAD_TOP = 60, BOUNDARY_PAD_BOTTOM = 70;
const ACTOR_RAIL = 260;

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
export function generateUseCaseDiagramHTML(data: UseCaseDiagramData, options: { mock?: boolean } = {}): string {
	const leftActors = data.actors.filter(a => a.side === 'left');
	const rightActors = data.actors.filter(a => a.side === 'right');
	const rows = Math.max(1, Math.ceil(data.useCases.length / UC_COLS));

	const boundaryWidth = COL_GAP * (UC_COLS - 1) + 2 * (UC_RX + BOUNDARY_PAD_X - COL_GAP / 2);
	const boundaryLeft = ACTOR_RAIL;
	const boundaryTop = 0;
	const boundaryHeight = BOUNDARY_PAD_TOP + UC_TOP + (rows - 1) * ROW_GAP + UC_RY + BOUNDARY_PAD_BOTTOM;

	const actorCount = Math.max(leftActors.length, rightActors.length, 1);
	const canvasHeight = Math.max(boundaryTop + boundaryHeight, boundaryTop + ACTOR_TOP + (actorCount - 1) * ACTOR_GAP_Y + 90) + 40;
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

	function renderUseCase(uc: UseCaseItem): string {
		const p = ucPos[uc.id];
		return `<g class="usecase" data-id="${uc.id}" transform="translate(${p.x},${p.y})">
			<ellipse class="uc-shape" cx="0" cy="0" rx="${UC_RX}" ry="${UC_RY}"/>
			${multilineText(uc.name, 0, 'class="uc-label" y="0" dominant-baseline="middle"')}
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

	#legend {
		position: absolute; top: 16px; right: 16px; z-index: 5; background: var(--surface); border: 1px solid var(--border);
		border-radius: 10px; padding: 10px 14px; font-size: 11.5px; color: var(--text-dim); display: flex; flex-direction: column; gap: 6px;
	}
	#legend .row { display: flex; align-items: center; gap: 8px; }
	#legend .swatch { width: 22px; height: 0; border-top: 2px solid var(--text-faint); flex-shrink: 0; }
	#legend .swatch.dashed { border-top-style: dashed; }

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

	#focus-banner {
		position: absolute; top: 16px; left: 50%; transform: translateX(-50%); display: none; z-index: 5;
		background: var(--accent); color: #fff; font-size: 12.5px; font-weight: 600;
		padding: 7px 14px; border-radius: 100px; align-items: center; gap: 10px;
	}
	#focus-banner button {
		border: none; background: rgba(255,255,255,0.25); color: #fff; border-radius: 100px;
		font-size: 11px; padding: 3px 10px; cursor: pointer; font-weight: 650;
	}
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
			${data.useCases.map(renderUseCase).join('\n')}
		</svg>
	</div>
	<div id="header">
		<h1>${escapeXml(data.workspaceName)}</h1>
		<span class="sub">${data.actors.length} actors &bull; ${data.useCases.length} use cases${options.mock ? ' &bull; mock data' : ''}</span>
	</div>
	<div id="legend">
		<div class="row"><span class="swatch"></span>association</div>
		<div class="row"><span class="swatch dashed"></span>&laquo;include&raquo; / &laquo;extend&raquo;</div>
	</div>
	<div id="focus-banner"><span id="focus-label"></span><button id="focus-clear">Clear</button></div>
	<div id="hint">hover an actor or use case to trace its connections</div>

<script>
(function () {
	'use strict';
	var svg = document.getElementById('uc-svg');
	var adjacency = ${adjacencyJSON};

	svg.querySelectorAll('.actor, .usecase').forEach(function (el) { el.classList.add('node'); });

	var focusedId = null;

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

	var focusBanner = document.getElementById('focus-banner');
	var focusLabel = document.getElementById('focus-label');
	function setFocus(id, label) {
		focusedId = id;
		applyHighlight(id);
		focusBanner.style.display = id ? 'flex' : 'none';
		if (id) focusLabel.textContent = label;
	}
	document.getElementById('focus-clear').addEventListener('click', function () { setFocus(null); });

	svg.querySelectorAll('.node').forEach(function (el) {
		el.addEventListener('mouseenter', function () { if (!focusedId) applyHighlight(el.getAttribute('data-id')); });
		el.addEventListener('mouseleave', function () { if (!focusedId) applyHighlight(null); });
		el.addEventListener('click', function () {
			var id = el.getAttribute('data-id');
			if (focusedId === id) { setFocus(null); return; }
			var label = el.querySelector('.actor-label, .uc-label');
			setFocus(id, (label ? label.textContent : id).replace(/\\s+/g, ' '));
		});
	});
	svg.addEventListener('click', function (e) { if (e.target === svg) setFocus(null); });
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
