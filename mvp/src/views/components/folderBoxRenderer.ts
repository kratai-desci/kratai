import { FolderNode, FolderStructureBuilder } from './folderStructure';
import { FolderSize } from './layoutCalculator';

export class FolderBoxRenderer {
	renderAll(folder: FolderNode, folderSizes: Map<string, FolderSize>, depth = 0): string {
		const pos = folderSizes.get(folder.fullPath);
		if (!pos) return '';
		
		// Use progressively lighter colors for nested folders
		const bgOpacity = Math.max(0.12, 0.25 - depth * 0.03);
		const borderOpacity = Math.max(0.4, 0.65 - depth * 0.08);
		
		const folderIcon = this.getFolderIcon(folder.name);
		const totalCount = FolderStructureBuilder.countClasses(folder);
		
		let html = this.renderFolder(folder, pos, bgOpacity, borderOpacity, folderIcon, totalCount, depth);
		
		// Render child folders recursively
		const childFolders = Array.from(folder.children.values()).sort((a, b) => a.name.localeCompare(b.name));
		childFolders.forEach(child => {
			html += this.renderAll(child, folderSizes, depth + 1);
		});
		
		return html;
	}

	private renderFolder(
		folder: FolderNode, 
		pos: FolderSize, 
		bgOpacity: number, 
		borderOpacity: number,
		icon: string,
		totalCount: number,
		depth: number
	): string {
		// UML Package tab-style notation
		const tabWidth = Math.min(180, Math.max(120, folder.name.length * 8 + 60));
		
		return `
			<!-- Package Tab -->
			<div style="
				position: absolute;
				left: ${pos.x}px;
				top: ${pos.y - 28}px;
				width: ${tabWidth}px;
				height: 28px;
				background: #e8e8e8;
				border: 2px solid #666;
				border-bottom: none;
				border-radius: 4px 4px 0 0;
				z-index: ${6 - depth};
				pointer-events: auto;
				box-sizing: border-box;
			">
				<div style="
					padding: 5px 12px;
					color: #333;
					font-weight: 600;
					font-size: 13px;
					display: flex;
					align-items: center;
					gap: 6px;
					height: 100%;
				">
					<span>${icon}</span>
					<span>${folder.name}</span>
					${totalCount > 0 ? `<span style="
						background: #d0d0d0;
						padding: 1px 6px;
						border-radius: 3px;
						font-size: 11px;
						margin-left: auto;
						font-weight: 500;
					">${totalCount}</span>` : ''}
				</div>
			</div>
			<!-- Package Body -->
			<div class="folder-box" style="
				position: absolute;
				left: ${pos.x}px;
				top: ${pos.y}px;
				width: ${pos.width}px;
				height: ${pos.height}px;
				background: #fafafa;
				border: 2px solid #666;
				border-radius: 0 4px 4px 4px;
				z-index: ${5 - depth};
				pointer-events: none;
				box-sizing: border-box;
			">
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
