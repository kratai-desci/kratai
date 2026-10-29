import {
	UI_ACTION_TOOL_NAMES, SPEC_TOOL_NAMES, NEW_PROJECT_STEPS, MAX_DOCUMENT_CHARS,
	parseWizardChoices, buildProjectSpec, describeWizardOutcome
} from '@kratai-desci/llm';
import type { ConversationMessage, ChatStepResult, NewProjectStep, SpecDetails, UseCaseDiagramData, DataModelData } from '@kratai-desci/llm';
import { generateShellHTML, type WebShellOptions, type ViewCounts } from './viewShell.js';
import { generateUseCaseDiagramHTML, generateUseCaseDiagramEmptyHTML } from './useCaseDiagramView.js';
import { generateDataModelHTML, generateDataModelEmptyHTML } from './dataModelView.js';
import { generateProgressHTML } from './progressView.js';
import { generateProgressReportHTML } from './progressReportView.js';
import { generateSrsDocHTML, generateSrsEmptyHTML } from './srsDocView.js';
import { generateNewProjectHTML } from './newProjectView.js';
import { visibleSpec, buildProgressRows, applyProgressAction, userNameFromEmail, type ProgressAction } from './progressData.js';
import { executeSpecTool } from './chatSpecTools.js';
import { specSection } from './specSummary.js';
import { extractDocument, DocumentError } from './documentText.js';
import { describeToolCall, editsSpec, ChatStoppedError, type ChatEvent, type UiAction } from './chatActivity.js';
import { generateBoardHTML } from './boardView.js';
import {
	TASK_STATUSES, linkOptions, resolveLink, deriveStatuses, carriedOverTasks, boardSection, taskContext,
	type Task, type NewTask, type TaskStatus, type TaskLink, type BoardMember
} from './tasks.js';

/**
 * One project's Spec served over plain web Request/Response - the web app's counterpart of
 * @kratai/cli's view server (view.ts), with the same pages and the same /api routes the views
 * already call, minus everything that needs code. Where the desktop app keeps a project in files
 * and runs AI through kratai.com, the caller here supplies both (SpecAppDeps): kratai-web keeps
 * the project in its database and calls the AI directly. Paths are relative to the project's own
 * address, which must end in "/" so the views' relative links resolve inside it.
 */

export interface SpecProject {
	/** The project's name: the spec's title until the spec has one of its own. */
	name: string;
	useCaseData?: UseCaseDiagramData;
	dataModelData?: DataModelData;
	/** This user's conversation about the project (display turns only). */
	chatHistory: ConversationMessage[];
	/** Set once "Skip for now" was pressed in the wizard: the project then opens on its empty Spec. */
	wizardSkipped?: boolean;
}

export interface SpecAppDeps {
	project: SpecProject;
	email: string | null;
	saveUseCaseData(data: UseCaseDiagramData): Promise<void>;
	saveDataModelData(data: DataModelData): Promise<void>;
	saveChatHistory(history: ConversationMessage[]): Promise<void>;
	saveWizardSkipped(): Promise<void>;
	getLayout(): Promise<Record<string, unknown>>;
	saveLayout(layout: Record<string, unknown>): Promise<void>;
	getBalance(): Promise<{ balanceCents: number; totalCents: number } | null>;
	/** One model turn of the chat, billed to the user (see view.ts's runChatLoop for the loop around it). */
	chatStep(messages: ConversationMessage[], projectName: string, summary: string, signal?: AbortSignal): Promise<ChatStepResult>;
	/** One AI step of the new-project wizard, billed to the user. */
	newProjectStep(step: NewProjectStep, input: unknown): Promise<unknown>;
	/** Reads a scanned document (a picture, or a PDF of page pictures) into text, billed to the user. */
	readDocument(file: { name: string; mimeType: string; data: string }): Promise<string>;
	links: Omit<WebShellOptions, 'counts'>;
	/** The app icon as a data URI, for the wizard's header. */
	logoDataUrl?: string;
	/** The task board, where the caller keeps one (the web app). Without it there is no Board view. */
	board?: BoardDeps;
}

