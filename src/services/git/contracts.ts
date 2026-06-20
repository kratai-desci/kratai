// Git service contracts - DTOs for git operations

export interface FileChange {
	path: string;
	status: 'modified' | 'added' | 'deleted' | 'renamed';
	additions?: number;
	deletions?: number;
}

export interface GitComparisonResult {
	workspaceName: string;
	currentBranch: string;
	compareTarget: string;
	changes: FileChange[];
}
