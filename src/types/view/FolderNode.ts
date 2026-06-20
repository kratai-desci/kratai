export interface FolderNode {
	path: string;           // Relative path
	name: string;           // Folder name
	selected: boolean;
	children: FolderNode[];
	fileCount?: number;     // Number of parseable files
}
