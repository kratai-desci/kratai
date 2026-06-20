import * as assert from 'assert';
import * as path from 'path';
import { TypeScriptParser } from '../../../../services/parsing/languages/TypeScriptParser';
import { ClassInfo } from '../../../../types/domain/ClassInfo';
import { ClassRelationship } from '../../../../types/domain/ClassRelationship';

suite('TypeScript Parser Test Suite', () => {
	const fixturesPath = path.join(__dirname, 'fixtures');
	const workspacePath = path.join(__dirname, 'fixtures');
	let parser: TypeScriptParser;

	setup(() => {
		parser = new TypeScriptParser();
	});

	suite('Phase 1: OOP Patterns', () => {
		test('should parse class with constructor and methods', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.ts');
			const classes = parser.parseFile(fixturePath);

			assert.ok(classes.length > 0, 'Should find classes');
			
			const userService = classes.find(c => c.name === 'UserService' && !c.isModule);
			assert.ok(userService, 'Should find UserService class');
			assert.ok(userService.methods.length > 0, 'Should find methods');
			assert.ok(userService.properties.length > 0, 'Should find properties');
		});

		test('should detect class inheritance (extends)', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const extendsRel = relationships.filter(r => r.type === 'extends');
			assert.ok(extendsRel.length > 0, 'Should find extends relationships');
			
			const userServiceExtends = extendsRel.find(r => 
				r.from === 'UserService' && r.to === 'BaseService'
			);
			assert.ok(userServiceExtends, 'UserService should extend BaseService');
		});

		test('should detect interface implementation', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const implementsRel = relationships.filter(r => r.type === 'implements');
			assert.ok(implementsRel.length > 0, 'Should find implements relationships');
		});

		test('should detect abstract classes', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.ts');
			const classes = parser.parseFile(fixturePath);

			const abstractClass = classes.find(c => c.isAbstract === true);
			assert.ok(abstractClass, 'Should find abstract class');
		});
	});

	suite('Phase 2: Type Relationships', () => {
		test('should detect property types (composition)', () => {
			const fixturePath = path.join(fixturesPath, 'type-relationships.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const compositionRel = relationships.filter(r => r.type === 'composition');
			assert.ok(compositionRel.length > 0, 'Should find composition relationships');
			
			const repoComposition = compositionRel.find(r =>
				r.from === 'UserService' && r.to === 'UserRepository'
			);
			assert.ok(repoComposition, 'UserService should have UserRepository property');
		});

		test('should detect return types', () => {
			const fixturePath = path.join(fixturesPath, 'type-relationships.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const returnsRel = relationships.filter(r => r.type === 'returns');
			assert.ok(returnsRel.length > 0, 'Should find return type relationships');
		});

		test('should detect parameter types', () => {
			const fixturePath = path.join(fixturesPath, 'type-relationships.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const parameterRel = relationships.filter(r => r.type === 'parameter');
			assert.ok(parameterRel.length > 0, 'Should find parameter type relationships');
		});

		test('should detect generic type parameters', () => {
			const fixturePath = path.join(fixturesPath, 'higher-order.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const genericRel = relationships.filter(r => r.type === 'generic');
			assert.ok(genericRel.length > 0, 'Should find generic type relationships');
		});
	});

	suite('Phase 3: Method Calls', () => {
		test('should detect function calls', () => {
			const fixturePath = path.join(fixturesPath, 'functional.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const callsRel = relationships.filter(r => r.type === 'calls');
			assert.ok(callsRel.length > 0, 'Should find call relationships');
		});

		test('should detect static method calls', () => {
			const fixturePath = path.join(fixturesPath, 'static-calls.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const staticCallRel = relationships.filter(r => r.type === 'calls-static');
			assert.ok(staticCallRel.length > 0, 'Should find static call relationships');
		});

		test('should detect super calls to parent methods', () => {
			const fixturePath = path.join(fixturesPath, 'parent-calls.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const superCallRel = relationships.filter(r => r.type === 'calls-super');
			assert.ok(superCallRel.length > 0, 'Should find super call relationships');
		});

		test('should detect async/await calls', () => {
			const fixturePath = path.join(fixturesPath, 'async-chains.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const asyncCallRel = relationships.filter(r => r.type === 'async-calls');
			assert.ok(asyncCallRel.length > 0, 'Should find async call relationships');
		});
	});

	suite('Phase 4: Functional Patterns', () => {
		test('should parse functions as modules', () => {
			const fixturePath = path.join(fixturesPath, 'functional.ts');
			const classes = parser.parseFile(fixturePath);

			// Functions should be represented as modules
			const modules = classes.filter(c => c.isModule === true);
			assert.ok(modules.length > 0, 'Should find function modules');
			
			const createUser = classes.find(c => c.name === 'createUser' && c.isModule);
			assert.ok(createUser, 'Should find createUser function as module');
		});

		test('should detect function calls between functions', () => {
			const fixturePath = path.join(fixturesPath, 'functional.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const callsRel = relationships.filter(r => r.type === 'calls');
			assert.ok(callsRel.length > 0, 'Should find function call relationships');
		});

		test('should detect higher-order functions with callbacks', () => {
			const fixturePath = path.join(fixturesPath, 'higher-order.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const callbackRel = relationships.filter(r => r.type === 'callback');
			assert.ok(callbackRel.length > 0, 'Should find callback relationships');
		});

		test('should detect factory patterns (constructor calls)', () => {
			const fixturePath = path.join(fixturesPath, 'factory-pattern.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const createsRel = relationships.filter(r => r.type === 'creates');
			assert.ok(createsRel.length > 0, 'Should find factory creates relationships');
		});
	});

	suite('Phase 5: Module Graph', () => {
		test('should detect import relationships', () => {
			const fixturePath = path.join(fixturesPath, 'imports.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const importsRel = relationships.filter(r => r.type === 'imports');
			assert.ok(importsRel.length > 0, 'Should find import relationships');
		});

		test('should detect re-export relationships', () => {
			const fixturePath = path.join(fixturesPath, 're-exports.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const reExportsRel = relationships.filter(r => r.type === 're-exports');
			assert.ok(reExportsRel.length > 0, 'Should find re-export relationships');
		});

		test('should build transitive dependency graph', () => {
			const fixturePath = path.join(fixturesPath, 'imports.ts');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// Should have relationships from imports
			const allModuleRels = relationships.filter(r => 
				r.type === 'imports' || r.type === 're-exports'
			);
			assert.ok(allModuleRels.length > 0, 'Should find module relationships');
		});
	});
});
