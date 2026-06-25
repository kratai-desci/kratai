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
import { ViewManager } from '../services/view/index.js';
import { DiagramView } from '../types/view/DiagramView.js';
import { ConfigService } from '../services/config/configService.js';
import { CodeParserService } from '../services/parsing/codeParserService.js';
import { GitDiffEnricher } from '../services/git/gitDiffEnricher.js';
import { MarkdownExporter } from '../services/export/MarkdownExporter.js';

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
				description: 'List all saved Kratai architecture diagrams and class diagram views in this workspace. Use this when the user asks: "what diagrams exist?", "show my diagrams", "list architecture views", "what class diagrams do I have?", or mentions Kratai diagrams. Returns diagram names, IDs, and last generation timestamps.',
				inputSchema: {
					type: 'object',
					properties: {},
				},
			},
			{
				name: 'kratai_get_diagram',
				description: 'Get complete architecture diagram with all classes, methods, properties, relationships, file paths, and line numbers in markdown format. Use this to analyze codebase structure, understand dependencies, find classes, plan refactoring, or answer questions about code architecture. ALWAYS call this when user asks about: class structure, code organization, dependencies, what would break if X changes, how components relate, impact analysis, or needs to see the full architecture. Example queries: "Show domain-model structure", "What classes exist?", "Analyze dependencies", "How is auth structured?"',
				inputSchema: {
					type: 'object',
					properties: {
						diagramId: {
							type: 'string',
							description: 'Diagram ID from kratai_list_diagrams (e.g. "domain-model", "full-diagram", "parsing-package")',
						},
					},
					required: ['diagramId'],
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

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(diagrams, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: `Error listing diagrams: ${error}`,
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
			if (!diagramId) {
				throw new Error('diagramId is required');
			}

			// Load view
			const view = await ViewManager.getView(this.workspacePath, diagramId);
			if (!view) {
				throw new Error(`Diagram not found: ${diagramId}`);
			}

			// Load view config
			const config = await ViewManager.loadViewConfig(this.workspacePath, diagramId);

			// Parse workspace
			console.log(`[Kratai MCP] Generating diagram: ${view.name}`);
			const diagramData = await CodeParserService.parseWorkspace(this.workspacePath, config);

			// Enrich with git diff if enabled
			if (config.gitDiff?.enabled !== false) {
				const baseCommit = config.gitDiff?.baseCommit || 'HEAD~1';
				await GitDiffEnricher.enrichWithGitDiff(diagramData, this.workspacePath, baseCommit);
			}

			// Apply class type filters
			const classTypeFilters = config.classTypeFilters || {};
			if (Object.keys(classTypeFilters).length > 0) {
				diagramData.classes = diagramData.classes.filter(classInfo => {
					const type = classInfo.classType || 'class';
					return classTypeFilters[type] !== false;
				});
			}

			// Apply relationship type filters
			const relationshipTypeFilters = config.relationshipTypeFilters || {};
			if (Object.keys(relationshipTypeFilters).length > 0) {
				diagramData.relationships = diagramData.relationships.filter(rel => {
					return relationshipTypeFilters[rel.type] === true;
				});
			}

			// Remove orphaned relationships
			const validClassIds = new Set(diagramData.classes.map(c => `${c.filePath}__${c.name}`));
			diagramData.relationships = diagramData.relationships.filter(rel =>
				validClassIds.has(rel.from) && validClassIds.has(rel.to)
			);

			// Generate markdown
			const markdown = MarkdownExporter.toMarkdown(diagramData, view.name);

			return {
				content: [
					{
						type: 'text',
						text: markdown,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: `Error generating diagram: ${error}`,
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

	if (!fs.existsSync(workspacePath)) {
		console.error(`Workspace path does not exist: ${workspacePath}`);
		process.exit(1);
	}

	console.error(`[Kratai MCP] Starting server for workspace: ${workspacePath}`);

	const server = new KrataiMCPServer(workspacePath);
	await server.start();
}

// Run if called directly
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
	main().catch((error) => {
		console.error('[Kratai MCP] Fatal error:', error);
		process.exit(1);
	});
}

export { main };
