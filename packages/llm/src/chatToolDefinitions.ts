import { ToolDefinition } from './llmClient.js';

/**
 * The contract only - name/description/schema, declared to the model.
 * Execution lives in @kratai/cli's chatTools.ts, which is the only layer
 * with access to a codebase's actual parsed data (DiagramData) - this
 * package stays analysis-agnostic on purpose (see the file-level comment
 * in index.ts). kratai-web declares these tools to the model; when the
 * model calls one, kratai-web hands the request back to the desktop app to
 * actually execute (see /api/chat's own doc comment for why it can't run
 * these itself).
 */
export const CHAT_TOOL_DEFINITIONS: ToolDefinition[] = [
	{
		name: 'search_classes',
		description: 'Search for classes/files by name or keyword substring. Returns matching names, types, and folder paths.',
		inputSchema: {
			type: 'object',
			properties: { query: { type: 'string', description: 'Name or keyword to search for' } },
			required: ['query']
		}
	},
	{
		name: 'get_class_detail',
		description: 'Get full detail for one class or file by exact name: its properties, methods, and relationships to other classes.',
		inputSchema: {
			type: 'object',
			properties: { name: { type: 'string', description: 'Exact class/file name, as returned by search_classes' } },
			required: ['name']
		}
	},
	{
		name: 'trace_reachability',
		description: 'Find whether and how one class can reach another through the dependency graph (calls, imports, etc.), forward or backward.',
		inputSchema: {
			type: 'object',
			properties: {
				from: { type: 'string', description: 'Starting class/file name' },
				to: { type: 'string', description: 'Target class/file name' }
			},
			required: ['from', 'to']
		}
	},
	{
		name: 'what_changed',
		description: 'List classes/files that were added, modified, or deleted according to the git diff against the base commit.',
		inputSchema: { type: 'object', properties: {} }
	},
	{
		name: 'get_folder_structure',
		description: 'Get the full folder/directory structure of the codebase.',
		inputSchema: { type: 'object', properties: {} }
	},
	{
		name: 'show_view',
		description: 'Change which diagram view is currently on screen, so the user sees it rather than just reading about it. Call this before highlight_class if the Knowledge Graph view is not already visible.',
		inputSchema: {
			type: 'object',
			properties: {
				view: {
					type: 'string',
					enum: ['graph', 'class', 'stack', 'usecase', 'data', 'srs'],
					description: '"graph" = 3D Knowledge Graph, "class" = Class Diagram, "stack" = 3D Stack Layer, "usecase" = Use Case Model, "data" = Data Model, "srs" = the Spec document'
				}
			},
			required: ['view']
		}
	},
	{
		name: 'highlight_class',
		description: 'Highlight a specific class/file and what it connects to in the Knowledge Graph view (switches to it first if needed). Use this whenever your answer references a specific class, so the user can see it, not just read about it.',
		inputSchema: {
			type: 'object',
			properties: { name: { type: 'string', description: 'Exact class/file name, as returned by search_classes' } },
			required: ['name']
		}
	},
	{
		name: 'update_srs_metadata',
		description: 'Edit the Spec document\'s header metadata. Only include the field(s) you want to change - an omitted field is left as-is.',
		inputSchema: {
			type: 'object',
			properties: {
				preparedBy: { type: 'string', description: 'Name of the person or company preparing the document' },
				clientName: { type: 'string', description: 'Name of the client this document is for (optional)' }
			}
		}
	},
	{
		name: 'update_use_case_model',
		description: 'Edit the Use Case Model. Only include the top-level field(s) you want to change - an omitted field is left as-is. IMPORTANT: "actors", "useCases", "associations", "relations", and "nfrs" each REPLACE the entire current list, not merge into it - to add one actor, pass every existing actor from the summary above plus the new one, not just the new one alone. Existing ids must be reused exactly (as given in the summary) to keep an item the same; a new item needs a new unique kebab-case id. The edit is rejected if it would leave zero actors or zero use cases.',
		inputSchema: {
			type: 'object',
			properties: {
				overview: { type: 'string', description: '1-2 sentence project-goal blurb' },
				narrative: { type: 'string', description: 'Role-by-role plain-language explanation of who the actors are and what they do' },
				actors: {
					type: 'array',
					description: 'The COMPLETE replacement list of actors',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							name: { type: 'string' },
							side: { type: 'string', enum: ['left', 'right'] },
							role: { type: 'string' },
							description: { type: 'string' }
						},
						required: ['id', 'name']
					}
				},
				useCases: {
					type: 'array',
					description: 'The COMPLETE replacement list of use cases',
					items: {
						type: 'object',
						properties: { id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' } },
						required: ['id', 'name']
					}
				},
				associations: {
					type: 'array',
					description: 'The COMPLETE replacement list of actor-to-use-case links',
					items: {
						type: 'object',
						properties: { actorId: { type: 'string' }, useCaseId: { type: 'string' } },
						required: ['actorId', 'useCaseId']
					}
				},
				relations: {
					type: 'array',
					description: 'The COMPLETE replacement list of <<include>>/<<extend>> links between use cases',
					items: {
						type: 'object',
						properties: {
							kind: { type: 'string', enum: ['include', 'extend'] },
							fromId: { type: 'string' },
							toId: { type: 'string' }
						},
						required: ['kind', 'fromId', 'toId']
					}
				},
				nfrs: {
					type: 'array',
					description: 'The COMPLETE replacement list of non-functional requirements',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							useCaseId: { type: 'string', description: 'A use case id above, to scope this NFR to one capability. Omit this key entirely for a project-wide NFR - do not pass an empty string or null.' },
							name: { type: 'string' },
							text: { type: 'string' }
						},
						required: ['id', 'name', 'text']
					}
				}
			}
		}
	},
	{
		name: 'update_data_model',
		description: 'Edit the Data Model. Only include the top-level field(s) you want to change - an omitted field is left as-is. IMPORTANT: "entities" and "relationships" each REPLACE the entire current list, not merge into it - to add one entity, pass every existing entity from the summary above plus the new one, not just the new one alone. Existing ids must be reused exactly (as given in the summary) to keep an item the same; a new item needs a new unique kebab-case id.',
		inputSchema: {
			type: 'object',
			properties: {
				narrative: { type: 'string', description: 'Short conceptual paragraph explaining how the entities relate and why' },
				entities: {
					type: 'array',
					description: 'The COMPLETE replacement list of entities',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							name: { type: 'string' },
							attributes: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										name: { type: 'string' },
										type: { type: 'string' },
										isPK: { type: 'boolean' },
										isFK: { type: 'boolean' }
									},
									required: ['name', 'type']
								}
							}
						},
						required: ['id', 'name']
					}
				},
				relationships: {
					type: 'array',
					description: 'The COMPLETE replacement list of relationships',
					items: {
						type: 'object',
						properties: {
							fromId: { type: 'string' },
							toId: { type: 'string' },
							kind: { type: 'string', enum: ['one-to-one', 'one-to-many', 'many-to-many'] },
							label: { type: 'string' }
						},
						required: ['fromId', 'toId', 'kind']
					}
				}
			}
		}
	},
	{
		name: 'generate_use_case_model',
		description: 'Create a brand-new Use Case Model from scratch, extracted directly from the actual codebase - not from anything in this conversation. Only call this when none exists yet (the summary above will say so) and the user actually asked for one (e.g. "write up a spec", "generate a use case model") - never speculatively. Costs a real AI call, same as clicking Generate in the UI. If one already exists, use update_use_case_model to edit it instead - calling this again would be rejected. Takes no input.',
		inputSchema: { type: 'object', properties: {} }
	},
	{
		name: 'generate_data_model',
		description: 'Create a brand-new Data Model from scratch, extracted directly from the actual codebase - not from anything in this conversation. Only call this when none exists yet (the summary above will say so) and the user actually asked for one. Costs a real AI call, same as clicking Generate in the UI. If one already exists, use update_data_model to edit it instead - calling this again would be rejected. Takes no input.',
		inputSchema: { type: 'object', properties: {} }
	}
];

/**
 * These two don't return information the model reasons with - they're pure
 * UI side effects that only the shell's own browser JS can carry out (it
 * owns the view pickers and the diagram iframes; neither kratai-web nor
 * view.ts's Node process can touch the screen). view.ts's chat loop checks
 * this set to route a call to executeChatTool (data) vs. accumulating it as
 * a uiAction the final response carries back to the shell to actually
 * perform - see view.ts's own doc comment on the split.
 */
export const UI_ACTION_TOOL_NAMES = new Set(['show_view', 'highlight_class']);

/**
 * Spec-editing tools - unlike the read-only tools above, these mutate
 * kratai.usecases.json/kratai.datamodel.json. Routed in view.ts's chat loop
 * to @kratai/cli's chatSpecTools.ts (executeSpecTool), the only layer with
 * a live, mutable reference to useCaseData/dataModelData and the save
 * functions that persist them.
 */
export const SPEC_TOOL_NAMES = new Set([
	'update_srs_metadata', 'update_use_case_model', 'update_data_model',
	'generate_use_case_model', 'generate_data_model'
]);
