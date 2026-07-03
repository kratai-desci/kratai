import * as fs from 'fs';
import * as path from 'path';
import { ConfigFolderNode, ExtensionInfo } from '../../types/view';

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
	 * Used by both UI and MCP for generating default folder selections
	 * 
	 * @param workspacePath - Absolute path to workspace
	 * @param targetFolders - Optional specific folders to expand (for MCP)
	 * @returns Array of relative folder paths
	 */
	static selectFolders(
		workspacePath: string,
		targetFolders?: string[]
	): string[] {
		const folders: string[] = [];

		// If specific folders requested, expand those
		if (targetFolders && targetFolders.length > 0) {
			for (const folder of targetFolders) {
				const cleanFolder = folder.replace(/\/$/, '');
				
				// Handle workspace root
				if (cleanFolder === '.' || cleanFolder === '') {
					this.collectFolders(workspacePath, '', folders);
				} else {
					// Scan specific folder
					this.collectFolders(workspacePath, cleanFolder, folders);
				}
			}
		} else {
			// No specific folders - scan entire workspace
			this.collectFolders(workspacePath, '', folders);
		}

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

	static discoverExtensions(workspacePath: string): ExtensionInfo[] {
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
}
