import * as assert from 'assert';
import { UMLMapper } from '../../../services/util/umlMapper';

suite('UMLMapper Test Suite', () => {

	suite('Inheritance / Realization / Dependency', () => {
		test('should map extends to inheritance', () => {
			assert.strictEqual(UMLMapper.mapToUMLType('extends'), 'inheritance');
		});

		test('should map implements to realization', () => {
			assert.strictEqual(UMLMapper.mapToUMLType('implements'), 'realization');
		});

		test('should map call/usage detailed types to dependency', () => {
			for (const type of ['uses', 'calls', 'calls-super', 'calls-static', 'async-calls',
				'returns', 'parameter', 'generic', 'imports', 'callback', 'http-call',
				'server-action', 'data-fetching', 'creates']) {
				assert.strictEqual(UMLMapper.mapToUMLType(type), 'dependency', `${type} should map to dependency`);
			}
		});
	});

	suite('Association (composition/aggregation merged)', () => {
		test('should map routes-to/middleware/layout-wraps to association', () => {
			for (const type of ['routes-to', 'middleware', 'layout-wraps']) {
				assert.strictEqual(UMLMapper.mapToUMLType(type), 'association', `${type} should map to association`);
			}
		});

		test('should map composition (typed field) to association, not a separate composition category', () => {
			assert.strictEqual(UMLMapper.mapToUMLType('composition'), 'association');
		});

		test('should map injects (DI) to association, not a separate composition category', () => {
			assert.strictEqual(UMLMapper.mapToUMLType('injects'), 'association');
		});

		test('should map re-exports to association, not a separate aggregation category', () => {
			assert.strictEqual(UMLMapper.mapToUMLType('re-exports'), 'association');
		});
	});

	suite('Unknown types', () => {
		test('should default unrecognized detailed types to dependency', () => {
			assert.strictEqual(UMLMapper.mapToUMLType('some-made-up-type'), 'dependency');
		});

		test('should default currently-unmapped ORM/framework detailed types to dependency', () => {
			// Documents current (pre-existing, out of scope here) behavior: these detailed
			// types have no explicit case in mapToUMLType and fall through to the default.
			for (const type of ['has-many', 'belongs-to', 'one-to-many', 'many-to-one',
				'many-to-many', 'one-to-one', 'observes', 'triggers', 'serializes',
				'protected-by', 'renders']) {
				assert.strictEqual(UMLMapper.mapToUMLType(type), 'dependency', `${type} should default to dependency`);
			}
		});
	});

	suite('getUMLLabel', () => {
		test('should return the correct label for each UML type', () => {
			assert.strictEqual(UMLMapper.getUMLLabel('inheritance'), 'extends');
			assert.strictEqual(UMLMapper.getUMLLabel('realization'), 'implements');
			assert.strictEqual(UMLMapper.getUMLLabel('dependency'), 'uses');
			assert.strictEqual(UMLMapper.getUMLLabel('association'), 'has');
		});
	});
});
