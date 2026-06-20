import { ReactFlowNode } from '../../types/view';

export interface FolderNode {
	name: string;
	fullPath: string;
	children: Map<string, FolderNode>;
	classes: ReactFlowNode[];
}

export class FolderStructureBuilder {
	static build(nodes: ReactFlowNode[]): FolderNode {
		const root: FolderNode = { 
			name: 'workspace', 
			fullPath: '', 
			children: new Map(), 
			classes: [] 
		};

		const unmatchedFiles: string[] = [];
		
		nodes.forEach(node => {
			const filePath = node.data.classInfo.filePath;
			const className = node.data.classInfo.name;
			
			// Match the full path structure, capturing everything before the file
			// Supports .ts, .tsx, .js, .jsx, .py, .php files
			const matchPath = filePath.match(/^(.+)\/[^\/]+\.(tsx?|jsx?|py|php)$/);
			
			if (matchPath) {
				// File has a folder path - split into parts
				const fullFolderPath = matchPath[1];
				const pathParts = fullFolderPath.split('/').filter(p => p.length > 0);
				
				// Skip common prefixes that aren't meaningful (like 'src' alone)
				// But keep the full hierarchy to avoid collisions
				if (pathParts.length === 0) {
					root.classes.push(node);
					return;
				}
				
				let current = root;
				let currentPath = '';
				
				pathParts.forEach(part => {
					currentPath = currentPath ? currentPath + '/' + part : part;
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
				// File doesn't have a folder path (shouldn't happen with valid code)
				console.warn(`⚠️ ${className}: Path "${filePath}" didn't match expected pattern - adding to root`);
				unmatchedFiles.push(`${className} @ ${filePath}`);
				root.classes.push(node);
			}
		});

		if (unmatchedFiles.length > 0) {
			console.warn(`\n❌ ${unmatchedFiles.length} files didn't match folder pattern:`);
			unmatchedFiles.slice(0, 10).forEach(f => console.warn(`   ${f}`));
		}

		// Collapse pass-through folders - DISABLED (causes structure corruption)
		// this.collapsePassThroughFolders(root);

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
		console.log(`${indent}📁 ${folder.name} (${folder.classes.length} classes) [fullPath: ${folder.fullPath}]`);
		folder.classes.forEach(node => {
			console.log(`${indent}  └─ ${node.data.classInfo.name} @ ${node.data.classInfo.filePath}`);
		});
		
		// Show children count
		if (folder.children.size > 0) {
			console.log(`${indent}  Children: ${Array.from(folder.children.keys()).join(', ')}`);
		}
		
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
