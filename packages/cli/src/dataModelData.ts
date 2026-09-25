import * as fs from 'fs';
import * as path from 'path';
import { DiagramData, ClassInfo } from '@kratai/analysis';
import { DataModelData } from '@kratai-desci/llm';

// The shape itself is owned by @kratai-desci/llm - it's the contract the model's
// JSON output has to satisfy (see dataModelSchema.ts there), so it's
// defined once and re-exported here rather than duplicated - same split
// useCaseDiagramData.ts uses for the Use Case Model.
export type { DataModelData, DataEntity, DataAttribute, DataRelationship } from '@kratai-desci/llm';

const CACHE_FILE = 'kratai.datamodel.json';

/**
 * A separate file from kratai.usecases.json - one committed artifact per
 * spec concern, so generating/editing one doesn't touch the other. Same
 * workspace-local (not Electron userData) treatment as the use case
 * model's cache - see that file's own doc comment for why.
 */
export function loadCachedDataModelData(workspacePath: string): DataModelData | undefined {
	const filePath = path.join(workspacePath, CACHE_FILE);
	if (!fs.existsSync(filePath)) return undefined;
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
	} catch (error) {
		console.error('Error loading cached data model:', error);
		return undefined;
	}
}

export function saveCachedDataModelData(workspacePath: string, data: DataModelData): void {
	fs.writeFileSync(path.join(workspacePath, CACHE_FILE), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// Cheap existence check (no parse) - see useCaseDiagramData.ts's
// hasCachedUseCaseDiagramData for why this exists alongside the full loader.
export function hasCachedDataModelData(workspacePath: string): boolean {
	return fs.existsSync(path.join(workspacePath, CACHE_FILE));
}

const DATA_MODEL_TYPES = new Set<ClassInfo['classType']>(['entity', 'repository']);
const MAX_SUMMARY_CLASSES = 60;

/**
 * The data-model sibling of buildUseCaseExtractionSummary (that file) -
 * entities/attributes instead of actor-facing capabilities. Primary
 * signal is classType 'entity'/'repository' (populated for JPA/Spring-
 * style ORM usage - see ClassInfo.entityMeta/repositoryMeta), with a
 * fallback for every other stack: a class with fields and no real
 * behavior (no methods) reads as a plain data model/DTO regardless of
 * language - TS interfaces, Python dataclasses, etc. Capped rather than
 * exhaustive - most codebases have far more DTOs than genuinely distinct
 * domain entities, and every extra class is tokens the model has to read
 * for a proportionally smaller signal gain.
 */
export function buildDataModelExtractionSummary(diagramData: DiagramData, workspaceName: string): string {
	const tagged = diagramData.classes.filter(c => c.classType && DATA_MODEL_TYPES.has(c.classType));
	const plainDataClasses = diagramData.classes.filter(c =>
		!(c.classType && DATA_MODEL_TYPES.has(c.classType)) && c.properties.length > 0 && c.methods.length === 0
	);
	const candidates = [...tagged, ...plainDataClasses].slice(0, MAX_SUMMARY_CLASSES);

	const lines: string[] = [`# ${workspaceName}`, ''];
	if (candidates.length === 0) {
		lines.push('No ORM entities, repositories, or plain data-holder classes were detected in this codebase.');
		return lines.join('\n');
	}

	lines.push('## Data-model-relevant classes');
	candidates.forEach(c => {
		lines.push(`- ${c.name} (${c.classType || 'class'}) - ${c.filePath}`);
		if (c.entityMeta?.tableName) lines.push(`  table: ${c.entityMeta.tableName}`);
		if (c.entityMeta?.primaryKey) lines.push(`  primary key: ${c.entityMeta.primaryKey}`);
		if (c.repositoryMeta?.entityType) lines.push(`  manages entity: ${c.repositoryMeta.entityType}`);
		c.properties.forEach(p => lines.push(`  - ${p.name}: ${p.type}`));
	});

	return lines.join('\n');
}

