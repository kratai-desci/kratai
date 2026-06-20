import { execSync } from 'child_process';
import { FileChange, GitComparisonResult } from '../../types/git';

export class GitService {
	
	static isGitRepository(workspacePath: string): boolean {
		try {
			execSync('git rev-parse --git-dir', { cwd: workspacePath, stdio: 'pipe' });
			return true;
		} catch {
			return false;
		}
	}

	static getCurrentBranch(workspacePath: string): string {
		return execSync('git rev-parse --abbrev-ref HEAD', 
			{ cwd: workspacePath, encoding: 'utf-8' }).trim();
	}

	static getRemoteName(workspacePath: string): string {
		try {
			return execSync('git remote', 
				{ cwd: workspacePath, encoding: 'utf-8' }).trim().split('\n')[0];
		} catch {
			return 'origin';
		}
	}

	static fetchRemote(workspacePath: string, remoteName: string): void {
		try {
			execSync(`git fetch ${remoteName}`, { cwd: workspacePath, stdio: 'pipe' });
		} catch (error) {
			console.log('Fetch warning:', error);
		}
	}

	static getCompareTarget(workspacePath: string, remoteName: string, currentBranch: string): string | null {
		const remoteBranch = `${remoteName}/${currentBranch}`;
		
		// Try current branch
		try {
			execSync(`git rev-parse ${remoteBranch}`, { cwd: workspacePath, stdio: 'pipe' });
			return remoteBranch;
		} catch { }

		// Try main
		try {
			execSync(`git rev-parse ${remoteName}/main`, { cwd: workspacePath, stdio: 'pipe' });
			return `${remoteName}/main`;
		} catch { }

		// Try master
		try {
			execSync(`git rev-parse ${remoteName}/master`, { cwd: workspacePath, stdio: 'pipe' });
			return `${remoteName}/master`;
		} catch { }

		return null;
	}

	static getUncommittedChanges(workspacePath: string): FileChange[] {
		const changes: FileChange[] = [];
		
		const uncommittedStatus = execSync(
			'git status --porcelain',
			{ cwd: workspacePath, encoding: 'utf-8' }
		).trim();

		if (!uncommittedStatus) return changes;

		const uncommittedLines = uncommittedStatus.split('\n');
		for (const line of uncommittedLines) {
			if (line.length < 3) continue;
			
			const statusCode = line.substring(0, 2).trim();
			const filePath = line.substring(3);

			let status: FileChange['status'] = 'modified';
			if (statusCode === 'A' || statusCode === 'AM' || statusCode === '??' || statusCode === 'A ') {
				status = 'added';
			} else if (statusCode === 'D' || statusCode === ' D') {
				status = 'deleted';
			} else if (statusCode.startsWith('R')) {
				status = 'renamed';
			}

			// Get numstat for modified files
			let additions = 0, deletions = 0;
			if (status === 'modified' || statusCode.includes('M')) {
				try {
					const numstat = execSync(
						`git diff HEAD --numstat -- "${filePath}"`,
						{ cwd: workspacePath, encoding: 'utf-8' }
					).trim();
					if (numstat) {
						const parts = numstat.split('\t');
						if (parts.length >= 2) {
							additions = parts[0] === '-' ? 0 : parseInt(parts[0], 10);
							deletions = parts[1] === '-' ? 0 : parseInt(parts[1], 10);
						}
					}
				} catch { }
			}

			changes.push({ path: filePath, status, additions, deletions });
		}

		return changes;
	}

	static getUnpushedChanges(workspacePath: string, compareTarget: string, existingPaths: Set<string>): FileChange[] {
		const changes: FileChange[] = [];

		try {
			const diffOutput = execSync(
				`git diff --numstat ${compareTarget}...HEAD`,
				{ cwd: workspacePath, encoding: 'utf-8' }
			).trim();

			const statusOutput = execSync(
				`git diff --name-status ${compareTarget}...HEAD`,
				{ cwd: workspacePath, encoding: 'utf-8' }
			).trim();

			if (!statusOutput) return changes;

			const statusLines = statusOutput.split('\n');
			const diffLines = diffOutput ? diffOutput.split('\n') : [];

			for (const line of statusLines) {
				const parts = line.split('\t');
				if (parts.length < 2) continue;

				const statusCode = parts[0];
				const filePath = parts[1];

				// Skip if already in uncommitted changes
				if (existingPaths.has(filePath)) continue;

				let status: FileChange['status'] = 'modified';
				if (statusCode === 'A') status = 'added';
				else if (statusCode === 'D') status = 'deleted';
				else if (statusCode.startsWith('R')) status = 'renamed';

				// Find corresponding numstat line
				const diffLine = diffLines.find(dl => dl.endsWith(filePath));
				let additions = 0, deletions = 0;

				if (diffLine) {
					const numStats = diffLine.split('\t');
					if (numStats.length >= 2) {
						additions = numStats[0] === '-' ? 0 : parseInt(numStats[0], 10);
						deletions = numStats[1] === '-' ? 0 : parseInt(numStats[1], 10);
					}
				}

				changes.push({ path: filePath, status, additions, deletions });
			}
		} catch {
			// Might fail if branches have diverged or no common base
		}

		return changes;
	}

	static async analyzeChanges(workspacePath: string, workspaceName: string): Promise<GitComparisonResult | null> {
		if (!this.isGitRepository(workspacePath)) {
			throw new Error('This is not a Git repository!');
		}

		const currentBranch = this.getCurrentBranch(workspacePath);
		const remoteName = this.getRemoteName(workspacePath);
		
		this.fetchRemote(workspacePath, remoteName);

		const compareTarget = this.getCompareTarget(workspacePath, remoteName, currentBranch);
		if (!compareTarget) {
			throw new Error('Could not find remote branch to compare!');
		}

		// Get uncommitted changes
		const uncommittedChanges = this.getUncommittedChanges(workspacePath);
		const existingPaths = new Set(uncommittedChanges.map(c => c.path));

		// Get unpushed changes
		const unpushedChanges = this.getUnpushedChanges(workspacePath, compareTarget, existingPaths);

		// Combine all changes
		const allChanges = [...uncommittedChanges, ...unpushedChanges];

		return {
			workspaceName,
			currentBranch,
			compareTarget,
			changes: allChanges
		};
	}
}
