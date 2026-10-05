import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { CodeParserService, DiagramGeneratorService, GitDiffEnricher, FolderStructureBuilder } from '@kratai/analysis';
import { ClassDiagramView } from '@kratai/diagram-view';
import { loadCliConfig, saveFolderExpanded, saveFolderOrder, saveFolderPanelOpen, saveFolderVisibility } from '../config.js';
import { openFile } from '../openFile.js';
import { generateShellHTML, ShellStats } from '../viewShell.js';
import { buildKnowledgeGraphData } from '../knowledgeGraphData.js';
import { generateKnowledgeGraphHTML } from '../knowledgeGraphView.js';
import { buildStackLayerData } from '../stackLayerData.js';
import { generateStackLayerHTML } from '../stackLayerView.js';
import { loadCachedUseCaseDiagramData, saveCachedUseCaseDiagramData, hasCachedUseCaseDiagramData, buildUseCaseExtractionSummary, UseCaseDiagramData } from '../useCaseDiagramData.js';
import { generateUseCaseDiagramHTML, generateUseCaseDiagramEmptyHTML } from '../useCaseDiagramView.js';
import { loadCachedDataModelData, saveCachedDataModelData, buildDataModelExtractionSummary, DataModelData } from '../dataModelData.js';
import { generateDataModelHTML, generateDataModelEmptyHTML } from '../dataModelView.js';
import { generateProgressHTML } from '../progressView.js';
import { generateProgressReportHTML } from '../progressReportView.js';
import { visibleSpec, buildProgressRows, applyProgressAction, userNameFromEmail, type ProgressAction } from '../progressData.js';
import { generateSrsDocHTML, generateSrsEmptyHTML } from '../srsDocView.js';
import { executeChatTool } from '../chatTools.js';
import { executeSpecTool } from '../chatSpecTools.js';
import { executeFileTool } from '../fileTools.js';
import { buildChatSummary } from '../chatContext.js';
import { loadCachedChatHistory, saveCachedChatHistory } from '../chatHistoryData.js';
import { UI_ACTION_TOOL_NAMES, SPEC_TOOL_NAMES, FILE_TOOL_NAMES } from '@kratai-desci/llm';
import type { ConversationMessage, ChatStepResult, NewProjectStep, SpecDetails } from '@kratai-desci/llm';
import { NEW_PROJECT_STEPS, parseWizardChoices, buildProjectSpec, describeWizardOutcome } from '@kratai-desci/llm';
import { generateNewProjectHTML } from '../newProjectView.js';

export interface AuthStatus {
	signedIn: boolean;
	email: string | null;
}

export interface GenerationProgressStep {
	label: string;
	status: 'pending' | 'active' | 'done' | 'error';
}

