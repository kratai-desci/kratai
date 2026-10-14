import { UseCaseDiagramData, DataModelData, validateUseCaseModelOutput, validateDataModelOutput } from '@kratai-desci/llm';
import { reconcileAiEdit } from './progressData.js';

export interface SpecToolResult {
	output: string;
	updatedUseCaseData?: UseCaseDiagramData;
	updatedDataModelData?: DataModelData;
}

function updateSrsMetadata(input: Record<string, unknown>, useCaseData: UseCaseDiagramData | undefined): SpecToolResult {
	if (!useCaseData) return { output: 'No Use Case Model exists yet - generate one first before editing document metadata.' };
	const updated: UseCaseDiagramData = { ...useCaseData };
	const changed: string[] = [];
	if (typeof input.systemName === 'string' && input.systemName.trim()) {
		updated.systemName = input.systemName.trim();
		changed.push(`project name: "${updated.systemName}"`);
	}
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

function updateUseCaseModel(input: Record<string, unknown>, useCaseData: UseCaseDiagramData | undefined, workspaceName?: string): SpecToolResult {
	if (!useCaseData) {
		// Nothing to edit yet: build the first one from what was provided, run
		// through the same validator (which still requires at least one actor
		// and one use case) - how a project with no code gets a Use Case Model,
		// since there's nothing for generate_use_case_model to extract from.
		if (!workspaceName) return { output: 'No Use Case Model exists yet - generate one first before editing it.' };
		try {
			const validated = validateUseCaseModelOutput(input);
			return { output: 'Use Case Model created.', updatedUseCaseData: { workspaceName, systemName: workspaceName, ...validated } };
		} catch (error) {
			return { output: `Could not create the Use Case Model: ${error instanceof Error ? error.message : String(error)}` };
		}
	}
	try {
		const merged = { ...useCaseData, ...input };
		const validated = validateUseCaseModelOutput(merged);
		// The validator drops status/priority/closedBy (people set those, never the model), so
		// they are put back by id here - and an edit or removal of an item that has progress is
		// flagged for the user instead of silently applied (see progressData.ts).
		const reconciled = reconcileAiEdit(useCaseData, {
			actors: validated.actors, useCases: validated.useCases, associations: validated.associations,
			relations: validated.relations, nfrs: validated.nfrs ?? []
		});
		const updated: UseCaseDiagramData = {
			...useCaseData, ...validated,
			useCases: reconciled.useCases, associations: reconciled.associations, relations: reconciled.relations
		};
		if (reconciled.nfrs.length > 0) updated.nfrs = reconciled.nfrs; else delete updated.nfrs;
		return { output: ['Use Case Model updated.', ...reconciled.notes].join(' '), updatedUseCaseData: updated };
	} catch (error) {
		return { output: `Could not update the Use Case Model: ${error instanceof Error ? error.message : String(error)}` };
	}
}

function updateDataModel(input: Record<string, unknown>, dataModelData: DataModelData | undefined, workspaceName?: string): SpecToolResult {
	if (!dataModelData) {
		if (!workspaceName) return { output: 'No Data Model exists yet - generate one first before editing it.' };
		try {
			const validated = validateDataModelOutput(input);
			return { output: 'Data Model created.', updatedDataModelData: { workspaceName, ...validated } };
		} catch (error) {
			return { output: `Could not create the Data Model: ${error instanceof Error ? error.message : String(error)}` };
		}
	}
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
	// Needed only to create a model that doesn't exist yet (a project with no
	// code) - an existing one already carries its own name.
	workspaceName?: string;
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
			return updateUseCaseModel(input, useCaseData, generators.workspaceName);
		case 'update_data_model':
			return updateDataModel(input, dataModelData, generators.workspaceName);
		case 'generate_use_case_model':
			return generateUseCaseModelTool(useCaseData, generators.generateUseCaseModel);
		case 'generate_data_model':
			return generateDataModelTool(dataModelData, generators.generateDataModel);
		default:
			return { output: `Unknown tool: ${name}` };
	}
}
