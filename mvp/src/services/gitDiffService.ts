import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitDiffInfo {
	addedFiles: Set<string>;      // Files added in this commit
	deletedFiles: Set<string>;    // Files deleted
	modifiedFiles: Set<string>;   // Files with changes
	fileChanges: Map<string, FileChange>;  // Detailed changes per file
}

export interface FileChange {
	filePath: string;
	status: 'added' | 'deleted' | 'modified';
	addedLines: Set<number>;      // Line numbers that were added
	deletedLines: Set<number>;    // Line numbers that were deleted
	modifiedLines: Set<number>;   // Line numbers that were modified
}

export class GitDiffService {
	/**
	 * Get git diff between HEAD and a base commit (default: previous commit)
	 * If there are uncommitted changes, show those instead
	 */
	static async getDiff(workspacePath: string, baseCommit: string = 'HEAD~1'): Promise<GitDiffInfo | null> {
		try {
			// Check if git repo exists
			const { stdout: isRepo } = await execAsync('git rev-parse --is-inside-work-tree', { cwd: workspacePath });
			if (!isRepo.trim()) {
				console.log('❌ Not a git repository');
				return null;
			}

			// First check if there are uncommitted changes
			const hasUncommitted = await this.hasUncommittedChanges(workspacePath);
			console.log(`🔍 Uncommitted changes: ${hasUncommitted}`);

			let statusOutput: string;
			let diffCommand: string;

			if (hasUncommitted) {
				// Show working directory changes (uncommitted)
				console.log('📝 Showing uncommitted changes (working directory)');
				const { stdout } = await execAsync('git diff --name-status HEAD', { cwd: workspacePath });
				statusOutput = stdout;
				diffCommand = 'git diff HEAD';
			} else {
				// Show last commit changes
				console.log(`📝 Showing committed changes (${baseCommit} → HEAD)`);
				const { stdout } = await execAsync(
					`git diff --name-status ${baseCommit} HEAD`,
					{ cwd: workspacePath }
				);
				statusOutput = stdout;
				diffCommand = `git diff ${baseCommit} HEAD`;
			}

			const addedFiles = new Set<string>();
			const deletedFiles = new Set<string>();
			const modifiedFiles = new Set<string>();
			const fileChanges = new Map<string, FileChange>();

			// Parse file status
			const lines = statusOutput.trim().split('\n').filter(line => line);
			console.log(`📊 Git diff found ${lines.length} changed files`);
			
			for (const line of lines) {
				const [status, filePath] = line.split('\t');
				console.log(`  ${status} ${filePath}`);
				
				if (status === 'A') {
					addedFiles.add(filePath);
					fileChanges.set(filePath, {
						filePath,
						status: 'added',
						addedLines: new Set(),
						deletedLines: new Set(),
						modifiedLines: new Set()
					});
					console.log(`    ➕ Marked as ADDED: "${filePath}"`);
				} else if (status === 'D') {
					deletedFiles.add(filePath);
					fileChanges.set(filePath, {
						filePath,
						status: 'deleted',
						addedLines: new Set(),
						deletedLines: new Set(),
						modifiedLines: new Set()
					});
					console.log(`    ➖ Marked as DELETED: "${filePath}"`);
				} else if (status === 'M' || status.startsWith('R')) {
					modifiedFiles.add(filePath);
					// Get detailed line-level diff for modified files
					await this.getFileLineDiff(workspacePath, filePath, diffCommand, fileChanges);
				}
			}

			// Also check for untracked files (new files not yet added to git)
			const { stdout: untrackedOutput } = await execAsync('git ls-files --others --exclude-standard', { cwd: workspacePath });
			const untrackedLines = untrackedOutput.trim().split('\n').filter(line => line);
			console.log(`📊 Git found ${untrackedLines.length} untracked (new) files`);
			
			for (const filePath of untrackedLines) {
				// Only add TypeScript/JavaScript files
				if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || 
					filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
					console.log(`  ➕ Untracked: ${filePath}`);
					addedFiles.add(filePath);
					fileChanges.set(filePath, {
						filePath,
						status: 'added',
						addedLines: new Set(),
						deletedLines: new Set(),
						modifiedLines: new Set()
					});
					console.log(`    ➕ Marked as ADDED (untracked): "${filePath}"`);
				}
			}

			console.log(`✅ Git diff summary: ${addedFiles.size} added, ${deletedFiles.size} deleted, ${modifiedFiles.size} modified`);

			return {
				addedFiles,
				deletedFiles,
				modifiedFiles,
				fileChanges
			};
		} catch (error) {
			console.error('Error getting git diff:', error);
			return null;
		}
	}

	/**
	 * Get line-level changes for a specific file
	 */
	private static async getFileLineDiff(
		workspacePath: string,
		filePath: string,
		diffCommand: string,
		fileChanges: Map<string, FileChange>
	): Promise<void> {
		try {
			const { stdout } = await execAsync(
				`${diffCommand} -U0 -- "${filePath}"`,
				{ cwd: workspacePath }
			);

			const addedLines = new Set<number>();
			const deletedLines = new Set<number>();

			// Parse diff output to get line numbers
			const lines = stdout.split('\n');
			let currentNewLine = 0;
			let currentOldLine = 0;

			for (const line of lines) {
				// Parse hunk headers like @@ -10,5 +10,7 @@
				const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
				if (hunkMatch) {
					currentOldLine = parseInt(hunkMatch[1]);
					currentNewLine = parseInt(hunkMatch[3]);
					continue;
				}

				if (line.startsWith('+') && !line.startsWith('+++')) {
					addedLines.add(currentNewLine);
					currentNewLine++;
				} else if (line.startsWith('-') && !line.startsWith('---')) {
					deletedLines.add(currentOldLine);
					currentOldLine++;
				} else if (line.startsWith(' ')) {
					currentNewLine++;
					currentOldLine++;
				}
			}

			fileChanges.set(filePath, {
				filePath,
				status: 'modified',
				addedLines,
				deletedLines,
				modifiedLines: new Set()
			});
		} catch (error) {
			console.error(`Error getting line diff for ${filePath}:`, error);
		}
	}

	/**
	 * Get list of recent commits for selection
	 */
	static async getRecentCommits(workspacePath: string, limit: number = 10): Promise<Array<{ hash: string; message: string }>> {
		try {
			const { stdout } = await execAsync(
				`git log --oneline -${limit}`,
				{ cwd: workspacePath }
			);

			return stdout.trim().split('\n').map(line => {
				const [hash, ...messageParts] = line.split(' ');
				return {
					hash,
					message: messageParts.join(' ')
				};
			});
		} catch (error) {
			console.error('Error getting commits:', error);
			return [];
		}
	}

	/**
	 * Check if file has uncommitted changes
	 */
	static async hasUncommittedChanges(workspacePath: string): Promise<boolean> {
		try {
			const { stdout } = await execAsync('git status --porcelain', { cwd: workspacePath });
			return stdout.trim().length > 0;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Get the content of a deleted file from the previous commit
	 */
	static async getDeletedFileContent(workspacePath: string, filePath: string, baseCommit: string = 'HEAD~1'): Promise<string | null> {
		try {
			const { stdout } = await execAsync(`git show ${baseCommit}:"${filePath}"`, { cwd: workspacePath });
			return stdout;
		} catch (error) {
			console.error(`Failed to get deleted file content for ${filePath}:`, error);
			return null;
		}
	}
}
