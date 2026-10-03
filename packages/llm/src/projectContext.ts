import type { UseCaseDiagramData, ContextSection } from './useCaseSchema.js';

export const CONTEXT_SECTIONS: readonly ContextSection[] = ['background', 'goal', 'outOfScope'];

export type ContextField = 'overview' | ContextSection;
export type ContextState = 'filled' | 'notRelevant' | 'unanswered';

export function contextState(data: UseCaseDiagramData, field: ContextField): ContextState {
	if (data[field]?.trim()) return 'filled';
	if (field !== 'overview' && data.contextNotRelevant?.includes(field)) return 'notRelevant';
	return 'unanswered';
}

/** Rows still waiting on the user, in interview order - "not relevant" is a
 * real answer, so it doesn't count as outstanding. */
export function unansweredSections(data: UseCaseDiagramData): ContextSection[] {
	return CONTEXT_SECTIONS.filter(section => contextState(data, section) === 'unanswered');
}

export interface ContextUpdate {
	/** Text per row. A non-empty string fills the row; an empty string clears it back to unanswered. */
	overview?: string;
	background?: string;
	goal?: string;
	outOfScope?: string;
	/** Rows the user said don't apply - clears any text and records the decision. */
	notRelevant?: ContextSection[];
	/** Undo a not-relevant mark, returning the row to unanswered. */
	relevant?: ContextSection[];
}

/** Returns a new object; never mutates `data`. Filling a row also lifts any
 * not-relevant mark on it, and marking a row not relevant drops its text, so a
 * row is only ever in one of the three states. */
export function applyContextUpdate(data: UseCaseDiagramData, update: ContextUpdate): UseCaseDiagramData {
	const next: UseCaseDiagramData = { ...data };
	const notRelevant = new Set(data.contextNotRelevant ?? []);

	for (const field of ['overview', ...CONTEXT_SECTIONS] as ContextField[]) {
		const value = update[field];
		if (typeof value !== 'string') continue;
		const trimmed = value.trim();
		if (trimmed) next[field] = trimmed;
		else delete next[field];
		if (field !== 'overview') notRelevant.delete(field);
	}
	// Filtered to real sections: this also runs on JSON posted by the spec
	// page, where an unexpected name (say "overview") must not be able to
	// wipe a row that was never meant to be skippable.
	const valid = (sections: readonly ContextSection[] | undefined): ContextSection[] =>
		(Array.isArray(sections) ? (sections as ContextSection[]) : []).filter(section => CONTEXT_SECTIONS.includes(section));
	for (const section of valid(update.notRelevant)) {
		delete next[section];
		notRelevant.add(section);
	}
	for (const section of valid(update.relevant)) notRelevant.delete(section);

	const ordered = CONTEXT_SECTIONS.filter(section => notRelevant.has(section));
	if (ordered.length > 0) next.contextNotRelevant = [...ordered];
	else delete next.contextNotRelevant;
	return next;
}
