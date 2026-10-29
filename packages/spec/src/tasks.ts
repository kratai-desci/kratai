import type { UseCaseDiagramData, DataModelData, UseCaseItem, UseCaseNFR } from '@kratai-desci/llm';
import { visibleSpec } from './progressData.js';

/**
 * The web app's task board. A task is a piece of work, optionally linked to the one use case or
 * non-functional requirement it delivers; a linked item's Progress status is worked out from its
 * tasks (deriveStatuses), so the board is where progress is recorded.
 */
export type TaskStatus = 'todo' | 'doing' | 'done';
export const TASK_STATUSES: readonly TaskStatus[] = ['todo', 'doing', 'done'];

export interface TaskLink {
	type: 'uc' | 'nfr';
	id: string;
}

export interface Task {
	id: string;
	title: string;
	notes: string;
	status: TaskStatus;
	/** Position within its column, lowest first. */
	order: number;
	link: TaskLink | null;
	assigneeUid: string | null;
	createdByAi: boolean;
	/** Who moved it to Done (a display name), shown as "closed by" on the item it delivers. */
	doneBy: string | null;
	/** The brief for a coding agent, once written (see writeTaskPrompt in @kratai-desci/llm). */
	prompt: { text: string; at: string } | null;
	updatedAt: string | null;
}

export type NewTask = Omit<Task, 'id' | 'updatedAt'>;

export interface BoardMember {
	uid: string;
	name: string;
}

/** A use case or requirement a task can deliver, as the board offers it: "UC-3 Book a court". */
export interface LinkOption {
	type: 'uc' | 'nfr';
	id: string;
	label: string;
	name: string;
}

export function linkOptions(data: UseCaseDiagramData | undefined): LinkOption[] {
	if (!data) return [];
	const spec = visibleSpec(data);
	return [
		...spec.useCases.map((u, i) => ({ type: 'uc' as const, id: u.id, label: `UC-${i + 1}`, name: u.name.replace(/\n/g, ' ') })),
		...(spec.nfrs || []).map((n, i) => ({ type: 'nfr' as const, id: n.id, label: `NFR-${i + 1}`, name: n.name }))
	];
}

/**
 * The link for what the AI (or a person) names: an item id from the spec, or its shown label
 * (UC-3, NFR-2). Null when it names nothing that exists.
 */
export function resolveLink(data: UseCaseDiagramData | undefined, ref: unknown): TaskLink | null {
	if (typeof ref !== 'string' || !ref.trim()) return null;
	const wanted = ref.trim();
	const match = linkOptions(data).find(o => o.id === wanted || o.label.toLowerCase() === wanted.toLowerCase());
	return match ? { type: match.type, id: match.id } : null;
}

function sameLink(a: TaskLink | null, type: 'uc' | 'nfr', id: string): boolean {
	return !!a && a.type === type && a.id === id;
}

/**
 * Sets each use case's and requirement's status from its tasks, in place: Done when every task is
 * done (closed by whoever finished the last one), In progress once any has started or finished, Open
 * otherwise - including an item with no tasks. Answers whether anything changed, for the caller to save.
 */
export function deriveStatuses(data: UseCaseDiagramData, tasks: Task[]): boolean {
	let changed = false;
	const apply = (type: 'uc' | 'nfr', item: UseCaseItem | UseCaseNFR) => {
		const own = tasks.filter(t => sameLink(t.link, type, item.id));
		let status: 'open' | 'in-progress' | 'done' = 'open';
		let closedBy: string | undefined;
		if (own.length && own.every(t => t.status === 'done')) {
			status = 'done';
			const last = own.slice().sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0];
			closedBy = last.doneBy ?? undefined;
		} else if (own.some(t => t.status !== 'todo')) {
			status = 'in-progress';
		}
		const before = `${item.status ?? 'open'}|${item.closedBy ?? ''}`;
		if (status === 'open') delete item.status; else item.status = status;
		if (closedBy) item.closedBy = closedBy; else delete item.closedBy;
		if (`${item.status ?? 'open'}|${item.closedBy ?? ''}` !== before) changed = true;
	};
	data.useCases.forEach(u => apply('uc', u));
	(data.nfrs || []).forEach(n => apply('nfr', n));
	return changed;
}

/**
 * Tasks that carry over what Progress already recorded, made once when a project first gets its board:
 * one finished task for each item marked Done (keeping who closed it), one started task for each In
 * progress, so working the statuses out from tasks changes none of them.
 */
