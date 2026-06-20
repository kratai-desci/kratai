export interface FileChange {
	path: string;
	status: 'modified' | 'added' | 'deleted' | 'renamed';
	additions?: number;
	deletions?: number;
}
