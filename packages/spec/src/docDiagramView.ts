import { UseCaseDiagramData, UseCaseActor, UseCaseItem, UseCaseNFR } from '@kratai-desci/llm';

/**
 * The use case diagram as it appears in the DOCUMENTS (the SRS and the progress report, and so
 * their PDFs). Deliberately separate from useCaseDiagramView.ts, which draws the interactive Use
 * Case Model page in the app: the two have different jobs. The page is a screen to explore - hover
 * to trace, click for detail, project-wide requirements as pills inside the picture. A document is
 * read and printed - nothing to click, white paper, and the project-wide requirements as their own
 * wrapping row of tags under the figure so any number of them fits. They share nothing but the
 * data, so a change to one cannot break the other.
 */

const UC_RX = 95, UC_RY = 38;
// Tighter than the on-screen page's layout (useCaseDiagramView.ts): a printed page is short and fixed, so
// vertical room is what limits how big the text can be. Less blank space above the first row, between
// rows and beside the actors lets the same diagram print about a third larger.
const COL_GAP = 260, ROW_GAP = 100, UC_TOP = 70, UC_COLS = 2;
const ACTOR_GAP_Y = 150, ACTOR_TOP = 130;
const BOUNDARY_PAD_X = 90, BOUNDARY_PAD_TOP = 60, BOUNDARY_PAD_BOTTOM = 70;
const ACTOR_RAIL = 200;

/** Most use cases a figure shows before the document switches to one figure per actor (and the most
 * one actor's figure shows before it is split into parts). Chosen from real student requirement
 * documents: up to about 18 use cases a full page keeps the labels readable (about 6.5pt). */
export const DOC_SINGLE_DIAGRAM_MAX = 18;

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

/** Breaks a long name into lines of at most `max` characters at spaces (a very long single word stays whole). */
function wrapLabel(text: string, max = 24): string {
	const out: string[] = [];
	for (const paragraph of text.split('\n')) {
		let line = '';
		for (const word of paragraph.split(/\s+/).filter(Boolean)) {
			if (line && (line + ' ' + word).length > max) { out.push(line); line = word; }
			else line = line ? line + ' ' + word : word;
		}
		out.push(line);
	}
	return out.join('\n');
}

function multilineText(text: string, x: number, extraAttrs = ''): string {
	const lines = text.split('\n');
	const startDy = -((lines.length - 1) / 2);
	return `<text x="${x}" text-anchor="middle" ${extraAttrs}>${lines.map((line, i) =>
		`<tspan x="${x}" dy="${i === 0 ? startDy : 1}em">${escapeXml(line)}</tspan>`).join('')}</text>`;
}

/**
 * Shape and colour rules for the document diagram and the requirement tags. Uses the host
 * document's colour variables (so the on-screen SRS follows the app theme); the SRS print rules
 * reset every variable used here to light values, so a printed copy is always on white.
 */
export const DOC_DIAGRAM_STYLE = `
	.boundary { fill: none; stroke: var(--boundary-stroke); stroke-width: 1.5; }
	.boundary-label { fill: var(--text-dim); font-size: 13px; font-weight: 650; }
	.actor-shape { fill: none; stroke: var(--actor-stroke); stroke-width: 2.2; stroke-linecap: round; }
	.actor-label { fill: var(--text); font-size: 12.5px; }
	.uc-shape { fill: var(--uc-fill); stroke: var(--uc-stroke); stroke-width: 1.8; }
	.uc-label { fill: var(--text); font-size: 12px; }
	.assoc-edge { stroke: var(--text-faint); stroke-width: 1.4; }
	.rel-line { stroke: var(--text-faint); stroke-width: 1.4; stroke-dasharray: 5 4; }
	.rel-label { fill: var(--text-dim); font-size: 10px; font-style: italic; }
	.nfr-badge circle { fill: var(--accent-2); }
	.nfr-badge text { fill: #fff; font-size: 9.5px; font-weight: 700; text-anchor: middle; dominant-baseline: central; }
	.uc-number circle { fill: var(--surface); stroke: var(--uc-stroke); stroke-width: 1.5; }
	.uc-number text { fill: var(--uc-stroke); font-size: 9.5px; font-weight: 700; text-anchor: middle; dominant-baseline: central; }
	/* A use case that belongs to another actor but is linked to one in this figure (include/extend). */
	.usecase.related .uc-shape { stroke-dasharray: 5 3; stroke: var(--text-faint); }
	.usecase.related .uc-label { fill: var(--text-dim); }
	/* The project-wide NFRs are plain HTML under the diagram (see buildNfrTagsHtml), not part of the
	   SVG: a row of any number of tags wraps instead of being clipped at the diagram's edges. */
	.nfr-block { margin: 18px 0 0; text-align: center; }
	.nfr-block-label { font-size: 10px; font-weight: 700; letter-spacing: 0.04em; color: var(--text-faint); margin-bottom: 8px; }
	.nfr-tags { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
	.nfr-tag { border: 1.5px solid var(--accent-2); border-radius: 999px; background: var(--surface); color: var(--accent-2); font-size: 11.5px; font-weight: 650; padding: 5px 14px; font-family: inherit; line-height: 1.3; }
`;

