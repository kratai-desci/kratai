import * as fs from 'fs';
import * as path from 'path';

const START_MARKER = '<!-- kratai:start -->';
const END_MARKER = '<!-- kratai:end -->';

function stripFrontmatter(skillContent: string): string {
	const match = skillContent.match(/^---\n[\s\S]*?\n---\n/);
	return match ? skillContent.slice(match[0].length).trim() : skillContent.trim();
}

/**
 * AGENTS.md is the cross-tool standard read natively by Cursor/Codex and used
 * as a fallback by OpenCode/Claude Code - reuses SKILL.md's body (its
 * guidance already reads as always-on project instructions, not a narrowly
 * triggered skill) rather than maintaining a second copy that would drift.
 * Marker-delimited so re-running `kratai init` replaces only kratai's own
 * block and never touches the rest of a project's AGENTS.md.
 */
export function setupAgentsMd(workspacePath: string, skillContent: string): void {
	const body = stripFrontmatter(skillContent);
	const block = `${START_MARKER}\n## Architecture (via kratai)\n\n${body}\n${END_MARKER}`;

	const filePath = path.join(workspacePath, 'AGENTS.md');
	let existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';

	if (existing.includes(START_MARKER) && existing.includes(END_MARKER)) {
		const startIdx = existing.indexOf(START_MARKER);
		const endIdx = existing.indexOf(END_MARKER) + END_MARKER.length;
		existing = existing.slice(0, startIdx) + block + existing.slice(endIdx);
	} else {
		existing = existing.trim().length > 0 ? `${existing.trim()}\n\n${block}\n` : `${block}\n`;
	}

	fs.writeFileSync(filePath, existing, 'utf-8');
	console.log('Wrote AGENTS.md (kratai block) - read natively by Cursor/Codex, as fallback by OpenCode/Claude Code');
}
