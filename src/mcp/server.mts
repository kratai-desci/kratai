#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { ViewManager } from '../services/view/index.js';
import { DiagramView } from '../types/view/DiagramView.js';
import { ConfigService } from '../services/util/configService.js';
import { WorkspaceScanner } from '../services/parsing/workspaceScanner.js';
import { CodeParserService } from '../services/parsing/codeParserService.js';
import { GitDiffEnricher } from '../services/git/gitDiffEnricher.js';
import { MarkdownExporter } from '../services/export/MarkdownExporter.js';
import { TelemetryService } from '../services/telemetry/telemetryService.js';
import { KrataiConfig } from '../types/config/KrataiConfig.js';
import { ClassInfo, ClassRelationship } from '../types/domain/index.js';

/**
 * Kratai MCP Server
 * Exposes architecture diagrams to AI agents
 */
export class KrataiMCPServer {
	private server: Server;
	private workspacePath: string;

	constructor(workspacePath: string) {
		this.workspacePath = workspacePath;
		this.server = new Server(
			{
				name: 'kratai',
				version: '1.0.0',
			},
			{
				capabilities: {
					tools: {},
				},
			}
		);

		// Initialize telemetry for MCP usage tracking		// Note: initialize() is async but returns immediately in non-VS Code contexts		TelemetryService.initialize();

		this.setupHandlers();
	}

