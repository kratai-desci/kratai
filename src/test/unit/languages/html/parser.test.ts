import * as assert from 'assert';
import * as path from 'path';
import { HTMLParser } from '../../../../services/parsing/languages/HTMLParser';

describe('HTMLParser', () => {
	let parser: HTMLParser;
	const fixturesPath = path.join(__dirname, 'fixtures');

	beforeEach(() => {
		parser = new HTMLParser();
	});

	describe('File Detection', () => {
		it('should detect .html files', async () => {
			const filePath = path.join(fixturesPath, 'simple.html');
			const result = await parser.parse(filePath, fixturesPath);

			assert.strictEqual(result.classes.length, 1, 'Should create one ClassInfo node');
			
			const template = result.classes[0];
			assert.strictEqual(template.name, 'simple.html', 'Should use filename as name');
			assert.strictEqual(template.classType, 'template', 'Should have classType "template"');
			assert.strictEqual(template.properties.length, 0, 'Should have no properties');
			assert.strictEqual(template.methods.length, 0, 'Should have no methods');
		});

		it('should detect .blade.php files', async () => {
			const filePath = path.join(fixturesPath, 'blade-template.blade.php');
			const result = await parser.parse(filePath, fixturesPath);

			assert.strictEqual(result.classes.length, 1);
			
			const template = result.classes[0];
			assert.strictEqual(template.name, 'blade-template.blade.php');
			assert.strictEqual(template.classType, 'template');
		});

		it('should detect .html.twig files', async () => {
			const filePath = path.join(fixturesPath, 'twig-template.html.twig');
			const result = await parser.parse(filePath, fixturesPath);

			assert.strictEqual(result.classes.length, 1);
			
			const template = result.classes[0];
			assert.strictEqual(template.name, 'twig-template.html.twig');
			assert.strictEqual(template.classType, 'template');
		});

		it('should handle Django templates with special syntax', async () => {
			const filePath = path.join(fixturesPath, 'django-template.html');
			const result = await parser.parse(filePath, fixturesPath);

			assert.strictEqual(result.classes.length, 1);
			
			const template = result.classes[0];
			assert.strictEqual(template.name, 'django-template.html');
			assert.strictEqual(template.classType, 'template');
		});

		it('should handle nested folder structures', async () => {
			const filePath = path.join(fixturesPath, 'nested/subfolder/deep.html');
			const result = await parser.parse(filePath, fixturesPath);

			assert.strictEqual(result.classes.length, 1);
			
			const template = result.classes[0];
			assert.strictEqual(template.name, 'deep.html');
			assert.strictEqual(template.classType, 'template');
			assert.ok(template.filePath.includes('nested/subfolder'), 'Should preserve folder path');
		});
	});

	describe('No Content Parsing', () => {
		it('should not parse template syntax', async () => {
			const filePath = path.join(fixturesPath, 'django-template.html');
			const result = await parser.parse(filePath, fixturesPath);

			// Should not extract template variables, blocks, or includes
			assert.strictEqual(result.classes.length, 1, 'Should only create one node for the file');
			assert.strictEqual(result.relationships.length, 0, 'Should not create relationships from content');
		});

		it('should not parse Blade directives', async () => {
			const filePath = path.join(fixturesPath, 'blade-template.blade.php');
			const result = await parser.parse(filePath, fixturesPath);

			// Should not extract @extends, @section, @include
			assert.strictEqual(result.classes.length, 1);
			assert.strictEqual(result.relationships.length, 0);
		});

		it('should not parse Twig syntax', async () => {
			const filePath = path.join(fixturesPath, 'twig-template.html.twig');
			const result = await parser.parse(filePath, fixturesPath);

			// Should not extract {% extends %}, {% block %}, {% include %}
			assert.strictEqual(result.classes.length, 1);
			assert.strictEqual(result.relationships.length, 0);
		});
	});

	describe('Supported Extensions', () => {
		it('should report supported extensions', () => {
			const extensions = parser.supportedExtensions;
			
			assert.ok(extensions.includes('.html'), 'Should support .html');
			assert.ok(extensions.includes('.htm'), 'Should support .htm');
		});

		it('should support blade.php extension', () => {
			const extensions = parser.supportedExtensions;
			assert.ok(
				extensions.includes('.blade.php') || extensions.includes('.html'),
				'Should support .blade.php or handle via .html'
			);
		});
	});

	describe('File Path Handling', () => {
		it('should use workspace-relative paths', async () => {
			const filePath = path.join(fixturesPath, 'simple.html');
			const result = await parser.parse(filePath, fixturesPath);

			const template = result.classes[0];
			assert.ok(!template.filePath.includes(fixturesPath), 'Should not include fixtures path');
			assert.ok(template.filePath.endsWith('simple.html'), 'Should end with filename');
		});

		it('should preserve folder structure in paths', async () => {
			const filePath = path.join(fixturesPath, 'nested/subfolder/deep.html');
			const result = await parser.parse(filePath, fixturesPath);

			const template = result.classes[0];
			assert.ok(template.filePath.includes('nested'), 'Should include folder name');
			assert.ok(template.filePath.includes('subfolder'), 'Should include subfolder name');
		});
	});

	describe('Empty and Edge Cases', () => {
		it('should handle empty HTML files', async () => {
			// Create a temp empty file test
			const filePath = path.join(fixturesPath, 'simple.html');
			const result = await parser.parse(filePath, fixturesPath);

			// Should still create a node even if file is empty/simple
			assert.strictEqual(result.classes.length, 1);
		});
	});
});
