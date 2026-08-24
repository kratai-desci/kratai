import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { CodeParserService, DiagramGeneratorService, GitDiffEnricher, FolderStructureBuilder, MarkdownExporter } from '@kratai/core';
import { ClassDiagramView } from '@kratai/diagram-view';
import { loadCliConfig, saveFolderExpanded, saveFolderOrder, saveFolderPanelOpen, saveFolderVisibility } from '../config.js';
import { openFile } from '../openFile.js';
import { generateShellHTML } from '../viewShell.js';
import { buildStackLayerData } from '../stackLayerData.js';
import { generateStackLayerHTML } from '../stackLayerView.js';

export interface ViewOptions {
	path: string;
	port: number;
	open: boolean;
}

export async function runView(options: ViewOptions): Promise<void> {
	const workspacePath = path.resolve(options.path);

	if (!fs.existsSync(workspacePath)) {
		throw new Error(`Path not found: ${workspacePath}`);
	}

	const config = loadCliConfig(workspacePath, undefined, {});
	const diagramName = path.basename(workspacePath);

	console.log(`Analyzing ${workspacePath}...`);
	const diagramData = await CodeParserService.parseWorkspace(workspacePath, config);

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

	const { nodes, edges } = DiagramGeneratorService.generateReactFlowData(diagramData);
	const folderCount = FolderStructureBuilder.countFolders(FolderStructureBuilder.build(nodes));
	const markdown = MarkdownExporter.toMarkdown(diagramData, diagramName);
	const shellHtml = generateShellHTML(diagramName, {
		classCount: nodes.length,
		folderCount,
		edgeCount: edges.length
	});

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
	function renderStackLayer(): string {
		const freshConfig = loadCliConfig(workspacePath, undefined, {});
		return generateStackLayerHTML(buildStackLayerData(diagramName, nodes, edges, freshConfig));
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
		const html = req.url === '/class-diagram' ? renderClassDiagram()
			: req.url === '/stack-layer' ? renderStackLayer()
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
}
