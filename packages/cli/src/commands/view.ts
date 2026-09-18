import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { CodeParserService, DiagramGeneratorService, GitDiffEnricher, FolderStructureBuilder, MarkdownExporter } from '@kratai/analysis';
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
	generateUseCaseDiagram?: (markdown: string, workspaceName: string) => Promise<UseCaseDiagramData>;
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
	let markdown = MarkdownExporter.toMarkdown(diagramData, diagramName, config.folders);
	// Generation is a manual, explicit action (see /api/use-case-diagram/
	// generate below) - a real API call, unlike the other views' free
	// re-renders - so whatever was last generated is loaded once here and
	// reused across requests/reparse, not regenerated on every reparse.
	let useCaseData: UseCaseDiagramData | undefined = loadCachedUseCaseDiagramData(workspacePath);
	const shellHtml = generateShellHTML(diagramName, {
		classCount: nodes.length,
		folderCount,
		edgeCount: edges.length
	}, getLayout(), getAuthStatus());

	// The parse above (diagramData/nodes/edges) is the expensive part and
	// stays cached for the server's lifetime, but the two diagram pages
	// themselves are cheap to re-render - regenerating them fresh on every
	// request (rather than once at startup, like markdown/shellHtml above)
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
	function renderUseCaseDiagram(): string {
		if (useCaseData) return generateUseCaseDiagramHTML(useCaseData);
		return generateUseCaseDiagramEmptyHTML(getAuthStatus().signedIn);
	}

	// Re-runs the expensive parse (the refresh button's whole job) and
	// swaps out the cached diagramData/nodes/edges/markdown closures above -
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
		markdown = MarkdownExporter.toMarkdown(diagramData, diagramName, freshConfig.folders);

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
		if (req.url === '/download.md') {
			res.writeHead(200, {
				'Content-Type': 'text/markdown; charset=utf-8',
				'Content-Disposition': `attachment; filename="${diagramName}.md"`
			});
			res.end(markdown);
			return;
		}
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
