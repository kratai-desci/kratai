export interface ConfigFolderNode {
	path: string;           // Relative path
	name: string;           // Folder name
	selected: boolean;
	children: ConfigFolderNode[];
	fileCount?: number;     // Number of parseable files
}
