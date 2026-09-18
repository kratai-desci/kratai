export interface UseCaseActor {
	id: string;
	name: string;
	side: 'left' | 'right';
}

export interface UseCaseItem {
	id: string;
	name: string;
}

export interface UseCaseAssociation {
	actorId: string;
	useCaseId: string;
}

export interface UseCaseRelation {
	kind: 'include' | 'extend';
	fromId: string;
	toId: string;
}

export interface UseCaseDiagramData {
	workspaceName: string;
	systemName: string;
	actors: UseCaseActor[];
	useCases: UseCaseItem[];
	associations: UseCaseAssociation[];
	relations: UseCaseRelation[];
}

/** What the model is asked to produce - workspaceName/systemName are added
 * afterward from data we already trust, not requested from the model. */
export type UseCaseModelOutput = Pick<UseCaseDiagramData, 'actors' | 'useCases' | 'associations' | 'relations'>;

/**
 * Model output is untrusted input - it can omit fields, invent ids that
 * don't exist elsewhere in its own response, or wrap the JSON in prose/code
 * fences despite instructions not to. This throws only when the response is
 * unusable (no actors/use cases at all); a dangling association/relation
 * referencing an unknown id is dropped rather than failing the whole
 * generation, since the rest of the diagram is still useful.
 */
export function validateUseCaseModelOutput(raw: unknown): UseCaseModelOutput {
	if (typeof raw !== 'object' || raw === null) {
		throw new Error('Model response was not a JSON object.');
	}
	const obj = raw as Record<string, unknown>;

	const actors = parseActors(obj.actors);
	const useCases = parseUseCases(obj.useCases);
	if (actors.length === 0) throw new Error('Model response had no actors.');
	if (useCases.length === 0) throw new Error('Model response had no use cases.');

	const actorIds = new Set(actors.map(a => a.id));
	const useCaseIds = new Set(useCases.map(u => u.id));

	const associations = parseAssociations(obj.associations, actorIds, useCaseIds);
	const relations = parseRelations(obj.relations, useCaseIds);

	return { actors, useCases, associations, relations };
}

function parseActors(raw: unknown): UseCaseActor[] {
	if (!Array.isArray(raw)) return [];
	const seen = new Set<string>();
	return raw.filter((entry): entry is UseCaseActor => {
		if (typeof entry !== 'object' || entry === null) return false;
		const e = entry as Record<string, unknown>;
		if (typeof e.id !== 'string' || !e.id || typeof e.name !== 'string' || !e.name) return false;
		if (seen.has(e.id)) return false;
		seen.add(e.id);
		// Defensive default rather than dropping the actor - side only
		// affects which rail it's drawn on, not whether the data is usable.
		if (e.side !== 'left' && e.side !== 'right') e.side = seen.size % 2 === 1 ? 'left' : 'right';
		return true;
	});
}

function parseUseCases(raw: unknown): UseCaseItem[] {
	if (!Array.isArray(raw)) return [];
	const seen = new Set<string>();
	return raw.filter((entry): entry is UseCaseItem => {
		if (typeof entry !== 'object' || entry === null) return false;
		const e = entry as Record<string, unknown>;
		if (typeof e.id !== 'string' || !e.id || typeof e.name !== 'string' || !e.name) return false;
		if (seen.has(e.id)) return false;
		seen.add(e.id);
		return true;
	});
}

function parseAssociations(raw: unknown, actorIds: Set<string>, useCaseIds: Set<string>): UseCaseAssociation[] {
	if (!Array.isArray(raw)) return [];
	return raw.filter((entry): entry is UseCaseAssociation => {
		if (typeof entry !== 'object' || entry === null) return false;
		const e = entry as Record<string, unknown>;
		return typeof e.actorId === 'string' && actorIds.has(e.actorId)
			&& typeof e.useCaseId === 'string' && useCaseIds.has(e.useCaseId);
	});
}

function parseRelations(raw: unknown, useCaseIds: Set<string>): UseCaseRelation[] {
	if (!Array.isArray(raw)) return [];
	return raw.filter((entry): entry is UseCaseRelation => {
		if (typeof entry !== 'object' || entry === null) return false;
		const e = entry as Record<string, unknown>;
		return (e.kind === 'include' || e.kind === 'extend')
			&& typeof e.fromId === 'string' && useCaseIds.has(e.fromId)
			&& typeof e.toId === 'string' && useCaseIds.has(e.toId);
	});
}
