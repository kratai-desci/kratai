import { FileChange } from './FileChange';

export interface GitComparisonResult {
	workspaceName: string;
	currentBranch: string;
	compareTarget: string;
	changes: FileChange[];
}
