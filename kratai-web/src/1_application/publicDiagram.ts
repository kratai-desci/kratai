import 'server-only';

import { MarkdownExporter } from '@kratai/core';

import { PublicGitCloneSource } from '@/3_infrastructure/clone/PublicGitCloneSource';

import { DEFAULT_CONFIG } from './config';
import { applyConfigFilters, generateDiagramHtml } from './diagram';

// Stateless (no per-request credentials, unlike GitCloneDiagramSource) - safe
// as a module-level singleton.
const publicSource = new PublicGitCloneSource();

export interface PublicDiagramResult {
	html: string;
	/** Same MarkdownExporter output the authenticated export endpoint
	 * produces (see app/api/diagrams/[viewId]/export) - computed here
	 * alongside the HTML so downloading it never needs a second clone. */
	markdown: string;
	repoFullName: string;
	branch: string;
	commitSha: string;
	classCount: number;
	relationshipCount: number;
}

/**
 * Anonymous counterpart to generateAndCacheView: clones+parses a public
 * repo's default branch with zero-config defaults and renders it straight
 * to HTML, with nothing persisted. This is the "try it before you sign in"
 * entry point (app/try/[owner]/[repo]) - deliberately not backed by
 * ViewRepository, which is owned-by-a-user end to end (see its own
 * comments); giving this its own un-cached path keeps that invariant
 * intact rather than bolting an ownerless-view special case onto it.
 */
export async function generatePublicDiagram(repoFullName: string): Promise<PublicDiagramResult> {
	const { diagramData, commitSha, branch } = await publicSource.getDiagramData(repoFullName, DEFAULT_CONFIG);
	const { html, classCount, relationshipCount } = generateDiagramHtml(
		diagramData,
		repoFullName,
		DEFAULT_CONFIG,
		true
	);
	const markdown = MarkdownExporter.toMarkdown(applyConfigFilters(diagramData, DEFAULT_CONFIG), repoFullName);

	return { html, markdown, repoFullName, branch, commitSha, classCount, relationshipCount };
}
