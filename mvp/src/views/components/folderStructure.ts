import { ReactFlowNode } from '../../types/diagram';

export interface FolderNode {
	name: string;
	fullPath: string;
	children: Map<string, FolderNode>;
	classes: ReactFlowNode[];
}

export class FolderStructureBuilder {
	static build(nodes: ReactFlowNode[]): FolderNode {
		const root: FolderNode = { 
			name: 'src', 
			fullPath: 'src', 
			children: new Map(), 
			classes: [] 
		};

		const unmatchedFiles: string[] = [];
		
		nodes.forEach(node => {
			const filePath = node.data.classInfo.filePath;
			const className = node.data.classInfo.name;
			
			// Match any file under src/, extracting the folder path
			const match = filePath.match(/src\/(.+)\/[^\/]+\.tsx?$/);
			
			if (match) {
				// File has a folder path like src/commands/file.ts or src/l1_ui/components/file.tsx
				const pathParts = match[1].split('/');
				
				let current = root;
				let currentPath = 'src';
				
				pathParts.forEach(part => {
					currentPath += '/' + part;
					if (!current.children.has(part)) {
						current.children.set(part, {
							name: part,
							fullPath: currentPath,
							children: new Map(),
							classes: []
						});
					}
					current = current.children.get(part)!;
				});
				
				current.classes.push(node);
			} else {
				// File is directly in src/ (no subfolder) OR doesn't match pattern
				console.warn(`⚠️ ${className}: Path "${filePath}" didn't match /src\\/(.+)\\/[^\\/]+\\.tsx?$/ - adding to root`);
				unmatchedFiles.push(`${className} @ ${filePath}`);
				root.classes.push(node);
			}
		});

		if (unmatchedFiles.length > 0) {
			console.warn(`\n❌ ${unmatchedFiles.length} files didn't match folder pattern:`);
			unmatchedFiles.slice(0, 10).forEach(f => console.warn(`   ${f}`));
		}

		// Collapse pass-through folders (folders with no classes and only one child)
		this.collapsePassThroughFolders(root);

		return root;
	}

	// Collapse folders that have no classes and only one child folder
	private static collapsePassThroughFolders(folder: FolderNode): void {
		const childEntries = Array.from(folder.children.entries());
		
		for (const [childName, childFolder] of childEntries) {
			// First, recursively collapse children
			this.collapsePassThroughFolders(childFolder);
			
			// If this child has no classes and exactly one child of its own, collapse it
			if (childFolder.classes.length === 0 && childFolder.children.size === 1) {
				const [grandchildName, grandchildFolder] = Array.from(childFolder.children.entries())[0];
				
				// Merge the names: "github" + "repos" -> "github/repos"
				grandchildFolder.name = `${childFolder.name}/${grandchildName}`;
				
				// Replace the child with the grandchild
				folder.children.delete(childName);
				folder.children.set(childFolder.name, grandchildFolder);
				
				console.log(`🔄 Collapsed ${childFolder.fullPath} -> ${grandchildFolder.name}`);
			}
		}
	}

	static logStructure(folder: FolderNode, indent = ''): void {
		console.log(`${indent}📁 ${folder.name} (${folder.classes.length} classes)`);
		folder.classes.forEach(node => {
			console.log(`${indent}  └─ ${node.data.classInfo.name}`);
		});
		folder.children.forEach(child => this.logStructure(child, indent + '  '));
	}

	static countClasses(folder: FolderNode): number {
		let count = folder.classes.length;
		folder.children.forEach(child => count += this.countClasses(child));
		return count;
	}

	static countFolders(folder: FolderNode): number {
		let count = 1;
		folder.children.forEach(child => count += this.countFolders(child));
		return count;
	}
}
