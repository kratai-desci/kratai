import { DiagramData, ClassInfo } from '@kratai/analysis';
import { UseCaseDiagramData } from './useCaseDiagramData.js';
import { DataModelData } from './dataModelData.js';

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

const ENTRY_POINT_TYPES = new Set<ClassInfo['classType']>([
	'route', 'page', 'layout', 'controller', 'rest-controller', 'server-action', 'middleware'
]);

// A changed class with at least this many relationships is treated as
// "core structure" rather than an isolated leaf - arbitrary but consistent
// with the relationship-count signal abstractViewData.ts used to use for
// the same "how central is this" judgment.
const HIGH_BLAST_RADIUS = 9;

function countRelationships(className: string, diagramData: DiagramData): number {
	return diagramData.relationships.filter(r => r.from === className || r.to === className).length;
}

function checkBlastRadius(c: ClassInfo, diagramData: DiagramData): string | undefined {
	const count = countRelationships(c.name, diagramData);
	if (count < HIGH_BLAST_RADIUS) return undefined;
	return `Highly connected (${count} relationships) - review carefully, other code likely depends on this.`;
}

// Honest by construction: there's no structural link from a class to a
// specific use case in the current data model, so this can't claim "this
// violates NFR X" without fabricating that link. What it CAN say for real:
// an entry point changed, and here's what NFRs exist for this project -
// worth a human checking them, not a specific verdict.
function checkEntryPointNfrs(c: ClassInfo, useCaseData: UseCaseDiagramData | undefined): string | undefined {
	if (!c.classType || !ENTRY_POINT_TYPES.has(c.classType)) return undefined;
	const nfrs = useCaseData?.nfrs || [];
	if (nfrs.length === 0) return undefined;
	const names = nfrs.slice(0, 3).map(n => n.name).join(', ');
	return `Touches an entry point - check it still satisfies the project's NFRs (${names}${nfrs.length > 3 ? ', ...' : ''}).`;
}

// A Data Model entity's "name" is an LLM-written display name (e.g.
// "Class Info" for a class actually called ClassInfo), not necessarily the
// exact source identifier - normalizing both sides to bare lowercase
// alphanumerics before comparing catches that common "added spaces to a
// PascalCase name" pattern without needing an exact match.
function normalizeForMatch(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Purely structural - diffs the class's current parsed properties against
// what the cached Data Model recorded for the matching entity, no judgment
// call involved. Only fires for a class that's actually tracked as an
// entity, so a change to an unrelated class never gets flagged for this.
function checkDataModelDrift(c: ClassInfo, dataModelData: DataModelData | undefined): string | undefined {
	if (!dataModelData) return undefined;
	const target = normalizeForMatch(c.name);
	const entity = dataModelData.entities.find(e => normalizeForMatch(e.name) === target);
	if (!entity) return undefined;

	const currentProps = new Set(c.properties.map(p => p.name));
	const recordedProps = new Set(entity.attributes.map(a => a.name));
	const added = [...currentProps].filter(p => !recordedProps.has(p));
	const removed = [...recordedProps].filter(p => !currentProps.has(p));
	if (added.length === 0 && removed.length === 0) return undefined;

	const parts: string[] = [];
	if (added.length > 0) parts.push(`new field(s) ${added.join(', ')}`);
	if (removed.length > 0) parts.push(`missing field(s) ${removed.join(', ')}`);
	return `Data Model is out of date for this entity (${parts.join('; ')}) - regenerate the Data Model.`;
}

/**
 * Real git-diff scorecard - reuses the changed-class list (changeStatus,
 * from GitDiffEnricher, the same data already driving Knowledge Graph's
 * added/modified/deleted coloring) and cross-references it against the
 * app's already-extracted Use Case Model / Data Model. Entirely
 * deterministic - no LLM call, so no cost, no sign-in requirement, and no
 * hallucination risk - every finding below is a direct read of data this
 * app already parsed or extracted, not a model's judgment call.
 */
export function buildDiffScorecard(
	diagramData: DiagramData,
	workspaceName: string,
	useCaseData: UseCaseDiagramData | undefined,
	dataModelData: DataModelData | undefined
): ScorecardData {
	const changed = diagramData.classes.filter(c => c.changeStatus && c.changeStatus !== 'unchanged');
	const items: ScorecardItem[] = changed.map(c => {
		const findings = [
			checkDataModelDrift(c, dataModelData),
			checkEntryPointNfrs(c, useCaseData),
			checkBlastRadius(c, diagramData)
		].filter((f): f is string => !!f);

		return {
			name: c.name,
			filePath: c.filePath,
			changeStatus: c.changeStatus as string,
			commentary: findings.length > 0 ? findings.join(' ') : 'No concerns detected against the current Spec.',
			flag: findings.length > 0 ? 'warning' : 'ok'
		};
	});

	const warnings = items.filter(i => i.flag === 'warning').length;
	const overallScore = items.length === 0 ? 100 : Math.max(35, 100 - warnings * 15 - Math.max(0, items.length - warnings - 5) * 2);
	const summary = items.length === 0
		? 'No changes against the base commit - nothing to review.'
		: `${items.length} changed file${items.length === 1 ? '' : 's'}, ${warnings} flagged for review.`;

	return { workspaceName, items, overallScore, summary };
}
