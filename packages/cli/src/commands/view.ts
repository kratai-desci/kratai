import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { CodeParserService, DiagramGeneratorService, GitDiffEnricher, FolderStructureBuilder, MarkdownExporter } from '@kratai/core';
import { ClassDiagramView } from '@kratai/diagram-view';
import { loadCliConfig, saveFolderOrder } from '../config.js';
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
	// hasLiveHost stays false - the view server doesn't yet listen for the
	// diagram's postMessage calls (Save/Settings/open-file). Wire those up
	// when the server actually handles them.
	const classDiagramHtml = ClassDiagramView.generate(nodes, edges, diagramName, config, undefined, false);
	const folderCount = FolderStructureBuilder.countFolders(FolderStructureBuilder.build(nodes));
	const stackLayerHtml = generateStackLayerHTML(buildStackLayerData(diagramName, nodes, edges, config));
	const markdown = MarkdownExporter.toMarkdown(diagramData, diagramName);
	const shellHtml = generateShellHTML(diagramName, {
		classCount: nodes.length,
		folderCount,
		edgeCount: edges.length
	});

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
			let body = '';
			req.on('data', chunk => { body += chunk; });
			req.on('end', () => {
				try {
					const payload = JSON.parse(body) as { orders?: Record<string, number> };
					saveFolderOrder(workspacePath, payload.orders || {});
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ ok: true }));
				} catch (error) {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
				}
			});
			return;
		}
		const html = req.url === '/class-diagram' ? classDiagramHtml
			: req.url === '/stack-layer' ? stackLayerHtml
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
