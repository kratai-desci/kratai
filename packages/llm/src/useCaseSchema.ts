export interface UseCaseActor {
	id: string;
	name: string;
	side: 'left' | 'right';
	// Short role label/description (e.g. "Registered User who can manage
	// their own listings"). Optional - real extraction doesn't produce this
	// yet, only the mock preview data does; the view hides the affordance
	// entirely when it's absent rather than showing an empty one.
	role?: string;
	description?: string;
}

export interface UseCaseItem {
	id: string;
	name: string;
	// Shown in the click-to-open detail popup (see useCaseDiagramView.ts) -
	// optional for the same reason as UseCaseActor.role/description above.
	description?: string;
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

/** A non-functional requirement, either scoped to one use case or, with
 * `useCaseId: null`, to the project as a whole. `name` is the short,
 * at-a-glance label shown on the pill/chip; `text` is the full detail
 * shown once clicked (see useCaseDiagramView.ts's detail popup). */
export interface UseCaseNFR {
	id: string;
	useCaseId: string | null;
	name: string;
	text: string;
}

export interface UseCaseDiagramData {
	workspaceName: string;
	systemName: string;
	// Short project-goal/context blurb - what the Spec (Requirements) doc's
	// "Overview" section shows. Not shown on the interactive diagram itself
	// (see narrative below for that view's own explanation) - optional for
	// the same reason as UseCaseActor.role/description above.
	overview?: string;
	actors: UseCaseActor[];
	useCases: UseCaseItem[];
	associations: UseCaseAssociation[];
	relations: UseCaseRelation[];
	// Role-by-role, plain-language explanation of who uses this system -
	// each actor's main goal/responsibility and what it can actually do in
	// the app - shown behind an "Overview" button on the Use Case Model
	// view (same click-to-open-popup pattern as DataModelData's narrative).
	// Distinct from `overview` above: this is about the actors/use cases in
	// THIS diagram, not what the project is for as a whole.
	narrative?: string;
	nfrs?: UseCaseNFR[];
	// Document metadata for the Requirements (SRS) view - user-entered, not
	// LLM output (a company/client name isn't inferable from code), so
	// these are edited in place on that view and saved back via
	// view.ts's /api/requirements/metadata route, not part of
	// UseCaseModelOutput below.
	preparedBy?: string;
	clientName?: string;
}

/** What the model is asked to produce - workspaceName/systemName are added
 * afterward from data we already trust, not requested from the model. */
export type UseCaseModelOutput = Pick<UseCaseDiagramData, 'actors' | 'useCases' | 'associations' | 'relations' | 'overview' | 'narrative' | 'nfrs'>;

/**
 * Model output is untrusted input - it can omit fields, invent ids that
 * don't exist elsewhere in its own response, or wrap the JSON in prose/code
 * fences despite instructions not to. This throws only when the response is
 * unusable (no actors/use cases at all); a dangling association/relation/nfr
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
	const nfrs = parseNfrs(obj.nfrs, useCaseIds);
	const overview = typeof obj.overview === 'string' && obj.overview.trim() ? obj.overview.trim() : undefined;
	const narrative = typeof obj.narrative === 'string' && obj.narrative.trim() ? obj.narrative.trim() : undefined;

	return {
		actors, useCases, associations, relations,
		...(overview ? { overview } : {}),
		...(narrative ? { narrative } : {}),
		...(nfrs.length > 0 ? { nfrs } : {})
	};
}

function parseActors(raw: unknown): UseCaseActor[] {
	if (!Array.isArray(raw)) return [];
	const seen = new Set<string>();
	const result: UseCaseActor[] = [];
	raw.forEach(entry => {
		if (typeof entry !== 'object' || entry === null) return;
		const e = entry as Record<string, unknown>;
		if (typeof e.id !== 'string' || !e.id || typeof e.name !== 'string' || !e.name) return;
		if (seen.has(e.id)) return;
		seen.add(e.id);
		// Defensive default rather than dropping the actor - side only
		// affects which rail it's drawn on, not whether the data is usable.
		const side = e.side === 'left' || e.side === 'right' ? e.side : (seen.size % 2 === 1 ? 'left' : 'right');
		const actor: UseCaseActor = { id: e.id, name: e.name, side };
		if (typeof e.role === 'string' && e.role) actor.role = e.role;
		if (typeof e.description === 'string' && e.description) actor.description = e.description;
		result.push(actor);
	});
	return result;
}

function parseUseCases(raw: unknown): UseCaseItem[] {
	if (!Array.isArray(raw)) return [];
	const seen = new Set<string>();
	const result: UseCaseItem[] = [];
	raw.forEach(entry => {
		if (typeof entry !== 'object' || entry === null) return;
		const e = entry as Record<string, unknown>;
		if (typeof e.id !== 'string' || !e.id || typeof e.name !== 'string' || !e.name) return;
		if (seen.has(e.id)) return;
		seen.add(e.id);
		const uc: UseCaseItem = { id: e.id, name: e.name };
		if (typeof e.description === 'string' && e.description) uc.description = e.description;
		result.push(uc);
	});
	return result;
}

function parseNfrs(raw: unknown, useCaseIds: Set<string>): UseCaseNFR[] {
	if (!Array.isArray(raw)) return [];
	const seen = new Set<string>();
	const result: UseCaseNFR[] = [];
	raw.forEach(entry => {
		if (typeof entry !== 'object' || entry === null) return;
		const e = entry as Record<string, unknown>;
		if (typeof e.id !== 'string' || !e.id || seen.has(e.id)) return;
		if (typeof e.name !== 'string' || !e.name) return;
		if (typeof e.text !== 'string' || !e.text) return;
		// Missing/omitted useCaseId is treated as project-wide (null) rather
		// than dropped - the model leaving it out entirely is far more
		// likely than it deliberately meaning "scope to nothing".
		let useCaseId: string | null;
		if (e.useCaseId === null || e.useCaseId === undefined) {
			useCaseId = null;
		} else if (typeof e.useCaseId === 'string' && useCaseIds.has(e.useCaseId)) {
			useCaseId = e.useCaseId;
		} else {
			return;
		}
		seen.add(e.id);
		result.push({ id: e.id, useCaseId, name: e.name, text: e.text });
	});
	return result;
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
