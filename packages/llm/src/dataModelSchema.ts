export interface DataAttribute {
	name: string;
	type: string;
	isPK?: boolean;
	isFK?: boolean;
}

export interface DataEntity {
	id: string;
	name: string;
	attributes: DataAttribute[];
}

export interface DataRelationship {
	fromId: string;
	toId: string;
	kind: 'one-to-one' | 'one-to-many' | 'many-to-many';
	label?: string;
}

export interface DataModelData {
	workspaceName: string;
	entities: DataEntity[];
	relationships: DataRelationship[];
	// One-paragraph, plain-language description of how the entities relate
	// to each other - shown behind a "Relationships" button on the Data
	// Model view (mirrors the Use Case Model's "Project Overview" button),
	// for readers who don't think in ER-diagram notation. Absent when there
	// are no relationships to narrate.
	narrative?: string;
}

/** What the model is asked to produce - workspaceName is added afterward
 * from data we already trust, same treatment as useCaseSchema.ts. */
export type DataModelOutput = Pick<DataModelData, 'entities' | 'relationships' | 'narrative'>;

/**
 * Model output is untrusted input - same defensive-parsing posture as
 * validateUseCaseModelOutput (drop malformed entries and dangling
 * relationship references rather than failing the whole generation).
 * Deliberately does NOT throw on zero entities, unlike the use case
 * model's zero-actors/zero-use-cases check - an empty data model is a
 * legitimate, honest answer for a codebase with no real data-model layer
 * (the prompt in dataModelExtraction.ts explicitly asks for this rather
 * than a fabricated one), not a failed generation.
 */
export function validateDataModelOutput(raw: unknown): DataModelOutput {
	if (typeof raw !== 'object' || raw === null) {
		throw new Error('Model response was not a JSON object.');
	}
	const obj = raw as Record<string, unknown>;

	const entities = parseEntities(obj.entities);
	const entityIds = new Set(entities.map(e => e.id));
	const relationships = parseRelationships(obj.relationships, entityIds);
	const narrative = relationships.length > 0 ? parseNarrative(obj.narrative) : undefined;

	return { entities, relationships, ...(narrative ? { narrative } : {}) };
}

// Capped well above what a one-paragraph description should ever need -
// just a guard against a model ignoring the "one paragraph" instruction and
// producing something the popup UI isn't sized for.
const MAX_NARRATIVE_LENGTH = 1000;

function parseNarrative(raw: unknown): string | undefined {
	if (typeof raw !== 'string') return undefined;
	const trimmed = raw.trim();
	if (!trimmed) return undefined;
	return trimmed.length > MAX_NARRATIVE_LENGTH ? trimmed.slice(0, MAX_NARRATIVE_LENGTH) : trimmed;
}

function parseEntities(raw: unknown): DataEntity[] {
	if (!Array.isArray(raw)) return [];
	const seen = new Set<string>();
	const result: DataEntity[] = [];
	raw.forEach(entry => {
		if (typeof entry !== 'object' || entry === null) return;
		const e = entry as Record<string, unknown>;
		if (typeof e.id !== 'string' || !e.id || typeof e.name !== 'string' || !e.name) return;
		if (seen.has(e.id)) return;
		seen.add(e.id);
		result.push({ id: e.id, name: e.name, attributes: parseAttributes(e.attributes) });
	});
	return result;
}

function parseAttributes(raw: unknown): DataAttribute[] {
	if (!Array.isArray(raw)) return [];
	const result: DataAttribute[] = [];
	raw.forEach(entry => {
		if (typeof entry !== 'object' || entry === null) return;
		const a = entry as Record<string, unknown>;
		if (typeof a.name !== 'string' || !a.name || typeof a.type !== 'string' || !a.type) return;
		const attr: DataAttribute = { name: a.name, type: a.type };
		if (a.isPK === true) attr.isPK = true;
		if (a.isFK === true) attr.isFK = true;
		result.push(attr);
	});
	return result;
}

function parseRelationships(raw: unknown, entityIds: Set<string>): DataRelationship[] {
	if (!Array.isArray(raw)) return [];
	const result: DataRelationship[] = [];
	raw.forEach(entry => {
		if (typeof entry !== 'object' || entry === null) return;
		const r = entry as Record<string, unknown>;
		if (typeof r.fromId !== 'string' || !entityIds.has(r.fromId)) return;
		if (typeof r.toId !== 'string' || !entityIds.has(r.toId)) return;
		if (r.kind !== 'one-to-one' && r.kind !== 'one-to-many' && r.kind !== 'many-to-many') return;
		const rel: DataRelationship = { fromId: r.fromId, toId: r.toId, kind: r.kind };
		if (typeof r.label === 'string' && r.label) rel.label = r.label;
		result.push(rel);
	});
	return result;
}
