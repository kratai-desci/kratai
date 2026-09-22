import { DomainModelData, DomainEntity } from './domainModelData.js';

const BOX_WIDTH = 210, HEADER_H = 32, ATTR_H = 20, PAD_TOP = 10, PAD_BOTTOM = 10;
const COLS_GAP = 130, ROWS_GAP = 70, MARGIN = 50;

interface Point { x: number; y: number; }
interface BoxLayout { entity: DomainEntity; x: number; y: number; height: number; }

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function boxHeight(entity: DomainEntity): number {
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
 * 2D ER-style entity-relationship diagram - same "plain server-rendered
 * SVG, layout computed from data size" approach as useCaseDiagramView.ts,
 * so real extraction can later replace buildMockDomainModelData's fixed
 * fixture without any rework here. Entities are laid out in a grid
 * (roughly square aspect) rather than a single row, since a domain model
 * with a dozen-plus entities would otherwise produce an unreadably wide
 * canvas.
 */
export function generateDomainModelHTML(data: DomainModelData, options: { mock?: boolean } = {}): string {
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

	function renderEntity(box: BoxLayout): string {
		const { entity } = box;
		const rows = entity.attributes.map((attr, i) => {
			const y = HEADER_H + PAD_TOP + i * ATTR_H;
			const marker = attr.isPK ? 'PK' : attr.isFK ? 'FK' : '';
			return `<g class="attr-row" transform="translate(0,${y})">
				${marker ? `<text class="attr-marker" x="14">${marker}</text>` : ''}
				<text class="attr-name${attr.isPK ? ' pk' : ''}" x="46">${escapeXml(attr.name)}</text>
				<text class="attr-type" x="${BOX_WIDTH - 12}" text-anchor="end">${escapeXml(attr.type)}</text>
			</g>`;
		}).join('\n');
		return `<g class="entity" data-id="${entity.id}" transform="translate(${box.x},${box.y})">
			<rect class="entity-box" width="${BOX_WIDTH}" height="${box.height}" rx="8"/>
			<rect class="entity-header" width="${BOX_WIDTH}" height="${HEADER_H}" rx="8"/>
			<rect class="entity-header-mask" y="${HEADER_H - 8}" width="${BOX_WIDTH}" height="8"/>
			<text class="entity-name" x="${BOX_WIDTH / 2}" y="${HEADER_H / 2}" text-anchor="middle" dominant-baseline="central">${escapeXml(entity.name)}</text>
			<line class="header-rule" x1="0" y1="${HEADER_H}" x2="${BOX_WIDTH}" y2="${HEADER_H}"/>
			${rows}
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
<title>${escapeXml(data.workspaceName)} - domain model</title>
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
		--entity-fill: #FFFFFF; --entity-header: #3459E0;
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
			--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
			--dot: color-mix(in srgb, var(--border) 70%, transparent);
			--entity-fill: #171F38; --entity-header: #2C3A66;
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
		--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
		--dot: color-mix(in srgb, var(--border) 70%, transparent);
		--entity-fill: #171F38; --entity-header: #2C3A66;
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

	#header {
		position: absolute; top: 0; left: 0; right: 0; padding: 14px 20px;
		display: flex; align-items: baseline; gap: 10px; pointer-events: none; z-index: 5;
	}
	#header h1 { margin: 0; font-size: 15px; font-weight: 650; }
	#header .sub { font-size: 12.5px; color: var(--text-dim); font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }

	.entity-box { fill: var(--entity-fill); stroke: var(--border); stroke-width: 1.5; }
	.entity-header { fill: var(--entity-header); }
	.entity-header-mask { fill: var(--entity-fill); }
	.entity-name { fill: #fff; font-size: 12.5px; font-weight: 650; }
	.header-rule { stroke: var(--border); stroke-width: 1; }
	.attr-marker { fill: var(--accent-2); font-size: 9.5px; font-weight: 700; font-family: ui-monospace, monospace; }
	.attr-name { fill: var(--text); font-size: 11.5px; }
	.attr-name.pk { font-weight: 650; text-decoration: underline; }
	.attr-type { fill: var(--text-faint); font-size: 10.5px; font-family: ui-monospace, monospace; }

	.rel-line { stroke: var(--text-faint); stroke-width: 1.4; }
	.rel-label { fill: var(--text-dim); font-size: 10px; }

	.entity { cursor: pointer; }
	.entity:hover .entity-box { stroke: var(--accent); }

	svg.highlighting .node, svg.highlighting .edge { opacity: 0.22; }
	svg.highlighting .node.hi, svg.highlighting .edge.hi { opacity: 1; }
	svg.highlighting .node.hi .entity-box { stroke: var(--accent); }
	svg.highlighting .edge.hi .rel-line { stroke: var(--accent); }
</style>
</head>
<body>
	<div id="stage">
		<svg id="domain-svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
			${relEdges}
			${data.entities.map(e => renderEntity(layout[e.id])).join('\n')}
		</svg>
	</div>
	<div id="header">
		<h1>${escapeXml(data.workspaceName)}</h1>
		<span class="sub">${data.entities.length} entities &bull; ${data.relationships.length} relationships${options.mock ? ' &bull; mock data' : ''}</span>
	</div>

<script>
(function () {
	'use strict';
	var svg = document.getElementById('domain-svg');
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
</body>
</html>`;
}
