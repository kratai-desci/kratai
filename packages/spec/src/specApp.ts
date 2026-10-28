import {
	UI_ACTION_TOOL_NAMES, SPEC_TOOL_NAMES, NEW_PROJECT_STEPS, MAX_DOCUMENT_CHARS,
	parseWizardChoices, buildProjectSpec, describeWizardOutcome
} from '@kratai-desci/llm';
import type { ConversationMessage, ChatStepResult, NewProjectStep, SpecDetails, UseCaseDiagramData, DataModelData } from '@kratai-desci/llm';
import { generateShellHTML, type WebShellOptions } from './viewShell.js';
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
	links: Omit<WebShellOptions, 'subtitle'>;
	/** The app icon as a data URI, for the wizard's header. */
	logoDataUrl?: string;
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

/** The line under the project name in the shell. */
function specCounts(useCaseData: UseCaseDiagramData | undefined): string {
	if (!useCaseData) return 'No spec yet';
	const spec = visibleSpec(useCaseData);
	return `${spec.actors.length} actors • ${spec.useCases.length} use cases • ${(spec.nfrs || []).length} requirements`;
}

export async function handleSpecRequest(deps: SpecAppDeps, req: SpecRequest): Promise<Response> {
	const project = deps.project;
	let useCaseData = project.useCaseData;
	let dataModelData = project.dataModelData;
	const name = () => useCaseData?.systemName || project.name;
	const wizardApplies = () => !useCaseData && !project.wizardSkipped;
	const { method, path } = req;

	if (method === 'GET') {
		if (path === '' || path === 'index.html') {
			if (wizardApplies()) return redirect('new-project');
			const chatMode = useCaseData ? 'draft' : 'blank';
			return html(generateShellHTML(name(), { classCount: 0, folderCount: 0, edgeCount: 0 }, await deps.getLayout(),
				{ signedIn: true, email: deps.email }, project.chatHistory, chatMode, req.search.get('view') === 'spec',
				{ ...deps.links, subtitle: specCounts(useCaseData) }));
		}
		if (path === 'new-project') return wizardApplies() ? html(generateNewProjectHTML(name(), deps.logoDataUrl ?? '')) : redirect('./');
		if (path === 'use-case-diagram') return html(useCaseData ? generateUseCaseDiagramHTML(visibleSpec(useCaseData)) : generateUseCaseDiagramEmptyHTML(true, false));
		if (path === 'data-model') return html(dataModelData ? generateDataModelHTML(dataModelData) : generateDataModelEmptyHTML(true, false));
		if (path === 'srs-preview') return html(useCaseData ? generateSrsDocHTML(visibleSpec(useCaseData), dataModelData) : generateSrsEmptyHTML(true, false));
		if (path === 'progress') return html(generateProgressHTML(name(), useCaseData ? buildProgressRows(useCaseData) : []));
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
				const result = applyProgressAction(useCaseData, (await req.json()) as ProgressAction, userNameFromEmail(deps.email));
				if (!result.ok) throw new Error(result.error);
				await deps.saveUseCaseData(useCaseData);
				return json(200, { ok: true, rows: buildProgressRows(useCaseData) });
			}
			case 'api/chat':
				return await chatResponse();
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

	async function runChatLoop(initialMessages: ConversationMessage[], onEvent: (event: ChatEvent) => void): Promise<{ reply: string; steps: string[] }> {
		let summary = buildSpecOnlyChatSummary(name(), useCaseData, dataModelData);
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
				toolResults.push({ toolCallId: call.id, output: NO_CODE_TOOL_OUTPUT });
			}
			sendUi();
			conversation.push({ role: 'user', toolResults });
			if (specChanged) summary = buildSpecOnlyChatSummary(name(), useCaseData, dataModelData);
		}
		// Out of turns: say so rather than pretend (same reasoning as view.ts's runChatLoop).
		return { reply: 'I could not finish that within my step budget. Try asking for one change at a time.', steps };
	}
}
