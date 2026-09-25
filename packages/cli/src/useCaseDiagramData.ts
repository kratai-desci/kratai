import * as fs from 'fs';
import * as path from 'path';
import { DiagramData, ClassInfo } from '@kratai/analysis';
import { UseCaseDiagramData } from '@kratai-desci/llm';

// The shape itself is owned by @kratai-desci/llm - it's the contract the model's
// JSON output has to satisfy (see useCaseSchema.ts there), so it's defined
// once and re-exported here rather than duplicated.
export type { UseCaseDiagramData, UseCaseActor, UseCaseItem, UseCaseAssociation, UseCaseRelation, UseCaseNFR } from '@kratai-desci/llm';

const CACHE_FILE = 'kratai.usecases.json';

/**
 * Generated diagrams are cached workspace-locally (like kratai.local.json,
 * not Electron's global userData) since the content is about this specific
 * codebase, not a personal app preference - see loadCliConfig's own doc
 * comment in config.ts for the same distinction. Regeneration is always an
 * explicit action - either the manual "Generate"/"Regenerate" button
 * (view.ts's /api/use-case-diagram/generate route) or the desktop app's
 * first-open prompt (index.ts) - never silent, since it costs a real API call.
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

// Cheap existence check (no parse) - lets the desktop app decide whether to
// show its "generate now?" prompt (index.ts) without paying for a full
// loadCachedUseCaseDiagramData() JSON parse just to answer yes/no.
export function hasCachedUseCaseDiagramData(workspacePath: string): boolean {
	return fs.existsSync(path.join(workspacePath, CACHE_FILE));
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

