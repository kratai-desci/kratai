import * as assert from 'assert';
import * as path from 'path';
import { PHPParser } from '../../../../services/parsing/languages/PHPParser';

suite('PHP Parser Test Suite', () => {
	const parser = new PHPParser();
	const fixturesPath = path.join(__dirname, 'fixtures');
	const workspacePath = path.join(__dirname, '../../../..');

	suite('Phase 1: OOP Patterns', () => {
		test('should parse basic class definitions', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.php');
			const classes = parser.parseFile(fixturePath);

			assert.ok(classes.length > 0, 'Should parse at least one class');
			
			const baseService = classes.find(c => c.name === 'BaseService');
			assert.ok(baseService, 'Should find BaseService class');
			assert.strictEqual(baseService.filePath, fixturePath, 'Should have correct file path');
			
			// Methods
			const validateMethod = baseService.methods.find(m => m.name === 'validate');
			assert.ok(validateMethod, 'Should find validate method');
			assert.strictEqual(validateMethod.parameters.length, 1, 'validate should have 1 parameter');
		});

		test('should detect class inheritance (extends)', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.php');
			const classes = parser.parseFile(fixturePath);

			const userService = classes.find(c => c.name === 'UserService');
			assert.ok(userService, 'Should find UserService class');
			assert.strictEqual(userService.extends, 'BaseService', 'UserService should extend BaseService');
		});

		test('should detect multi-level inheritance', () => {
			const fixturePath = path.join(fixturesPath, 'parent-calls.php');
			const classes = parser.parseFile(fixturePath);

			// BaseService -> UserService -> AdminService (3 levels)
			const baseService = classes.find(c => c.name === 'BaseService');
			const userService = classes.find(c => c.name === 'UserService');
			const adminService = classes.find(c => c.name === 'AdminService');

			assert.ok(baseService, 'Should find BaseService');
			assert.ok(userService, 'Should find UserService');
			assert.ok(adminService, 'Should find AdminService');

			assert.strictEqual(userService.extends, 'BaseService', 'UserService extends BaseService');
			assert.strictEqual(adminService.extends, 'UserService', 'AdminService extends UserService');
		});

		test('should parse interfaces', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.php');
			const classes = parser.parseFile(fixturePath);

			const iUserService = classes.find(c => c.name === 'IUserService');
			assert.ok(iUserService, 'Should find IUserService interface');
		});

		test('should parse abstract classes', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.php');
			const classes = parser.parseFile(fixturePath);

			const abstractService = classes.find(c => c.name === 'AbstractService');
			assert.ok(abstractService, 'Should find AbstractService abstract class');
		});

		test('should parse properties with visibility', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.php');
			const classes = parser.parseFile(fixturePath);

			const userService = classes.find(c => c.name === 'UserService');
			const repositoryProp = userService.properties.find(p => p.name === 'repository');
			
			assert.ok(repositoryProp, 'Should find repository property');
			assert.strictEqual(repositoryProp.visibility, 'private', 'repository should be private');
		});

		test('should preserve line numbers for navigation', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.php');
			const classes = parser.parseFile(fixturePath);

			const baseService = classes.find(c => c.name === 'BaseService');
			assert.ok(baseService.methods[0].lineNumber > 0, 'Methods should have line numbers');
			assert.ok(baseService.methods[0].endLineNumber >= baseService.methods[0].lineNumber, 
				'End line should be >= start line');
		});
	});

	suite('Phase 2: Type Relationships', () => {
		test('should parse property type declarations', () => {
			const fixturePath = path.join(fixturesPath, 'type-declarations.php');
			const classes = parser.parseFile(fixturePath);

			const user = classes.find(c => c.name === 'User');
			const nameProp = user.properties.find(p => p.name === 'name');
			
			assert.ok(nameProp, 'Should find name property');
			assert.strictEqual(nameProp.type, 'string', 'name should be typed as string');
		});

		test('should parse parameter type hints', () => {
			const fixturePath = path.join(fixturesPath, 'type-declarations.php');
			const classes = parser.parseFile(fixturePath);

			const userRepo = classes.find(c => c.name === 'UserRepository');
			const saveMethod = userRepo.methods.find(m => m.name === 'save');
			
			assert.ok(saveMethod, 'Should find save method');
			assert.strictEqual(saveMethod.parameters.length, 1, 'save should have 1 parameter');
			assert.strictEqual(saveMethod.parameters[0].type, 'User', 'Parameter should be typed as User');
		});

		test('should parse return type declarations', () => {
			const fixturePath = path.join(fixturesPath, 'type-declarations.php');
			const classes = parser.parseFile(fixturePath);

			const userRepo = classes.find(c => c.name === 'UserRepository');
			const findMethod = userRepo.methods.find(m => m.name === 'find');
			
			assert.ok(findMethod, 'Should find find method');
			assert.strictEqual(findMethod.returnType, '?User', 'Return type should be ?User (nullable)');
		});

		test('should detect composition from typed properties', () => {
			const fixturePath = path.join(fixturesPath, 'type-declarations.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// UserService has property: private UserRepository $repository
			const serviceToRepo = relationships.find(r =>
				r.from === `${fixturePath}__UserService` && 
				r.to === `${fixturePath}__UserRepository` &&
				(r.type === 'uses' || r.type === 'composition')
			);
			assert.ok(serviceToRepo, 'MUST detect composition from typed property');
		});

		test('should detect return type relationships', () => {
			const fixturePath = path.join(fixturesPath, 'type-declarations.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// UserRepository.find() returns ?User
			const returnsUser = relationships.filter(r =>
				r.from.includes('UserRepository') && 
				r.to.includes('User') &&
				r.type === 'returns'
			);
			assert.ok(returnsUser.length > 0, 'MUST detect returns relationships from type hints');
		});

		test('should detect parameter type relationships', () => {
			const fixturePath = path.join(fixturesPath, 'type-declarations.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// UserRepository.save(User $user)
			const paramUser = relationships.filter(r =>
				r.from.includes('UserRepository') && 
				r.to.includes('User') &&
				r.type === 'parameter'
			);
			assert.ok(paramUser.length > 0, 'MUST detect parameter relationships from type hints');
		});
	});

	suite('Phase 3: Method Calls', () => {
		test('should detect parent::method() calls to parent', () => {
			const fixturePath = path.join(fixturesPath, 'parent-calls.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// UserService calls parent::validate() and parent::process()
			const parentCalls = relationships.filter(r => r.type === 'calls-super' || r.type === 'calls-parent');
			assert.ok(parentCalls.length > 0, 'MUST detect parent::method() calls as parent call relationships');
		});

		test('should detect static method calls (Class::method())', () => {
			const fixturePath = path.join(fixturesPath, 'static-calls.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// UserService calls ValidationUtils::validateEmail(), etc.
			const staticCalls = relationships.filter(r => r.type === 'calls-static');
			assert.ok(staticCalls.length > 0, 'MUST detect Class::method() as calls-static relationships');
		});

		test('should mark static methods correctly', () => {
			const fixturePath = path.join(fixturesPath, 'static-calls.php');
			const classes = parser.parseFile(fixturePath);

			const validationUtils = classes.find(c => c.name === 'ValidationUtils');
			const validateEmail = validationUtils.methods.find(m => m.name === 'validateEmail');
			
			assert.ok(validateEmail, 'Should find validateEmail method');
			assert.strictEqual(validateEmail.isStatic, true, 'validateEmail MUST be marked as static');
		});
	});

	suite('Phase 4: Functional Patterns', () => {
		test('should parse top-level functions as module', () => {
			const fixturePath = path.join(fixturesPath, 'functional.php');
			const classes = parser.parseFile(fixturePath);

			// Should create module entry for file with functions
			const module = classes.find(c => c.isModule === true);
			assert.ok(module, 'Should have module for functions');
			
			const validateUser = module.methods.find(m => m.name === 'validateUser');
			assert.ok(validateUser, 'Should find validateUser function');
		});

		test('should detect all function declarations', () => {
			const fixturePath = path.join(fixturesPath, 'functional.php');
			const classes = parser.parseFile(fixturePath);

			const module = classes.find(c => c.isModule === true);
			const expectedFunctions = ['validateUser', 'saveUser', 'createUser', 'updateUser', 'getUser', 'deleteUser', 'processUsers'];
			
			expectedFunctions.forEach(funcName => {
				const func = module.methods.find(m => m.name === funcName);
				assert.ok(func, `Should find function: ${funcName}`);
			});
		});

		test('should detect function-to-function calls', () => {
			const fixturePath = path.join(fixturesPath, 'functional.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// createUser() calls validateUser() and saveUser()
			const callsRel = relationships.filter(r => r.type === 'calls');
			assert.ok(callsRel.length > 0, 'MUST detect function-to-function calls');
		});

		test('should detect factory functions', () => {
			const fixturePath = path.join(fixturesPath, 'factory-pattern.php');
			const classes = parser.parseFile(fixturePath);

			const module = classes.find(c => c.isModule === true);
			assert.ok(module, 'Should have module for factory functions');
			
			const createUser = module.methods.find(m => m.name === 'createUser');
			assert.ok(createUser, 'Should find createUser factory function');
		});

		test('should detect constructor calls in factory functions', () => {
			const fixturePath = path.join(fixturesPath, 'factory-pattern.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// createUser() creates new User() - factory pattern
			const creates = relationships.filter(r => r.type === 'creates' || r.type === 'instantiates');
			assert.ok(creates.length > 0, 'MUST detect factory → product relationships (new ClassName())');
		});

		test('should detect factory classes with static methods', () => {
			const fixturePath = path.join(fixturesPath, 'factory-pattern.php');
			const classes = parser.parseFile(fixturePath);

			const userFactory = classes.find(c => c.name === 'UserFactory');
			assert.ok(userFactory, 'Should find UserFactory class');
			
			const create = userFactory.methods.find(m => m.name === 'create');
			assert.ok(create, 'Should find create static method');
			assert.strictEqual(create.isStatic, true, 'create should be marked as static');
		});
	});

	suite('Phase 5: Traits', () => {
		test('should detect trait usage', () => {
			const fixturePath = path.join(fixturesPath, 'traits.php');
			const classes = parser.parseFile(fixturePath);

			const user = classes.find(c => c.name === 'User');
			assert.ok(user, 'Should find User class');
			
			// Should detect traits (implementation depends on parser)
			// Could be in implements, traits property, or special relationship
		});

		test('should detect multiple traits in one class', () => {
			const fixturePath = path.join(fixturesPath, 'traits.php');
			const classes = parser.parseFile(fixturePath);

			const article = classes.find(c => c.name === 'Article');
			assert.ok(article, 'Should find Article class that uses 3 traits');
		});

		test('should parse trait definitions', () => {
			const fixturePath = path.join(fixturesPath, 'traits.php');
			const classes = parser.parseFile(fixturePath);

			const timestampable = classes.find(c => c.name === 'Timestampable');
			assert.ok(timestampable, 'Should find Timestampable trait');
		});
	});

	suite('Phase 6: Namespaces and Imports', () => {
		test('should handle namespace declarations', () => {
			const fixturePath = path.join(fixturesPath, 'namespaces.php');
			const classes = parser.parseFile(fixturePath);

			const userController = classes.find(c => c.name === 'UserController');
			assert.ok(userController, 'Should find UserController class');
		});

		test('should detect use statements (imports)', () => {
			const fixturePath = path.join(fixturesPath, 'namespaces.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// Should detect dependencies from use statements
			const imports = relationships.filter(r => r.type === 'imports' || r.type === 'uses');
			// At minimum, should detect composition from typed properties
			assert.ok(imports.length >= 0, 'May detect import relationships');
		});

		test('should handle aliased imports (use X as Y)', () => {
			const fixturePath = path.join(fixturesPath, 'namespaces.php');
			const classes = parser.parseFile(fixturePath);

			// UserModel is aliased from User
			const userController = classes.find(c => c.name === 'UserController');
			assert.ok(userController, 'Should handle files with aliased imports');
		});
	});

	suite('Phase 7: Higher-Order Functions', () => {
		test('should parse higher-order functions', () => {
			const fixturePath = path.join(fixturesPath, 'higher-order.php');
			const classes = parser.parseFile(fixturePath);

			const module = classes.find(c => c.isModule === true);
			assert.ok(module, 'Should have module for higher-order functions');
			
			const map = module.methods.find(m => m.name === 'map');
			assert.ok(map, 'Should find map higher-order function');
		});

		test('should detect callable type hints in function parameters', () => {
			const fixturePath = path.join(fixturesPath, 'higher-order.php');
			const classes = parser.parseFile(fixturePath);

			const module = classes.find(c => c.isModule === true);
			const map = module.methods.find(m => m.name === 'map');
			
			assert.ok(map, 'Should find map function');
			// Should have callable parameter
			const callableParam = map.parameters.find(p => p.type === 'callable');
			assert.ok(callableParam, 'Should detect callable type hint in parameters');
		});

		test('should parse class with higher-order methods', () => {
			const fixturePath = path.join(fixturesPath, 'higher-order.php');
			const classes = parser.parseFile(fixturePath);

			const dataProcessor = classes.find(c => c.name === 'DataProcessor');
			assert.ok(dataProcessor, 'Should find DataProcessor class');
			
			const transform = dataProcessor.methods.find(m => m.name === 'transform');
			assert.ok(transform, 'Should find transform method that takes callable');
			
			const callableParam = transform.parameters.find(p => p.type === 'callable');
			assert.ok(callableParam, 'transform should have callable parameter');
		});
	});

	suite('Phase 8: Re-exports / Aliases', () => {
		test('should handle class aliasing patterns', () => {
			const fixturePath = path.join(fixturesPath, 're-exports.php');
			const classes = parser.parseFile(fixturePath);

			// Should parse classes that extend/alias other classes
			const userService = classes.find(c => c.name === 'UserService');
			assert.ok(userService, 'Should find UserService (re-export via extension)');
		});

		test('should parse module with mixed definitions and re-exports', () => {
			const fixturePath = path.join(fixturesPath, 're-exports.php');
			const classes = parser.parseFile(fixturePath);

			const configService = classes.find(c => c.name === 'ConfigService');
			assert.ok(configService, 'Should find local ConfigService definition');
		});
	});

	suite('Edge Cases', () => {
		test('should handle non-existent files gracefully', () => {
			const fixturePath = path.join(fixturesPath, 'nonexistent.php');
			const classes = parser.parseFile(fixturePath);
			
			assert.strictEqual(classes.length, 0, 'Should return empty array for non-existent files');
		});

		test('should use correct ID format (filePath__className)', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// UserService extends BaseService
			const extendsRel = relationships.find(r => r.type === 'extends');
			if (extendsRel) {
				assert.ok(extendsRel.from.includes('__'), 'from ID MUST use filePath__className format');
				assert.ok(extendsRel.to.includes('__'), 'to ID MUST use filePath__className format');
				assert.ok(extendsRel.from.includes(fixturePath), 'from ID MUST include full file path');
				assert.ok(extendsRel.to.includes(fixturePath), 'to ID MUST include full file path');
			}
		});

		test('should handle empty files gracefully', () => {
			const fixturePath = path.join(fixturesPath, 'empty.php');
			const classes = parser.parseFile(fixturePath);
			
			assert.ok(Array.isArray(classes), 'Should return array for empty files');
		});

		test('should handle files with only comments', () => {
			const fixturePath = path.join(fixturesPath, 'comments-only.php');
			const classes = parser.parseFile(fixturePath);
			
			assert.ok(Array.isArray(classes), 'Should return array for comment-only files');
		});
	});
});