export interface BoardDeps {
	listTasks(): Promise<Task[]>;
	/** Adds tasks; answers their ids, in order. */
	createTasks(tasks: NewTask[]): Promise<string[]>;
	updateTask(id: string, patch: Partial<NewTask>): Promise<void>;
	deleteTask(id: string): Promise<void>;
	/** Who can be assigned a task: the owner and the members (not viewers). */
	members: BoardMember[];
	/** The person making the request: their uid, and the name recorded when they finish a task. */
	me: { uid: string; name: string };
	readOnly: boolean;
	/** Whether the statuses Progress recorded before the board were carried over into tasks yet (once per project). */
	carriedOver: boolean;
	markCarriedOver(): Promise<void>;
	/** Writes the coding agent's brief from a task's context (taskContext), billed to the person asking. */
	writePrompt(context: string): Promise<string>;
}

export interface SpecRequest {
	method: string;
	/** The path below the project's address, without a leading "/" ('' for the project itself). */
	path: string;
	search: URLSearchParams;
	json(): Promise<unknown>;
	signal?: AbortSignal;
}

// Same cap as the desktop app's chat history file (chatHistoryData.ts): the history is resent with
// every chat turn, so an endless one would make every later turn more expensive.
const MAX_CHAT_ENTRIES = 40;
const MAX_TOOL_ITERATIONS = 20;
const NO_CODE_TOOL_OUTPUT = 'This project has no code - there is nothing to search or read. Work from the Spec and what the user tells you.';

function json(status: number, payload: unknown): Response {
	return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
}

