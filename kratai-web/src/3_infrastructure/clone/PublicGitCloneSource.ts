import 'server-only';

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import type { KrataiConfig } from '@kratai/core';

import { parseWorkspaceInWorker } from '../parsing/parseWorkspaceInWorker';

const execFileAsync = promisify(execFile);

const CLONE_TIMEOUT_MS = 2 * 60 * 1000;

export interface PublicDiagramSourceResult {
	diagramData: Awaited<ReturnType<typeof parseWorkspaceInWorker>>;
	commitSha: string;
	/** Actual branch cloned - whatever the repo's default branch is, since no branch was requested. */
	branch: string;
}

/**
 * Unauthenticated counterpart to GitCloneDiagramSource, for the anonymous
 * "try a public repo" flow (no signed-in user, no OAuth token). Deliberately
 * a separate small class rather than making GitCloneDiagramSource's token
 * optional: that class always clones a specific branch (needed once a view
 * is saved and can be regenerated against a chosen branch), whereas here
 * there's no session to have picked one - this just clones whatever HEAD of
 * the default branch resolves to, the same way `git clone` with no
 * `--branch` flag would from the command line. Anonymous access also means
 * this only ever works for public repos - GitHub simply fails the clone for
 * a private one, which surfaces as a normal thrown error here.
 */
export class PublicGitCloneSource {
	async getDiagramData(repoFullName: string, config: KrataiConfig): Promise<PublicDiagramSourceResult> {
		const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kratai-public-clone-'));

		try {
			await this.clone(repoFullName, workDir);
			const [diagramData, commitSha, branch] = await Promise.all([
				parseWorkspaceInWorker(workDir, config),
				this.getHeadSha(workDir),
				this.getBranchName(workDir),
			]);
			return { diagramData, commitSha, branch };
		} finally {
			fs.rmSync(workDir, { recursive: true, force: true });
		}
	}

	private async getHeadSha(repoDir: string): Promise<string> {
		const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: repoDir });
		return stdout.trim();
	}

	private async getBranchName(repoDir: string): Promise<string> {
		const { stdout } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repoDir });
		return stdout.trim();
	}

	private async clone(repoFullName: string, targetDir: string): Promise<void> {
		// No credentials embedded in the URL, unlike GitCloneDiagramSource -
		// anonymous HTTPS clone, which GitHub only serves for public repos.
		const url = `https://github.com/${repoFullName}.git`;

		try {
			await execFileAsync('git', ['clone', '--depth', '1', url, targetDir], {
				timeout: CLONE_TIMEOUT_MS,
				env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
			});
		} catch {
			// Anonymous clone failures are almost always "doesn't exist or is
			// private" (GitHub returns the same generic 404 for both, to avoid
			// leaking which private repos exist) - a fixed message here is more
			// honest than surfacing git's raw stderr, which talks about auth
			// prompts that are misleading in an anonymous context.
			throw new Error(
				`Couldn't clone ${repoFullName} - it may be private, may not exist, or may be misspelled.`
			);
		}
	}
}
