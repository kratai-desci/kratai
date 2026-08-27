import * as assert from 'assert';
import { MarkdownExporter } from '../../../export/MarkdownExporter';
import { ClassInfo, ClassRelationship, DiagramData } from '../../../types/domain';
import { FolderConfig } from '../../../types/config';

suite('MarkdownExporter Test Suite', () => {
	function mockClass(name: string, filePath: string): ClassInfo {
		return { name, filePath, properties: [], methods: [], classType: 'class' };
	}

	function buildData(): DiagramData {
		const classes: ClassInfo[] = [
			mockClass('User', 'backend/app/models.py'),
			mockClass('GeneratedClient', 'frontend/src/client/client.gen.ts'),
		];
		const relationships: ClassRelationship[] = [
			{
				from: 'frontend/src/client/client.gen.ts__GeneratedClient',
				to: 'backend/app/models.py__User',
				type: 'uses',
			},
		];
		return { classes, relationships };
	}

	test('with no folders config, behaves exactly as before (no filtering)', () => {
		const md = MarkdownExporter.toMarkdown(buildData(), 'test');
		assert.ok(md.includes('User'));
		assert.ok(md.includes('GeneratedClient'));
		assert.ok(md.includes('Total: 2 classes, 1 relationships'));
	});

	test('a folder marked hidden is excluded from the output entirely', () => {
		const folders: Record<string, FolderConfig> = {
			'frontend': { selected: true, hidden: true },
		};
		const md = MarkdownExporter.toMarkdown(buildData(), 'test', folders);

		assert.ok(md.includes('User'), 'visible folder\'s class should remain');
		assert.ok(!md.includes('GeneratedClient'), 'hidden folder\'s class should be dropped');
		assert.ok(!md.includes('client.gen.ts'), 'hidden folder should not appear in the folder tree either');
		assert.ok(md.includes('Total: 1 classes, 0 relationships'), 'counts should reflect the filtered set');
	});

	test('a relationship touching a hidden-folder class is dropped even though the other side is visible', () => {
		const folders: Record<string, FolderConfig> = {
			'frontend': { selected: true, hidden: true },
		};
		const md = MarkdownExporter.toMarkdown(buildData(), 'test', folders);
		assert.ok(!md.includes('Used By: GeneratedClient'), 'relationship referencing a hidden class should not leak through');
	});

	test('hidden: false does not filter anything', () => {
		const folders: Record<string, FolderConfig> = {
			'frontend': { selected: true, hidden: false },
		};
		const md = MarkdownExporter.toMarkdown(buildData(), 'test', folders);
		assert.ok(md.includes('GeneratedClient'));
	});

	test('excludeHiddenFolders is exposed for callers that need accurate post-filter counts', () => {
		const folders: Record<string, FolderConfig> = {
			'frontend': { selected: true, hidden: true },
		};
		const filtered = MarkdownExporter.excludeHiddenFolders(buildData(), folders);
		assert.strictEqual(filtered.classes.length, 1);
		assert.strictEqual(filtered.relationships.length, 0);
	});
});
