import type { UseCaseDiagramData, UseCaseItem, UseCaseNFR, ProgressStatus, ProgressPriority } from '@kratai-desci/llm';

/**
 * The rules behind the Progress view, kept in one place so the chat tools,
 * the HTTP routes and the views all agree. Status/priority/closedBy are set
 * by people only: model output never carries them (the llm package's
 * validators drop them), and an AI edit that replaces a list gets them put
 * back from the existing item by id (reconcileAiEdit).
 */

type Item = UseCaseItem | UseCaseNFR;
export type ItemType = 'uc' | 'nfr';

const STATUSES: readonly ProgressStatus[] = ['open', 'in-progress', 'done'];
const PRIORITIES: readonly ProgressPriority[] = ['low', 'medium', 'high'];
const PROGRESS_KEYS = ['status', 'priority', 'closedBy', 'editedByAi', 'removedByAi'] as const;

/** "Has progress" = someone has started or finished it. Open items with only a
 * priority are not protected: editing or removing them is ordinary. */
export function hasProgress(item: { status?: ProgressStatus }): boolean {
	return item.status === 'in-progress' || item.status === 'done';
}

function pickProgress(item: Item): Partial<Item> {
	const out: Record<string, unknown> = {};
	for (const key of PROGRESS_KEYS) {
		const value = (item as unknown as Record<string, unknown>)[key];
		if (value !== undefined) out[key] = value;
	}
	return out as Partial<Item>;
}

function contentOf(kind: ItemType, item: Item): string {
	const keys = kind === 'uc'
		? ['name', 'description', 'goal', 'preconditions', 'mainFlow', 'postconditions']
		: ['name', 'text', 'useCaseId'];
	return JSON.stringify(keys.map(k => (item as unknown as Record<string, unknown>)[k] ?? null));
}

/** What every view except Progress works from: items the AI removed (and are
 * waiting on the user's decision) are hidden, along with anything that hangs
 * off a hidden use case. */
export function visibleSpec(data: UseCaseDiagramData): UseCaseDiagramData {
	const hiddenUc = new Set(data.useCases.filter(u => u.removedByAi).map(u => u.id));
	const anyHiddenNfr = (data.nfrs || []).some(n => n.removedByAi);
	if (hiddenUc.size === 0 && !anyHiddenNfr) return data;
	return {
		...data,
		useCases: data.useCases.filter(u => !u.removedByAi),
		associations: data.associations.filter(a => !hiddenUc.has(a.useCaseId)),
		relations: data.relations.filter(r => !hiddenUc.has(r.fromId) && !hiddenUc.has(r.toId)),
		...(data.nfrs ? { nfrs: data.nfrs.filter(n => !n.removedByAi && !(n.useCaseId && hiddenUc.has(n.useCaseId))) } : {})
	};
}

export interface ReconcileInput {
	actors: UseCaseDiagramData['actors'];
	useCases: UseCaseItem[];
	associations: UseCaseDiagramData['associations'];
	relations: UseCaseDiagramData['relations'];
	nfrs: UseCaseNFR[];
}

export interface ReconcileResult extends ReconcileInput {
	/** Plain-language lines for the model, so it can tell the user what happened. */
	notes: string[];
}

function statusWord(item: Item): string {
	return item.status === 'done' ? 'Done' : 'In progress';
}

