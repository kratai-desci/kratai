import { DiagramData } from '@kratai/analysis';

export interface ScorecardItem {
	name: string;
	filePath: string;
	changeStatus: string;
	commentary: string;
	flag: 'ok' | 'warning';
}

export interface ScorecardData {
	workspaceName: string;
	items: ScorecardItem[];
	overallScore: number;
	summary: string;
}

// Hand-written, cycled deterministically per item rather than pulled from a
// real model - see the file-level comment on buildDiffScorecard for why.
const OK_LINES = [
	'Consistent with the existing Use Case Model - no drift detected.',
	'Matches the Data Model shape for this entity; no review needed.',
	'Internal change only - doesn\'t touch any documented use case or actor.'
];
const WARNING_LINES = [
	'New public surface here isn\'t reflected in any use case yet - consider updating the spec.',
	'Shape changed in a way that may affect the Data Model - worth a data-model review.',
	'Touches an entry point with no associated NFR - flag for a requirements pass.'
];

function hashIndex(name: string, mod: number): number {
	let h = 0;
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
	return h % mod;
}

/**
 * "AI git-diff scorecard" mockup - reuses the real changed-class list
 * (diagramData.classes' changeStatus, already populated by
 * GitDiffEnricher and already driving Knowledge Graph's added/modified/
 * deleted coloring - see knowledgeGraphView.ts) so the list itself is
 * real, but the per-item commentary and overall score are hand-written/
 * deterministic, not a real model call - this only exists to put the
 * target UI in front of the user before that extraction work is scoped
 * (see chatTools.ts's whatChanged for the same underlying data used a
 * different way).
 */
export function buildDiffScorecard(diagramData: DiagramData, workspaceName: string): ScorecardData {
	const changed = diagramData.classes.filter(c => c.changeStatus && c.changeStatus !== 'unchanged');
	const items: ScorecardItem[] = changed.map(c => {
		const isWarning = hashIndex(c.name, 3) === 0;
		const lines = isWarning ? WARNING_LINES : OK_LINES;
		return {
			name: c.name,
			filePath: c.filePath,
			changeStatus: c.changeStatus as string,
			commentary: lines[hashIndex(c.filePath, lines.length)],
			flag: isWarning ? 'warning' : 'ok'
		};
	});

	const warnings = items.filter(i => i.flag === 'warning').length;
	const overallScore = items.length === 0 ? 100 : Math.max(35, 100 - warnings * 15 - Math.max(0, items.length - warnings - 5) * 2);
	const summary = items.length === 0
		? 'No changes against the base commit - nothing to review.'
		: `${items.length} changed file${items.length === 1 ? '' : 's'}, ${warnings} flagged for a spec review.`;

	return { workspaceName, items, overallScore, summary };
}