interface SvgOptions {
	/** Use case id -> the number it has in the whole spec (a per-actor figure shows only some of them). */
	numbers?: Record<string, number>;
	/** Use cases drawn as "related" (dashed): linked to a use case in this figure but not this actor's own. */
	relatedIds?: Set<string>;
}

function buildSvg(data: UseCaseDiagramData, opts: SvgOptions = {}): { svg: string; width: number; height: number } {
	const leftActors = data.actors.filter(a => a.side === 'left');
	const rightActors = data.actors.filter(a => a.side === 'right');
	const rows = Math.max(1, Math.ceil(data.useCases.length / UC_COLS));

	const boundaryWidth = COL_GAP * (UC_COLS - 1) + 2 * (UC_RX + BOUNDARY_PAD_X - COL_GAP / 2);
	const boundaryLeft = ACTOR_RAIL;
	const boundaryTop = 0;
	const boundaryHeight = BOUNDARY_PAD_TOP + UC_TOP + (rows - 1) * ROW_GAP + UC_RY + BOUNDARY_PAD_BOTTOM;

	const contentBottom = boundaryTop + boundaryHeight;

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
		return `<g class="actor" transform="translate(${p.x},${p.y})">
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
		const numberBadge = `<g class="uc-number" transform="translate(${-UC_RX + 10},${-UC_RY + 6})"><circle r="9"/><text>${opts.numbers?.[uc.id] ?? index + 1}</text></g>`;
		return `<g class="usecase${opts.relatedIds?.has(uc.id) ? ' related' : ''}" transform="translate(${p.x},${p.y})">
			<ellipse class="uc-shape" cx="0" cy="0" rx="${UC_RX}" ry="${UC_RY}"/>
			${numberBadge}
			${nfrBadge}
			${multilineText(wrapLabel(uc.name), 0, 'class="uc-label" y="0" dominant-baseline="middle"')}
		</g>`;
	}

	const associationEdges = data.associations.map(assoc => {
		const a = actorPos[assoc.actorId];
		const uc = ucPos[assoc.useCaseId];
		const isLeft = !!leftPos[assoc.actorId];
		const actorAnchor: Point = { x: a.x + (isLeft ? 24 : -24), y: a.y - 8 };
		const ucEnd = ellipseIntersect(uc.x, uc.y, UC_RX, UC_RY, actorAnchor.x, actorAnchor.y);
		return `<line class="edge assoc-edge"
			x1="${actorAnchor.x}" y1="${actorAnchor.y}" x2="${ucEnd.x}" y2="${ucEnd.y}"/>`;
	});

	const relationEdges = data.relations.map(rel => {
		const from = ucPos[rel.fromId], to = ucPos[rel.toId];
		const start = ellipseIntersect(from.x, from.y, UC_RX, UC_RY, to.x, to.y);
		const end = ellipseIntersect(to.x, to.y, UC_RX, UC_RY, from.x, from.y);
		const midX = (start.x + end.x) / 2, midY = (start.y + end.y) / 2;
		return `<g class="edge relation-edge">
			<line class="rel-line" marker-end="url(#arrow)" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>
			<text class="rel-label" x="${midX}" y="${midY - 8}" text-anchor="middle">&laquo;${rel.kind}&raquo;</text>
		</g>`;
	});

	const svg = `<svg class="doc-diagram" viewBox="0 0 ${canvasWidth} ${canvasHeight}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
				<path d="M0,0 L10,5 L0,10 z" fill="var(--text-faint)"/>
			</marker>
		</defs>
		<rect class="boundary" x="${boundaryLeft}" y="${boundaryTop}" width="${boundaryWidth}" height="${boundaryHeight}" rx="18"/>
		<text class="boundary-label" x="${boundaryLeft + boundaryWidth / 2}" y="${boundaryTop + 30}" text-anchor="middle">${escapeXml(data.systemName)}</text>
		${associationEdges.join('\n')}
		${relationEdges.join('\n')}
		${data.actors.map(renderActor).join('\n')}
		${data.useCases.map((uc, i) => renderUseCase(uc, i)).join('\n')}
	</svg>`;

	return { svg, width: canvasWidth, height: canvasHeight };
}

/**
 * The project-wide NFRs as a row of tags that wraps, printed as plain labels under the figure.
 */
function buildNfrTagsHtml(data: UseCaseDiagramData): string {
	const projectNfrs = (data.nfrs || []).filter(n => n.useCaseId === null);
	if (projectNfrs.length === 0) return '';
	return `<div class="nfr-block"><div class="nfr-block-label">PROJECT-WIDE NFRs</div><div class="nfr-tags">${projectNfrs.map(n => `<span class="nfr-tag">${escapeXml(n.name)}</span>`).join('')}</div></div>`;
}

export interface DiagramFigure {
	svg: string;
	/** Caption text without the "Figure n:" prefix. */
	caption: string;
	/** Use cases drawn in the figure (own and related), to size it on the page. */
	useCaseCount: number;
}

export interface DocumentDiagrams {
	/** 'single': one diagram of the whole system; 'per-actor': one figure per actor (or part of one). */
	mode: 'single' | 'per-actor';
	figures: DiagramFigure[];
	/** The project-wide requirements, as a separate block to place under the figures ('' if none). */
	nfrTagsHtml: string;
}

/**
 * The use case diagram(s) for a document. Up to DOC_SINGLE_DIAGRAM_MAX use cases: one diagram of the whole
 * system. More than that, the single diagram would print too small to read, so each actor gets its own
 * figure: that actor, its use cases (numbered as in the whole spec) and the use cases of other actors it
 * is linked to by include/extend, drawn dashed so no link points at nothing. An actor with more than
 * DOC_SINGLE_DIAGRAM_MAX use cases is split into evenly sized parts.
 */
export function buildDocumentDiagrams(data: UseCaseDiagramData): DocumentDiagrams {
	const nfrTagsHtml = buildNfrTagsHtml(data);
	if (data.useCases.length <= DOC_SINGLE_DIAGRAM_MAX) {
		return { mode: 'single', nfrTagsHtml, figures: [{ svg: buildSvg(data).svg, caption: 'Use Case Diagram', useCaseCount: data.useCases.length }] };
	}

	const numbers: Record<string, number> = {};
	data.useCases.forEach((u, i) => { numbers[u.id] = i + 1; });
	const figures: DiagramFigure[] = [];

	for (const actor of data.actors) {
		const ownIds = new Set(data.associations.filter(a => a.actorId === actor.id).map(a => a.useCaseId));
		const own = data.useCases.filter(u => ownIds.has(u.id));
		if (own.length === 0) continue;

		const parts = Math.ceil(own.length / DOC_SINGLE_DIAGRAM_MAX);
		const size = Math.ceil(own.length / parts);
		for (let part = 0; part < parts; part++) {
			const chunk = own.slice(part * size, (part + 1) * size);
			const chunkIds = new Set(chunk.map(u => u.id));
			const relatedIds = new Set<string>();
			data.relations.forEach(r => {
				if (chunkIds.has(r.fromId) && !chunkIds.has(r.toId)) relatedIds.add(r.toId);
				if (chunkIds.has(r.toId) && !chunkIds.has(r.fromId)) relatedIds.add(r.fromId);
			});
			const related = data.useCases.filter(u => relatedIds.has(u.id));
			const shownIds = new Set([...chunkIds, ...relatedIds]);
			const sub: UseCaseDiagramData = {
				...data,
				actors: [actor],
				useCases: [...chunk, ...related],
				associations: data.associations.filter(a => a.actorId === actor.id && chunkIds.has(a.useCaseId)),
				relations: data.relations.filter(r => shownIds.has(r.fromId) && shownIds.has(r.toId) && (chunkIds.has(r.fromId) || chunkIds.has(r.toId))),
				nfrs: (data.nfrs || []).filter(n => n.useCaseId !== null && shownIds.has(n.useCaseId))
			};
			const name = actor.name.replace(/\n/g, ' ');
			figures.push({
				svg: buildSvg(sub, { numbers, relatedIds }).svg,
				caption: `Use cases for ${name}${parts > 1 ? ` (part ${part + 1} of ${parts})` : ''}${related.length > 0 ? ' (dashed: related use cases)' : ''}`,
				useCaseCount: chunk.length + related.length
			});
		}
	}
	return { mode: 'per-actor', nfrTagsHtml, figures };
}
