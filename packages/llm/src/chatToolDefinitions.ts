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
					enum: ['graph', 'class', 'stack', 'usecase'],
					description: '"graph" = 3D Knowledge Graph, "class" = Class Diagram, "stack" = 3D Stack Layer, "usecase" = Use Case Diagram'
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
