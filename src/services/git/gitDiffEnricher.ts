import { DiagramData, ClassInfo, PropertyInfo, MethodInfo } from '../../types/diagram';
import { GitDiffService, GitDiffInfo } from './gitDiffService';
import { CodeParserService } from '../parsing/codeParserService';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export class GitDiffEnricher {
	/**
	 * Enrich diagram data with git diff information (uncommitted changes only)
	 * @param diagramData - The diagram data to enrich
	 * @param workspacePath - The workspace path
	 * @param baseCommit - Deprecated, no longer used (kept for backwards compatibility)
	 */
	static async enrichWithGitDiff(
		diagramData: DiagramData,
		workspacePath: string,
		baseCommit: string = 'HEAD~1'
	): Promise<DiagramData> {
		console.log('🔍 Starting git diff enrichment (uncommitted changes only)...');
		const diffInfo = await GitDiffService.getDiff(workspacePath);
		
		if (!diffInfo) {
			// No uncommitted changes - mark everything as unchanged
			console.log('✨ No uncommitted changes, marking all as unchanged');
			return this.markAllUnchanged(diagramData);
		}

		// Get the git root directory to convert absolute paths to git-relative paths
		const gitRoot = await GitDiffService.getGitRoot(workspacePath);
		if (!gitRoot) {
			console.log('⚠️ Could not determine git root, marking all as unchanged');
			return this.markAllUnchanged(diagramData);
		}

		console.log(`📊 Processing ${diagramData.classes.length} classes for git diff`);
		console.log(`� Git root: "${gitRoot}"`);
		console.log(`🔍 Workspace: "${workspacePath}"`);
		console.log(`�📋 Modified files in git diff: (${diffInfo.modifiedFiles.size})`, Array.from(diffInfo.modifiedFiles));
		console.log(`📋 Added files in git diff: (${diffInfo.addedFiles.size})`, Array.from(diffInfo.addedFiles));
		console.log(`📋 Deleted files in git diff: (${diffInfo.deletedFiles.size})`, Array.from(diffInfo.deletedFiles));

		// Parse deleted files and add them to diagram data
		if (diffInfo.deletedFiles.size > 0) {
			console.log(`🔍 Parsing ${diffInfo.deletedFiles.size} deleted files...`);
			for (const deletedFilePath of diffInfo.deletedFiles) {
				// Only process TypeScript/JavaScript files
				if (deletedFilePath.endsWith('.ts') || deletedFilePath.endsWith('.tsx') || 
					deletedFilePath.endsWith('.js') || deletedFilePath.endsWith('.jsx')) {
					
					const fileContent = await GitDiffService.getDeletedFileContent(workspacePath, deletedFilePath, baseCommit);
					if (fileContent) {
						// Create a temporary file to parse
						const tempFilePath = path.join(os.tmpdir(), `kratai_deleted_${Date.now()}_${path.basename(deletedFilePath)}`);
						fs.writeFileSync(tempFilePath, fileContent);
						
						try {
							// Parse the deleted file
							const deletedClasses = CodeParserService.parseFile(tempFilePath);
							
							// Mark all classes from this file as deleted
							for (const classInfo of deletedClasses) {
								classInfo.filePath = deletedFilePath; // Use original path
								classInfo.changeStatus = 'deleted';
								classInfo.properties.forEach(prop => prop.changeStatus = 'deleted');
								classInfo.methods.forEach(method => method.changeStatus = 'deleted');
								
								// Add to diagram data
								diagramData.classes.push(classInfo);
								console.log(`  ❌ Added deleted class: ${classInfo.name} from "${deletedFilePath}"`);
							}
						} finally {
							// Clean up temp file
							try { fs.unlinkSync(tempFilePath); } catch (e) { /* ignore */ }
						}
					}
				}
			}
		}
		
		let addedCount = 0;
		let deletedCount = 0;
		let modifiedCount = 0;
		let unchangedCount = 0;

		// Enrich each class with change status
		for (const classInfo of diagramData.classes) {
			// classInfo.filePath is now workspace-relative (e.g., "test-fixtures/typescript/03-node-backend/src/controllers/ProductController.ts")
			// We need to convert it to git-relative (e.g., "mvp/test-fixtures/typescript/03-node-backend/src/controllers/ProductController.ts")
			const workspaceRelativePath = classInfo.filePath.replace(/\\/g, '/');
			const gitRelativePath = path.relative(gitRoot, path.join(workspacePath, workspaceRelativePath)).replace(/\\/g, '/');
			
			console.log(`  🔍 Checking "${classInfo.name}"`);
			console.log(`     workspace-relative: "${workspaceRelativePath}"`);
			console.log(`     git-relative: "${gitRelativePath}"`);
			console.log(`     in modified set? ${diffInfo.modifiedFiles.has(gitRelativePath)}`);
			console.log(`     in added set? ${diffInfo.addedFiles.has(gitRelativePath)}`);
			
			// Determine class-level change status
			if (diffInfo.addedFiles.has(gitRelativePath)) {
				classInfo.changeStatus = 'added';
				addedCount++;
				// Mark all members as added
				classInfo.properties.forEach(prop => prop.changeStatus = 'added');
				classInfo.methods.forEach(method => method.changeStatus = 'added');
				console.log(`  ✅ ${classInfo.name} at "${gitRelativePath}" → ADDED`);
			} else if (diffInfo.deletedFiles.has(gitRelativePath)) {
				classInfo.changeStatus = 'deleted';
				deletedCount++;
				// Mark all members as deleted
				classInfo.properties.forEach(prop => prop.changeStatus = 'deleted');
				classInfo.methods.forEach(method => method.changeStatus = 'deleted');
				console.log(`  ❌ ${classInfo.name} at "${gitRelativePath}" → DELETED (still exists in workspace)`);
			} else if (diffInfo.modifiedFiles.has(gitRelativePath)) {
				// File is modified - need to check member-level changes
				console.log(`  🔍 Found "${gitRelativePath}" in modified files, checking members...`);
				const fileChange = diffInfo.fileChanges.get(gitRelativePath);
				
				// Get the old version from git to detect deleted members
				const oldFileContent = await GitDiffService.getFileContentFromHistory(workspacePath, gitRelativePath, baseCommit);
				let oldClasses: ClassInfo[] = [];
				
				if (oldFileContent) {
					// Parse the old version
					const tempFilePath = path.join(os.tmpdir(), `kratai_old_${Date.now()}_${path.basename(gitRelativePath)}`);
					fs.writeFileSync(tempFilePath, oldFileContent);
					
					try {
						oldClasses = CodeParserService.parseFile(tempFilePath);
					} finally {
						try { fs.unlinkSync(tempFilePath); } catch (e) { /* ignore */ }
					}
				}
				
				// Find the matching old class
				const oldClass = oldClasses.find(c => c.name === classInfo.name);
				
				if (fileChange) {
					const hasModifiedMembers = this.enrichMembersWithChanges(
						classInfo,
						fileChange,
						oldClass
					);
					classInfo.changeStatus = hasModifiedMembers ? 'modified' : 'unchanged';
					if (hasModifiedMembers) {
						modifiedCount++;
						console.log(`  🔄 ${classInfo.name} → MODIFIED (has member changes)`);
					} else {
						unchangedCount++;
						console.log(`  ⚪ ${classInfo.name} → UNCHANGED (no member changes detected)`);
					}
				} else {
					classInfo.changeStatus = 'unchanged';
					unchangedCount++;
					console.log(`  ⚠️ ${classInfo.name} → UNCHANGED (no fileChange data)`);
				}
			} else {
				classInfo.changeStatus = 'unchanged';
				unchangedCount++;
				classInfo.properties.forEach(prop => prop.changeStatus = 'unchanged');
				classInfo.methods.forEach(method => method.changeStatus = 'unchanged');
				// Only log if it's potentially an issue (new classes not detected)
				if (!classInfo.name.startsWith('[') && classInfo.methods.length > 0) {
					console.log(`  ⚪ ${classInfo.name} at "${gitRelativePath}" → UNCHANGED (not in any git diff set)`);
				}
			}
		}

		// Count deleted classes that were added from git history
		const deletedFromGit = diagramData.classes.filter(c => c.changeStatus === 'deleted').length;
		console.log(`✨ Git diff enrichment complete: ${addedCount} added, ${deletedFromGit} deleted (${deletedFromGit - deletedCount} from git history), ${modifiedCount} modified, ${unchangedCount} unchanged`);

		return diagramData;
	}

	/**
	 * Enrich properties and methods with change status based on line numbers
	 */
	private static enrichMembersWithChanges(
		classInfo: ClassInfo,
		fileChange: { addedLines: Set<number>; deletedLines: Set<number> },
		oldClass?: ClassInfo
	): boolean {
		// Sort methods by line number for proper range detection
		const sortedMethods = [...classInfo.methods].sort((a, b) => 
			(a.lineNumber || 0) - (b.lineNumber || 0)
		);
		let hasChanges = false;

		console.log(`    📝 File has ${fileChange.addedLines.size} added lines, ${fileChange.deletedLines.size} deleted lines`);
		console.log(`    📝 Added lines:`, Array.from(fileChange.addedLines).slice(0, 10));
		console.log(`    📝 Deleted lines:`, Array.from(fileChange.deletedLines).slice(0, 10));

		// If we have the old version, detect deleted members
		if (oldClass) {
			// Check for deleted properties
			for (const oldProp of oldClass.properties) {
				const stillExists = classInfo.properties.some(p => p.name === oldProp.name);
				if (!stillExists) {
					// Property was deleted - add it back with 'deleted' status
					classInfo.properties.push({
						...oldProp,
						changeStatus: 'deleted'
					});
					hasChanges = true;
					console.log(`      🔹 Property "${oldProp.name}" → DELETED (not in current version)`);
				}
			}
			
			// Check for deleted methods
			for (const oldMethod of oldClass.methods) {
				const stillExists = classInfo.methods.some(m => m.name === oldMethod.name);
				if (!stillExists) {
					// Method was deleted - add it back with 'deleted' status
					classInfo.methods.push({
						...oldMethod,
						changeStatus: 'deleted'
					});
					hasChanges = true;
					console.log(`      🔸 Method "${oldMethod.name}" → DELETED (not in current version)`);
				}
			}
		}

		// Check properties
		for (const prop of classInfo.properties) {
			// Skip if already marked as deleted
			if (prop.changeStatus === 'deleted') continue;
			
			if (prop.lineNumber) {
				console.log(`      🔹 Property "${prop.name}" at line ${prop.lineNumber}`);
				if (fileChange.addedLines.has(prop.lineNumber)) {
					prop.changeStatus = 'added';
					hasChanges = true;
					console.log(`        ✅ ADDED`);
				} else if (fileChange.deletedLines.has(prop.lineNumber)) {
					prop.changeStatus = 'deleted';
					hasChanges = true;
					console.log(`        ❌ DELETED`);
				} else {
					// For properties, check the actual range or default to single line
					const endLine = prop.endLineNumber || prop.lineNumber + 1;
					if (this.isChangeInRange(prop.lineNumber, endLine, fileChange)) {
						prop.changeStatus = 'modified';
						hasChanges = true;
						console.log(`        🔄 MODIFIED`);
					} else {
						prop.changeStatus = 'unchanged';
					}
				}
			} else {
				prop.changeStatus = 'unchanged';
				console.log(`      🔹 Property "${prop.name}" has no line number`);
			}
		}

		// Check methods
		for (let i = 0; i < sortedMethods.length; i++) {
			const method = sortedMethods[i];
			// Skip if already marked as deleted
			if (method.changeStatus === 'deleted') continue;
			
			if (method.lineNumber) {
				console.log(`      🔸 Method "${method.name}" at line ${method.lineNumber}`);
				if (fileChange.addedLines.has(method.lineNumber)) {
					method.changeStatus = 'added';
					hasChanges = true;
					console.log(`        ✅ ADDED`);
				} else if (fileChange.deletedLines.has(method.lineNumber)) {
					method.changeStatus = 'deleted';
					hasChanges = true;
					console.log(`        ❌ DELETED`);
				} else {
					// Use actual end line from AST, or next method's start, or reasonable default
					let endLine: number;
					if (method.endLineNumber) {
						endLine = method.endLineNumber;
					} else {
						const nextMethod = sortedMethods[i + 1];
						endLine = nextMethod?.lineNumber || method.lineNumber + 200;
					}
					
					if (this.isChangeInRange(method.lineNumber, endLine, fileChange)) {
						method.changeStatus = 'modified';
						hasChanges = true;
						console.log(`        🔄 MODIFIED (change in lines ${method.lineNumber}-${endLine})`);
					} else {
						method.changeStatus = 'unchanged';
					}
				}
			} else {
				method.changeStatus = 'unchanged';
				console.log(`      🔸 Method "${method.name}" has no line number`);
			}
		}

		return hasChanges;
	}

	/**
	 * Check if a change falls within a specific line range (method body)
	 * Only marks as changed if the change is actually within this member's range
	 */
	private static isChangeInRange(
		startLine: number,
		endLine: number,
		fileChange: { addedLines: Set<number>; deletedLines: Set<number> }
	): boolean {
		// Check if any changes are within this specific range
		for (let i = startLine; i < endLine; i++) {
			if (fileChange.addedLines.has(i) || fileChange.deletedLines.has(i)) {
				return true;
			}
		}
		
		return false;
	}

	/**
	 * Mark all classes and members as unchanged
	 */
	private static markAllUnchanged(diagramData: DiagramData): DiagramData {
		for (const classInfo of diagramData.classes) {
			classInfo.changeStatus = 'unchanged';
			classInfo.properties.forEach(prop => prop.changeStatus = 'unchanged');
			classInfo.methods.forEach(method => method.changeStatus = 'unchanged');
		}
		return diagramData;
	}
}
