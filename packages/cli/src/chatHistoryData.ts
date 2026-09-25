import * as fs from 'fs';
import * as path from 'path';
import type { ConversationMessage } from '@kratai-desci/llm';

const CACHE_FILE = 'kratai.chat.json';

// Bounds both the file size and, more importantly, what gets resent as
// context on every future chat call (chatHistory rides along in each
// /api/chat request - see viewShell.ts) - without a cap, a long-lived
// conversation would silently make every later turn more expensive to
// bill, not just slower. 40 entries is 20 user/assistant exchanges.
const MAX_ENTRIES = 40;

/**
 * A personal conversation log, not a team artifact like
 * kratai.usecases.json/kratai.datamodel.json - workspace-local for the same
 * reason those are (see useCaseDiagramData.ts's own doc comment), but never
 * meant to be committed, so callers should keep it out of the target
 * workspace's own version control the same way kratai.local.json is
 * (nothing in this codebase currently automates that - see config.ts's own
 * stale comment about a since-removed init.ts - so this is a manual step
 * for now, not something this file can enforce).
 */
export function loadCachedChatHistory(workspacePath: string): ConversationMessage[] {
	const filePath = path.join(workspacePath, CACHE_FILE);
	if (!fs.existsSync(filePath)) return [];
	try {
		const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		console.error('Error loading cached chat history:', error);
		return [];
	}
}

export function saveCachedChatHistory(workspacePath: string, history: ConversationMessage[]): void {
	const trimmed = history.slice(-MAX_ENTRIES);
	fs.writeFileSync(path.join(workspacePath, CACHE_FILE), JSON.stringify(trimmed, null, 2) + '\n', 'utf-8');
}
