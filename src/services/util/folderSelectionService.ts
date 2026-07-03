import * as fs from 'fs';
import * as path from 'path';

/**
 * FolderSelectionService - Unified folder selection logic
 * Used by both UI (commands) and AI (MCP) for consistent behavior
 */
export class FolderSelectionService {
	
	/**
	 * Select folders from workspace
	 * Simple logic: Include all folders from root, excluding only critical system folders
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
					this.scanFolders(workspacePath, '', folders);
				} else {
					// Scan specific folder
					this.scanFolders(workspacePath, cleanFolder, folders);
				}
			}
		} else {
			// No specific folders - scan entire workspace
			this.scanFolders(workspacePath, '', folders);
		}

		return folders.length > 0 ? folders : ['.'];
	}

	/**
	 * Recursively scan folders and add them to the list
	 * Excludes only critical system folders
	 */
	private static scanFolders(
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

				// Exclude only critical system folders
				const excludedFolders = [
					'node_modules',
					'.git',
					'__pycache__',
					'venv',
					'.venv',
					'vendor'
				];

				if (excludedFolders.includes(entry.name)) {
					continue;
				}

				// Build child path
				const childPath = relativePath 
					? `${relativePath}/${entry.name}`
					: entry.name;

				// Recursively scan
				this.scanFolders(workspacePath, childPath, folders);
			}
		} catch (error) {
			// Skip folders we can't read
		}
	}

	/**
	 * Get a human-readable summary of folder selection
	 */
	static getSelectionSummary(folders: string[]): string {
		if (folders.length === 0 || (folders.length === 1 && folders[0] === '.')) {
			return '📂 Analyzing entire workspace';
		}

		const topLevel = folders.filter(f => !f.includes('/'));
		if (topLevel.length <= 3) {
			return `📂 Analyzing: ${topLevel.join(', ')} (and subdirectories)`;
		}

		return `📂 Analyzing ${folders.length} folders`;
	}
}
