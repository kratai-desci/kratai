import { DiagramFolderNode, FolderStructureBuilder } from '../../services/diagram/folderStructure';
import { FolderSize } from '../../services/diagram/layoutCalculator';
import { KrataiConfig } from '../../types/config/KrataiConfig';

/**
 * Layer weight dictionary for smart default folder ordering
 * Organized by dependency/execution flow:
 * 100s: API Definition
 * 200s: Middleware
 * 300s: Routing
 * 400s: Controllers
 * 500s: Business Logic
 * 600s: Infrastructure/Utilities (used by services)
 * 700s: Data Access
 * 800s: Data Structures
 * 900s: UI/Output
 * 990s: Tests/Docs
 */
const LAYER_WEIGHTS: Record<string, number> = {
	// API Layer (100-199)
	"api": 100,
	"apis": 100,
	// HTTP Methods (for virtual API boxes)
	"get": 100,
	"post": 100,
	"put": 100,
	"patch": 100,
	"delete": 100,
	"head": 100,
	"options": 100,
	// WebSocket/Events
	"websocket": 100,
	"ws": 100,
	"webhook": 100,
	"webhooks": 100,
	// API-related
	"endpoints": 105,
	"endpoint": 105,
	"graphql": 110,
	"mutation": 110,
	"subscription": 110,
	
	// Middleware (200-299)
	"middleware": 200,
	"middlewares": 200,
	"interceptors": 205,
	"interceptor": 205,
	"guards": 210,
	"guard": 210,
	"filters": 215,
	"filter": 215,
	
	// Routing (300-399)
	"routes": 300,
	"route": 300,
	"routing": 300,
	"urls": 305,
	"url": 305,
	
	// Controllers (400-499)
	"controllers": 400,
	"controller": 400,
	"handlers": 405,
	"handler": 405,
	"views": 400,  // Django/FastAPI style (controllers)
	"view": 400,
	"pages": 400,  // Next.js pages (controllers)
	"page": 400,
	"screens": 400,  // Mobile screens
	"screen": 400,
	
	// Business Logic (500-599)
	"services": 500,
	"service": 500,
	"usecases": 505,
	"use-cases": 505,
	"usecase": 505,
	"business": 510,
	"domain": 515,
	"domains": 515,
	"core": 520,
	"providers": 520,  // Context providers, DI
	"provider": 520,
	"store": 520,  // State management
	"stores": 520,
	"commands": 525,
	"command": 525,
	"actions": 525,  // Redux actions
	"action": 525,
	"reducers": 528,  // Redux reducers
	"reducer": 528,
	"queries": 530,
	"query": 530,
	"processors": 535,
	"processor": 535,
	"workflows": 540,
	"workflow": 540,
	
	// Infrastructure/Utilities (600-699) - Used by services
	"config": 600,
	"configuration": 600,
	"settings": 605,
	"utils": 610,
	"util": 610,
	"utilities": 610,
	"helpers": 615,
	"helper": 615,
	"hooks": 618,  // React hooks
	"hook": 618,
	"common": 620,
	"shared": 625,
	"lib": 630,
	"libs": 630,
	"library": 630,
	"types": 635,
	"type": 635,
	"interfaces": 640,
	"interface": 640,
	"constants": 645,
	"constant": 645,
	"enums": 650,
	"enum": 650,
	"adapters": 655,
	"adapter": 655,
	"clients": 660,
	"client": 660,
	"external": 665,
	"integrations": 670,
	"integration": 670,
	"features": 675,  // Feature-based folders
	"feature": 675,
	"modules": 680,  // Module folders
	"module": 680,
	
	// Data Access (700-799)
	"repositories": 700,
	"repository": 700,
	"repos": 700,
	"repo": 700,
	"dal": 705,
	"dataaccess": 705,
	"data-access": 705,
	"persistence": 710,
	
	// Data Structures (800-899)
	"models": 800,
	"model": 800,
	"dto": 805,  // Data Transfer Objects
	"dtos": 805,
	"entities": 805,
	"entity": 805,
	"schemas": 808,  // Schema definitions
	"schema": 808,
	"database": 810,
	"db": 810,
	"storage": 815,
	"data": 820,
	
	// UI/Output (900-989)
	"templates": 900,
	"template": 900,
	"layouts": 900,  // Layout components
	"layout": 900,
	"presenters": 905,
	"presenter": 905,
	"serializers": 910,
	"serializer": 910,
	"responses": 915,
	"response": 915,
	"formatters": 920,
	"formatter": 920,
	"components": 925,  // UI components
	"component": 925,
	"ui": 925,  // UI library
	
	// Tests/Docs (990-999)
	"tests": 990,
	"test": 990,
	"__tests__": 990,
	"specs": 992,
	"spec": 992,
	"__specs__": 992,
	"e2e": 994,
	"unit": 996,
	"docs": 998,
	"documentation": 998,
	"examples": 999,
	"example": 999
};

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
			const layerWeightA = this.getLayerWeight(a.fullPath, a.name);
			const layerWeightB = this.getLayerWeight(b.fullPath, b.name);
			
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

	/**
	 * Get smart default layer weight for a folder
	 * Virtual boxes (API routes) float to top, others use layer-based weights
	 * Returns weight from LAYER_WEIGHTS dictionary, or 9999 (bottom - unknown)
	 */
	private getLayerWeight(fullPath: string, folderName: string): number {
		// Check if this is a virtual box (API routes, etc.)
		// Virtual boxes typically have paths like "API /...", "virtual/...", or "/api/..."
		if (this.isVirtualBox(fullPath, folderName)) {
			return 0; // Float to top
		}
		
		// Regular folders: analyze both path and name, take the better (lower) weight
		const pathWeight = this.analyzeForKeywords(fullPath);
		const nameWeight = this.analyzeForKeywords(folderName);
		
		return Math.min(pathWeight, nameWeight);
	}
	
	/**
	 * Check if this is a virtual box (API routes, webhooks, etc.)
	 */
	private isVirtualBox(fullPath: string, folderName: string): boolean {
		// Empty or blank = virtual
		if (!fullPath || fullPath.trim() === '') {
			return true;
		}
		
		// Check for specific API route patterns
		const virtualPatterns = [
			/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s/i,  // HTTP methods
			/^API\s+\//i,                                      // "API /" prefix
			/:\.\.\.(all|any)/i                                // Dynamic route params
		];
		
		return virtualPatterns.some(pattern => pattern.test(fullPath));
	}
	
	/**
	 * Analyze a string (path or name) for layer keywords
	 */
	private analyzeForKeywords(text: string): number {
		// Split by / and spaces, normalize each token
		const tokens = text.toLowerCase()
			.split(/[\/\s]+/)
			.map(t => t.replace(/[-_]/g, ''));
		
		let bestMatch: number | null = null;
		let bestLength = 0;
		
		// Check each token for exact match or contains match
		for (const token of tokens) {
			// 1. Check exact match
			if (LAYER_WEIGHTS[token] !== undefined) {
				const weight = LAYER_WEIGHTS[token];
				if (bestMatch === null || weight < bestMatch) {
					bestMatch = weight;
					bestLength = token.length;
				}
				continue;
			}
			
			// 2. Check if token contains any known keyword (longest match wins)
			for (const [keyword, weight] of Object.entries(LAYER_WEIGHTS)) {
				if (token.includes(keyword) && keyword.length > bestLength) {
					if (bestMatch === null || weight < bestMatch) {
						bestMatch = weight;
						bestLength = keyword.length;
					}
				}
			}
		}
		
		// Default weight for unknown
		return bestMatch !== null ? bestMatch : 9999;
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
