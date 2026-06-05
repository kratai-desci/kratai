import { DiagramData, ClassInfo, PropertyInfo, MethodInfo } from '../types/diagram';
import { GitDiffService, GitDiffInfo } from './gitDiffService';
import * as path from 'path';

export class GitDiffEnricher {
	/**
	 * Enrich diagram data with git diff information
	 */
	static async enrichWithGitDiff(
		diagramData: DiagramData,
		workspacePath: string,
		baseCommit: string = 'HEAD~1'
	): Promise<DiagramData> {
		console.log('🔍 Starting git diff enrichment...');
		const diffInfo = await GitDiffService.getDiff(workspacePath, baseCommit);
		
		if (!diffInfo) {
			// No git diff available, mark everything as unchanged
			console.log('⚠️ No git diff info available, marking all as unchanged');
			return this.markAllUnchanged(diagramData);
		}

		console.log(`📊 Processing ${diagramData.classes.length} classes for git diff`);
		console.log(`📋 Modified files in git diff:`, Array.from(diffInfo.modifiedFiles));
		console.log(`📋 Added files in git diff:`, Array.from(diffInfo.addedFiles));
		console.log(`📋 Deleted files in git diff:`, Array.from(diffInfo.deletedFiles));
		
		let addedCount = 0;
		let deletedCount = 0;
		let modifiedCount = 0;
		let unchangedCount = 0;

		// Enrich each class with change status
		for (const classInfo of diagramData.classes) {
			const relativeFilePath = classInfo.filePath;
			const normalizedPath = relativeFilePath.replace(/\\/g, '/'); // Normalize to forward slashes
			
			console.log(`  🔎 Checking: ${classInfo.name} at "${normalizedPath}"`);
			
			// Determine class-level change status
			if (diffInfo.addedFiles.has(normalizedPath)) {
				classInfo.changeStatus = 'added';
				addedCount++;
				// Mark all members as added
				classInfo.properties.forEach(prop => prop.changeStatus = 'added');
				classInfo.methods.forEach(method => method.changeStatus = 'added');
				console.log(`  ✅ ${classInfo.name} → ADDED`);
			} else if (diffInfo.deletedFiles.has(normalizedPath)) {
				classInfo.changeStatus = 'deleted';
				deletedCount++;
				// Mark all members as deleted
				classInfo.properties.forEach(prop => prop.changeStatus = 'deleted');
				classInfo.methods.forEach(method => method.changeStatus = 'deleted');
				console.log(`  ❌ ${classInfo.name} → DELETED`);
			} else if (diffInfo.modifiedFiles.has(normalizedPath)) {
				// File is modified - need to check member-level changes
				console.log(`  🔍 Found in modified files, checking members...`);
				const fileChange = diffInfo.fileChanges.get(normalizedPath);
				if (fileChange) {
					const hasModifiedMembers = this.enrichMembersWithChanges(
						classInfo,
						fileChange
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
			}
		}

		console.log(`✨ Git diff enrichment complete: ${addedCount} added, ${deletedCount} deleted, ${modifiedCount} modified, ${unchangedCount} unchanged`);

		return diagramData;
	}

	/**
	 * Enrich properties and methods with change status based on line numbers
	 */
	private static enrichMembersWithChanges(
		classInfo: ClassInfo,
		fileChange: { addedLines: Set<number>; deletedLines: Set<number> }
	): boolean {
		let hasChanges = false;

		console.log(`    📝 File has ${fileChange.addedLines.size} added lines, ${fileChange.deletedLines.size} deleted lines`);
		console.log(`    📝 Added lines:`, Array.from(fileChange.addedLines).slice(0, 10));
		console.log(`    📝 Deleted lines:`, Array.from(fileChange.deletedLines).slice(0, 10));

		// Check properties
		for (const prop of classInfo.properties) {
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
				} else if (this.isLineNearChange(prop.lineNumber, fileChange)) {
					prop.changeStatus = 'modified';
					hasChanges = true;
					console.log(`        🔄 MODIFIED (near change)`);
				} else {
					prop.changeStatus = 'unchanged';
				}
			} else {
				prop.changeStatus = 'unchanged';
				console.log(`      🔹 Property "${prop.name}" has no line number`);
			}
		}

		// Check methods
		for (const method of classInfo.methods) {
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
				} else if (this.isLineNearChange(method.lineNumber, fileChange)) {
					method.changeStatus = 'modified';
					hasChanges = true;
					console.log(`        🔄 MODIFIED (near change)`);
				} else {
					method.changeStatus = 'unchanged';
				}
			} else {
				method.changeStatus = 'unchanged';
				console.log(`      🔸 Method "${method.name}" has no line number`);
			}
		}

		return hasChanges;
	}

	/**
	 * Check if a line is near added/deleted lines (within 3 lines)
	 * This now checks if changes fall INSIDE a method/property (not just near its declaration)
	 */
	private static isLineNearChange(
		lineNumber: number,
		fileChange: { addedLines: Set<number>; deletedLines: Set<number> }
	): boolean {
		const range = 20; // Check within 20 lines (typical method body size)
		
		// Check if any changes are within the method/property body
		for (let i = lineNumber; i <= lineNumber + range; i++) {
			if (fileChange.addedLines.has(i) || fileChange.deletedLines.has(i)) {
				return true;
			}
		}
		
		// Also check a few lines before (for changes at method signature)
		for (let i = Math.max(1, lineNumber - 3); i < lineNumber; i++) {
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
