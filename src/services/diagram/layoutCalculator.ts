import { DiagramFolderNode } from './folderStructure';
import { ReactFlowNode } from '../../types/view';

export interface LayoutConfig {
	horizontalSpacing: number;
	verticalSpacing: number;
	folderPadding: number;
	classSpacing: number;
}

export interface Position {
	x: number;
	y: number;
}

export interface FolderSize extends Position {
	width: number;
	height: number;
}

export class HierarchicalLayoutCalculator {
	private config: LayoutConfig;
	
	constructor(config?: Partial<LayoutConfig>) {
		this.config = {
			horizontalSpacing: 400,
			verticalSpacing: 300,
			folderPadding: 50,
			classSpacing: 20,
			...config
		};
	}
	
	calculate(folder: DiagramFolderNode, x: number, y: number): { width: number; height: number } {
		let currentX = x + this.config.folderPadding;
		let currentY = y + this.config.folderPadding + 80; // Space for folder title
		let maxWidth = 0;
		let maxHeight = 0;
		
		// Layout classes in this folder first
		folder.classes.forEach((node: ReactFlowNode, index: number) => {
			// Update node position
			node.position = { x: currentX, y: currentY };
			
			const classWidth = 300;
			const classHeight = 150;
			
			currentY += classHeight + this.config.classSpacing;
			maxWidth = Math.max(maxWidth, classWidth);
			maxHeight = currentY - y;
		});
		
		// Reset for subfolders
		if (folder.classes.length > 0) {
			currentY += this.config.verticalSpacing / 2;
		}
		
		// Layout subfolders
		const childFolders = Array.from(folder.children.values());
		let folderX = currentX;
		
		childFolders.forEach((childFolder, index) => {
			const childSize = this.calculate(childFolder, folderX, currentY);
			
			// Arrange subfolders horizontally
			folderX += childSize.width + this.config.horizontalSpacing;
			maxWidth = Math.max(maxWidth, folderX - x);
			maxHeight = Math.max(maxHeight, childSize.height + (currentY - y));
		});
		
		const totalWidth = maxWidth + this.config.folderPadding * 2;
		const totalHeight = maxHeight + this.config.folderPadding;
		
		return { width: totalWidth, height: totalHeight };
	}
}
