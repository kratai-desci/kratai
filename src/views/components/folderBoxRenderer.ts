import { DiagramFolderNode, FolderStructureBuilder } from '../../services/diagram/folderStructure';
import { FolderSize } from '../../services/diagram/layoutCalculator';
import { KrataiConfig } from '../../types/config/KrataiConfig';

export class FolderBoxRenderer {
	private config: KrataiConfig;

	constructor(config: KrataiConfig) {
		this.config = config;
	}
	
	renderAll(folder: DiagramFolderNode): string {
		// Collect all leaf folders (folders with classes)
		const leafFolders = this.collectLeafFolders(folder);
		
		// Sort by custom order
		const sortedFolders = this.sortFoldersByOrder(leafFolders);
		
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
	 * Sort folders by custom order, then alphabetically
	 */
	private sortFoldersByOrder(folders: DiagramFolderNode[]): DiagramFolderNode[] {
		return folders.sort((a, b) => {
			const orderA = this.getFolderOrder(a);
			const orderB = this.getFolderOrder(b);
			
			// Both have custom orders - sort by order
			if (orderA !== null && orderB !== null) {
				return orderA - orderB;
			}
			
			// A has order, B doesn't - A comes first
			if (orderA !== null) return -1;
			if (orderB !== null) return 1;
			
			// Neither has order - alphabetical by full path
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
			<div class="folder-container" data-folder="${safeFolderPath}" style="
				margin: 20px;
				border: 2px solid #333;
				background: transparent;
			">
				<!-- Folder Header with Name and Full Path -->
				<div class="folder-header" style="
					padding: 8px 12px;
					background: #ddd;
					border-bottom: 2px solid #333;
					color: #000;
					font-weight: 600;
					font-size: 13px;
					display: flex;
					align-items: center;
					gap: 6px;
				">
					<span>${folderIcon}</span>
					<span>${safeFolderName}</span>
					<span style="
						font-weight: 400;
						font-size: 11px;
						color: #666;
						margin-left: 4px;
					">| ${safeFolderPath}</span>
					${classCount > 0 ? `<span style="
						background: #999;
						padding: 2px 6px;
						font-size: 11px;
						margin-left: auto;
						color: #fff;
					">${classCount}</span>` : ''}
				</div>
				
				<!-- Folder Content: Classes in CSS Grid -->
				<div class="classes-grid" data-folder-classes="${safeFolderPath}" style="
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
					gap: 20px;
					padding: 20px;
				">
					${folder.classes.map(node => {
						const classRenderer = new (require('./classBoxRenderer').ClassBoxRenderer)(260);
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
