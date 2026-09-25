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

// generate() is view.ts's own closure (summary-building + the real
// generateUseCaseDiagram/generateDataModel proxy hook + saving to disk) -
// this file stays decoupled from how a summary gets built or which proxy
// hits kratai-web, same reasoning as updateUseCaseModel/updateDataModel
// staying decoupled from persistence (view.ts owns that too). Guarding
// against an existing model here, not just in the tool description, since
// a model can call a tool the prompt told it not to.
export interface SpecToolGenerators {
	generateUseCaseModel?: () => Promise<UseCaseDiagramData>;
	generateDataModel?: () => Promise<DataModelData>;
}

async function generateUseCaseModelTool(useCaseData: UseCaseDiagramData | undefined, generate: SpecToolGenerators['generateUseCaseModel']): Promise<SpecToolResult> {
	if (useCaseData) return { output: 'A Use Case Model already exists - use update_use_case_model to edit it instead of generating a new one.' };
	if (!generate) return { output: 'Generation is only available in the kratai desktop app.' };
	try {
		const generated = await generate();
		return { output: 'Use Case Model generated.', updatedUseCaseData: generated };
	} catch (error) {
		return { output: `Could not generate the Use Case Model: ${error instanceof Error ? error.message : String(error)}` };
	}
}

async function generateDataModelTool(dataModelData: DataModelData | undefined, generate: SpecToolGenerators['generateDataModel']): Promise<SpecToolResult> {
	if (dataModelData) return { output: 'A Data Model already exists - use update_data_model to edit it instead of generating a new one.' };
	if (!generate) return { output: 'Generation is only available in the kratai desktop app.' };
	try {
		const generated = await generate();
		return { output: 'Data Model generated.', updatedDataModelData: generated };
	} catch (error) {
		return { output: `Could not generate the Data Model: ${error instanceof Error ? error.message : String(error)}` };
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
 * Async (unlike a plain patch) because the generate_* tools are real
 * network calls to kratai-web, not just local JSON merging.
 */
export async function executeSpecTool(
	name: string,
	input: Record<string, unknown>,
	useCaseData: UseCaseDiagramData | undefined,
	dataModelData: DataModelData | undefined,
	generators: SpecToolGenerators = {}
): Promise<SpecToolResult> {
	switch (name) {
		case 'update_srs_metadata':
			return updateSrsMetadata(input, useCaseData);
		case 'update_use_case_model':
			return updateUseCaseModel(input, useCaseData);
		case 'update_data_model':
			return updateDataModel(input, dataModelData);
		case 'generate_use_case_model':
			return generateUseCaseModelTool(useCaseData, generators.generateUseCaseModel);
		case 'generate_data_model':
			return generateDataModelTool(dataModelData, generators.generateDataModel);
		default:
			return { output: `Unknown tool: ${name}` };
	}
}
