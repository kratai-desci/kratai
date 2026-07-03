import * as fs from 'fs';
import * as path from 'path';
import { ConfigFolderNode, ExtensionInfo } from '../../types/view';
import { KrataiConfig } from '../../types/config';

export class WorkspaceScanner {
	private static readonly DEFAULT_EXCLUSIONS = [
		'node_modules', 'dist', 'build', 'out', '.git', '.vscode',
		// Python exclusions
		'venv', '.venv', 'env', '__pycache__', 'site-packages', '.tox', '.pytest_cache',
		// PHP exclusions
		'vendor',
		// General
		'.idea', '.DS_Store', 'coverage', '.next', '.nuxt'
	];

	static scanFolders(workspacePath: string, selectedFolders: string[] = []): ConfigFolderNode {
		const rootNode: ConfigFolderNode = {
			path: '',
			name: path.basename(workspacePath),
			selected: selectedFolders.length === 0, // Select all if none selected
			children: []
		};

		this.buildFolderTree(workspacePath, '', rootNode, selectedFolders);
		return rootNode;
	}

	private static buildFolderTree(
		workspacePath: string,
		relativePath: string,
		node: ConfigFolderNode,
		selectedFolders: string[]
	): void {
		const fullPath = path.join(workspacePath, relativePath);
		
		if (!fs.existsSync(fullPath)) {
			return;
		}

		const entries = fs.readdirSync(fullPath, { withFileTypes: true });

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			
			// Skip default exclusions
			if (this.DEFAULT_EXCLUSIONS.includes(entry.name)) {
				continue;
			}

			const childRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
			const isSelected = selectedFolders.length === 0 || selectedFolders.includes(childRelativePath);

		const childNode: ConfigFolderNode = {
				path: childRelativePath,
				name: entry.name,
				selected: isSelected,
				children: []
			};

			// Recursively build tree
			this.buildFolderTree(workspacePath, childRelativePath, childNode, selectedFolders);

			node.children.push(childNode);
		}
	}

	/**
	 * Select folders from workspace (flat array for config)
	 * Returns only top-level source folders - parsing will recursively include their contents
	 * 
	 * @param workspacePath - Absolute path to workspace
	 * @returns Array of top-level folder paths (e.g., ["src", "lib", "mcp"])
	 */
	static selectFolders(workspacePath: string): string[] {
		// Detect standard top-level source folders
		const folders = this.detectTopLevelSourceFolders(workspacePath);
		return folders.length > 0 ? folders : ['.'];
	}

	/**
	 * Detect top-level source folders only
	 * Returns folder names if they exist (parsing will handle recursion)
	 */
	private static detectTopLevelSourceFolders(workspacePath: string): string[] {
		const candidates = [
			// Universal patterns (top-level only)
			'src',
			'lib', 
			'app',
			'mcp',        // MCP server development
			'api',        // API folder (common in Next.js, etc.)
			'server',     // Server code
			
			// TypeScript/JavaScript Frameworks
			'pages',      // Next.js
			'routes',     // SvelteKit/Remix/Express
			'components', // React/Vue components
			'modules',    // NestJS/Angular
			'hooks',      // React hooks
			'utils',      // Utility functions
			'helpers',    // Helper functions
			'services',   // Business logic
			'middleware', // Express/Koa middleware
			'controllers',// MVC controllers
			'models',     // Data models
			'views',      // View templates
			
			// Python
			'apps',       // Django apps
			'core',       // Django core
			'blueprints', // Flask blueprints
			'routers',    // FastAPI routers
			'schemas',    // Pydantic schemas
			
			// PHP
			'resources',  // Laravel resources
			'database',   // Laravel migrations/seeders/factories
			
			// Go
			'cmd',        // Go commands
			'pkg',        // Go packages
			'internal',   // Go internal packages
			
			// Java/Kotlin
			'main',       // Common source folder
		];
		
		const found: string[] = [];
		
		for (const candidate of candidates) {
			const fullPath = path.join(workspacePath, candidate);
			// Only check if folder exists and has code (directly or in descendants)
			if (fs.existsSync(fullPath) && this.hasCodeInTree(fullPath)) {
				found.push(candidate);
			}
		}
		
		return found;
	}

	/**
	 * Check if folder tree contains any parseable code files
	 * Recursively checks folder and all descendants
	 */
	private static hasCodeInTree(
		folderPath: string,
		maxDepth: number = 5,
		currentDepth: number = 0
	): boolean {
		// Prevent infinite recursion
		if (currentDepth > maxDepth) return false;
		
		try {
			const entries = fs.readdirSync(folderPath, { withFileTypes: true });
			
			for (const entry of entries) {
				if (entry.isFile()) {
					// Check if this is a parseable file
					const ext = path.extname(entry.name).toLowerCase();
					const PARSEABLE_EXTENSIONS = [
						'.ts', '.tsx', '.js', '.jsx', 
						'.py', '.php', '.java', '.kt', 
						'.html', '.jsp', '.go', '.rs',
					];
					if (PARSEABLE_EXTENSIONS.includes(ext)) {
						return true;
					}
				} else if (entry.isDirectory()) {
					// Skip excluded folders
					if (this.shouldExcludeFolder(entry.name)) continue;
					
					// Recurse into subdirectory
					const childPath = path.join(folderPath, entry.name);
					if (this.hasCodeInTree(childPath, maxDepth, currentDepth + 1)) {
						return true;
					}
				}
			}
		} catch (error) {
			// Can't read folder
		}
		
		return false;
	}

	/**
	 * Check if folder should be excluded (non-source folders)
	 */
	private static shouldExcludeFolder(name: string): boolean {
		const lowerName = name.toLowerCase();
		
		const exclusions = [
			// Build/Dependencies (from DEFAULT_EXCLUSIONS)
			'node_modules', 'dist', 'build', 'out', 'vendor',
			'venv', '.venv', 'env', '__pycache__', 'site-packages',
			'.tox', '.pytest_cache',
			
			// VCS/IDE
			'.git', '.vscode', '.idea', '.ds_store', '.next', '.nuxt', '.cache',
			
			// Non-source folders
			'test', 'tests', '__tests__', 'spec', 'specs', 'e2e',
			'doc', 'docs', 'documentation',
			'example', 'examples', 'demo', 'demos', 'sample', 'samples',
			'script', 'scripts', 'tool', 'tools', 'util', 'utilities',
			'config', 'configs', 'configuration',
			'public', 'static', 'assets', 'resources', 'images',
			'coverage', 'reports',
			
			// Framework-specific non-source
			'migrations', 'seeds', 'fixtures', 'locales', 'i18n',
		];
		
		return exclusions.includes(lowerName);
	}

	/**
	 * Check if folder contains parseable source files
	 */
	private static hasParseableFiles(
		folderPath: string,
		maxCheck: number = 50  // Don't scan thousands of files
	): boolean {
		const PARSEABLE_EXTENSIONS = [
			'.ts', '.tsx', '.js', '.jsx', 
			'.py', '.php', '.java', '.kt', 
			'.html', '.jsp', '.go', '.rs',
			'.c', '.cpp', '.h', '.hpp',
			'.cs', '.rb', '.swift', '.scala'
		];
		
		try {
			const entries = fs.readdirSync(folderPath, { withFileTypes: true });
			let checked = 0;
			
			for (const entry of entries) {
				if (checked++ > maxCheck) break;
				
				if (entry.isFile()) {
					const ext = path.extname(entry.name).toLowerCase();
					if (PARSEABLE_EXTENSIONS.includes(ext)) {
						return true;
					}
				}
			}
		} catch (error) {
			// Can't read folder
		}
		
		return false;
	}

	/**
	 * Scan workspace and count file extensions
	 * Used by UI to display extension statistics
	 */
	static scanExtensionCounts(workspacePath: string): ExtensionInfo[] {
		const extensionMap = new Map<string, number>();
		
		this.scanExtensions(workspacePath, '', extensionMap);

		// Convert to array and sort by count
		const extensions: ExtensionInfo[] = Array.from(extensionMap.entries())
			.map(([ext, count]) => ({
				extension: ext,
				count,
				selected: ext === '.ts' || ext === '.tsx' // Default selections
			}))
			.sort((a, b) => b.count - a.count);

		return extensions;
	}

	private static scanExtensions(
		workspacePath: string,
		relativePath: string,
		extensionMap: Map<string, number>
	): void {
		const fullPath = path.join(workspacePath, relativePath);
		
		if (!fs.existsSync(fullPath)) {
			return;
		}

		const entries = fs.readdirSync(fullPath, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.isDirectory()) {
				// Skip default exclusions
				if (this.DEFAULT_EXCLUSIONS.includes(entry.name)) {
					continue;
				}
				
				const childRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
				this.scanExtensions(workspacePath, childRelativePath, extensionMap);
			} else {
				const ext = path.extname(entry.name);
				if (ext) {
					extensionMap.set(ext, (extensionMap.get(ext) || 0) + 1);
				}
			}
		}
	}

	/**
	 * Get list of files to parse based on config
	 * Starts parsing from selected folders directly, includes all subdirectories
	 * 
	 * @param workspacePath - Absolute path to workspace
	 * @param config - Configuration with selected folders and extensions
	 * @returns Array of absolute file paths ready to parse
	 */
	static getFilesToParse(workspacePath: string, config: KrataiConfig): string[] {
		const files: string[] = [];
		
		// If no folders selected, parse entire workspace
		if (config.selectedFolders.length === 0) {
			this.scanForFiles(workspacePath, workspacePath, config, files);
			return files;
		}
		
		// Parse each selected folder + all subdirectories
		for (const folder of config.selectedFolders) {
			const folderPath = path.join(workspacePath, folder);
			if (fs.existsSync(folderPath)) {
				this.scanForFiles(folderPath, workspacePath, config, files);
			}
		}
		
		return files;
	}

	/**
	 * Recursively scan directory for files matching config
	 * Parses everything in the given directory + all subdirectories (except exclusions)
	 * Private - callers should use getFilesToParse()
	 */
	private static scanForFiles(
		dir: string,
		workspacePath: string,
		config: KrataiConfig,
		files: string[]
	): void {
		try {
			const items = fs.readdirSync(dir);
			
			for (const item of items) {
				const fullPath = path.join(dir, item);
				const stat = fs.statSync(fullPath);

				if (stat.isDirectory()) {
					// Skip excluded folders only (tests, node_modules, etc.)
					if (!this.isExcludedFolder(item)) {
						this.scanForFiles(fullPath, workspacePath, config, files);
					}
				} else {
					if (this.shouldIncludeFile(fullPath, config.selectedExtensions)) {
						files.push(fullPath);
					}
				}
			}
		} catch (error) {
			// Skip directories we can't read
		}
	}

	/**
	 * Check if a folder should be excluded from parsing
	 * Combines DEFAULT_EXCLUSIONS and comprehensive exclusions
	 */
	private static isExcludedFolder(folderName: string): boolean {
		// Check DEFAULT_EXCLUSIONS (node_modules, dist, .git, etc.)
		if (this.DEFAULT_EXCLUSIONS.includes(folderName)) {
			return true;
		}
		
		// Check comprehensive exclusions (tests, docs, etc.)
		return this.shouldExcludeFolder(folderName);
	}

	/**
	 * Check if a file should be included based on extension
	 * Private - inclusion logic is internal to WorkspaceScanner
	 */
	private static shouldIncludeFile(filePath: string, selectedExtensions: string[]): boolean {
		const ext = path.extname(filePath);
		return selectedExtensions.includes(ext);
	}
}
