import 'server-only';

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import type { DiagramSourceRepository } from '@/2_domain';
import type { DiagramData, KrataiConfig } from '@kratai/core';

import { parseWorkspaceInWorker } from '../parsing/parseWorkspaceInWorker';

const execFileAsync = promisify(execFile);

const CLONE_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Real DiagramSourceRepository implementation: shallow-clones the
 * requested repo/branch into a temp directory using the signed-in user's
 * OAuth access token, runs the same CodeParserService.parseWorkspace the
 * VS Code extension uses locally, then deletes the clone. Constructed
 * per-request (see 3_infrastructure/diagramSource.ts) since the token is
 * user-specific - never a module-level singleton.
 */
export class GitCloneDiagramSource implements DiagramSourceRepository {
	constructor(private readonly accessToken: string) {}

	async getDiagramData(
		repoFullName: string,
		branch: string,
		config: KrataiConfig
	): Promise<DiagramData> {
		const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kratai-clone-'));

		try {
			await this.clone(repoFullName, branch, workDir);
			return await parseWorkspaceInWorker(workDir, config);
		} finally {
			fs.rmSync(workDir, { recursive: true, force: true });
		}
	}

	private async clone(repoFullName: string, branch: string, targetDir: string): Promise<void> {
		// Token-in-URL is GitHub's documented way to authenticate git-over-HTTPS
		// (works for OAuth App user tokens with `repo` scope, same as PATs).
		const authenticatedUrl = `https://${this.accessToken}@github.com/${repoFullName}.git`;

		try {
			await execFileAsync(
				'git',
				[
					'clone',
					'--depth',
					'1',
					'--single-branch',
					'--branch',
					branch,
					authenticatedUrl,
					targetDir,
				],
				{
					timeout: CLONE_TIMEOUT_MS,
					// Fail fast instead of hanging on a credential prompt if the
					// token is invalid/expired/lacks access.
					env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
				}
			);
		} catch (error) {
			// The failing command (with the token embedded in the URL) can end
			// up in the thrown error's message - never let that propagate as-is.
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(
				`Failed to clone ${repoFullName}@${branch}: ${message.replaceAll(this.accessToken, '***')}`
			);
		}
	}
}
