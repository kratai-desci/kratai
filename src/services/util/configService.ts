import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { KrataiConfig } from '../../types/config';
import { WorkspaceScanner } from '../parsing/workspaceScanner';
import { ParserFactory } from '../parsing/languages/ParserFactory';

export class ConfigService {
	private static readonly CONFIG_FILE = '.vscode/kratai.json';

	static getDefaultConfig(): KrataiConfig {
		// Parse all supported file types by default
		const parserFactory = new ParserFactory();
		const allSupportedExtensions = parserFactory.getSupportedExtensions();
		
		return {
			selectedFolders: [],  // Empty = all folders except node_modules/dist
			selectedExtensions: allSupportedExtensions,
			respectGitignore: true,
			followSymlinks: false,
			gitDiff: {
				enabled: true,
				baseCommit: 'HEAD~1'
			},
			detectHttpCalls: true  // Detect fetch/axios/useSWR calls to API routes
		};
	}

	static generateSmartDefaults(workspacePath: string): KrataiConfig {
		// Use unified folder selection logic from WorkspaceScanner
		const selectedFolders = WorkspaceScanner.selectFolders(workspacePath);

		// Detect project type and appropriate extensions
		const extensions = this.detectProjectExtensions(workspacePath);

		return {
			selectedFolders,
			selectedExtensions: extensions,
			respectGitignore: true,
			followSymlinks: false,
			detectHttpCalls: true,
			frameworkEnrichment: true
		};
	}

	/**
	 * Get all supported file extensions from registered parsers
	 * Parse everything we support - let users filter via config if needed
	 * Build files (pom.xml, package.json, etc.) are only used for framework enrichment
	 */
	private static detectProjectExtensions(workspacePath: string): string[] {
		const parserFactory = new ParserFactory();
		return parserFactory.getSupportedExtensions();
	}

	static getProjectInfo(config: KrataiConfig): string {
		const selectedFolders = this.getSelectedFolders(config);
		
		if (selectedFolders.length === 0) {
			return '📂 Scanning all folders (except node_modules, dist, build, out, .git)';
		}

		const folderList = selectedFolders.join(', ');
		const extList = config.selectedExtensions.join(', ');
		return `📂 Folders: ${folderList}\n📄 Extensions: ${extList}`;
	}
	
	/**
	 * Get selected folders from config, supporting both old and new format
	 * Old format: selectedFolders: string[]
	 * New format: folders: Record<string, FolderConfig>
	 */
	static getSelectedFolders(config: KrataiConfig): string[] {
		// If new format exists and has data, use it
		if (config.folders && Object.keys(config.folders).length > 0) {
			return Object.entries(config.folders)
				.filter(([_, folderConfig]) => folderConfig.selected)
				.map(([path, _]) => path)
				.sort();
		}
		
		// Fall back to old format
		return config.selectedFolders || [];
	}

	static async loadConfig(workspacePath: string): Promise<KrataiConfig> {
		const configPath = path.join(workspacePath, this.CONFIG_FILE);
		
		if (!fs.existsSync(configPath)) {
			// No config file exists - generate smart defaults
			return this.generateSmartDefaults(workspacePath);
		}

		try {
			const content = fs.readFileSync(configPath, 'utf-8');
			const config = JSON.parse(content) as KrataiConfig;
			
			// Merge with defaults to handle missing fields
			return {
				...this.getDefaultConfig(),
				...config
			};
		} catch (error) {
			console.error('Error loading Kratai config:', error);
			return this.generateSmartDefaults(workspacePath);
		}
	}

	static async saveConfig(workspacePath: string, config: KrataiConfig): Promise<void> {
		const configPath = path.join(workspacePath, this.CONFIG_FILE);
		const vscodeDir = path.dirname(configPath);

		// Create .vscode directory if it doesn't exist
		if (!fs.existsSync(vscodeDir)) {
			fs.mkdirSync(vscodeDir, { recursive: true });
		}

		const configWithTimestamp = {
			...config,
			lastUpdated: new Date().toISOString()
		};

		fs.writeFileSync(configPath, JSON.stringify(configWithTimestamp, null, 2), 'utf-8');
	}

}
