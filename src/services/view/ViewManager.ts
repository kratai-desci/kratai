import * as fs from 'fs';
import * as path from 'path';
import { DiagramView, DiagramViewRegistry } from '../../types/view/DiagramView';
import { KrataiConfig } from '../../types/config';

export class ViewManager {
	private static readonly VIEWS_DIR = '.vscode/kratai';
	private static readonly REGISTRY_FILE = 'views.json';

	/**
	 * Slugify a name for use as a file ID
	 * "API Routes" -> "api-routes"
	 */
	static slugify(name: string): string {
		return name
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '')
			.replace(/[\s_-]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	/**
	 * Get the views directory path
	 */
	private static getViewsDir(workspacePath: string): string {
		return path.join(workspacePath, this.VIEWS_DIR);
	}

	/**
	 * Get the registry file path
	 */
	private static getRegistryPath(workspacePath: string): string {
		return path.join(this.getViewsDir(workspacePath), this.REGISTRY_FILE);
	}

	/**
	 * Get the config file path for a view
	 */
	private static getViewConfigPath(workspacePath: string, viewId: string): string {
		return path.join(this.getViewsDir(workspacePath), `${viewId}.json`);
	}

	/**
	 * Ensure the views directory exists
	 */
	private static ensureViewsDir(workspacePath: string): void {
		const viewsDir = this.getViewsDir(workspacePath);
		if (!fs.existsSync(viewsDir)) {
			fs.mkdirSync(viewsDir, { recursive: true });
		}
	}

	/**
	 * Load the registry file
	 */
	private static async loadRegistry(workspacePath: string): Promise<DiagramViewRegistry> {
		const registryPath = this.getRegistryPath(workspacePath);
		
		if (!fs.existsSync(registryPath)) {
			return { views: [] };
		}

		try {
			const content = fs.readFileSync(registryPath, 'utf-8');
			return JSON.parse(content) as DiagramViewRegistry;
		} catch (error) {
			console.error('Error loading view registry:', error);
			return { views: [] };
		}
	}

	/**
	 * Save the registry file
	 */
	private static async saveRegistry(workspacePath: string, registry: DiagramViewRegistry): Promise<void> {
		this.ensureViewsDir(workspacePath);
		const registryPath = this.getRegistryPath(workspacePath);
		fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
	}

	/**
	 * Create a new view
	 */
	static async createView(workspacePath: string, name: string, config: KrataiConfig): Promise<DiagramView> {
		const id = this.slugify(name);
		
		// Check if view with this ID already exists
		const registry = await this.loadRegistry(workspacePath);
		const existingView = registry.views.find(v => v.id === id);
		
		if (existingView) {
			throw new Error(`A diagram named "${existingView.name}" already exists. Please choose a different name.`);
		}

		// Create the view
		const view: DiagramView = {
			id,
			name,
			config,
			createdAt: new Date().toISOString()
		};

		// Save view config
		await this.saveViewConfig(workspacePath, view.id, config);

		// Update registry
		registry.views.push(view);
		await this.saveRegistry(workspacePath, registry);

		return view;
	}

	/**
	 * Save a view configuration
	 */
	static async saveViewConfig(workspacePath: string, viewId: string, config: KrataiConfig): Promise<void> {
		this.ensureViewsDir(workspacePath);
		const configPath = this.getViewConfigPath(workspacePath, viewId);
		
		const configWithTimestamp = {
			...config,
			lastUpdated: new Date().toISOString()
		};

		fs.writeFileSync(configPath, JSON.stringify(configWithTimestamp, null, 2), 'utf-8');
	}

	/**
	 * Load a view configuration
	 */
	static async loadViewConfig(workspacePath: string, viewId: string): Promise<KrataiConfig> {
		const configPath = this.getViewConfigPath(workspacePath, viewId);
		
		if (!fs.existsSync(configPath)) {
			throw new Error(`View configuration not found: ${viewId}`);
		}

		try {
			const content = fs.readFileSync(configPath, 'utf-8');
			return JSON.parse(content) as KrataiConfig;
		} catch (error) {
			throw new Error(`Error loading view configuration: ${error}`);
		}
	}

	/**
	 * List all views
	 */
	static async listViews(workspacePath: string): Promise<DiagramView[]> {
		const registry = await this.loadRegistry(workspacePath);
		return registry.views;
	}

	/**
	 * Get a specific view
	 */
	static async getView(workspacePath: string, viewId: string): Promise<DiagramView | undefined> {
		const registry = await this.loadRegistry(workspacePath);
		return registry.views.find(v => v.id === viewId);
	}

	/**
	 * Update last generated timestamp
	 */
	static async updateLastGenerated(workspacePath: string, viewId: string): Promise<void> {
		const registry = await this.loadRegistry(workspacePath);
		const view = registry.views.find(v => v.id === viewId);
		
		if (view) {
			view.lastGenerated = new Date().toISOString();
			await this.saveRegistry(workspacePath, registry);
		}
	}

	/**
	 * Update view metadata (name, etc.)
	 */
	static async updateView(workspacePath: string, viewId: string, updates: Partial<Pick<DiagramView, 'name'>>): Promise<void> {
		const registry = await this.loadRegistry(workspacePath);
		const view = registry.views.find(v => v.id === viewId);
		
		if (view) {
			if (updates.name) {
				view.name = updates.name;
			}
			await this.saveRegistry(workspacePath, registry);
		}
	}
}
