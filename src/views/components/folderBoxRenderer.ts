import { FolderNode, FolderStructureBuilder } from './folderStructure';
import { FolderSize } from './layoutCalculator';

export class FolderBoxRenderer {
	
	renderAll(folder: FolderNode, depth = 0): string {
		const folderIcon = this.getFolderIcon(folder.name);
		const totalCount = FolderStructureBuilder.countClasses(folder);
		
		let html = this.renderFolder(folder, folderIcon, totalCount, depth);
		
		return html;
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

	private renderFolder(
		folder: FolderNode,
		icon: string,
		totalCount: number,
		depth: number
	): string {
		const childFolders = Array.from(folder.children.values()).sort((a, b) => a.name.localeCompare(b.name));
		
		// Pre-render child folders to avoid template string issues
		const childFoldersHTML = childFolders.length > 0
			? childFolders.map(child => this.renderAll(child, depth + 1)).join('\n')
			: '';
		
		// Escape folder name and path for safe HTML rendering
		const safeFolderName = this.escapeHtml(folder.name);
		const safeFolderPath = this.escapeHtml(folder.fullPath);
		
		return `
			<div class="folder-container" data-folder="${safeFolderPath}" data-depth="${depth}" style="
				margin: ${depth === 0 ? '20px' : '10px'};
				border: 2px solid #333;
				background: transparent;
			">
				<!-- Folder Header -->
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
					<span>${icon}</span>
					<span>${safeFolderName}</span>
					${totalCount > 0 ? `<span style="
						background: #999;
						padding: 2px 6px;
						font-size: 11px;
						margin-left: auto;
						color: #fff;
					">${totalCount}</span>` : ''}
				</div>
				
				<!-- Folder Content: Classes in CSS Grid -->
				${folder.classes.length > 0 ? `
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
				` : ''}
				
				<!-- Child Folders -->
				${childFoldersHTML ? `
				<div class="child-folders" data-parent="${safeFolderPath}" style="
					display: flex;
					flex-direction: column;
					gap: 10px;
					padding: ${folder.classes.length > 0 ? '0 10px 10px 10px' : '10px'};
				">
${childFoldersHTML}
				</div>
				` : ''}
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
