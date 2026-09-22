import * as fs from 'fs';
import * as path from 'path';
import { DiagramData, ClassInfo } from '@kratai/analysis';
import { UseCaseActor, UseCaseDiagramData } from '@kratai/llm';

// The shape itself is owned by @kratai/llm - it's the contract the model's
// JSON output has to satisfy (see useCaseSchema.ts there), so it's defined
// once and re-exported here rather than duplicated.
export type { UseCaseDiagramData, UseCaseActor, UseCaseItem, UseCaseAssociation, UseCaseRelation, UseCaseNFR } from '@kratai/llm';

const CACHE_FILE = 'kratai.usecases.json';

/**
 * Generated diagrams are cached workspace-locally (like kratai.local.json,
 * not Electron's global userData) since the content is about this specific
 * codebase, not a personal app preference - see loadCliConfig's own doc
 * comment in config.ts for the same distinction. Regeneration is a manual
 * "Generate"/"Regenerate" action (view.ts's /api/use-case-diagram/generate
 * route), never automatic, since it costs a real API call.
 */
export function loadCachedUseCaseDiagramData(workspacePath: string): UseCaseDiagramData | undefined {
	const filePath = path.join(workspacePath, CACHE_FILE);
	if (!fs.existsSync(filePath)) return undefined;
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
	} catch (error) {
		console.error('Error loading cached use case diagram:', error);
		return undefined;
	}
}