export function carriedOverTasks(data: UseCaseDiagramData | undefined): NewTask[] {
	if (!data) return [];
	const out: NewTask[] = [];
	const add = (type: 'uc' | 'nfr', item: UseCaseItem | UseCaseNFR) => {
		if (item.status !== 'done' && item.status !== 'in-progress') return;
		out.push({
			title: item.name.replace(/\n/g, ' '),
			notes: item.status === 'done' ? 'Marked done in Progress before the board existed.' : 'Marked in progress in Progress before the board existed.',
			status: item.status === 'done' ? 'done' : 'doing',
			order: out.length,
			link: { type, id: item.id },
			assigneeUid: null,
			createdByAi: false,
			doneBy: item.status === 'done' ? item.closedBy ?? null : null,
			prompt: null
		});
	};
	data.useCases.forEach(u => add('uc', u));
	(data.nfrs || []).forEach(n => add('nfr', n));
	return out;
}

const STATUS_LABEL: Record<TaskStatus, string> = { todo: 'To do', doing: 'Doing', done: 'Done' };

/** The board as the chat model sees it, so it plans around what is there instead of repeating it. */
export function boardSection(data: UseCaseDiagramData | undefined, tasks: Task[], members: BoardMember[]): string {
	const lines = ['', '## Board (tasks - you can add to it with add_tasks)'];
	if (tasks.length === 0) {
		lines.push('No tasks yet.');
		return lines.join('\n');
	}
	const options = linkOptions(data);
	TASK_STATUSES.forEach(status => {
		const column = tasks.filter(t => t.status === status).sort((a, b) => a.order - b.order);
		if (!column.length) return;
		lines.push('', `${STATUS_LABEL[status]}:`);
		column.forEach(t => {
			const link = t.link ? options.find(o => o.type === t.link!.type && o.id === t.link!.id) : undefined;
			const who = t.assigneeUid ? members.find(m => m.uid === t.assigneeUid)?.name : undefined;
			lines.push(`- "${t.title}"${link ? ` - delivers ${link.id} (${link.label})` : ''}${who ? ` - ${who}` : ''}`);
		});
	});
	return lines.join('\n');
}

/** What the spec says that bears on one task: the input for the coding agent's brief. */
export function taskContext(task: Task, data: UseCaseDiagramData | undefined, dataModel: DataModelData | undefined, tasks: Task[]): string {
	const lines: string[] = [];
	lines.push(`# Task: ${task.title}`);
	if (task.notes.trim()) lines.push(task.notes.trim());
	if (data) {
		const spec = visibleSpec(data);
		lines.push('', `# Project: ${spec.systemName || spec.workspaceName}`);
		if (spec.overview) lines.push(spec.overview);
		const option = task.link ? linkOptions(data).find(o => o.type === task.link!.type && o.id === task.link!.id) : undefined;
		if (task.link?.type === 'uc' && option) {
			const uc = spec.useCases.find(u => u.id === task.link!.id)!;
			const actors = spec.associations.filter(a => a.useCaseId === uc.id).map(a => spec.actors.find(x => x.id === a.actorId)?.name).filter(Boolean);
			lines.push('', `# Delivers use case ${option.label}: ${option.name}`);
			if (actors.length) lines.push(`Actors: ${actors.join(', ')}`);
			if (uc.description) lines.push(`Description: ${uc.description}`);
			if (uc.goal) lines.push(`Goal: ${uc.goal}`);
			if (uc.preconditions?.length) lines.push('Preconditions:', ...uc.preconditions.map(p => `- ${p}`));
			if (uc.mainFlow?.length) lines.push('Main flow:', ...uc.mainFlow.map((s, i) => `${i + 1}. ${s}`));
			if (uc.postconditions?.length) lines.push('Postconditions:', ...uc.postconditions.map(p => `- ${p}`));
			const related = spec.relations.filter(r => r.fromId === uc.id || r.toId === uc.id)
				.map(r => `${spec.useCases.find(u => u.id === r.fromId)?.name} <<${r.kind}>> ${spec.useCases.find(u => u.id === r.toId)?.name}`);
			if (related.length) lines.push('Related use cases:', ...related.map(r => `- ${r}`));
		} else if (task.link?.type === 'nfr' && option) {
			const nfr = (spec.nfrs || []).find(n => n.id === task.link!.id)!;
			lines.push('', `# Delivers requirement ${option.label}: ${nfr.name}`, nfr.text);
		}
		const nfrs = (spec.nfrs || []).filter(n =>
			n.useCaseId === null || (task.link?.type === 'uc' && n.useCaseId === task.link.id));
		if (nfrs.length) lines.push('', '# Non-functional requirements that apply', ...nfrs.map(n => `- ${n.name}: ${n.text}`));
	}
	if (dataModel && dataModel.entities.length) {
		lines.push('', '# Data model');
		dataModel.entities.forEach(e => lines.push(`- ${e.name}: ${e.attributes.map(a => `${a.name} (${a.type})`).join(', ') || 'no fields yet'}`));
	}
	const siblings = task.link ? tasks.filter(t => t.id !== task.id && sameLink(t.link, task.link!.type, task.link!.id)) : [];
	if (siblings.length) lines.push('', '# Other tasks for the same item', ...siblings.map(t => `- ${t.title} (${STATUS_LABEL[t.status]})`));
	return lines.join('\n');
}
