import { UseCaseDiagramData, DataModelData, validateUseCaseModelOutput, validateDataModelOutput } from '@kratai-desci/llm';

export interface SpecToolResult {
	output: string;
	updatedUseCaseData?: UseCaseDiagramData;
	updatedDataModelData?: DataModelData;
}

function updateSrsMetadata(input: Record<string, unknown>, useCaseData: UseCaseDiagramData | undefined): SpecToolResult {
	if (!useCaseData) return { output: 'No Use Case Model exists yet - generate one first before editing document metadata.' };
	const updated: UseCaseDiagramData = { ...useCaseData };
	const changed: string[] = [];
	if (typeof input.preparedBy === 'string') {
		updated.preparedBy = input.preparedBy;
		changed.push(`prepared by: "${input.preparedBy}"`);
	}
	if (typeof input.clientName === 'string') {
		updated.clientName = input.clientName;
		changed.push(`client: "${input.clientName}"`);
	}
	if (changed.length === 0) return { output: 'No fields provided to update.' };
	return { output: `Updated ${changed.join(', ')}.`, updatedUseCaseData: updated };
}

// Patch semantics: `{ ...current, ...input }` overlays only the top-level
// keys the model actually provided onto the current data, then
// validateUseCaseModelOutput/validateDataModelOutput - the exact same
// functions that sanitize real LLM extraction output - re-validate the
// result (dropping malformed entries/dangling references, and, for the use
// case model, throwing if the edit would leave zero actors or use cases -
// a safety net against an edit wiping the model out, not just a parsing
// nicety). workspaceName/systemName/preparedBy/clientName live outside
// what the validators touch, so they're preserved by spreading the
// validated result back onto `current` rather than replacing it wholesale.

function updateUseCaseModel(input: Record<string, unknown>, useCaseData: UseCaseDiagramData | undefined): SpecToolResult {
	if (!useCaseData) return { output: 'No Use Case Model exists yet - generate one first before editing it.' };
	try {
		const merged = { ...useCaseData, ...input };
		const validated = validateUseCaseModelOutput(merged);
		return { output: 'Use Case Model updated.', updatedUseCaseData: { ...useCaseData, ...validated } };
	} catch (error) {
		return { output: `Could not update the Use Case Model: ${error instanceof Error ? error.message : String(error)}` };
	}
}

function updateDataModel(input: Record<string, unknown>, dataModelData: DataModelData | undefined): SpecToolResult {
	if (!dataModelData) return { output: 'No Data Model exists yet - generate one first before editing it.' };
	try {
		const merged = { ...dataModelData, ...input };
		const validated = validateDataModelOutput(merged);
		return { output: 'Data Model updated.', updatedDataModelData: { ...dataModelData, ...validated } };
	} catch (error) {
		return { output: `Could not update the Data Model: ${error instanceof Error ? error.message : String(error)}` };
	}
}

/**
 * The mutating counterpart of chatTools.ts's executeChatTool - routed
 * separately in view.ts's chat loop (see SPEC_TOOL_NAMES in
 * chatToolDefinitions.ts) since these need the live useCaseData/
 * dataModelData plus the save functions that persist them, none of which
 * executeChatTool's read-only DiagramData access has. Returns the updated
 * object(s) rather than mutating in place - view.ts owns reassigning its
 * own `let` and saving to disk, same as the real Generate routes already do.
 */
export function executeSpecTool(
	name: string,
	input: Record<string, unknown>,
	useCaseData: UseCaseDiagramData | undefined,
	dataModelData: DataModelData | undefined
): SpecToolResult {
	switch (name) {
		case 'update_srs_metadata':
			return updateSrsMetadata(input, useCaseData);
		case 'update_use_case_model':
			return updateUseCaseModel(input, useCaseData);
		case 'update_data_model':
			return updateDataModel(input, dataModelData);
		default:
			return { output: `Unknown tool: ${name}` };
	}
}
