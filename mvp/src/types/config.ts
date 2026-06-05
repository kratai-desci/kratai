export interface KrataiConfig {
	selectedFolders: string[];      // Relative paths from workspace root
	selectedExtensions: string[];   // [".ts", ".tsx", etc.]
	respectGitignore?: boolean;     // Default: true
	followSymlinks?: boolean;       // Default: false
	classTypeFilters?: {            // Dynamic filters for class types
		[type: string]: boolean;    // e.g., { "class": true, "interface": false, "module": true }
	};
	relationshipTypeFilters?: {     // Dynamic filters for relationship types
		[type: string]: boolean;    // e.g., { "extends": true, "implements": false }
	};
	gitDiff?: {
		enabled?: boolean;          // Show git diff visualization
		baseCommit?: string;        // Compare against this commit (default: 'HEAD~1')
	};
}

export interface FolderNode {
	path: string;           // Relative path
	name: string;           // Folder name
	selected: boolean;
	children: FolderNode[];
	fileCount?: number;     // Number of parseable files
}

export interface ExtensionInfo {
	extension: string;      // e.g., ".ts"
	count: number;          // Number of files
	selected: boolean;
}
