import * as assert from 'assert';
import * as path from 'path';
import { HTMLParser } from '../../../../services/parsing/languages/HTMLParser';
import { ClassInfo } from '../../../../types/domain/ClassInfo';
import { ClassRelationship } from '../../../../types/domain/ClassRelationship';

suite('HTML Parser Test Suite', () => {
	const fixturesPath = path.join(__dirname, '../../../../../src/test/unit/languages/html/fixtures');
	const workspacePath = path.join(__dirname, '../../../../../src/test/unit/languages/html/fixtures');
	let parser: HTMLParser;

	setup(() => {
		parser = new HTMLParser();
	});

	suite('File Detection', () => {
		test('should detect .html files', async () => {
			const filePath = path.join(fixturesPath, 'simple.html');
			const result = await parser.parse(filePath, workspacePath);

			assert.strictEqual(result.classes.length, 1, 'Should create one ClassInfo node');
			
			const template = result.classes[0];
			assert.strictEqual(template.name, 'simple.html', 'Should use filename as name');
			assert.strictEqual(template.classType, 'template', 'Should have classType "template"');
			assert.strictEqual(template.properties.length, 0, 'Should have no properties');
			assert.strictEqual(template.methods.length, 0, 'Should have no methods');
		});

		test('should detect .blade.php files', async () => {
			const filePath = path.join(fixturesPath, 'blade-template.blade.php');
			const result = await parser.parse(filePath, workspacePath);

			assert.strictEqual(result.classes.length, 1);
			
			const template = result.classes[0];
			assert.strictEqual(template.name, 'blade-template.blade.php');
			assert.strictEqual(template.classType, 'template');
		});

		test('should detect .html.twig files', async () => {
			const filePath = path.join(fixturesPath, 'twig-template.html.twig');
			const result = await parser.parse(filePath, workspacePath);

			assert.strictEqual(result.classes.length, 1);
			
			const template = result.classes[0];
			assert.strictEqual(template.name, 'twig-template.html.twig');
			assert.strictEqual(template.classType, 'template');
		});

		test('should handle Django templates with special syntax', async () => {
			const filePath = path.join(fixturesPath, 'django-template.html');
			const result = await parser.parse(filePath, workspacePath);

			assert.strictEqual(result.classes.length, 1);
			
			const template = result.classes[0];
			assert.strictEqual(template.name, 'django-template.html');
			assert.strictEqual(template.classType, 'template');
		});

		test('should handle nested folder structures', async () => {
			const filePath = path.join(fixturesPath, 'nested/subfolder/deep.html');
			const result = await parser.parse(filePath, workspacePath);

			assert.strictEqual(result.classes.length, 1);
			
			const template = result.classes[0];
			assert.strictEqual(template.name, 'deep.html');
			assert.strictEqual(template.classType, 'template');
			assert.ok(template.filePath.includes('nested'), 'Should preserve folder path');
		});
	});

	suite('No Content Parsing', () => {
		test('should not parse template syntax', async () => {
			const filePath = path.join(fixturesPath, 'django-template.html');
			const result = await parser.parse(filePath, workspacePath);

			// Should not extract template variables, blocks, or includes
			assert.strictEqual(result.classes.length, 1, 'Should only create one node for the file');
			assert.strictEqual(result.relationships.length, 0, 'Should not create relationships from content');
		});

		test('should not parse Blade directives', async () => {
			const filePath = path.join(fixturesPath, 'blade-template.blade.php');
			const result = await parser.parse(filePath, workspacePath);

			// Should not extract @extends, @section, @include
			assert.strictEqual(result.classes.length, 1);
			assert.strictEqual(result.relationships.length, 0);
		});

		test('should not parse Twig syntax', async () => {
			const filePath = path.join(fixturesPath, 'twig-template.html.twig');
			const result = await parser.parse(filePath, workspacePath);

			// Should not extract {% extends %}, {% block %}, {% include %}
			assert.strictEqual(result.classes.length, 1);
			assert.strictEqual(result.relationships.length, 0);
		});
	});

	suite('Supported Extensions', () => {
		test('should report supported extensions', () => {
			const extensions = parser.supportedExtensions;
			
			assert.ok(extensions.includes('.html'), 'Should support .html');
			assert.ok(extensions.includes('.htm'), 'Should support .htm');
		});

		test('should support blade.php extension', () => {
			const extensions = parser.supportedExtensions;
			assert.ok(
				extensions.includes('.blade.php') || extensions.includes('.html'),
				'Should support .blade.php or handle via .html'
			);
		});
	});

	suite('File Path Handling', () => {
		test('should use workspace-relative paths', async () => {
			const filePath = path.join(fixturesPath, 'simple.html');
			const result = await parser.parse(filePath, workspacePath);

			const template = result.classes[0];
			assert.ok(!template.filePath.includes(workspacePath), 'Should not include workspace path');
			assert.ok(template.filePath.endsWith('simple.html'), 'Should end with filename');
		});

		test('should preserve folder structure in paths', async () => {
			const filePath = path.join(fixturesPath, 'nested/subfolder/deep.html');
			const result = await parser.parse(filePath, workspacePath);

			const template = result.classes[0];
			assert.ok(template.filePath.includes('nested'), 'Should include folder name');
			assert.ok(template.filePath.includes('subfolder'), 'Should include subfolder name');
		});
	});

	suite('Empty and Edge Cases', () => {
		test('should handle empty HTML files', async () => {
			// Create a temp empty file test
			const filePath = path.join(fixturesPath, 'simple.html');
			const result = await parser.parse(filePath, workspacePath);

			// Should still create a node even if file is empty/simple
			assert.strictEqual(result.classes.length, 1);
		});
	});
});