	private setupHandlers(): void {
		// List available tools
		this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
			tools: this.getTools(),
		}));

		// Handle tool calls
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;

			switch (name) {
				case 'kratai_list_diagrams':
					return await this.listDiagrams();
				
				case 'kratai_get_diagram':
					return await this.getDiagram(args?.diagramId as string);
				
				case 'kratai_create_overview_diagram':
					return await this.createOverviewDiagram();

				default:
					throw new Error(`Unknown tool: ${name}`);
			}
		});
	}

	/**
	 * Get available tools
	 */
	private getTools(): Tool[] {
		return [
			{
				name: 'kratai_list_diagrams',
				description: `Lists all saved architecture diagrams in this workspace.

**ALWAYS call this first** when user asks about architecture or code structure.

**Use when:**
- User asks about architecture, dependencies, classes
- Before getting a diagram (to find valid IDs)
- User asks: "what diagrams exist?", "show diagrams"

**Returns:** [{id, name, lastGenerated}, ...]
**Next:** kratai_get_diagram(id) with an ID from the list`,
				inputSchema: {
					type: 'object',
					properties: {},
				},
			},
			{
				name: 'kratai_get_diagram',
				description: `Gets complete architecture diagram with classes, methods, relationships.

**CALL THIS when user asks:**
- "What classes exist?", "Show structure"
- "What depends on X?", "What breaks if I change X?"
- "How does [feature] work?"
- Any architecture or dependency question

**Returns:** Markdown with:
- All classes (methods, properties, file paths, line numbers)
- All relationships (extends, implements, uses, HTTP calls)
- Git diff (shows recent changes)
- Complete codebase structure

**Why use this:** Replaces reading 50+ files. One call = full architecture. Diagrams are generated from code, so always current.

**Required:** diagramId from kratai_list_diagrams
**Workflow:** list diagrams → get diagram → answer question`,
				inputSchema: {
					type: 'object',
					properties: {
						diagramId: {
							type: 'string',
							description: 'Diagram ID from kratai_list_diagrams (e.g. "domain-model", "overview-2026-07-03T14-30-25")',
						},
					},
					required: ['diagramId'],
				},
			},
			{
				name: 'kratai_create_overview_diagram',
				description: `Creates a complete architecture overview of the entire codebase.

**CALL THIS when:**
- kratai_list_diagrams returns empty (no diagrams exist)
- First time analyzing a codebase
- User asks: "analyze my code", "show architecture"

**What it does automatically:**
- Detects all source folders, languages
- Scans all code files
- Extracts classes, methods, properties, relationships
- Shows git diff (uncommitted changes)
- Auto-deletes previous overview diagrams

**No parameters needed** - fully automatic!

**Returns:** Complete architecture markdown + diagram ID
**Typical flow:**
1. list diagrams → empty?
2. create overview → returns ID
3. Use returned markdown immediately`,
				inputSchema: {
					type: 'object',
					properties: {},
				},
			},
		];
	}

	/**
	 * List all diagrams
	 */
	private async listDiagrams() {
		try {
			const views = await ViewManager.listViews(this.workspacePath);

			const diagrams = views.map((view: DiagramView) => ({
				id: view.id,
				name: view.name,
				lastGenerated: view.lastGenerated || 'Never',
			}));

			// Track MCP usage
			TelemetryService.trackMcpListDiagrams(diagrams.length);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(diagrams, null, 2),
					},
				],
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`[Kratai MCP] Error in listDiagrams:`, errorMessage);
			
			return {
				content: [
					{
						type: 'text',
						text: `Error listing diagrams: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	}

	/**
	 * Get diagram as markdown
	 */
	private async getDiagram(diagramId: string) {
		try {
			// Validate input
			if (!diagramId || typeof diagramId !== 'string') {
				throw new Error('diagramId is required and must be a string');
			}
			
			// Sanitize input - only allow alphanumeric, hyphens, underscores
			if (!/^[a-zA-Z0-9_-]+$/.test(diagramId)) {
				throw new Error('Invalid diagramId format. Only alphanumeric characters, hyphens, and underscores are allowed.');
			}
			
			// Prevent excessively long IDs
			if (diagramId.length > 100) {
				throw new Error('diagramId too long (max 100 characters)');
			}

			// Load view
			const view = await ViewManager.getView(this.workspacePath, diagramId);
			if (!view) {
				throw new Error(`Diagram not found: ${diagramId}`);
			}

			// Load view config
			const config = await ViewManager.loadViewConfig(this.workspacePath, diagramId);

			// Parse workspace with timeout protection (5 minutes max)
			console.error(`[Kratai MCP] Generating diagram: ${view.name}`);
			const parsePromise = CodeParserService.parseWorkspace(this.workspacePath, config);
			const timeoutPromise = new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Parsing timeout (5 minutes)')), 5 * 60 * 1000)
			);
			const diagramData = await Promise.race([parsePromise, timeoutPromise]) as any;

			// Enrich with git diff if enabled
			if (config.gitDiff?.enabled !== false) {
				const baseCommit = config.gitDiff?.baseCommit || 'HEAD~1';
				await GitDiffEnricher.enrichWithGitDiff(diagramData, this.workspacePath, baseCommit);
			}

			// Apply class type filters
			const classTypeFilters = config.classTypeFilters || {};
			if (Object.keys(classTypeFilters).length > 0) {
				diagramData.classes = diagramData.classes.filter((classInfo: ClassInfo) => {
					const type = classInfo.classType || 'class';
					return classTypeFilters[type] !== false;
				});
			}

			// Apply relationship type filters
			const relationshipTypeFilters = config.relationshipTypeFilters || {};
			if (Object.keys(relationshipTypeFilters).length > 0) {
				diagramData.relationships = diagramData.relationships.filter((rel: ClassRelationship) => {
					// Handle both single type and array of types
					const types: string[] = Array.isArray(rel.type) ? rel.type : [rel.type as string];
					// Show relationship if ANY of its types is enabled in filter
					return types.some(type => relationshipTypeFilters[type] === true);
				});
			}

			// Remove orphaned relationships
			const validClassIds = new Set(diagramData.classes.map((c: ClassInfo) => `${c.filePath}__${c.name}`));
			diagramData.relationships = diagramData.relationships.filter((rel: ClassRelationship) =>
				validClassIds.has(rel.from) && validClassIds.has(rel.to)
			);

			// Generate markdown
			const markdown = MarkdownExporter.toMarkdown(diagramData, view.name);

			// Track MCP usage
			TelemetryService.trackMcpGetDiagram(
				diagramData.classes.length,
				diagramData.relationships.length
			);

			return {
				content: [
					{
						type: 'text',
						text: markdown,
					},
				],
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const errorStack = error instanceof Error ? error.stack : undefined;
			
			console.error(`[Kratai MCP] Error in getDiagram:`, errorMessage);
			if (errorStack) {
				console.error(errorStack);
			}
			
			return {
				content: [
					{
						type: 'text',
						text: `Error generating diagram '${this.sanitizeForLog(arguments[0])}': ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	}

	/**
	 * Sanitize input for safe logging
	 */
	private sanitizeForLog(input: any): string {
		if (typeof input !== 'string') return '[non-string]';
		return input.substring(0, 50).replace(/[^a-zA-Z0-9_-]/g, '');
	}

	/**
	 * Create an overview diagram with auto-detection
	 * No parameters needed - intelligently detects everything!
	 */
	private async createOverviewDiagram() {
		try {
			// Auto-generate unique name with timestamp
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
			const name = `overview-${timestamp}`;

			// Delete old overview diagrams (keep only the latest)
			const existingViews = await ViewManager.listViews(this.workspacePath);
			const oldOverviews = existingViews.filter(v => v.id.startsWith('overview-'));
			
			if (oldOverviews.length > 0) {
				// Limit cleanup to prevent excessive operations
				const toDelete = oldOverviews.slice(0, 10);
				console.error(`[Kratai MCP] Cleaning up ${toDelete.length} old overview diagram(s)...`);
				
				for (const oldView of toDelete) {
					await ViewManager.deleteView(this.workspacePath, oldView.id);
					console.error(`[Kratai MCP] Deleted: ${oldView.name}`);
				}
				
				if (oldOverviews.length > 10) {
					console.error(`[Kratai MCP] Note: ${oldOverviews.length - 10} additional old diagrams remain`);
				}
			}

			// Use smart defaults - auto-detect folders and languages
			const config = ConfigService.generateSmartDefaults(this.workspacePath);

			// Enhance config for MCP
			const enhancedConfig: KrataiConfig = {
				...config,
				classTypeFilters: {}, // Empty = show all types
				relationshipTypeFilters: {
					'extends': true,
					'implements': true,
					'uses': true,
					'composition': true,
					'aggregation': true,
					'association': true,
					'http-call': true,
					'routes-to': true
				},
				gitDiff: {
					enabled: true,
					baseCommit: 'HEAD'  // Shows uncommitted changes (working directory vs HEAD)
				}
			};

			// Create view
			const view = await ViewManager.createView(
				this.workspacePath,
				name,
				enhancedConfig
			);

			// Generate diagram immediately with timeout protection (5 minutes max)
			const parsePromise = CodeParserService.parseWorkspace(
				this.workspacePath,
				enhancedConfig
			);
			const timeoutPromise = new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Parsing timeout (5 minutes)')), 5 * 60 * 1000)
			);
			const diagramData = await Promise.race([parsePromise, timeoutPromise]) as any;

			// Update last generated timestamp
			await ViewManager.updateLastGenerated(this.workspacePath, view.id);

			// Generate markdown for AI to consume
			const markdown = MarkdownExporter.toMarkdown(diagramData, view.name);

			// Track MCP usage
			TelemetryService.trackMcpCreateDiagram(
				diagramData.classes.length,
				diagramData.relationships.length,
				enhancedConfig.selectedFolders?.length || 0
			);

			// Return markdown directly (AI can analyze it immediately)
			return {
				content: [
					{
						type: 'text',
						text: `Created diagram "${view.name}" (ID: ${view.id}) with ${diagramData.classes.length} classes and ${diagramData.relationships.length} relationships.\n\n---\n\n${markdown}`,
					},
				],
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const errorStack = error instanceof Error ? error.stack : undefined;
			
			console.error(`[Kratai MCP] Error in createOverviewDiagram:`, errorMessage);
			if (errorStack) {
				console.error(errorStack);
			}
			
			return {
				content: [
					{
						type: 'text',
						text: `Error creating overview diagram: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	}

	/**
	 * Start the MCP server
	 */
	async start(): Promise<void> {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error('[Kratai MCP] Server started on stdio');
	}
}

/**
 * CLI entry point
 */
async function main() {
	// Get workspace path from command line args
	const workspacePath = process.argv[2] || process.cwd();

	// Debug logging to stderr (won't interfere with MCP protocol on stdout)
	console.error(`[Kratai MCP] argv[0]: ${process.argv[0]}`);
	console.error(`[Kratai MCP] argv[1]: ${process.argv[1]}`);
	console.error(`[Kratai MCP] argv[2]: ${process.argv[2]}`);
	console.error(`[Kratai MCP] import.meta.url: ${import.meta.url}`);
	console.error(`[Kratai MCP] Resolved workspace: ${workspacePath}`);

	if (!fs.existsSync(workspacePath)) {
		console.error(`Workspace path does not exist: ${workspacePath}`);
		process.exit(1);
	}

	console.error(`[Kratai MCP] Starting server for workspace: ${workspacePath}`);

	const server = new KrataiMCPServer(workspacePath);
	await server.start();
}

// Run if called directly
// Support multiple invocation patterns: direct execution, node server.mjs, and VS Code MCP
const currentFile = fileURLToPath(import.meta.url);
const isDirectExecution = process.argv[1] && (
	process.argv[1] === currentFile ||
	process.argv[1].endsWith('/mcp/server.mjs') ||
	process.argv[1].endsWith('/mcp/server.mts')
);

if (isDirectExecution) {
	main().catch((error) => {
		console.error('[Kratai MCP] Fatal error:', error);
		process.exit(1);
	});
}

export { main };
