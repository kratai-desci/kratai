import { DiagramData } from '@kratai/analysis';
import { UseCaseDiagramData, DataModelData } from '@kratai-desci/llm';
import { specSection } from '@kratai-desci/spec';
import { buildUseCaseExtractionSummary } from './useCaseDiagramData.js';

/**
 * Everything the chat model needs in one text block: the existing
 * codebase-routes summary (buildUseCaseExtractionSummary) plus a full
 * plain-text dump of the Spec, when it exists - actors/use cases/NFRs/
 * narratives, data entities/relationships, and document metadata. Ids are
 * included so the model can reference exact existing items when it calls
 * one of the update_* tools (see chatToolDefinitions.ts) to edit them.
 */
export function buildChatSummary(
	diagramData: DiagramData,
	workspaceName: string,
	useCaseData: UseCaseDiagramData | undefined,
	dataModelData: DataModelData | undefined
): string {
	const noCode = diagramData.classes.length === 0
		? '\n\nNOTE: This workspace has NO CODE yet - there is nothing to read or extract from. The user is starting from scratch.\n'
		: '';
	return buildUseCaseExtractionSummary(diagramData, workspaceName) + noCode + specSection(useCaseData, dataModelData);
}
