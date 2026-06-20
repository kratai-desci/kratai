export interface KrataiConfig {
	selectedFolders: string[];      // Relative paths from workspace root
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
}