function reconcileList<T extends Item>(kind: ItemType, oldList: T[], newList: T[], notes: string[], forceKeepOldIds: Set<string>): T[] {
	const oldById = new Map(oldList.map(i => [i.id, i]));
	const newIds = new Set(newList.map(i => i.id));
	const result: T[] = newList.map(n => {
		const o = oldById.get(n.id);
		if (!o) return n;
		const merged = { ...n, ...pickProgress(o) } as T;
		// Already waiting on the user's decision, or already flagged: keep it as is.
		if (o.removedByAi || o.editedByAi) return merged;
		if (hasProgress(o) && contentOf(kind, o) !== contentOf(kind, n)) {
			merged.editedByAi = true;
			notes.push(`"${n.name}" (${statusWord(o)}) was edited, so it is flagged "edited by AI" for the user to review on the Progress page.`);
		}
		return merged;
	});
	// Items the model left out: keep any that have progress (or hang off a kept use case) as
	// "removed by AI", in their old position, instead of deleting them.
	const kept: { index: number; item: T }[] = [];
	oldList.forEach((o, index) => {
		if (newIds.has(o.id)) return;
		if (o.removedByAi || forceKeepOldIds.has(o.id)) { kept.push({ index, item: { ...o, removedByAi: true } }); return; }
		if (hasProgress(o)) {
			kept.push({ index, item: { ...o, removedByAi: true } });
			notes.push(`"${o.name}" has progress (${statusWord(o)}), so it was NOT deleted: it is marked "removed by AI" and waits for the user to restore it or delete it for good on the Progress page.`);
		}
	});
	kept.forEach(({ index, item }) => result.splice(Math.min(index, result.length), 0, item));
	return result;
}

/**
 * Applies the model's replacement lists to the existing spec without letting
 * it touch progress: statuses/priorities carry over by id, an edit to an item
 * that has progress flags it, and removing one that has progress marks it
 * removed-by-AI instead of deleting it.
 */
export function reconcileAiEdit(old: UseCaseDiagramData, next: ReconcileInput): ReconcileResult {
	const notes: string[] = [];
	const useCases = reconcileList('uc', old.useCases, next.useCases, notes, new Set());
	const hiddenUcIds = new Set(useCases.filter(u => u.removedByAi).map(u => u.id));
	// A requirement scoped to a use case that is waiting for removal goes with it, so restoring
	// the use case restores them too.
	const followUc = new Set((old.nfrs || []).filter(n => n.useCaseId && hiddenUcIds.has(n.useCaseId)).map(n => n.id));
	const nfrs = reconcileList('nfr', old.nfrs || [], next.nfrs, notes, followUc);

	// Keep the hidden use cases wired to their actors and each other so a restore is complete.
	const actorIds = new Set(next.actors.map(a => a.id));
	const allUcIds = new Set(useCases.map(u => u.id));
	const associations = [...next.associations];
	old.associations.forEach(a => {
		if (hiddenUcIds.has(a.useCaseId) && actorIds.has(a.actorId) && !associations.some(x => x.actorId === a.actorId && x.useCaseId === a.useCaseId)) associations.push(a);
	});
	const relations = [...next.relations];
	old.relations.forEach(r => {
		if ((hiddenUcIds.has(r.fromId) || hiddenUcIds.has(r.toId)) && allUcIds.has(r.fromId) && allUcIds.has(r.toId)
			&& !relations.some(x => x.kind === r.kind && x.fromId === r.fromId && x.toId === r.toId)) relations.push(r);
	});
	return { actors: next.actors, useCases, associations, relations, nfrs, notes };
}

// ---------------------------------------------------------------------------
// The Progress view's data
// ---------------------------------------------------------------------------

export interface ProgressRow {
	type: ItemType;
	id: string;
	/** The number shown (UC-n / NFR-n), the same one the Spec uses; null while removed by the AI. */
	n: number | null;
	name: string;
	/** For a requirement: the use case it belongs to (by id), or null when project-wide. */
	ucId: string | null;
	status: ProgressStatus;
	priority: ProgressPriority | '';
	closedBy: string;
	editedByAi: boolean;
	removedByAi: boolean;
}

