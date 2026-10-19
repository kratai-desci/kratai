import * as fs from 'fs';
import * as path from 'path';
import type { ConversationMessage } from '@kratai-desci/llm';
import { keepOutOfGit } from './gitignore.js';

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
 * meant to be committed, so it is kept out of the workspace's own version
 * control automatically (keepOutOfGit adds it to the folder's .gitignore, both
 * when it is saved and when an existing one is loaded - so a repo that already
 * has chats gets fixed on its next open). Without that, everyone sharing a repo
 * would commit - and conflict on - each other's conversations.
 */
export function loadCachedChatHistory(workspacePath: string): ConversationMessage[] {
	const filePath = path.join(workspacePath, CACHE_FILE);
	if (!fs.existsSync(filePath)) return [];
	keepOutOfGit(workspacePath, CACHE_FILE);
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
	keepOutOfGit(workspacePath, CACHE_FILE);
}
