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
 *
 * Shared between FolderBoxRenderer (class-diagram folder ordering) and the
 * CLI's stack-layer view (3D layer sorting) - both need the exact same
 * "which layer does this folder belong to" answer for their sort order to
 * agree with each other.
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

/**
 * Check if this is a virtual box (API routes, webhooks, etc.)
 */
function isVirtualBox(fullPath: string, folderName: string): boolean {
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
function analyzeForKeywords(text: string): number {
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

/**
 * Get smart default layer weight for a folder
 * Virtual boxes (API routes) float to top, others use layer-based weights
 * Returns weight from LAYER_WEIGHTS dictionary, or 9999 (bottom - unknown)
 */
export function getLayerWeight(fullPath: string, folderName: string): number {
	if (isVirtualBox(fullPath, folderName)) {
		return 0; // Float to top
	}

	// Regular folders: analyze both path and name, take the better (lower) weight
	const pathWeight = analyzeForKeywords(fullPath);
	const nameWeight = analyzeForKeywords(folderName);

	return Math.min(pathWeight, nameWeight);
}
