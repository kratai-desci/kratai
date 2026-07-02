import { ReactFlowNode } from '../../types/view';

export interface DiagramFolderNode {
	name: string;
	fullPath: string;
	children: Map<string, DiagramFolderNode>;
	classes: ReactFlowNode[];
}

export class FolderStructureBuilder {
	static build(nodes: ReactFlowNode[]): DiagramFolderNode {
		const root: DiagramFolderNode = { 
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
			// Supports: TypeScript, JavaScript, Python, PHP, Java, Kotlin, Groovy, HTML, Twig
			// + Spring templates: JSP, FreeMarker, Mustache, Velocity + XML configs
			const matchPath = filePath.match(/^(.+)\/[^\/]+\.(tsx?|jsx?|py|php|java|kt|groovy|html?|twig|jsp|ftlh?|mustache|vm|xml)$/);
			
			if (matchPath) {
				// File has a folder path - split into parts
				const folderPath = matchPath[1];
				const pathParts = folderPath.split('/');
				
				// Navigate/create folder structure
				let currentFolder = root;
				let accumulatedPath = '';
				
				for (let i = 0; i < pathParts.length; i++) {
					const part = pathParts[i];
					accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
					
					if (!currentFolder.children.has(part)) {
						currentFolder.children.set(part, {
							name: part,
							fullPath: accumulatedPath,
							children: new Map(),
							classes: []
						});
					}
					currentFolder = currentFolder.children.get(part)!;
				}
				
				// Add class to the deepest folder
				currentFolder.classes.push(node);
			} else {
				// No folder path - goes to root
				unmatchedFiles.push(`${className} (${filePath})`);
				root.classes.push(node);
			}
		});
		
		if (unmatchedFiles.length > 0) {
			console.log(`⚠️ Files without folder structure (${unmatchedFiles.length}):`, unmatchedFiles.join(', '));
		}
		
		// DISABLED: Folder collapsing - users want to see full hierarchy
		// this.collapsePassThroughFolders(root);
		
		return root;
	}
	
	/**
	 * Collapse folders that only have one child folder (no classes)
	 * e.g., "src" -> "components" becomes "src > components"
	 */
	private static collapsePassThroughFolders(folder: DiagramFolderNode): void {
		// Recursively process all children first
		folder.children.forEach(child => this.collapsePassThroughFolders(child));
		
		// If this folder has exactly 1 child folder and no classes, collapse it
		while (folder.classes.length === 0 && folder.children.size === 1) {
			const [childName, childFolder] = Array.from(folder.children.entries())[0];
			
			// Merge this folder with its child
			folder.name = `${folder.name} > ${childName}`;
			folder.fullPath = childFolder.fullPath;
			folder.classes = childFolder.classes;
			folder.children = childFolder.children;
		}
	}
	
	/**
	 * Log the folder structure (for debugging)
	 */
	static logStructure(folder: DiagramFolderNode, indent = ''): void {
		console.log(`${indent}📁 ${folder.name} (${folder.classes.length} classes)`);
		folder.children.forEach(child => {
			this.logStructure(child, indent + '  ');
		});
	}
	
	/**
	 * Count total classes in folder and subfolders
	 */
	static countClasses(folder: DiagramFolderNode): number {
		let count = folder.classes.length;
		folder.children.forEach(child => count += this.countClasses(child));
		return count;
	}
	
	static countFolders(folder: DiagramFolderNode): number {
		let count = 1; // Count self
		folder.children.forEach(child => count += this.countFolders(child));
		return count;
	}
}