export function buildProgressRows(data: UseCaseDiagramData): ProgressRow[] {
	const visible = visibleSpec(data);
	const ucNumber = new Map(visible.useCases.map((u, i) => [u.id, i + 1]));
	const nfrNumber = new Map((visible.nfrs || []).map((n, i) => [n.id, i + 1]));
	const rows: ProgressRow[] = [];
	data.useCases.forEach(u => rows.push({
		type: 'uc', id: u.id, n: ucNumber.get(u.id) ?? null, name: u.name.replace(/\n/g, ' '), ucId: null,
		status: u.status ?? 'open', priority: u.priority ?? '', closedBy: u.closedBy ?? '', editedByAi: !!u.editedByAi, removedByAi: !!u.removedByAi
	}));
	(data.nfrs || []).forEach(n => rows.push({
		type: 'nfr', id: n.id, n: nfrNumber.get(n.id) ?? null, name: n.name, ucId: n.useCaseId,
		status: n.status ?? 'open', priority: n.priority ?? '', closedBy: n.closedBy ?? '', editedByAi: !!n.editedByAi, removedByAi: !!n.removedByAi
	}));
	return rows;
}

// ---------------------------------------------------------------------------
// What people can do on the Progress page
// ---------------------------------------------------------------------------

export type ProgressAction =
	| { action: 'update'; type: ItemType; id: string; status?: string; priority?: string }
	| { action: 'acknowledge' | 'restore' | 'purge'; type: ItemType; id: string };

function findItem(data: UseCaseDiagramData, type: ItemType, id: string): Item | undefined {
	return type === 'uc' ? data.useCases.find(u => u.id === id) : (data.nfrs || []).find(n => n.id === id);
}

/** Mutates `data` in place; the caller saves it. `userName` is recorded as the closer when an item becomes Done. */
export function applyProgressAction(data: UseCaseDiagramData, input: ProgressAction, userName: string): { ok: true } | { ok: false; error: string } {
	if (input.type !== 'uc' && input.type !== 'nfr') return { ok: false, error: 'Unknown item type.' };
	const item = findItem(data, input.type, input.id);
	if (!item) return { ok: false, error: 'That item no longer exists.' };

	if (input.action === 'update') {
		if (item.removedByAi) return { ok: false, error: 'Restore this item before changing it.' };
		if (input.status !== undefined) {
			if (!STATUSES.includes(input.status as ProgressStatus)) return { ok: false, error: 'Unknown status.' };
			const status = input.status as ProgressStatus;
			if (status === 'open') delete item.status; else item.status = status;
			if (status === 'done') item.closedBy = userName; else delete item.closedBy;
		}
		if (input.priority !== undefined) {
			if (input.priority === '') delete item.priority;
			else if (PRIORITIES.includes(input.priority as ProgressPriority)) item.priority = input.priority as ProgressPriority;
			else return { ok: false, error: 'Unknown priority.' };
		}
		return { ok: true };
	}
	if (input.action === 'acknowledge') { delete item.editedByAi; return { ok: true }; }
	if (input.action === 'restore') {
		if (!item.removedByAi) return { ok: true };
		delete item.removedByAi;
		// A restored use case brings back the requirements that went with it.
		if (input.type === 'uc') (data.nfrs || []).forEach(n => { if (n.useCaseId === item.id) delete n.removedByAi; });
		return { ok: true };
	}
	// purge: only ever for something the AI removed - a deliberate human "delete for good".
	if (!item.removedByAi) return { ok: false, error: 'Only items the AI removed can be deleted here.' };
	if (input.type === 'uc') {
		data.useCases = data.useCases.filter(u => u.id !== item.id);
		data.associations = data.associations.filter(a => a.useCaseId !== item.id);
		data.relations = data.relations.filter(r => r.fromId !== item.id && r.toId !== item.id);
		// Requirements that belonged to it: the ones also waiting for removal go; the rest become project-wide.
		data.nfrs = (data.nfrs || []).filter(n => !(n.useCaseId === item.id && n.removedByAi)).map(n => n.useCaseId === item.id ? { ...n, useCaseId: null } : n);
	} else {
		data.nfrs = (data.nfrs || []).filter(n => n.id !== item.id);
	}
	return { ok: true };
}

/** A username for "closed by": the part of the account email before the @. */
export function userNameFromEmail(email: string | null | undefined): string {
	const name = (email || '').split('@')[0].trim();
	return name || 'someone';
}
