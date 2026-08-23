import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { CodeParserService, DiagramGeneratorService, GitDiffEnricher } from '@kratai/core';
import { ClassDiagramView } from '@kratai/diagram-view';
import { loadCliConfig } from '../config.js';
import { openFile } from '../openFile.js';

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
	// diagram's postMessage calls (Save/Settings/open-file), same as
	// `analyze --format html`'s static output. Wire those up when the
	// server actually handles them.
	const html = ClassDiagramView.generate(nodes, edges, diagramName, config, undefined, false);

	const server = http.createServer((_req, res) => {
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
