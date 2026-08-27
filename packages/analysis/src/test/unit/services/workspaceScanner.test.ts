import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { WorkspaceScanner } from '../../../parsing/workspaceScanner';
import { ConfigService } from '../../../util/configService';

suite('WorkspaceScanner.selectFolders Test Suite', () => {
	let workspacePath: string;

	setup(() => {
		workspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'kratai-scanner-'));
	});

	teardown(() => {
		fs.rmSync(workspacePath, { recursive: true, force: true });
	});

	function writeFile(relativePath: string, contents = '// code\n'): void {
		const fullPath = path.join(workspacePath, relativePath);
		fs.mkdirSync(path.dirname(fullPath), { recursive: true });
		fs.writeFileSync(fullPath, contents);
	}

	test('does not let an incidentally-named non-source folder hide real source folders', () => {
		// Regression test: a cookiecutter-style template ships a top-level
		// hooks/ folder containing a single post-gen script. Its name
		// coincidentally matched the old "React hooks" candidate, so the
		// whitelist-based detector picked ONLY hooks/ and silently ignored
		// the actual backend/ and frontend/ source, exactly like
		// tiangolo/full-stack-fastapi-template does in practice.
		writeFile('hooks/post_gen_project.py');
		writeFile('backend/app/models.py', 'class User:\n    pass\n');
		writeFile('frontend/src/App.tsx', 'export const App = () => null;\n');

		const folders = WorkspaceScanner.selectFolders(workspacePath);

		assert.ok(folders.includes('backend'), 'backend/ should be selected as a source folder');
		assert.ok(folders.includes('frontend'), 'frontend/ should be selected as a source folder');
	});

	test('selects a source folder with an arbitrary name not on any fixed list', () => {
		writeFile('doesnotmatchanycandidate/thing.py', 'class Thing:\n    pass\n');

		const folders = WorkspaceScanner.selectFolders(workspacePath);

		assert.ok(
			folders.includes('doesnotmatchanycandidate'),
			'a folder with real code should be selected regardless of its name'
		);
	});

	test('still excludes known non-source folders like tests/docs/node_modules', () => {
		writeFile('src/index.ts', 'export const x = 1;\n');
		writeFile('tests/index.test.ts', 'test("x", () => {});\n');
		writeFile('docs/guide.md', '# guide\n');
		writeFile('node_modules/pkg/index.js', 'module.exports = {};\n');

		const folders = WorkspaceScanner.selectFolders(workspacePath);

		assert.ok(folders.includes('src'), 'src/ should be selected');
		assert.ok(!folders.includes('tests'), 'tests/ should stay excluded');
		assert.ok(!folders.includes('docs'), 'docs/ should stay excluded');
		assert.ok(!folders.includes('node_modules'), 'node_modules/ should stay excluded');
	});

	test('falls back to scanning everything when no top-level folder qualifies', () => {
		writeFile('index.ts', 'export const x = 1;\n');

		const folders = WorkspaceScanner.selectFolders(workspacePath);

		assert.deepStrictEqual(folders, ['.']);
	});

	test('getFilesToParse does not re-scan a file once per ancestor folder', () => {
		// Regression test: selectFolders() used to expand each top-level
		// source folder into every one of its descendant subdirectories as
		// separate config entries. Since getFilesToParse() already scans
		// each entry recursively, a deeply nested file (e.g.
		// backend/app/api/routes/x.py) got scanned once for "backend", again
		// for "backend/app", again for "backend/app/api", etc. - the same
		// file parsed multiple times, corrupting class/relationship counts.
		writeFile('backend/app/api/routes/x.py', 'class X:\n    pass\n');
		writeFile('backend/app/y.py', 'class Y:\n    pass\n');

		const config = ConfigService.generateSmartDefaults(workspacePath);
		const files = WorkspaceScanner.getFilesToParse(workspacePath, config);

		assert.strictEqual(files.length, new Set(files).size, 'no file should be listed more than once');
		assert.strictEqual(files.length, 2, 'both files should be found exactly once each');
	});
});
