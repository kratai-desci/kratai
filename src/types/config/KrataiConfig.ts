/**
 * Configuration for individual folders in the diagram
 */
export interface FolderConfig {
	selected: boolean;              // Whether folder is included in diagram
	expanded?: boolean;             // UI state: whether folder is expanded in tree view
	order?: number | null;          // Custom order (1, 2, 3...), null = alphabetical
}

export interface KrataiConfig {
	selectedFolders: string[];      // Relative paths from workspace root (deprecated, use folders)
	folders?: Record<string, FolderConfig>;  // NEW: Folder configuration with order support
	selectedExtensions: string[];   // [".ts", ".tsx", etc.]
	respectGitignore?: boolean;     // Default: true
	followSymlinks?: boolean;       // Default: false
	classTypeFilters?: {            // Dynamic filters for class types
		[type: string]: boolean;    // e.g., { "class": true, "interface": false, "module": true }
	};
	relationshipTypeFilters?: {     // Dynamic filters for relationship types
		[type: string]: boolean;    // e.g., { "extends": true, "implements": false, "calls": true }
	};
	gitDiff?: {
		enabled?: boolean;          // Show git diff visualization
		baseCommit?: string;        // Compare against this commit (default: 'HEAD~1')
	};
	detectHttpCalls?: boolean;      // Detect HTTP API calls (fetch, axios, etc.) - Default: true
	frameworkEnrichment?: boolean;  // Add framework-specific knowledge (Next.js, Laravel, etc.) - Default: true
}