function html(body: string): Response {
	return new Response(body, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

function redirect(location: string): Response {
	return new Response(null, { status: 302, headers: { Location: location } });
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/** What the chat model is told about the project: there is no code, then the whole Spec. */
export function buildSpecOnlyChatSummary(projectName: string, useCaseData: UseCaseDiagramData | undefined, dataModelData: DataModelData | undefined): string {
	return `# ${projectName}\n\nNOTE: This workspace has NO CODE yet - there is nothing to read or extract from. The user is starting from scratch.\n` + specSection(useCaseData, dataModelData);
}

/** The numbers beside the views in the sidebar; done/total counts use cases and requirements, as on the Projects page. */
function viewCounts(useCaseData: UseCaseDiagramData | undefined, dataModelData: DataModelData | undefined, tasks: Task[] | null): ViewCounts {
	const spec = useCaseData ? visibleSpec(useCaseData) : undefined;
	const items: { status?: string }[] = [...(spec?.useCases ?? []), ...(spec?.nfrs ?? [])];
	return {
		useCases: spec?.useCases.length ?? 0,
		entities: dataModelData?.entities.length ?? 0,
		done: items.filter(i => i.status === 'done').length,
		total: items.length,
		...(tasks ? { openTasks: tasks.filter(t => t.status !== 'done').length } : {})
	};
}

const MAX_TITLE = 200;
const MAX_NOTES = 5000;

function cleanTitle(value: unknown): string | null {
	return typeof value === 'string' && value.trim() ? value.trim().slice(0, MAX_TITLE) : null;
}

export async function handleSpecRequest(deps: SpecAppDeps, req: SpecRequest): Promise<Response> {
	const project = deps.project;
	let useCaseData = project.useCaseData;
	let dataModelData = project.dataModelData;
	const name = () => useCaseData?.systemName || project.name;
	const wizardApplies = () => !useCaseData && !project.wizardSkipped;
	const { method, path } = req;
	const board = deps.board;

	// ---- the board: its tasks, read once per request ----
	let tasks: Task[] | null = null;
	async function loadTasks(): Promise<Task[]> {
		if (!board) return [];
		if (tasks) return tasks;
		if (!board.carriedOver) {
			const carried = carriedOverTasks(useCaseData);
			if (carried.length) await board.createTasks(carried);
			await board.markCarriedOver();
			board.carriedOver = true;
		}
		tasks = await board.listTasks();
		return tasks;
	}
	// After any change to the tasks: read them again, and keep each item's Progress status in step.
	async function afterTaskChange(): Promise<Task[]> {
		tasks = null;
		const fresh = await loadTasks();
		if (useCaseData && deriveStatuses(useCaseData, fresh)) await deps.saveUseCaseData(useCaseData);
		return fresh;
	}
	const isMember = (uid: unknown) => typeof uid === 'string' && !!board?.members.some(m => m.uid === uid);
	const knownLink = (link: unknown): TaskLink | null | undefined => {
		if (link === null) return null;
		const l = link as TaskLink | undefined;
		if (!l || (l.type !== 'uc' && l.type !== 'nfr') || typeof l.id !== 'string') return undefined;
		return linkOptions(useCaseData).some(o => o.type === l.type && o.id === l.id) ? { type: l.type, id: l.id } : undefined;
	};

	if (method === 'GET') {
		if (path === '' || path === 'index.html') {
			if (wizardApplies()) return redirect('new-project');
			const chatMode = useCaseData ? 'draft' : 'blank';
			return html(generateShellHTML(name(), { classCount: 0, folderCount: 0, edgeCount: 0 }, await deps.getLayout(),
				{ signedIn: true, email: deps.email }, project.chatHistory, chatMode, req.search.get('view') === 'spec',
				{ ...deps.links, counts: viewCounts(useCaseData, dataModelData, board ? await loadTasks() : null), board: !!board }));
		}
		if (path === 'new-project') return wizardApplies() ? html(generateNewProjectHTML(name(), deps.logoDataUrl ?? '')) : redirect('./');
		if (path === 'use-case-diagram') return html(useCaseData ? generateUseCaseDiagramHTML(visibleSpec(useCaseData)) : generateUseCaseDiagramEmptyHTML(true, false));
		if (path === 'data-model') return html(dataModelData ? generateDataModelHTML(dataModelData) : generateDataModelEmptyHTML(true, false));
		if (path === 'srs-preview') return html(useCaseData ? generateSrsDocHTML(visibleSpec(useCaseData), dataModelData) : generateSrsEmptyHTML(true, false));
		if (path === 'progress') {
			// With a board, each row shows its tasks and its status comes from them.
			const boardTasks = board ? await loadTasks() : null;
			return html(generateProgressHTML(name(), useCaseData ? buildProgressRows(useCaseData) : [],
				boardTasks ? { tasks: boardTasks, members: board!.members } : undefined));
		}
		if (path === 'board' && board) {
			return html(generateBoardHTML(name(), { tasks: await loadTasks(), members: board.members, links: linkOptions(useCaseData), me: board.me.uid, readOnly: board.readOnly }));
		}
		if (path === 'api/tasks' && board) return json(200, { ok: true, tasks: await loadTasks() });
		if (path === 'progress-report') {
			if (!useCaseData) return html('<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px">There is nothing to report yet.</body></html>');
			const all = buildProgressRows(useCaseData);
			return html(generateProgressReportHTML({
				spec: visibleSpec(useCaseData),
				rows: all.filter(r => !r.removedByAi),
				allRows: all,
				asOf: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
			}));
		}
		if (path === 'api/auth/status') return json(200, { signedIn: true, email: deps.email });
		if (path === 'api/balance') return json(200, await deps.getBalance());
		if (path === 'api/counts') return json(200, viewCounts(useCaseData, dataModelData, board ? await loadTasks() : null));
		if (path === 'api/update-info') return json(200, { update: null });
		return json(404, { ok: false, error: 'Not found.' });
	}

	if (method !== 'POST') return json(405, { ok: false, error: 'Method not allowed.' });

	try {
		switch (path) {
			case 'api/layout':
				await deps.saveLayout((await req.json()) as Record<string, unknown>);
				return json(200, { ok: true });
			case 'api/auth/start':
			case 'api/auth/sign-out':
				// Sign-in happens before a project can be opened, and signing out is the caller's
				// (it owns the session); nothing to do here.
				return json(200, { ok: true });
			case 'api/use-case-diagram/generate':
			case 'api/data-model/generate':
				throw new Error('There is no code to generate from - describe your project in the chat and it will draft the spec from what you tell it.');
			case 'api/requirements/export':
			case 'api/progress/export':
				throw new Error('Downloading as Word or PDF is not available on the web yet.');
			case 'api/requirements/metadata': {
				const payload = (await req.json()) as { preparedBy?: string; clientName?: string };
				if (!useCaseData) throw new Error('Create the spec before editing document metadata.');
				if (typeof payload.preparedBy === 'string') useCaseData.preparedBy = payload.preparedBy;
				if (typeof payload.clientName === 'string') useCaseData.clientName = payload.clientName;
				await deps.saveUseCaseData(useCaseData);
				return json(200, { ok: true });
			}
			case 'api/progress': {
				if (!useCaseData) throw new Error('There is no spec to track yet.');
				const action = (await req.json()) as ProgressAction;
				if (board && action.action === 'update' && action.status !== undefined) {
					throw new Error('A status comes from its tasks now - move them on the Board.');
				}
				const result = applyProgressAction(useCaseData, action, userNameFromEmail(deps.email));
				if (!result.ok) throw new Error(result.error);
				await deps.saveUseCaseData(useCaseData);
				return json(200, { ok: true, rows: buildProgressRows(useCaseData) });
			}
			case 'api/chat':
				return await chatResponse();
			case 'api/tasks': {
				if (!board) return json(404, { ok: false, error: 'Not found.' });
				return json(200, { ok: true, ...(await changeTasks((await req.json()) as Record<string, unknown>)) });
			}
			case 'api/tasks/prompt': {
				if (!board) return json(404, { ok: false, error: 'Not found.' });
				const { id } = (await req.json()) as { id?: string };
				const all = await loadTasks();
				const task = all.find(t => t.id === id);
				if (!task) throw new Error('That task no longer exists.');
				const text = (await board.writePrompt(taskContext(task, useCaseData, dataModelData, all))).trim();
				await board.updateTask(task.id, { prompt: { text, at: new Date().toISOString() } });
				return json(200, { ok: true, tasks: await afterTaskChange() });
			}
			case 'api/new-project/ai': {
				const { step, input } = (await req.json()) as { step?: string; input?: unknown };
				if (!NEW_PROJECT_STEPS.includes(step as NewProjectStep) || step === 'draft') throw new Error('Unknown wizard step.');
				return json(200, { ok: true, data: await deps.newProjectStep(step as NewProjectStep, input) });
			}
			case 'api/new-project/document':
				return await documentResponse();
			case 'api/new-project/create': {
				if (useCaseData) throw new Error('This project already has a spec, so kratai will not overwrite it.');
				const input = await req.json();
				const choices = parseWizardChoices(input, name());
				// Checked here too (not just in buildProjectSpec) so a hopeless request never costs an AI call.
				if (!choices.actors.some(a => (choices.useCases[a.name] ?? []).length > 0)) throw new Error('Choose at least one actor and one use case.');
				const details = await deps.newProjectStep('draft', input) as SpecDetails;
				const spec = buildProjectSpec(choices, details, name());
				await deps.saveUseCaseData(spec.useCaseData);
				await deps.saveDataModelData(spec.dataModelData);
				// Recorded like a real chat turn so the model knows what the user chose, and the chat opens
				// on "here is the initial design" rather than an empty log.
				const outcome = describeWizardOutcome(choices, spec);
				const seeded: ConversationMessage[] = [...project.chatHistory, { role: 'user', text: outcome.user }, { role: 'assistant', text: outcome.assistant }];
				await deps.saveChatHistory(seeded.slice(-MAX_CHAT_ENTRIES));
				return json(200, { ok: true });
			}
			case 'api/new-project/skip':
				await deps.saveWizardSkipped();
				return json(200, { ok: true });
			default:
				return json(404, { ok: false, error: 'Not found.' });
		}
	} catch (error) {
		return json(400, { ok: false, error: errorMessage(error) });
	}

	async function documentResponse(): Promise<Response> {
		if (!wizardApplies()) throw new Error('Documents can only be added while setting up a new project.');
		const body = (await req.json()) as { name?: unknown; data?: unknown };
		const fileName = typeof body.name === 'string' ? body.name.slice(0, 200) : '';
		const bytes = Buffer.from(typeof body.data === 'string' ? body.data : '', 'base64');
		try {
			const extracted = await extractDocument(fileName, bytes);
			const text = 'scan' in extracted
				? await deps.readDocument({ name: fileName, mimeType: extracted.scan.mimeType, data: bytes.toString('base64') })
				: extracted.text;
			return json(200, { ok: true, text: text.slice(0, MAX_DOCUMENT_CHARS) });
		} catch (error) {
			return json(400, { ok: false, error: error instanceof DocumentError || error instanceof Error ? error.message : 'Could not read that file.' });
		}
	}

	/**
	 * The chat, streamed one JSON event per line exactly as the desktop's /api/chat does (see
	 * chatActivity.ts), with the same tool loop - only the tools that read code have nothing to read.
	 */
	async function chatResponse(): Promise<Response> {
		const { messages } = (await req.json()) as { messages?: ConversationMessage[] };
		if (!Array.isArray(messages) || messages.length === 0) throw new Error('Missing messages.');
		const encoder = new TextEncoder();
		const started = Date.now();
		const stream = new ReadableStream<Uint8Array>({
			async start(controller) {
				const send = (event: ChatEvent) => {
					try { controller.enqueue(encoder.encode(JSON.stringify(event) + '\n')); } catch { /* the page has gone */ }
				};
				try {
					const { reply, steps } = await runChatLoop(messages, send);
					await deps.saveChatHistory([...messages, { role: 'assistant' as const, text: reply }].slice(-MAX_CHAT_ENTRIES));
					send({ type: 'done', reply, steps, elapsedMs: Date.now() - started });
				} catch (error) {
					// A stopped chat has nobody listening any more, and is not an error.
					if (!req.signal?.aborted && !(error instanceof ChatStoppedError)) send({ type: 'error', error: errorMessage(error) });
				}
				try { controller.close(); } catch { /* already closed */ }
			}
		});
		return new Response(stream, { status: 200, headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache' } });
	}

	/** One change on the board (see boardView.ts); answers the whole board again. */
	async function changeTasks(body: Record<string, unknown>): Promise<{ tasks: Task[]; created?: string }> {
		const all = await loadTasks();
		const endOf = (status: TaskStatus) => Math.max(-1, ...all.filter(t => t.status === status).map(t => t.order)) + 1;
		const task = all.find(t => t.id === body.id);
		if (body.action !== 'create' && !task) throw new Error('That task no longer exists - the board has been refreshed.');

		if (body.action === 'create') {
			const input = (body.task ?? {}) as Record<string, unknown>;
			const title = cleanTitle(input.title);
			if (!title) throw new Error('A task needs a title.');
			const status = TASK_STATUSES.includes(input.status as TaskStatus) ? input.status as TaskStatus : 'todo';
			const [created] = await board!.createTasks([{
				title, notes: typeof input.notes === 'string' ? input.notes.slice(0, MAX_NOTES) : '',
				status, order: endOf(status), link: knownLink(input.link ?? null) ?? null,
				assigneeUid: isMember(input.assigneeUid) ? input.assigneeUid as string : null,
				createdByAi: false, doneBy: status === 'done' ? board!.me.name : null, prompt: null
			}]);
			return { tasks: await afterTaskChange(), created };
		}
		if (body.action === 'delete') {
			await board!.deleteTask(task!.id);
			return { tasks: await afterTaskChange() };
		}
		if (body.action === 'move') {
			const status = body.status as TaskStatus;
			if (!TASK_STATUSES.includes(status)) throw new Error('Unknown column.');
			// The column as it will be, top to bottom, and each task's new place in it.
			const column = all.filter(t => t.status === status && t.id !== task!.id).sort((a, b) => a.order - b.order);
			const at = column.findIndex(t => t.id === body.beforeId);
			column.splice(at === -1 ? column.length : at, 0, task!);
			await Promise.all(column.map((t, i) => {
				if (t.id === task!.id) {
					const moved = t.status !== status;
					return board!.updateTask(t.id, {
						order: i, status,
						...(moved ? { doneBy: status === 'done' ? board!.me.name : null } : {})
					});
				}
				return t.order === i ? undefined : board!.updateTask(t.id, { order: i });
			}));
			return { tasks: await afterTaskChange() };
		}
		if (body.action === 'update') {
			const input = (body.patch ?? {}) as Record<string, unknown>;
			const patch: Partial<NewTask> = {};
			if (input.title !== undefined) {
				const title = cleanTitle(input.title);
				if (!title) throw new Error('A task needs a title.');
				patch.title = title;
			}
			if (typeof input.notes === 'string') patch.notes = input.notes.slice(0, MAX_NOTES);
			if (input.status !== undefined && input.status !== task!.status) {
				if (!TASK_STATUSES.includes(input.status as TaskStatus)) throw new Error('Unknown status.');
				patch.status = input.status as TaskStatus;
				patch.order = endOf(patch.status);
				patch.doneBy = patch.status === 'done' ? board!.me.name : null;
			}
			if (input.link !== undefined) {
				const link = knownLink(input.link);
				if (link === undefined) throw new Error('That use case or requirement is no longer in the spec.');
				patch.link = link;
			}
			if (input.assigneeUid !== undefined) {
				if (input.assigneeUid !== null && !isMember(input.assigneeUid)) throw new Error('Only the project\'s members can be assigned a task.');
				patch.assigneeUid = input.assigneeUid as string | null;
			}
			if (Object.keys(patch).length) await board!.updateTask(task!.id, patch);
			return { tasks: await afterTaskChange() };
		}
		throw new Error('Unknown change.');
	}

	/** The chat's add_tasks tool: tasks the AI planned, at the end of To do. */
	async function addTasksFromChat(input: Record<string, unknown>): Promise<string> {
		const list = Array.isArray(input.tasks) ? input.tasks as Record<string, unknown>[] : [];
		const all = await loadTasks();
		let order = Math.max(-1, ...all.filter(t => t.status === 'todo').map(t => t.order)) + 1;
		const unknown: string[] = [];
		const planned: NewTask[] = [];
		list.slice(0, 30).forEach(item => {
			const title = cleanTitle(item.title);
			if (!title) return;
			const link = resolveLink(useCaseData, item.delivers);
			if (item.delivers && !link) unknown.push(String(item.delivers));
			planned.push({
				title, notes: typeof item.notes === 'string' ? item.notes.slice(0, MAX_NOTES) : '',
				status: 'todo', order: order++, link, assigneeUid: null, createdByAi: true, doneBy: null, prompt: null
			});
		});
		if (!planned.length) return 'No tasks were added: each task needs a title.';
		await board!.createTasks(planned);
		await afterTaskChange();
		return `Added ${planned.length} task${planned.length === 1 ? '' : 's'} to To do on the board.` +
			(unknown.length ? ` These ids are not in the spec, so those tasks are not linked: ${unknown.join(', ')}.` : '');
	}

	async function runChatLoop(initialMessages: ConversationMessage[], onEvent: (event: ChatEvent) => void): Promise<{ reply: string; steps: string[] }> {
		const summarize = async () => buildSpecOnlyChatSummary(name(), useCaseData, dataModelData) +
			(board ? boardSection(useCaseData, await loadTasks(), board.members) : '');
		let summary = await summarize();
		const conversation: ConversationMessage[] = [...initialMessages];
		const uiActions: UiAction[] = [];
		const steps: string[] = [];
		let uiSent = 0;
		// Stops between steps, never inside one: a spec edit that has started is allowed to finish.
		const checkStopped = () => { if (req.signal?.aborted) throw new ChatStoppedError(); };
		const sendUi = () => {
			if (uiActions.length > uiSent) onEvent({ type: 'ui', actions: uiActions.slice(uiSent) });
			uiSent = uiActions.length;
		};
		for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
			checkStopped();
			onEvent({ type: 'thinking' });
			const step = await deps.chatStep(conversation, name(), summary, req.signal);
			checkStopped();
			if (step.done) return { reply: step.reply, steps };
			conversation.push({ role: 'assistant', text: step.assistantText, toolCalls: step.toolCalls });
			let specChanged = false;
			const toolResults: { toolCallId: string; output: string }[] = [];
			for (const call of step.toolCalls) {
				sendUi();
				checkStopped();
				const label = describeToolCall(call.name, call.input);
				steps.push(label);
				onEvent({ type: 'tool', label, ...(editsSpec(call.name) ? { editsSpec: true } : {}) });
				if (UI_ACTION_TOOL_NAMES.has(call.name)) {
					uiActions.push({ type: call.name, ...call.input });
					toolResults.push({ toolCallId: call.id, output: 'Shown to the user.' });
					continue;
				}
				if (SPEC_TOOL_NAMES.has(call.name)) {
					const result = await executeSpecTool(call.name, call.input, useCaseData, dataModelData, { workspaceName: name() });
					if (result.updatedUseCaseData) {
						useCaseData = result.updatedUseCaseData;
						await deps.saveUseCaseData(useCaseData);
						uiActions.push({ type: 'refresh_view', view: 'usecase' }, { type: 'refresh_view', view: 'srs' });
						specChanged = true;
					}
					if (result.updatedDataModelData) {
						dataModelData = result.updatedDataModelData;
						await deps.saveDataModelData(dataModelData);
						uiActions.push({ type: 'refresh_view', view: 'data' }, { type: 'refresh_view', view: 'srs' });
						specChanged = true;
					}
					toolResults.push({ toolCallId: call.id, output: result.output });
					continue;
				}
				if (call.name === 'add_tasks' && board && !board.readOnly) {
					toolResults.push({ toolCallId: call.id, output: await addTasksFromChat(call.input) });
					uiActions.push({ type: 'show_view', view: 'board' }, { type: 'refresh_view', view: 'board' }, { type: 'refresh_view', view: 'progress' });
					specChanged = true;
					continue;
				}
				toolResults.push({ toolCallId: call.id, output: NO_CODE_TOOL_OUTPUT });
			}
			sendUi();
			conversation.push({ role: 'user', toolResults });
			if (specChanged) summary = await summarize();
		}
		// Out of turns: say so rather than pretend (same reasoning as view.ts's runChatLoop).
		return { reply: 'I could not finish that within my step budget. Try asking for one change at a time.', steps };
	}
}
