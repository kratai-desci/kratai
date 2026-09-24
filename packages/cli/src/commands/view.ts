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
import { loadCachedUseCaseDiagramData, saveCachedUseCaseDiagramData, buildUseCaseExtractionSummary, UseCaseDiagramData } from '../useCaseDiagramData.js';
import { generateUseCaseDiagramHTML, generateUseCaseDiagramEmptyHTML } from '../useCaseDiagramView.js';
import { loadCachedDataModelData, saveCachedDataModelData, buildDataModelExtractionSummary, DataModelData } from '../dataModelData.js';
import { generateDataModelHTML, generateDataModelEmptyHTML } from '../dataModelView.js';
import { buildDiffScorecard } from '../diffScorecardData.js';
import { generateDiffScorecardHTML } from '../diffScorecardView.js';
import { generateSrsDocHTML, generateSrsEmptyHTML } from '../srsDocView.js';
import { executeChatTool } from '../chatTools.js';
import { executeSpecTool } from '../chatSpecTools.js';
import { buildChatSummary } from '../chatContext.js';
import { UI_ACTION_TOOL_NAMES, SPEC_TOOL_NAMES } from '@kratai/llm';
import type { ConversationMessage, ChatStepResult } from '@kratai/llm';

export interface AuthStatus {
	signedIn: boolean;
	email: string | null;
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
	// a provider key directly anymore (see @kratai/llm, which kratai-web
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
}

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

	if (diagramData.classes.length === 0) {
		throw new Error('No classes found - check your folder/extension filters.');
	}

	let { nodes, edges } = DiagramGeneratorService.generateReactFlowData(diagramData);
	let folderCount = FolderStructureBuilder.countFolders(FolderStructureBuilder.build(nodes));
	// Generation is a manual, explicit action (see /api/use-case-diagram/
	// generate below) - a real API call, unlike the other views' free
	// re-renders - so whatever was last generated is loaded once here and
	// reused across requests/reparse, not regenerated on every reparse.
	let useCaseData: UseCaseDiagramData | undefined = loadCachedUseCaseDiagramData(workspacePath);
	let dataModelData: DataModelData | undefined = loadCachedDataModelData(workspacePath);
	const shellHtml = generateShellHTML(diagramName, {
		classCount: nodes.length,
		folderCount,
		edgeCount: edges.length
	}, getLayout(), getAuthStatus());

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
		if (useCaseData) return generateUseCaseDiagramHTML(useCaseData);
		return generateUseCaseDiagramEmptyHTML(getAuthStatus().signedIn);
	}
	// Real data or the real "sign in / generate" empty-state card - same
	// pattern as renderUseCaseDiagram.
	function renderDataModel(): string {
		if (dataModelData) return generateDataModelHTML(dataModelData);
		return generateDataModelEmptyHTML(getAuthStatus().signedIn);
	}
	function renderDiffScorecard(): string {
		return generateDiffScorecardHTML(buildDiffScorecard(diagramData, diagramName, useCaseData, dataModelData));
	}
	// Real data only, same pattern as renderUseCaseDiagram() - this doc is
	// built entirely from the Use Case Model, so it has nothing to show
	// until that's been generated for real.
	function renderRequirementsDoc(): string {
		if (useCaseData) return generateSrsDocHTML(useCaseData, dataModelData);
		return generateSrsEmptyHTML(getAuthStatus().signedIn);
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

		if (diagramData.classes.length === 0) {
			throw new Error('No classes found - check your folder/extension filters.');
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
		if (req.method === 'POST' && req.url === '/api/use-case-diagram/generate') {
			(async () => {
				try {
					if (!generateUseCaseDiagramHook) throw new Error('Generation is only available in the kratai desktop app.');
					// Not the full markdown export - see buildUseCaseExtractionSummary's
					// doc comment for why (measured ~15,700 input tokens/call on a
					// 110-class repo otherwise, almost all irrelevant implementation
					// detail). Built fresh from the current diagramData, not cached,
					// so a /api/refresh in between always reflects the latest code.
					const summary = buildUseCaseExtractionSummary(diagramData, diagramName);
					useCaseData = await generateUseCaseDiagramHook(summary, diagramName);
					saveCachedUseCaseDiagramData(workspacePath, useCaseData);
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
						if (!chatHook) throw new Error('Chat is only available in the kratai desktop app.');
						const { messages } = JSON.parse(body) as { messages?: ConversationMessage[] };
						if (!Array.isArray(messages) || messages.length === 0) throw new Error('Missing messages.');
						// Rebuilt fresh before every model turn (cheap - see
						// buildUseCaseExtractionSummary), not just once per request, so a
						// spec edit earlier in this same loop (or a mid-conversation
						// /api/refresh) is reflected in the very next turn. Includes the
						// full Spec (useCaseData/dataModelData), not just codebase
						// routes - see chatContext.ts.
						let summary = buildChatSummary(diagramData, diagramName, useCaseData, dataModelData);

						// The tool-call loop: each chatHook() call is one model turn
						// (one kratai-web round trip). When the model wants a tool, it
						// can only be executed here (this process holds diagramData) -
						// kratai-web just hands the request back rather than trying to
						// run it itself. Bounded so a model that never stops calling
						// tools can't hang the request forever.
						const conversation: ConversationMessage[] = [...messages];
						// UI-action calls (show_view/highlight_class) are pure side
						// effects for the shell's own browser JS to carry out - there's
						// nothing meaningful to hand back to the model as a "result", so
						// they get a trivial acknowledgment and are separately
						// accumulated here to ride along with the final reply. A
						// successful spec edit (SPEC_TOOL_NAMES) queues the same kind of
						// side effect - the shell reloading whichever view just changed.
						const uiActions: Array<{ type: string } & Record<string, unknown>> = [];
						const MAX_TOOL_ITERATIONS = 6;
						for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
							const step = await chatHook(conversation, diagramName, summary);
							if (step.done) {
								res.writeHead(200, { 'Content-Type': 'application/json' });
								res.end(JSON.stringify({ ok: true, reply: step.reply, uiActions }));
								return;
							}
							console.log(`[chat] turn ${i + 1}: ${step.toolCalls.map(c => `${c.name}(${JSON.stringify(c.input)})`).join(', ')}`);
							conversation.push({ role: 'assistant', text: step.assistantText, toolCalls: step.toolCalls });
							let specChanged = false;
							const toolResults = step.toolCalls.map(call => {
								if (UI_ACTION_TOOL_NAMES.has(call.name)) {
									uiActions.push({ type: call.name, ...call.input });
									return { toolCallId: call.id, output: 'Shown to the user.' };
								}
								if (SPEC_TOOL_NAMES.has(call.name)) {
									const result = executeSpecTool(call.name, call.input, useCaseData, dataModelData);
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
									return { toolCallId: call.id, output: result.output };
								}
								return { toolCallId: call.id, output: executeChatTool(call.name, call.input, diagramData) };
							});
							conversation.push({ role: 'user', toolResults });
							if (specChanged) summary = buildChatSummary(diagramData, diagramName, useCaseData, dataModelData);
						}
						// Ran out of tool budget. A follow-up call with allowTools:false
						// looked like the obvious fix, but testing showed Gemini doesn't
						// reliably honor "no tools declared" once its own history
						// already shows a tool-calling pattern - it can still emit a
						// function call (even hallucinating a nonexistent tool name),
						// so trusting the provider to stop can't be how this
						// terminates. Synthesizing directly from what was already
						// gathered is guaranteed to end the request, costs no extra
						// model call, and is honest about the limitation instead of
						// pretending the partial exploration was a complete answer.
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
		const html = req.url === '/class-diagram' ? renderClassDiagram()
			: req.url === '/knowledge-graph' ? renderKnowledgeGraph()
			: req.url === '/stack-layer' ? renderStackLayer()
			: req.url === '/use-case-diagram' ? renderUseCaseDiagram()
			: req.url === '/data-model' ? renderDataModel()
			: req.url === '/diff-scorecard' ? renderDiffScorecard()
			: req.url === '/srs-preview' ? renderRequirementsDoc()
			: shellHtml;
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
