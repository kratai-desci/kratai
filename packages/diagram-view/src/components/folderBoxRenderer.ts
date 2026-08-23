import { DiagramFolderNode, FolderStructureBuilder, KrataiConfig, ReactFlowNode } from '@kratai/core';
import { getLayerWeight } from '../layerWeight';
import { foldSingleClassFolders, prefixFoldedClassName } from '../foldSingleClassFolders';

export class FolderBoxRenderer {
	private config: KrataiConfig;
	private hasLiveHost: boolean;

	constructor(config: KrataiConfig, hasLiveHost: boolean = false) {
		this.config = config;
		this.hasLiveHost = hasLiveHost;
	}
	
	renderAll(folder: DiagramFolderNode): string {
		// Collect all leaf folders (folders with classes)
		const leafFolders = this.collectLeafFolders(folder);

		// A leaf folder with exactly one class is usually routing structure
		// (Next.js's app/auth/sign-in/page.tsx, app/auth/sign-up/page.tsx,
		// ...), not a real architectural grouping - fold it into its parent
		// as a class instead of giving it its own near-empty box.
		const folded = foldSingleClassFolders<ReactFlowNode, DiagramFolderNode>(
			leafFolders,
			(node, originFolderName) => ({
				...node,
				data: { ...node.data, classInfo: { ...node.data.classInfo, name: prefixFoldedClassName(node.data.classInfo.name, originFolderName) } }
			}),
			(fullPath, name, classes) => ({ fullPath, name, children: new Map(), classes })
		);

		// Sort by custom order
		const sortedFolders = this.sortFoldersByOrder(folded);

		// Render each leaf folder as a flat box
		return sortedFolders.map(leafFolder => this.renderLeafFolder(leafFolder)).join('\n');
	}

	/**
	 * Recursively collect all folders that contain classes (leaf folders)
	 */
	private collectLeafFolders(folder: DiagramFolderNode): DiagramFolderNode[] {
		const leaves: DiagramFolderNode[] = [];
		
		// If this folder has classes, it's a leaf
		if (folder.classes.length > 0) {
			leaves.push(folder);
		}
		
		// Recursively collect from children
		folder.children.forEach(child => {
			leaves.push(...this.collectLeafFolders(child));
		});
		
		return leaves;
	}

	/**
	 * Sort folders by: 1) custom order, 2) layer weight, 3) alphabetical
	 */
	private sortFoldersByOrder(folders: DiagramFolderNode[]): DiagramFolderNode[] {
		return folders.sort((a, b) => {
			const customOrderA = this.getFolderOrder(a);
			const customOrderB = this.getFolderOrder(b);
			
			// 1. Custom order takes precedence
			if (customOrderA !== null && customOrderB !== null) {
				return customOrderA - customOrderB;
			}
			if (customOrderA !== null) return -1;
			if (customOrderB !== null) return 1;
			
			// 2. Use smart default layer weights (analyze both path and name)
			const layerWeightA = getLayerWeight(a.fullPath, a.name);
			const layerWeightB = getLayerWeight(b.fullPath, b.name);
			
			if (layerWeightA !== layerWeightB) {
				return layerWeightA - layerWeightB;
			}
			
			// 3. Alphabetical tiebreaker
			return a.fullPath.localeCompare(b.fullPath);
		});
	}

	/**
	 * Get custom order for a folder from config
	 */
	private getFolderOrder(folder: DiagramFolderNode): number | null {
		const folderConfig = this.config.folders?.[folder.fullPath];
		if (folderConfig?.order !== undefined && folderConfig.order !== null) {
			return folderConfig.order;
		}
		return null;
	}

	private escapeHtml(text: string): string {
		// Escape HTML special characters in folder/file names
		// Handles: angle brackets, quotes, ampersands, and control characters
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	/**
	 * Render a single leaf folder as a flat box with full path
	 */
	private renderLeafFolder(folder: DiagramFolderNode): string {
		const folderIcon = this.getFolderIcon(folder.name);
		const safeFolderName = this.escapeHtml(folder.name);
		const safeFolderPath = this.escapeHtml(folder.fullPath);
		const classCount = folder.classes.length;

		return `
			<div class="folder-container" data-folder="${safeFolderPath}">
				<div class="folder-header">
					<span>${folderIcon}</span>
					<span class="folder-name">${safeFolderName}</span>
					<span class="folder-path">| ${safeFolderPath}</span>
					${classCount > 0 ? `<span class="folder-count">${classCount}</span>` : ''}
				</div>

				<div class="classes-grid" data-folder-classes="${safeFolderPath}">
					${folder.classes.map(node => {
						const classRenderer = new (require('./classBoxRenderer').ClassBoxRenderer)(260, this.hasLiveHost);
						return classRenderer.render(node.data.classInfo);
					}).join('\n')}
				</div>
			</div>
		`;
	}

	private getFolderIcon(folderName: string): string {
		if (folderName.includes('command')) return '⚡';
		if (folderName.includes('service')) return '⚙️';
		if (folderName.includes('view')) return '👁️';
		if (folderName.includes('type')) return '📝';
		if (folderName.includes('l1_ui')) return '🎨';
		if (folderName.includes('l2_controller')) return '🎮';
		if (folderName.includes('l3_model')) return '📦';
		if (folderName.includes('l4_infra')) return '🔧';
		if (folderName.includes('app')) return '📱';
		return '📁';
	}
}