export interface ViewOptions {
	path: string;
	port: number;
	open: boolean;
	// Layout (view picker choices, split ratio, AI dialog height/open state)
	// persistence is dependency-injected rather than hardcoded here, since
	// this package stays Electron-agnostic - the desktop app supplies real
	// file-backed storage (packages/desktop/src/main/layoutStore.ts, via
	// app.getPath('userData') - genuinely global, independent of whatever
	// port this server happens to bind to). Plain CLI/browser use without
	// these wired falls back to an in-memory default below: it works within
	// one server's lifetime, just doesn't survive a restart - an accepted
	// tradeoff since the desktop app, not standalone `kratai view`, is the
	// primary surface this is built for.
	getLayout?: () => Record<string, unknown>;
	saveLayout?: (data: Record<string, unknown>) => void;
	// Sign-in is a hosted-account concept (kratai-web), not something this
	// package knows anything about beyond these hook shapes - the desktop
	// app owns the whole flow (deep link, PKCE, device token storage - see
	// packages/desktop/src/main/auth.ts) and injects the result. No
	// in-memory fallback makes sense the way getLayout's does: plain CLI/
	// browser use simply has no hosted account to sign into.
	getAuthStatus?: () => AuthStatus;
	startSignIn?: () => void;
	signOut?: () => void;
	// Also desktop-owned (packages/desktop/src/main/generateProxy.ts) - an
	// authenticated call to kratai-web's LLM proxy, using whatever device
	// token startSignIn/the auth flow produced. This package never touches
	// a provider key directly anymore (see @kratai-desci/llm, which kratai-web
	// depends on instead).
	generateUseCaseDiagram?: (summary: string, workspaceName: string) => Promise<UseCaseDiagramData>;
	// Same desktop-owned relay shape, pointed at kratai-web's data-model
	// generate route instead - see packages/desktop/src/main/generateProxy.ts.
	generateDataModel?: (summary: string, workspaceName: string) => Promise<DataModelData>;
	// Same desktop-owned relay shape (packages/desktop/src/main/chatProxy.ts),
	// but ONE model turn per call, not a full reply - the model may come
	// back wanting to call a tool (see chatTools.ts), which only this
	// process can execute (it's the only layer with the parsed codebase).
	// The /api/chat route below owns the loop: call this, execute any
	// requested tools, call again with the results appended, repeat until
	// done:true. kratai-web never runs this loop itself for the same
	// reason it never executes tools itself.
	chat?: (messages: ConversationMessage[], workspaceName: string, summary: string) => Promise<ChatStepResult>;
	// Desktop-owned (packages/desktop/src/main/pdfExport.ts) - builds on
	// Electron's own webContents.printToPDF() against this same server's
	// /srs-preview page, so this stays a plain HTTP hook like the others
	// rather than needing any native bridge of its own.
	exportRequirementsPdf?: () => Promise<{ ok: boolean; path?: string; error?: string }>;
	// Same idea for the Progress page's report (loads /progress-report).
	exportProgressPdf?: () => Promise<{ ok: boolean; path?: string; error?: string }>;
	// Also desktop-owned (packages/desktop/src/main/balanceProxy.ts) - reads
	// the signed-in user's remaining AI credit from kratai-web, plus the
	// signup-credit baseline the shell's meter renders "how full" against.
	// Returns null rather than throwing when signed out, same as the hook itself.
	getBalance?: () => Promise<{ balanceCents: number; totalCents: number } | null>;
	// Called with the full current checklist while runView is doing
	// first-open auto-generation (below) - once with everything still
	// 'pending' before the first call starts (so the desktop app can show
	// the whole plan upfront, not just "generating..." with no sense of how
	// much is left), then again on every status change. Never called at all
	// when nothing needs generating.
	onProgress?: (steps: GenerationProgressStep[]) => void;
	// Gates the first-open auto-generation below - called only when signed
	// in and at least one of the two isn't cached, with the real numbers
	// from the parse that already just happened (not a guess made before
	// it). The desktop app uses this to show a "generate now?" prompt with
	// real project size and the user's current balance (index.ts), and
	// resolves it with their choice - never inferred, since the whole point
	// is an informed choice every time there's something to generate, not a
	// standing preference.
	confirmGenerate?: (info: { workspaceName: string; missing: string[]; classCount: number; folderCount: number }) => Promise<boolean>;
	// Runs one AI step of the new-project wizard (see newProjectView.ts): the
	// wizard page posts here and this relays to the AI via the desktop app, the
	// same way chat and Generate do (kratai-web holds the model key and does the
	// billing). Its presence is also what enables the wizard - a project with no
	// code, no spec and a signed-in user is sent to it instead of the shell.
	newProjectAi?: (step: NewProjectStep, input: unknown) => Promise<unknown>;
	// The desktop app's "is there a newer release?" check. Resolves to the
	// newer version and the one running, or null when up to date, offline or
	// unknown. The shell shows a dismissible bar for it.
	checkForUpdate?: () => Promise<{ version: string; current: string } | null>;
	// The app icon as a data URI, for the wizard's header (the view server has no
	// asset route of its own).
	logoDataUrl?: string;
}

const NO_CODE_MESSAGE = 'No code yet - describe your project to chat and it will draft the spec from what you tell it.';

