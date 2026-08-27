import * as assert from 'assert';
import { CodeIndex } from '../../../export/CodeIndex';
import { ClassInfo, ClassRelationship, DiagramData } from '../../../types/domain';

suite('CodeIndex Test Suite', () => {
	function buildData(): DiagramData {
		const classes: ClassInfo[] = [
			{
				name: 'User',
				filePath: 'backend/app/models.py',
				properties: [{ name: 'email', type: 'str', visibility: 'public' }],
				methods: [],
				classType: 'class',
			},
			{
				name: 'UserCreate',
				filePath: 'backend/app/models.py',
				properties: [],
				methods: [{ name: 'validate', parameters: [], returnType: 'bool', visibility: 'public' }],
				classType: 'class',
			},
			// Duplicate name in a different file, on purpose - tests disambiguation.
			{
				name: 'Config',
				filePath: 'backend/app/core/config.py',
				properties: [],
				methods: [],
				classType: 'class',
			},
			{
				name: 'Config',
				filePath: 'frontend/src/config.ts',
				properties: [],
				methods: [],
				classType: 'class',
			},
		];
		const relationships: ClassRelationship[] = [
			{
				from: 'backend/app/models.py__UserCreate',
				to: 'backend/app/models.py__User',
				type: 'extends',
			},
		];
		return { classes, relationships };
	}

	test('buildOutline lists names only - no types, no signatures, no relationships', () => {
		const outline = CodeIndex.buildOutline(buildData());
		assert.ok(outline.includes('email'), 'property name should appear');
		assert.ok(outline.includes('validate()'), 'method name should appear, with ()');
		assert.ok(!outline.includes(': str'), 'property type should not appear in the outline');
		assert.ok(!outline.includes('Extends:'), 'relationships should not appear in the outline');
	});

	test('search finds classes by substring, case-insensitive', () => {
		const result = CodeIndex.search(buildData(), 'user');
		assert.ok(result.includes('User (backend/app/models.py)'));
		assert.ok(result.includes('UserCreate (backend/app/models.py)'));
	});

	test('search finds files by substring', () => {
		const result = CodeIndex.search(buildData(), 'core/config');
		assert.ok(result.includes('backend/app/core/config.py'));
	});

	test('search reports no matches honestly rather than returning something unrelated', () => {
		const result = CodeIndex.search(buildData(), 'zzz-nonexistent');
		assert.ok(result.includes('No classes or files matching'));
	});

	test('getDetail resolves a unique class name directly, including its relationships', () => {
		const detail = CodeIndex.getDetail(buildData(), 'UserCreate');
		assert.ok(detail.includes('UserCreate'));
		assert.ok(detail.includes('Uses: User (extends)'));
	});

	test('getDetail returns every class in a file when given an exact file path', () => {
		const detail = CodeIndex.getDetail(buildData(), 'backend/app/models.py');
		assert.ok(detail.includes('User'));
		assert.ok(detail.includes('UserCreate'));
	});

	test('getDetail lists candidates instead of guessing when a class name is ambiguous', () => {
		const detail = CodeIndex.getDetail(buildData(), 'Config');
		assert.ok(detail.includes('matches 2 classes'));
		assert.ok(detail.includes('backend/app/core/config.py::Config'));
		assert.ok(detail.includes('frontend/src/config.ts::Config'));
	});

	test('getDetail resolves an ambiguous name directly via the qualified "file::name" form', () => {
		const detail = CodeIndex.getDetail(buildData(), 'frontend/src/config.ts::Config');
		assert.ok(detail.includes('Config'));
		assert.ok(!detail.includes('matches 2 classes'));
	});

	test('getDetail reports honestly when nothing matches', () => {
		const detail = CodeIndex.getDetail(buildData(), 'DoesNotExist');
		assert.ok(detail.includes('No class or file matching'));
	});
});
