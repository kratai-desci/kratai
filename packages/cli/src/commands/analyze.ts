import * as fs from 'fs';
import * as path from 'path';
import { CodeParserService, DiagramGeneratorService, GitDiffEnricher, MarkdownExporter } from '@kratai/core';
import { ClassDiagramView } from '@kratai/diagram-view';
import { loadCliConfig } from '../config.js';
import { openFile } from '../openFile.js';

export interface AnalyzeOptions {
	path: string;
	output?: string;
	configPath?: string;
	name?: string;
	folders?: string;
	format: 'html' | 'md';
	gitDiff: boolean;
	open: boolean;
}

export async function runAnalyze(options: AnalyzeOptions): Promise<void> {
	const workspacePath = path.resolve(options.path);

	if (!fs.existsSync(workspacePath)) {
		throw new Error(`Path not found: ${workspacePath}`);
	}

	const config = loadCliConfig(workspacePath, options.configPath, {
		folders: options.folders?.split(',').map(f => f.trim()).filter(Boolean),
		gitDiff: options.gitDiff
	});

	const diagramName = options.name || path.basename(workspacePath);

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

	const content = options.format === 'md'
		? MarkdownExporter.toMarkdown(diagramData, diagramName)
		: (() => {
			const { nodes, edges } = DiagramGeneratorService.generateReactFlowData(diagramData);
			return ClassDiagramView.generate(nodes, edges, diagramName, config, undefined, true);
		})();

	const outputPath = path.resolve(options.output || `kratai-diagram.${options.format}`);
	fs.writeFileSync(outputPath, content, 'utf-8');

	console.log(`Wrote ${diagramData.classes.length} classes, ${diagramData.relationships.length} relationships -> ${outputPath}`);

	if (options.open) {
		await openFile(outputPath);
	}
}
