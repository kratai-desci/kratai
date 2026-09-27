import * as fs from 'fs';
import * as path from 'path';

// Directories that are never useful to list/read for requirement-extraction
// purposes and would otherwise burn tool turns/tokens on noise (thousands of
// files in node_modules, git's internal object store, build output).
// Skipped unconditionally, even if the model explicitly asks for one of
// these by name.
const IGNORED_DIR_NAMES = new Set([
	'node_modules', '.git', 'dist', 'out', 'build', '.next', 'coverage', 'vendor', '.turbo'
]);

// Files that could contain real secrets (API keys, private keys, credential
// bundles) - denied outright rather than left to the model's judgment, since
// their raw content would flow straight into a third-party LLM API call.
// Public keys (.pub) are deliberately not on this list - they're not secret.
const SENSITIVE_FILE_PATTERNS: RegExp[] = [
	/(^|\/)\.env(\..*)?$/i,
	/\.(pem|key|p12|pfx|crt)$/i,
	/(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/i,
	/(^|\/)\.npmrc$/i,
	/(^|\/)\.aws\/credentials$/i
];

// Read cap - large enough for real source/config/doc files, small enough
// that one read_file call can't single-handedly blow the request's token
// budget on a huge generated/vendored file.
const MAX_READ_CHARS = 30000;

function isSensitivePath(relativePath: string): boolean {
	return SENSITIVE_FILE_PATTERNS.some(re => re.test(relativePath));
}

// Resolves a model-supplied relative path against the workspace root and
// rejects anything that would escape it (../../etc/passwd) - the model's
// input is untrusted the same way any tool-call argument is, and this is
// the only thing standing between "read this project's README" and "read
// this machine's SSH keys".
function resolveSafe(workspacePath: string, relativePath: string): string | undefined {
	const resolved = path.resolve(workspacePath, relativePath || '.');
	const root = path.resolve(workspacePath);
	if (resolved !== root && !resolved.startsWith(root + path.sep)) return undefined;
	return resolved;
}

function readFileTool(workspacePath: string, relativePath: string): string {
	if (!relativePath) return 'Missing required "path" argument.';
	if (isSensitivePath(relativePath)) return `Refusing to read "${relativePath}" - it matches a pattern reserved for secrets/credentials (.env, private keys, etc.).`;

	const resolved = resolveSafe(workspacePath, relativePath);
	if (!resolved) return `"${relativePath}" resolves outside the workspace - not allowed.`;

	let stat: fs.Stats;
	try {
		stat = fs.statSync(resolved);
	} catch {
		return `No file found at "${relativePath}". Try list_directory on its parent folder to check the exact name.`;
	}
	if (stat.isDirectory()) return `"${relativePath}" is a directory, not a file - use list_directory instead.`;

	let buffer: Buffer;
	try {
		buffer = fs.readFileSync(resolved);
	} catch (error) {
		return `Could not read "${relativePath}": ${error instanceof Error ? error.message : String(error)}`;
	}

	// A null byte in the first slice is a reliable, cheap binary heuristic -
	// full binary sniffing isn't worth it here, this only needs to avoid
	// dumping garbage bytes into the model's context.
	if (buffer.subarray(0, 1000).includes(0)) return `"${relativePath}" appears to be a binary file - cannot display its contents.`;

	const text = buffer.toString('utf-8');
	if (text.length <= MAX_READ_CHARS) return text;
	return `${text.slice(0, MAX_READ_CHARS)}\n\n[truncated - file is ${text.length} characters, showing the first ${MAX_READ_CHARS}]`;
}

function listDirectoryTool(workspacePath: string, relativePath: string): string {
	const resolved = resolveSafe(workspacePath, relativePath || '.');
	if (!resolved) return `"${relativePath}" resolves outside the workspace - not allowed.`;

	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(resolved, { withFileTypes: true });
	} catch (error) {
		return `Could not list "${relativePath || '.'}": ${error instanceof Error ? error.message : String(error)}`;
	}

	const visible = entries.filter(e => !IGNORED_DIR_NAMES.has(e.name));
	if (visible.length === 0) return `"${relativePath || '.'}" is empty (or only contains ignored directories like node_modules/.git).`;

	const lines = visible
		.sort((a, b) => a.name.localeCompare(b.name))
		.map(e => e.isDirectory() ? `${e.name}/` : e.name);
	return lines.join('\n');
}

/**
 * Shared by chat's tool loop (view.ts) - the only two general-purpose
 * filesystem tools available to the model, deliberately separate from
 * chatTools.ts's class-oriented tools (those read the already-parsed
 * DiagramData; these read the real files on disk, for anything a
 * structural class model can't see at all - business logic inside method
 * bodies, tests, docs, config, schemas). Both are workspace-root-jailed and
 * secret-file-denied - see resolveSafe/isSensitivePath above.
 */
export function executeFileTool(name: string, input: Record<string, unknown>, workspacePath: string): string {
	switch (name) {
		case 'read_file':
			return readFileTool(workspacePath, String(input.path || ''));
		case 'list_directory':
			return listDirectoryTool(workspacePath, String(input.path || ''));
		default:
			return `Unknown tool: ${name}`;
	}
}