export async function runView(options: ViewOptions): Promise<http.Server> {
	const workspacePath = path.resolve(options.path);

	if (!fs.existsSync(workspacePath)) {
		throw new Error(`Path not found: ${workspacePath}`);
	}

	let inMemoryLayout: Record<string, unknown> = {};
	const getLayout = options.getLayout || (() => inMemoryLayout);
	const saveLayoutHook = options.saveLayout || ((data: Record<string, unknown>) => { inMemoryLayout = data; });

	const getAuthStatus = options.getAuthStatus || (() => ({ signedIn: false, email: null }));
	const startSignInHook = options.startSignIn || (() => {});
	const signOutHook = options.signOut || (() => {});
	const generateUseCaseDiagramHook = options.generateUseCaseDiagram;
	const generateDataModelHook = options.generateDataModel;
	const chatHook = options.chat;
	const exportRequirementsPdfHook = options.exportRequirementsPdf;
	const exportProgressPdfHook = options.exportProgressPdf;
	const onProgressHook = options.onProgress || (() => {});
	const getBalanceHook = options.getBalance || (async () => null);
	const confirmGenerateHook = options.confirmGenerate || (async () => false);

	const config = loadCliConfig(workspacePath, undefined, {});
	const diagramName = path.basename(workspacePath);

	console.log(`Analyzing ${workspacePath}...`);
	let diagramData = await CodeParserService.parseWorkspace(workspacePath, config);

	if (config.gitDiff?.enabled !== false) {
		try {
			const baseCommit = config.gitDiff?.baseCommit || 'HEAD~1';
			await GitDiffEnricher.enrichWithGitDiff(diagramData, workspacePath, baseCommit);
		} catch (error) {
			console.warn(`Skipping git diff highlighting: ${error instanceof Error ? error.message : error}`);
		}
	}


	let { nodes, edges } = DiagramGeneratorService.generateReactFlowData(diagramData);
	let folderCount = FolderStructureBuilder.countFolders(FolderStructureBuilder.build(nodes));
	// Generation is a manual, explicit action (see /api/use-case-diagram/
	// generate below) - a real API call, unlike the other views' free
	// re-renders - so whatever was last generated is loaded once here and
	// reused across requests/reparse, not regenerated on every reparse.
	let useCaseData: UseCaseDiagramData | undefined = loadCachedUseCaseDiagramData(workspacePath);
	let dataModelData: DataModelData | undefined = loadCachedDataModelData(workspacePath);
	// Display history only (user/assistant text turns) - never the
	// intermediate tool-call/tool-result messages a single /api/chat
	// request builds up internally (see that handler's own `conversation`
	// array), which live and die within one request.
	let chatHistory: ConversationMessage[] = loadCachedChatHistory(workspacePath);

	// First-open auto-generation: a signed-in user with nothing cached yet
	// would otherwise land on two empty "Generate" cards and have to click
	// each by hand before the Spec means anything. Never inferred silently
	// from just "signed in + something's missing" - confirmGenerateHook
	// decides, given the real numbers from the parse that just happened
	// (the desktop app shows these plus the user's balance in a "generate
	// now?" prompt - see index.ts). Failures (no credit, network) during
	// the actual generation below are swallowed either way - the
	// empty-state cards are still there as a manual fallback. The full
	// checklist is reported once up front (before anything starts) so the
	// desktop app can show the whole plan, not just "generating..." with no
	// sense of how much is left.
	// No code means nothing to extract from - generating would just invent a
	// spec - so a code-less project skips this and is drafted through chat
	// instead (see NO_CODE_MESSAGE).
	const hasCode = diagramData.classes.length > 0;
	const wantsUseCase = hasCode && getAuthStatus().signedIn && !useCaseData && !!generateUseCaseDiagramHook;
	const wantsDataModel = hasCode && getAuthStatus().signedIn && !dataModelData && !!generateDataModelHook;
	// Specifications (the SRS doc) isn't its own generation step - it's
	// derived for free from these two (see srsDocView.ts) - but it's listed
	// first here since it's what the user actually cares about ending up
	// with, and both underlying pieces feed it.
	const missingLabels: string[] = [];
	if (wantsUseCase || wantsDataModel) missingLabels.push('Specifications');
	if (wantsUseCase) missingLabels.push('Use Case Model');
	if (wantsDataModel) missingLabels.push('Data Model');

	const shouldAutoGenerate = (wantsUseCase || wantsDataModel) && await confirmGenerateHook({
		workspaceName: diagramName,
		missing: missingLabels,
		classCount: nodes.length,
		folderCount
	});

	// Specifications rides along in the checklist too (as a derived,
	// no-cost step - see missingLabels above) so what the user sees here
	// matches the plan they already agreed to in the prompt, rather than
	// one of the three items just silently disappearing. It never has a
	// real 'active' state of its own (there's no separate work happening
	// for it), so unlike the other two it starts 'done' rather than
	// 'pending' - showing it "in progress" would just sit there looking
	// stuck since nothing ever moves it. Only corrected to 'error' at the
	// very end, and only if one of the two below actually failed.
	const steps: GenerationProgressStep[] = [];
	if (shouldAutoGenerate) steps.push({ label: 'Specifications', status: 'done' });
	if (shouldAutoGenerate && wantsUseCase) steps.push({ label: 'Use Case Model', status: 'pending' });
	// Its own step, not folded into "Use Case Model" above - this is a
	// second, separately-costed pass (reads real files, not just the
	// summary) that can meaningfully take longer, so it needs its own
	// visible progress rather than "Use Case Model" just sitting on
	// 'active' for an unexplained extra stretch.
	if (shouldAutoGenerate && wantsUseCase) steps.push({ label: 'Use Case Detail', status: 'pending' });
	if (shouldAutoGenerate && wantsDataModel) steps.push({ label: 'Data Model', status: 'pending' });

	if (steps.length > 0) {
		onProgressHook(steps.slice());

		if (!useCaseData && generateUseCaseDiagramHook) {
			const step = steps.find(s => s.label === 'Use Case Model')!;
			const detailStep = steps.find(s => s.label === 'Use Case Detail');
			step.status = 'active';
			onProgressHook(steps.slice());
			try {
				const summary = buildUseCaseExtractionSummary(diagramData, diagramName);
				useCaseData = await generateUseCaseDiagramHook(summary, diagramName);
				saveCachedUseCaseDiagramData(workspacePath, useCaseData);
				step.status = 'done';
				onProgressHook(steps.slice());
				if (detailStep) {
					detailStep.status = 'active';
					onProgressHook(steps.slice());
					detailStep.status = await detailFillUseCaseModel() ? 'done' : 'error';
				}
			} catch (error) {
				step.status = 'error';
				if (detailStep) detailStep.status = 'error';
				console.warn(`Skipping automatic Use Case Model generation: ${error instanceof Error ? error.message : error}`);
			}
			onProgressHook(steps.slice());
		}

		if (!dataModelData && generateDataModelHook) {
			const step = steps.find(s => s.label === 'Data Model')!;
			step.status = 'active';
			onProgressHook(steps.slice());
			try {
				const summary = buildDataModelExtractionSummary(diagramData, diagramName);
				dataModelData = await generateDataModelHook(summary, diagramName);
				saveCachedDataModelData(workspacePath, dataModelData);
				step.status = 'done';
			} catch (error) {
				step.status = 'error';
				console.warn(`Skipping automatic Data Model generation: ${error instanceof Error ? error.message : error}`);
			}
			onProgressHook(steps.slice());
		}

		const specStep = steps.find(s => s.label === 'Specifications');
		if (specStep) {
			// Only really "ready" once both underlying pieces exist -
			// whether from just now or already-cached - not just "the loop
			// finished" (a failure above would otherwise still show it done).
			specStep.status = useCaseData && dataModelData ? 'done' : 'error';
			onProgressHook(steps.slice());
		}
	}

	/**
	 * The tool-call loop, extracted so both the real /api/chat route and
	 * the auto-detail-fill step below (see detailFillUseCaseModel) can
	 * drive it - a synthetic instruction is just another conversation to
	 * run through the exact same loop, not a separate mechanism. Bounded
	 * so a model that never stops calling tools can't hang the request
	 * forever. Doesn't touch chatHistory/saveCachedChatHistory itself -
	 * callers decide whether a given run belongs in the visible transcript.
	 */
	async function runChatLoop(initialMessages: ConversationMessage[]): Promise<{ reply: string; uiActions: Array<{ type: string } & Record<string, unknown>> }> {
		if (!chatHook) throw new Error('Chat is only available in the kratai desktop app.');
		let summary = buildChatSummary(diagramData, diagramName, useCaseData, dataModelData);
		const conversation: ConversationMessage[] = [...initialMessages];
		const uiActions: Array<{ type: string } & Record<string, unknown>> = [];
		const MAX_TOOL_ITERATIONS = 20;
		for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
			const step = await chatHook(conversation, diagramName, summary);
			if (step.done) return { reply: step.reply, uiActions };
			console.log(`[chat] turn ${i + 1}: ${step.toolCalls.map(c => `${c.name}(${JSON.stringify(c.input)})`).join(', ')}`);
			conversation.push({ role: 'assistant', text: step.assistantText, toolCalls: step.toolCalls });
			let specChanged = false;
			// Sequential, not Promise.all - a turn can include both a
			// generate_* and an update_* call together, and running them
			// concurrently would race on the same useCaseData/
			// dataModelData reassignment below.
			const toolResults: { toolCallId: string; output: string }[] = [];
			for (const call of step.toolCalls) {
				if (UI_ACTION_TOOL_NAMES.has(call.name)) {
					uiActions.push({ type: call.name, ...call.input });
					toolResults.push({ toolCallId: call.id, output: 'Shown to the user.' });
					continue;
				}
				if (SPEC_TOOL_NAMES.has(call.name)) {
					const result = await executeSpecTool(call.name, call.input, useCaseData, dataModelData, {
						workspaceName: diagramName,
						generateUseCaseModel: generateUseCaseDiagramHook
							? () => {
								if (diagramData.classes.length === 0) throw new Error(NO_CODE_MESSAGE);
								return generateUseCaseDiagramHook(buildUseCaseExtractionSummary(diagramData, diagramName), diagramName);
							}
							: undefined,
						generateDataModel: generateDataModelHook
							? () => {
								if (diagramData.classes.length === 0) throw new Error(NO_CODE_MESSAGE);
								return generateDataModelHook(buildDataModelExtractionSummary(diagramData, diagramName), diagramName);
							}
							: undefined
					});
					if (result.updatedUseCaseData) {
						useCaseData = result.updatedUseCaseData;
						saveCachedUseCaseDiagramData(workspacePath, useCaseData);
						uiActions.push({ type: 'refresh_view', view: 'usecase' }, { type: 'refresh_view', view: 'srs' });
						specChanged = true;
					}
					if (result.updatedDataModelData) {
						dataModelData = result.updatedDataModelData;
						saveCachedDataModelData(workspacePath, dataModelData);
						uiActions.push({ type: 'refresh_view', view: 'data' }, { type: 'refresh_view', view: 'srs' });
						specChanged = true;
					}
					toolResults.push({ toolCallId: call.id, output: result.output });
					continue;
				}
				if (FILE_TOOL_NAMES.has(call.name)) {
					toolResults.push({ toolCallId: call.id, output: executeFileTool(call.name, call.input, workspacePath) });
					continue;
				}
				toolResults.push({ toolCallId: call.id, output: executeChatTool(call.name, call.input, diagramData) });
			}
			conversation.push({ role: 'user', toolResults });
			if (specChanged) summary = buildChatSummary(diagramData, diagramName, useCaseData, dataModelData);
		}
		// Ran out of tool budget. A follow-up call with allowTools:false
		// looked like the obvious fix, but testing showed Gemini doesn't
		// reliably honor "no tools declared" once its own history already
		// shows a tool-calling pattern - it can still emit a function call
		// (even hallucinating a nonexistent tool name), so trusting the
		// provider to stop can't be how this terminates. Synthesizing
		// directly from what was already gathered is guaranteed to end the
		// request, costs no extra model call, and is honest about the
		// limitation instead of pretending the partial exploration was a
		// complete answer.
		const allOutputs = conversation
			.filter((m): m is ConversationMessage & { toolResults: NonNullable<ConversationMessage['toolResults']> } => !!m.toolResults?.length)
			.flatMap(m => m.toolResults)
			.map(r => r.output);
		// Dedupe (the same lookup can legitimately recur across turns) and
		// keep only the most recent few - later lookups are usually closer
		// to what the model was actually converging on than its first,
		// often-vague opening searches.
		const gathered = Array.from(new Set(allOutputs)).slice(-4).join('\n\n').slice(0, 3000);
		const reply = `I looked into several parts of the codebase but couldn't settle on a complete answer within my lookup budget. Here's what I found along the way:\n\n${gathered}\n\nTry asking a more specific question (about one particular class, route, or file) for a fuller answer.`;
		return { reply, uiActions };
	}

	// Auto-chained right after a fresh Use Case Model generation (both the
	// first-open flow and the manual Generate button below) - the one-shot
	// extraction above only ever sees a route/folder summary, never real
	// implementation, so it never fills goal/preconditions/mainFlow/
	// postconditions (see useCaseSchema.ts's comment on UseCaseItem).
	// Reuses the exact same tool loop chat already has instead of a
	// separate mechanism, with a synthetic instruction standing in for
	// what a user would type - the model reads real files via
	// read_file/list_directory and grounds each use case's detail in what's
	// actually implemented (or leaves it unset - see
	// chatAboutArchitecture.ts's system prompt). Appended to chatHistory
	// like a real turn so it's visible next time chat is opened, not a
	// silent background mutation. Returns whether it actually succeeded
	// (rather than swallowing the error itself) so callers with their own
	// progress/status reporting - the first-open checklist's "Use Case
	// Detail" step, the manual route's response - can show the truth
	// instead of claiming success either way; the generated (still atomic,
	// still useful) Use Case Model stands regardless of this step's outcome,
	// so a caller is free to treat a `false` as non-fatal.
	async function detailFillUseCaseModel(): Promise<boolean> {
		if (!chatHook || !useCaseData) return false;
		const instruction = 'I just generated the Use Case Model for this project. For each use case, add goal, preconditions, mainFlow, and postconditions detail via update_use_case_model - read the actual route/handler/component code behind each one first (read_file/list_directory), and ground every step in what the code really does. If you can\'t find or confirm real behavior for a use case, leave its detail fields unset for that one rather than guessing - don\'t let one uncertain use case stop you from detailing the rest. When you\'re done, briefly summarize what you added and, if any, which use cases you left as-is and why.';
		try {
			const { reply } = await runChatLoop([{ role: 'user', text: instruction }]);
			chatHistory = [...chatHistory, { role: 'user', text: instruction }, { role: 'assistant', text: reply }];
			saveCachedChatHistory(workspacePath, chatHistory);
			return true;
		} catch (error) {
			console.warn(`Skipping automatic use case detail fill: ${error instanceof Error ? error.message : error}`);
			return false;
		}
	}

	// Per request, not once at startup: chat history and whether a spec exists
	// both change while the server runs (the new-project wizard writes both).
	function renderShell(): string {
		const chatMode = diagramData.classes.length > 0 ? 'code' : useCaseData ? 'draft' : 'blank';
		return generateShellHTML(diagramName, {
			classCount: nodes.length,
			folderCount,
			edgeCount: edges.length
		}, getLayout(), getAuthStatus(), chatHistory, chatMode);
	}

	// A project with no code, no spec and a signed-in user is walked through the
	// new-project wizard instead of landing in an empty shell. Skipping it (or
	// finishing it) only lasts as long as this server does - reopening a project
	// that still has no spec shows it again.
	let newProjectDismissed = false;
	// The last drafted details, kept so a retry after a failed save (disk
	// permissions, say) does not pay for a second AI draft of the same choices.
	let lastDraft: { key: string; details: SpecDetails } | undefined;
	function wizardApplies(): boolean {
		return !!options.newProjectAi && !newProjectDismissed && diagramData.classes.length === 0 && !useCaseData
			// A spec file that exists but could not be read (permissions, bad JSON)
			// leaves useCaseData empty - the wizard must not offer to overwrite it.
			&& !hasCachedUseCaseDiagramData(workspacePath);
	}
	function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
		return new Promise((resolve, reject) => {
			let body = '';
			req.on('data', chunk => { body += chunk; });
			req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch (error) { reject(error); } });
			req.on('error', reject);
		});
	}
	function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
		res.writeHead(status, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(payload));
	}

	// The parse above (diagramData/nodes/edges) is the expensive part and
	// stays cached for the server's lifetime, but the two diagram pages
	// themselves are cheap to re-render - regenerating them fresh on every
	// request (rather than once at startup, like shellHtml above)
	// means a folder order/hidden/expanded change made from either page's
	// panel shows up correctly the next time *either* page loads, without
	// needing to restart the server. Baking them once was the original
	// approach and is what made cross-view sync only ever seem to work in
	// testing - restarting the server between checks papered over it.
	function renderClassDiagram(): string {
		const freshConfig = loadCliConfig(workspacePath, undefined, {});
		// hasLiveHost stays false - the view server doesn't yet listen for
		// the diagram's postMessage calls (Save/Settings/open-file). Wire
		// those up when the server actually handles them.
		return ClassDiagramView.generate(nodes, edges, diagramName, freshConfig, undefined, false);
	}
	function renderKnowledgeGraph(): string {
		return generateKnowledgeGraphHTML(buildKnowledgeGraphData(diagramName, nodes, edges));
	}
	function renderStackLayer(): string {
		const freshConfig = loadCliConfig(workspacePath, undefined, {});
		return generateStackLayerHTML(buildStackLayerData(diagramName, nodes, edges, freshConfig));
	}
	// Real data (a real extraction call's result, including overview/role/
	// description/nfrs - see useCaseExtraction.ts's prompt) or the real
	// "sign in / generate" empty-state card.
	function renderUseCaseDiagram(): string {
		if (useCaseData) return generateUseCaseDiagramHTML(visibleSpec(useCaseData));
		return generateUseCaseDiagramEmptyHTML(getAuthStatus().signedIn, diagramData.classes.length > 0);
	}
	// Real data or the real "sign in / generate" empty-state card - same
	// pattern as renderUseCaseDiagram.
	function renderDataModel(): string {
		if (dataModelData) return generateDataModelHTML(dataModelData);
		return generateDataModelEmptyHTML(getAuthStatus().signedIn, diagramData.classes.length > 0);
	}
	// The Progress page and its client report. The report prints in the order the user had on
	// screen when they pressed the button (see POST /api/progress/export-pdf).
	let progressReportOrder: string[] = [];
	function renderProgress(): string {
		return generateProgressHTML(useCaseData?.systemName || diagramName, useCaseData ? buildProgressRows(useCaseData) : []);
	}
	function renderProgressReport(): string {
		if (!useCaseData) return '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px">There is nothing to report yet.</body></html>';
		const all = buildProgressRows(useCaseData);
		const live = all.filter(r => !r.removedByAi);
		const byRef = new Map(live.map(r => [`${r.type}:${r.id}`, r]));
		const ordered = progressReportOrder.map(ref => byRef.get(ref)).filter((r): r is NonNullable<typeof r> => !!r);
		const missing = live.filter(r => !progressReportOrder.includes(`${r.type}:${r.id}`));
		return generateProgressReportHTML({
			spec: visibleSpec(useCaseData),
			rows: [...ordered, ...missing],
			allRows: all,
			asOf: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
		});
	}
	// Real data only, same pattern as renderUseCaseDiagram() - this doc is
	// built entirely from the Use Case Model, so it has nothing to show
	// until that's been generated for real.
	function renderRequirementsDoc(): string {
		if (useCaseData) return generateSrsDocHTML(visibleSpec(useCaseData), dataModelData);
		return generateSrsEmptyHTML(getAuthStatus().signedIn, diagramData.classes.length > 0);
	}

	// Re-runs the expensive parse (the refresh button's whole job) and
	// swaps out the cached diagramData/nodes/edges closures above -
	// renderClassDiagram/renderKnowledgeGraph/renderStackLayer read those same `let` bindings, so
	// the very next iframe reload picks up the new data with no other
	// wiring needed. Reloads config from disk too, in case selectedFolders/
	// extensions changed alongside the source.
	async function reparse(): Promise<ShellStats> {
		console.log(`Re-analyzing ${workspacePath}...`);
		const freshConfig = loadCliConfig(workspacePath, undefined, {});
		diagramData = await CodeParserService.parseWorkspace(workspacePath, freshConfig);

		if (freshConfig.gitDiff?.enabled !== false) {
			try {
				const baseCommit = freshConfig.gitDiff?.baseCommit || 'HEAD~1';
				await GitDiffEnricher.enrichWithGitDiff(diagramData, workspacePath, baseCommit);
			} catch (error) {
				console.warn(`Skipping git diff highlighting: ${error instanceof Error ? error.message : error}`);
			}
		}

		({ nodes, edges } = DiagramGeneratorService.generateReactFlowData(diagramData));
		folderCount = FolderStructureBuilder.countFolders(FolderStructureBuilder.build(nodes));

		return { classCount: nodes.length, folderCount, edgeCount: edges.length };
	}

	// Reads and parses a POST body, then hands it to `handle` - shared by
	// every /api/* route below so each one only has to say what it does
	// with the payload, not how to collect it.
	function handleJsonPost<T>(req: http.IncomingMessage, res: http.ServerResponse, handle: (payload: T) => void): void {
		let body = '';
		req.on('data', chunk => { body += chunk; });
		req.on('end', () => {
			try {
				handle(JSON.parse(body) as T);
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ ok: true }));
			} catch (error) {
				res.writeHead(400, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
			}
		});
	}

	const server = http.createServer((req, res) => {
		if (req.method === 'POST' && req.url === '/api/folder-order') {
			handleJsonPost<{ orders?: Record<string, number> }>(req, res, payload => {
				saveFolderOrder(workspacePath, payload.orders || {});
			});
			return;
		}
		if (req.method === 'POST' && req.url === '/api/folder-visibility') {
			handleJsonPost<{ path?: string; hidden?: boolean }>(req, res, payload => {
				// A workspace-root leaf's own path is the empty string - a
				// valid path, not a missing one, so check for undefined
				// specifically rather than falsiness.
				if (payload.path === undefined) throw new Error('Missing "path"');
				saveFolderVisibility(workspacePath, payload.path, !!payload.hidden);
			});
			return;
		}
		if (req.method === 'POST' && req.url === '/api/folder-expanded') {
			handleJsonPost<{ path?: string; expanded?: boolean }>(req, res, payload => {
				if (payload.path === undefined) throw new Error('Missing "path"');
				saveFolderExpanded(workspacePath, payload.path, !!payload.expanded);
			});
			return;
		}
		if (req.method === 'POST' && req.url === '/api/folder-panel-open') {
			handleJsonPost<{ open?: boolean }>(req, res, payload => {
				saveFolderPanelOpen(workspacePath, !!payload.open);
			});
			return;
		}
		if (req.method === 'POST' && req.url === '/api/layout') {
			handleJsonPost<Record<string, unknown>>(req, res, payload => {
				saveLayoutHook(payload);
			});
			return;
		}
		if (req.method === 'POST' && req.url === '/api/auth/start') {
			startSignInHook();
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ ok: true }));
			return;
		}
		if (req.method === 'GET' && req.url === '/api/auth/status') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify(getAuthStatus()));
			return;
		}
		if (req.method === 'POST' && req.url === '/api/auth/sign-out') {
			signOutHook();
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ ok: true }));
			return;
		}
		if (req.method === 'GET' && req.url === '/api/update-info') {
			(options.checkForUpdate ? options.checkForUpdate() : Promise.resolve(null))
				.catch(() => null)
				.then(update => sendJson(res, 200, { update }));
			return;
		}
		if (req.method === 'GET' && req.url === '/api/balance') {
			getBalanceHook().then(balance => {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(balance));
			});
			return;
		}
		if (req.method === 'POST' && req.url === '/api/use-case-diagram/generate') {
			(async () => {
				try {
					if (!generateUseCaseDiagramHook) throw new Error('Generation is only available in the kratai desktop app.');
					if (diagramData.classes.length === 0) throw new Error(NO_CODE_MESSAGE);
					// Not the full markdown export - see buildUseCaseExtractionSummary's
					// doc comment for why (measured ~15,700 input tokens/call on a
					// 110-class repo otherwise, almost all irrelevant implementation
					// detail). Built fresh from the current diagramData, not cached,
					// so a /api/refresh in between always reflects the latest code.
					const summary = buildUseCaseExtractionSummary(diagramData, diagramName);
					useCaseData = await generateUseCaseDiagramHook(summary, diagramName);
					saveCachedUseCaseDiagramData(workspacePath, useCaseData);
					// Same auto-chain as first-open's checklist (see
					// detailFillUseCaseModel's own comment) - this manual click
					// has no step-by-step progress UI to update, so its only
					// visible effect on failure is the console.warn inside
					// detailFillUseCaseModel itself; the response still reports
					// ok:true regardless, since the generated model is real and
					// useful either way.
					await detailFillUseCaseModel();
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ ok: true }));
				} catch (error) {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
				}
			})();
			return;
		}
		if (req.method === 'POST' && req.url === '/api/data-model/generate') {
			(async () => {
				try {
					if (!generateDataModelHook) throw new Error('Generation is only available in the kratai desktop app.');
					if (diagramData.classes.length === 0) throw new Error(NO_CODE_MESSAGE);
					// Built fresh from the current diagramData, not cached, so a
					// /api/refresh in between always reflects the latest code -
					// same reasoning as the use case model's own summary.
					const summary = buildDataModelExtractionSummary(diagramData, diagramName);
					dataModelData = await generateDataModelHook(summary, diagramName);
					saveCachedDataModelData(workspacePath, dataModelData);
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ ok: true }));
				} catch (error) {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
				}
			})();
			return;
		}
		if (req.method === 'POST' && req.url === '/api/requirements/metadata') {
			handleJsonPost<{ preparedBy?: string; clientName?: string }>(req, res, payload => {
				if (!useCaseData) throw new Error('Generate the Use Case Model before editing document metadata.');
				if (typeof payload.preparedBy === 'string') useCaseData.preparedBy = payload.preparedBy;
				if (typeof payload.clientName === 'string') useCaseData.clientName = payload.clientName;
				saveCachedUseCaseDiagramData(workspacePath, useCaseData);
			});
			return;
		}
		if (req.method === 'POST' && req.url === '/api/progress') {
			(async () => {
				try {
					if (!useCaseData) throw new Error('There is no spec to track yet.');
					const input = await readJsonBody(req) as ProgressAction;
					const result = applyProgressAction(useCaseData, input, userNameFromEmail(getAuthStatus().email));
					if (!result.ok) throw new Error(result.error);
					saveCachedUseCaseDiagramData(workspacePath, useCaseData);
					sendJson(res, 200, { ok: true, rows: buildProgressRows(useCaseData) });
				} catch (error) {
					sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
				}
			})();
			return;
		}
		if (req.method === 'POST' && req.url === '/api/progress/export-pdf') {
			(async () => {
				try {
					if (!exportProgressPdfHook) throw new Error('PDF export is only available in the kratai desktop app.');
					const { order } = await readJsonBody(req) as { order?: unknown };
					progressReportOrder = Array.isArray(order) ? order.filter((x): x is string => typeof x === 'string') : [];
					sendJson(res, 200, await exportProgressPdfHook());
				} catch (error) {
					sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
				}
			})();
			return;
		}
		if (req.method === 'POST' && req.url === '/api/requirements/export-pdf') {
			(async () => {
				try {
					if (!exportRequirementsPdfHook) throw new Error('PDF export is only available in the kratai desktop app.');
					const result = await exportRequirementsPdfHook();
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify(result));
				} catch (error) {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
				}
			})();
			return;
		}
		if (req.method === 'POST' && req.url === '/api/chat') {
			(async () => {
				let body = '';
				req.on('data', chunk => { body += chunk; });
				req.on('end', async () => {
					try {
						const { messages } = JSON.parse(body) as { messages?: ConversationMessage[] };
						if (!Array.isArray(messages) || messages.length === 0) throw new Error('Missing messages.');
						const { reply, uiActions } = await runChatLoop(messages);
						// messages is the client's own display history (already
						// includes the just-sent user turn) - only the final reply
						// needs adding, never the tool-call turns runChatLoop built
						// up internally for this one request.
						chatHistory = [...messages, { role: 'assistant', text: reply }];
						saveCachedChatHistory(workspacePath, chatHistory);
						res.writeHead(200, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ ok: true, reply, uiActions }));
						return;
					} catch (error) {
						res.writeHead(400, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
					}
				});
			})();
			return;
		}
		if (req.method === 'POST' && req.url === '/api/refresh') {
			reparse().then(stats => {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ ok: true, ...stats }));
			}).catch(error => {
				res.writeHead(400, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
			});
			return;
		}
		if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html') && wizardApplies()) {
			res.writeHead(302, { Location: '/new-project' });
			res.end();
			return;
		}
		if (req.method === 'POST' && req.url === '/api/new-project/ai') {
			(async () => {
				try {
					if (!options.newProjectAi) throw new Error('The new-project wizard is only available in the kratai desktop app.');
					const { step, input } = (await readJsonBody(req)) as { step?: string; input?: unknown };
					if (!NEW_PROJECT_STEPS.includes(step as NewProjectStep) || step === 'draft') throw new Error('Unknown wizard step.');
					sendJson(res, 200, { ok: true, data: await options.newProjectAi(step as NewProjectStep, input) });
				} catch (error) {
					sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
				}
			})();
			return;
		}
		if (req.method === 'POST' && req.url === '/api/new-project/create') {
			(async () => {
				try {
					if (!options.newProjectAi) throw new Error('The new-project wizard is only available in the kratai desktop app.');
					if (useCaseData || hasCachedUseCaseDiagramData(workspacePath)) throw new Error('This folder already has a spec, so kratai will not overwrite it.');
					const input = await readJsonBody(req);
					const choices = parseWizardChoices(input, diagramName);
					// Checked here too (not just in buildProjectSpec) so a hopeless request
					// never costs an AI call.
					if (!choices.actors.some(a => (choices.useCases[a.name] ?? []).length > 0)) throw new Error('Choose at least one actor and one use case.');
					const key = JSON.stringify(input);
					const details = lastDraft?.key === key ? lastDraft.details : await options.newProjectAi('draft', input) as SpecDetails;
					lastDraft = { key, details };
					const spec = buildProjectSpec(choices, details, diagramName);
					// Saved before the in-memory copies are set, so a failed write leaves
					// nothing half-created and "Try again" is allowed to run again.
					saveCachedUseCaseDiagramData(workspacePath, spec.useCaseData);
					saveCachedDataModelData(workspacePath, spec.dataModelData);
					useCaseData = spec.useCaseData;
					dataModelData = spec.dataModelData;
					// Recorded like a real chat turn so the model knows what the user
					// chose when they come back to change it, and the panel opens on
					// "here is the initial design" rather than an empty log.
					const outcome = describeWizardOutcome(choices, spec);
					chatHistory = [...chatHistory, { role: 'user', text: outcome.user }, { role: 'assistant', text: outcome.assistant }];
					saveCachedChatHistory(workspacePath, chatHistory);
					lastDraft = undefined;
					sendJson(res, 200, { ok: true });
				} catch (error) {
					sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
				}
			})();
			return;
		}
		if (req.method === 'POST' && req.url === '/api/new-project/skip') {
			newProjectDismissed = true;
			sendJson(res, 200, { ok: true });
			return;
		}
		const html = req.url === '/class-diagram' ? renderClassDiagram()
			: req.url === '/knowledge-graph' ? renderKnowledgeGraph()
			: req.url === '/stack-layer' ? renderStackLayer()
			: req.url === '/use-case-diagram' ? renderUseCaseDiagram()
			: req.url === '/data-model' ? renderDataModel()
			: req.url === '/progress' ? renderProgress()
			: req.url === '/progress-report' ? renderProgressReport()
			: req.url === '/srs-preview' ? renderRequirementsDoc()
			: req.url === '/new-project' ? (wizardApplies() ? generateNewProjectHTML(diagramName, options.logoDataUrl ?? '') : undefined)
			: renderShell();
		if (html === undefined) {
			res.writeHead(302, { Location: '/' });
			res.end();
			return;
		}
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(html);
	});

	await new Promise<void>((resolve) => server.listen(options.port, resolve));

	const url = `http://localhost:${options.port}`;
	console.log(`kratai view running at ${url} (Ctrl+C to stop)`);

	if (options.open) {
		await openFile(url);
	}

	return server;
}