export function saveCachedUseCaseDiagramData(workspacePath: string, data: UseCaseDiagramData): void {
	fs.writeFileSync(path.join(workspacePath, CACHE_FILE), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// Classes reachable from outside the system - the only ones a use case
// (an outside actor doing something to/with the system) can actually hinge
// on. 'route' gets its own section below (path + method, not just a name).
const ENTRY_POINT_TYPES = new Set<ClassInfo['classType']>([
	'route', 'page', 'server-action', 'controller', 'rest-controller', 'middleware'
]);

/**
 * A lean, use-case-focused summary of the codebase - deliberately NOT
 * MarkdownExporter's full export (used for the Download Markdown button),
 * which includes every class's full property/method signatures and
 * Uses/Used-By relationship graph. Measured on kratai's own 110-class repo:
 * the full export cost ~15,700 input tokens per generate call, the large
 * majority of it internal implementation detail - services, repositories,
 * entities, framework plumbing - that never maps to a distinct actor-facing
 * capability (a use case cares what GET /api/users/:id does, never how
 * GitOperations.getFileLineDiff is implemented). This only includes what's
 * reachable from outside the system (HTTP routes, pages, server actions,
 * controllers, middleware) plus the folder structure for broader context
 * where no such entry point was detected at all (e.g. a library).
 */
export function buildUseCaseExtractionSummary(diagramData: DiagramData, workspaceName: string): string {
	const entryPoints = diagramData.classes.filter(c => c.classType && ENTRY_POINT_TYPES.has(c.classType));
	const lines: string[] = [`# ${workspaceName}`, ''];

	const routes = entryPoints.filter((c): c is ClassInfo & { routeMeta: NonNullable<ClassInfo['routeMeta']> } =>
		c.classType === 'route' && !!c.routeMeta);
	if (routes.length > 0) {
		lines.push('## HTTP routes');
		routes.forEach(c => lines.push(`- ${c.routeMeta.method} ${c.routeMeta.path}`));
		lines.push('');
	}

	const otherEntryPoints = entryPoints.filter(c => c.classType !== 'route');
	if (otherEntryPoints.length > 0) {
		lines.push('## Other entry points (pages, controllers, server actions, middleware)');
		otherEntryPoints.forEach(c => lines.push(`- ${c.name} (${c.classType}) - ${c.filePath}`));
		lines.push('');
	}

	// Gives the model feature-area context even where nothing above was
	// detected at all (a library with no HTTP layer, say) - just directory
	// names, not the full per-file tree MarkdownExporter renders.
	const folders = Array.from(new Set(
		diagramData.classes.map(c => path.dirname(c.filePath)).filter(f => f !== '.')
	)).sort();
	if (folders.length > 0) {
		lines.push('## Folder structure');
		folders.forEach(f => lines.push(`- ${f}`));
	}

	return lines.join('\n');
}

/**
 * Doubles as both a UI-preview fixture (the original reason it exists -
 * see the note it used to carry) and, for now, the default content of
 * the Use Case Diagram view itself (see view.ts's renderUseCaseDiagram):
 * real extraction only produces actors/useCases/associations/relations,
 * not overview/role/description/nfrs, so this is also where those new
 * fields' target shape lives until the extraction prompt grows to match.
 *
 * Modeled on kratai itself rather than a generic placeholder app - the
 * actors/useCases/associations/relations below match what real extraction
 * already produced for this exact repo (kratai.usecases.json, generated
 * earlier this session), so this doubles as dogfooding: if the shape looks
 * right/useful for kratai's own use case model, it's a real signal, not a
 * guess at some other product's requirements.
 */
export function buildMockUseCaseDiagramData(workspaceName: string): UseCaseDiagramData {
	return {
		workspaceName,
		systemName: workspaceName,
		overview: `${workspaceName} parses a codebase and renders its architecture - class diagram, knowledge graph, use case model - so a developer can explore and document it without leaving their editor. Diagram generation and the in-app chat assistant are both powered by a hosted LLM call, authenticated and billed against the developer's signed-in account rather than a local API key.`,
		actors: [
			{ id: 'developer', name: 'Developer', side: 'left', role: 'Primary user', description: 'Runs kratai against their own codebase to explore its structure, generate diagrams, and chat with the AI about the architecture.' },
			{ id: 'llm-service', name: 'External LLM Service', side: 'right', role: 'AI provider (Anthropic/Gemini)', description: "Called server-side (kratai-web) to extract use cases, generate diagrams, and answer architecture questions - the desktop app never holds a provider key directly." }
		] satisfies UseCaseActor[],
		useCases: [
			{ id: 'analyze-repository', name: 'Analyze Source\nRepository', description: 'Parses the selected folder into a structured DiagramData model - classes, folders, relationships - the one shared dataset every other view (graph, class diagram, use case model) renders from.' },
			{ id: 'generate-diagram', name: 'Generate Architecture\nDiagram', description: 'Triggers the Use Case Model generation call: a lean, entry-points-only summary of the parsed repo is sent to the hosted LLM, which returns actors, use cases, and their relationships.' },
			{ id: 'view-diagram', name: 'View Interactive\nDiagram', description: 'Renders the parsed architecture as an interactive diagram - Knowledge Graph, Class Diagram, or Use Case Model - with hover/click tracing of what connects to what.' },
			{ id: 'export-diagram', name: 'Export Diagram', description: 'Downloads the current architecture as a plain Markdown file the developer can drop into their own docs or paste into another tool.' },
			{ id: 'enrich-analysis', name: 'Enrich Codebase\nContext with LLM', description: 'The External LLM Service reads the pruned entry-points summary and infers actors/use cases from it - the one step in this flow that actually costs hosted credit.' },
			{ id: 'configure-analysis-path', name: 'Configure Target\nPath', description: 'Lets the developer point kratai at a specific folder/workspace to analyze, instead of always defaulting to the current directory.' },
			{ id: 'run-cli-commands', name: 'Execute CLI\nCommands', description: 'The plain-CLI entry point (`kratai analyze` / `kratai view`) for developers who want the same analysis outside the desktop app, e.g. in CI or a terminal-only workflow.' }
		],
		associations: [
			{ actorId: 'developer', useCaseId: 'analyze-repository' },
			{ actorId: 'developer', useCaseId: 'view-diagram' },
			{ actorId: 'developer', useCaseId: 'export-diagram' },
			{ actorId: 'developer', useCaseId: 'configure-analysis-path' },
			{ actorId: 'developer', useCaseId: 'run-cli-commands' },
			{ actorId: 'llm-service', useCaseId: 'enrich-analysis' }
		],
		relations: [
			{ kind: 'include', fromId: 'generate-diagram', toId: 'analyze-repository' },
			{ kind: 'extend', fromId: 'enrich-analysis', toId: 'generate-diagram' },
			{ kind: 'extend', fromId: 'export-diagram', toId: 'view-diagram' }
		],
		nfrs: [
			{ id: 'nfr-billing', useCaseId: null, name: 'Hosted billing only', text: "Generation calls must be authenticated and debited against the signed-in user's hosted credit balance - never a local API key." },
			{ id: 'nfr-nonblocking-parse', useCaseId: null, name: 'Non-blocking parse', text: 'The view server must serve the last-parsed result immediately; re-parsing only happens on an explicit Refresh, never blocking page load.' },
			{ id: 'nfr-lean-context', useCaseId: 'enrich-analysis', name: 'Lean LLM context', text: 'Input sent to the LLM must be pruned to entry points only, not a full codebase export - measured 96% token reduction on this same repo.' },
			{ id: 'nfr-portable-export', useCaseId: 'export-diagram', name: 'Portable export format', text: 'Exported Markdown must stay valid outside kratai - no proprietary format - so it is usable in any doc tool.' }
		]
	};
}
