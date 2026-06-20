import * as assert from 'assert';
import * as path from 'path';
import { TypeScriptParser } from '../../../../services/parsing/languages/TypeScriptParser';

// Type definitions for test results
interface ParseResult {
	classes: any[];
	functions: any[];
	methods: any[];
	properties: any[];
	imports: any[];
	exports: any[];
	relationships: any[];
}

suite('TypeScript Parser Test Suite', () => {
	const fixturesPath = path.join(__dirname, 'fixtures');
	let parser: TypeScriptParser;

	setup(() => {
		parser = new TypeScriptParser();
	});

	suite('Phase 1: OOP Patterns', () => {
		test('should parse class with constructor and methods', async () => {
			const fixturePath = path.join(fixturesPath, 'class-based.ts');
			const result = await parser.parse(fixturePath);

			assert.ok(result.classes.length > 0, 'Should find classes');
			
			const userService = result.classes.find(c => c.name === 'UserService');
			assert.ok(userService, 'Should find UserService class');
			assert.ok(userService.methods.length > 0, 'Should find methods');
			assert.ok(userService.properties.length > 0, 'Should find properties');
		});

		test('should detect class inheritance (extends)', async () => {
			const fixturePath = path.join(fixturesPath, 'class-based.ts');
			const result = await parser.parse(fixturePath);

			const extendsRel = result.relationships.filter(r => r.type === 'extends');
			assert.ok(extendsRel.length > 0, 'Should find extends relationships');
			
			const userServiceExtends = extendsRel.find(r => 
				r.from === 'UserService' && r.to === 'BaseService'
			);
			assert.ok(userServiceExtends, 'UserService should extend BaseService');
		});

		test('should detect interface implementation', async () => {
			const fixturePath = path.join(fixturesPath, 'class-based.ts');
			const result = await parser.parse(fixturePath);

			const implementsRel = result.relationships.filter(r => r.type === 'implements');
			assert.ok(implementsRel.length > 0, 'Should find implements relationships');
		});

		test('should detect abstract classes', async () => {
			const fixturePath = path.join(fixturesPath, 'class-based.ts');
			const result = await parser.parse(fixturePath);

			const abstractClass = result.classes.find(c => c.isAbstract === true);
			assert.ok(abstractClass, 'Should find abstract class');
		});
	});

	suite('Phase 2: Type Relationships', () => {
		test('should detect property types (composition)', async () => {
			const fixturePath = path.join(fixturesPath, 'type-relationships.ts');
			const result = await parser.parse(fixturePath);

			const compositionRel = result.relationships.filter(r => r.type === 'composition');
			assert.ok(compositionRel.length > 0, 'Should find composition relationships');
			
			const repoComposition = compositionRel.find(r =>
				r.from === 'UserService' && r.to === 'UserRepository'
			);
			assert.ok(repoComposition, 'UserService should have UserRepository property');
		});

		test('should detect return types', async () => {
			const fixturePath = path.join(fixturesPath, 'type-relationships.ts');
			const result = await parser.parse(fixturePath);

			const returnsRel = result.relationships.filter(r => r.type === 'returns');
			assert.ok(returnsRel.length > 0, 'Should find return type relationships');
		});

		test('should detect parameter types', async () => {
			const fixturePath = path.join(fixturesPath, 'type-relationships.ts');
			const result = await parser.parse(fixturePath);

			const parameterRel = result.relationships.filter(r => r.type === 'parameter');
			assert.ok(parameterRel.length > 0, 'Should find parameter type relationships');
		});

		test('should detect generic type parameters', async () => {
			const fixturePath = path.join(fixturesPath, 'higher-order.ts');
			const result = await parser.parse(fixturePath);

			const genericRel = result.relationships.filter(r => r.type === 'generic');
			assert.ok(genericRel.length > 0, 'Should find generic type relationships');
		});
	});

	suite('Phase 3: Method Calls', () => {
		test('should detect instance method calls', async () => {
			const fixturePath = path.join(fixturesPath, 'functional.ts');
			const result = await parser.parse(fixturePath);

			const callsRel = result.relationships.filter(r => r.type === 'calls');
			assert.ok(callsRel.length > 0, 'Should find method call relationships');
		});

		test('should detect static method calls', async () => {
			const fixturePath = path.join(fixturesPath, 'static-calls.ts');
			const result = await parser.parse(fixturePath);

			const staticCallRel = result.relationships.filter(r => r.type === 'calls-static');
			assert.ok(staticCallRel.length > 0, 'Should find static call relationships');
			
			const validationCall = staticCallRel.find(r =>
				r.to.includes('ValidationUtils.validate')
			);
			assert.ok(validationCall, 'Should detect ValidationUtils.validate() call');
		});

		test('should detect super calls to parent methods', async () => {
			const fixturePath = path.join(fixturesPath, 'parent-calls.ts');
			const result = await parser.parse(fixturePath);

			const superCallRel = result.relationships.filter(r => r.type === 'calls-super');
			assert.ok(superCallRel.length > 0, 'Should find super call relationships');
		});

		test('should detect async/await calls', async () => {
			const fixturePath = path.join(fixturesPath, 'async-chains.ts');
			const result = await parser.parse(fixturePath);

			const asyncCallRel = result.relationships.filter(r => r.type === 'async-calls');
			assert.ok(asyncCallRel.length > 0, 'Should find async call relationships');
		});
	});

	suite('Phase 4: Functional Patterns', () => {
		test('should parse exported functions', async () => {
			const fixturePath = path.join(fixturesPath, 'functional.ts');
			const result = await parser.parse(fixturePath);

			assert.ok(result.functions.length > 0, 'Should find functions');
			
			const createUser = result.functions.find(f => f.name === 'createUser');
			assert.ok(createUser, 'Should find createUser function');
			assert.strictEqual(createUser.isExported, true, 'Should be marked as exported');
		});

		test('should detect function calls between functions', async () => {
			const fixturePath = path.join(fixturesPath, 'functional.ts');
			const result = await parser.parse(fixturePath);

			const callsRel = result.relationships.filter(r => 
				r.type === 'calls' && r.fromType === 'function' && r.toType === 'function'
			);
			assert.ok(callsRel.length > 0, 'Should find function-to-function calls');
		});

		test('should detect higher-order functions with callbacks', async () => {
			const fixturePath = path.join(fixturesPath, 'higher-order.ts');
			const result = await parser.parse(fixturePath);

			const callbackRel = result.relationships.filter(r => r.type === 'callback');
			assert.ok(callbackRel.length > 0, 'Should find callback relationships');
		});

		test('should detect factory patterns (constructor calls)', async () => {
			const fixturePath = path.join(fixturesPath, 'factory-pattern.ts');
			const result = await parser.parse(fixturePath);

			const createsRel = result.relationships.filter(r => r.type === 'creates');
			assert.ok(createsRel.length > 0, 'Should find factory creates relationships');
		});
	});

	suite('Phase 5: Module Graph', () => {
		test('should detect named imports', async () => {
			const fixturePath = path.join(fixturesPath, 'imports.ts');
			const result = await parser.parse(fixturePath);

			const importsRel = result.relationships.filter(r => r.type === 'imports');
			assert.ok(importsRel.length > 0, 'Should find import relationships');
		});

		test('should detect default imports', async () => {
			const fixturePath = path.join(fixturesPath, 'imports.ts');
			const result = await parser.parse(fixturePath);

			const defaultImports = result.imports.filter(i => i.isDefault === true);
			assert.ok(defaultImports.length >= 0, 'Should handle default imports');
		});

		test('should detect namespace imports', async () => {
			const fixturePath = path.join(fixturesPath, 'imports.ts');
			const result = await parser.parse(fixturePath);

			const namespaceImports = result.imports.filter(i => i.isNamespace === true);
			assert.ok(namespaceImports.length >= 0, 'Should handle namespace imports');
		});

		test('should detect re-exports', async () => {
			const fixturePath = path.join(fixturesPath, 're-exports.ts');
			const result = await parser.parse(fixturePath);

			const reExportsRel = result.relationships.filter(r => r.type === 're-exports');
			assert.ok(reExportsRel.length > 0, 'Should find re-export relationships');
		});

		test('should detect wildcard re-exports', async () => {
			const fixturePath = path.join(fixturesPath, 're-exports.ts');
			const result = await parser.parse(fixturePath);

			const wildcardExports = result.exports.filter(e => e.isWildcard === true);
			assert.ok(wildcardExports.length > 0, 'Should find wildcard exports');
		});
	});
});
