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
	 * Smart selection: Prioritizes standard source folders, excludes non-code folders
	 * 
	 * @param workspacePath - Absolute path to workspace
	 * @returns Array of relative folder paths containing source code
	 */
	static selectFolders(workspacePath: string): string[] {
		// Phase 1: Try standard source patterns first (highest priority)
		const standardFolders = this.detectStandardSourceFolders(workspacePath);
		if (standardFolders.length > 0) {
			return standardFolders;
		}
		
		// Phase 2: Smart scan with content verification (no depth limit)
		const folders: string[] = [];
		this.collectCodeFolders(workspacePath, '', folders);
		return folders.length > 0 ? folders : ['.'];
	}

	/**
	 * Detect standard source folder patterns
	 * Returns folders only if they exist and contain parseable files
	 */
	private static detectStandardSourceFolders(workspacePath: string): string[] {
		const candidates = [
			// Universal patterns
			'src',
			'lib', 
			'app',
			'mcp',  // MCP server development
			
			// Language-specific
			'src/main/java',     // Java/Spring
			'src/main/kotlin',   // Kotlin
			'pkg',               // Go
			'internal',          // Go
			
			// Framework-specific  
			'pages',             // Next.js
			'routes',            // SvelteKit/Remix
		];
		
		const found: string[] = [];
		
		for (const candidate of candidates) {
			const fullPath = path.join(workspacePath, candidate);
			if (fs.existsSync(fullPath) && this.hasParseableFiles(fullPath)) {
				found.push(candidate);
				// Recursively include all subfolders with code
				found.push(...this.getCodeSubfolders(workspacePath, candidate));
			}
		}
		
		return found;
	}

	/**
	 * Get all subfolders containing code (recursive, no depth limit)
	 */
	private static getCodeSubfolders(
		workspacePath: string, 
		parentPath: string
	): string[] {
		const subfolders: string[] = [];
		const fullPath = path.join(workspacePath, parentPath);
		
		try {
			const entries = fs.readdirSync(fullPath, { withFileTypes: true });
			
			for (const entry of entries) {
				if (!entry.isDirectory()) continue;
				if (this.shouldExcludeFolder(entry.name)) continue;
				
				const childPath = `${parentPath}/${entry.name}`;
				const childFullPath = path.join(workspacePath, childPath);
				
				if (this.hasParseableFiles(childFullPath)) {
					subfolders.push(childPath);
					// Recurse into child folders
					subfolders.push(...this.getCodeSubfolders(workspacePath, childPath));
				}
			}
		} catch (error) {
			// Can't read folder
		}
		
		return subfolders;
	}

	/**
	 * Recursively collect folders with source code (content-aware, no depth limit)
	 */
	private static collectCodeFolders(
		workspacePath: string,
		relativePath: string,
		folders: string[]
	): void {
		const fullPath = path.join(workspacePath, relativePath);

		if (!fs.existsSync(fullPath)) {
			return;
		}

		try {
			const stats = fs.statSync(fullPath);
			if (!stats.isDirectory()) {
				return;
			}

			// Scan subdirectories
			const entries = fs.readdirSync(fullPath, { withFileTypes: true });

			for (const entry of entries) {
				if (!entry.isDirectory()) continue;

				// Skip excluded folders (tests, docs, etc.)
				if (this.shouldExcludeFolder(entry.name)) {
					continue;
				}

				// Build child path
				const childPath = relativePath 
					? `${relativePath}/${entry.name}`
					: entry.name;

				const childFullPath = path.join(workspacePath, childPath);

				// Only include if it contains parseable source files
				if (this.hasParseableFiles(childFullPath)) {
					folders.push(childPath);
					// Recurse into child folders (no depth limit)
					this.collectCodeFolders(workspacePath, childPath, folders);
				}
			}
		} catch (error) {
			// Skip folders we can't read
		}
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
	 * All inclusion/exclusion logic is handled internally
	 * 
	 * @param workspacePath - Absolute path to workspace
	 * @param config - Configuration with selected folders and extensions
	 * @returns Array of absolute file paths ready to parse
	 */
	static getFilesToParse(workspacePath: string, config: KrataiConfig): string[] {
		const files: string[] = [];
		this.scanForFiles(workspacePath, workspacePath, config, files);
		return files;
	}

	/**
	 * Recursively scan directory for files matching config
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
				const relativePath = path.relative(workspacePath, fullPath);

				if (stat.isDirectory()) {
					if (this.shouldIncludeFolder(relativePath, config.selectedFolders)) {
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
	 * Check if a folder should be included based on config
	 * Private - inclusion logic is internal to WorkspaceScanner
	 */
	private static shouldIncludeFolder(folderPath: string, selectedFolders: string[]): boolean {
		const relativePath = folderPath.replace(/\\/g, '/');
		
		// Check default exclusions
		for (const exclusion of this.DEFAULT_EXCLUSIONS) {
			if (relativePath.includes(`/${exclusion}/`) || relativePath.endsWith(`/${exclusion}`) || relativePath === exclusion) {
				return false;
			}
		}

		// If no folders selected, include everything (except defaults)
		if (selectedFolders.length === 0) {
			return true;
		}

		// Only include folders that are EXPLICITLY selected
		return selectedFolders.includes(relativePath);
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
