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
	 * Scans entire workspace and returns all non-excluded folders
	 * 
	 * @param workspacePath - Absolute path to workspace
	 * @returns Array of relative folder paths
	 */
	static selectFolders(workspacePath: string): string[] {
		const folders: string[] = [];
		this.collectFolders(workspacePath, '', folders);
		return folders.length > 0 ? folders : ['.'];
	}

	/**
	 * Recursively collect folders into flat array
	 */
	private static collectFolders(
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

			// Add current folder (if not root)
			if (relativePath) {
				folders.push(relativePath);
			}

			// Scan subdirectories
			const entries = fs.readdirSync(fullPath, { withFileTypes: true });

			for (const entry of entries) {
				if (!entry.isDirectory()) continue;

				// Skip default exclusions
				if (this.DEFAULT_EXCLUSIONS.includes(entry.name)) {
					continue;
				}

				// Build child path
				const childPath = relativePath 
					? `${relativePath}/${entry.name}`
					: entry.name;

				// Recursively collect
				this.collectFolders(workspacePath, childPath, folders);
			}
		} catch (error) {
			// Skip folders we can't read
		}
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
