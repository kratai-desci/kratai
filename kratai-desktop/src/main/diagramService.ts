import * as fs from 'fs';
import * as path from 'path';
import {
	CodeParserService,
	DiagramGeneratorService,
	GitDiffEnricher,
	KrataiConfig,
	MarkdownExporter,
	DiagramData
} from '@kratai/core';
import { ClassDiagramView } from '@kratai/diagram-view';
import { getIconDataUri } from './icon';

// Mirrors apps/vsextension/src/commands/generateClassDiagram.ts's
// generateClassDiagramDirect flow: parse -> git diff enrich -> apply
// filters -> render. Keeps the last-generated diagramData in memory so
// exportMarkdown (triggered by a later, separate IPC call from the "Save as
// MD" button in the diagram) can reuse it, the same way the VS Code
// extension's onDidReceiveMessage closure reuses its local `diagramData`.
let lastDiagramData: DiagramData | undefined;

export async function generateDiagram(
	workspacePath: string,
	config: KrataiConfig,
	viewName: string
): Promise<{ html: string; classCount: number; relationshipCount: number }> {
	const diagramData = await CodeParserService.parseWorkspace(workspacePath, config);

	if (config.gitDiff?.enabled !== false) {
		const baseCommit = config.gitDiff?.baseCommit || 'HEAD~1';
		await GitDiffEnricher.enrichWithGitDiff(diagramData, workspacePath, baseCommit);
	}

	const classTypeFilters = config.classTypeFilters || {};
	if (Object.keys(classTypeFilters).length > 0) {
		diagramData.classes = diagramData.classes.filter(classInfo => {
			const type = classInfo.classType || 'class';
			return classTypeFilters[type] !== false;
		});
	}

	const relationshipTypeFilters = config.relationshipTypeFilters || {};
	if (Object.keys(relationshipTypeFilters).length > 0) {
		diagramData.relationships = diagramData.relationships.filter(rel => {
			const types: string[] = Array.isArray(rel.type) ? rel.type : [rel.type as string];
			return types.some(type => relationshipTypeFilters[type] === true);
		});
	}

	// Remove relationships referencing filtered-out classes
	const validClassIds = new Set(diagramData.classes.map(c => `${c.filePath}__${c.name}`));
	diagramData.relationships = diagramData.relationships.filter(rel =>
		validClassIds.has(rel.from) && validClassIds.has(rel.to)
	);

	lastDiagramData = diagramData;

	const { nodes, edges } = DiagramGeneratorService.generateReactFlowData(diagramData);
	const html = ClassDiagramView.generate(nodes, edges, viewName, config, getIconDataUri());

	return {
		html,
		classCount: diagramData.classes.length,
		relationshipCount: diagramData.relationships.length
	};
}

export function exportMarkdown(workspacePath: string, diagramName: string): { filePath: string } {
	if (!lastDiagramData) {
		throw new Error('No diagram has been generated yet - generate a diagram before exporting.');
	}

	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
		new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('Z')[0];
	const fileName = `${diagramName}_${timestamp}.md`;

	const exportsDir = path.join(workspacePath, '.kratai', 'exports');
	if (!fs.existsSync(exportsDir)) {
		fs.mkdirSync(exportsDir, { recursive: true });
	}

	const filePath = path.join(exportsDir, fileName);
	const markdownContent = MarkdownExporter.toMarkdown(lastDiagramData, diagramName);
	fs.writeFileSync(filePath, markdownContent, 'utf-8');

	return { filePath };
}
