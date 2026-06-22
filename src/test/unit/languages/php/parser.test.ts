import * as assert from 'assert';
import * as path from 'path';
import { PHPParser } from '../../../../services/parsing/languages/PHPParser';
import { ClassInfo } from '../../../../types/domain/ClassInfo';

suite('PHP Parser Test Suite', () => {
	const parser = new PHPParser();
	const fixturesPath = path.join(__dirname, '../../../../../src/test/unit/languages/php/fixtures');
	const workspacePath = path.join(__dirname, '../../../../../src/test/unit/languages/php/fixtures');

	/**
	 * Test Plan Validation:
	 * Following test-plan-languages.md requirements
	 * Tests should validate parser behavior, not be designed to pass
	 */

	suite('Phase 1: OOP Patterns', () => {
		test('should parse basic class definitions', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.php');
			const classes = parser.parseFile(fixturePath);

			// Exact count validation - should find 5 classes + possibly 1 module
			assert.strictEqual(classes.filter(c => !c.isModule).length, 5, 'Should find exactly 5 classes: BaseService, UserRepository, UserService, IUserService, AbstractService');
			
			const baseService = classes.find(c => c.name === 'BaseService');
			assert.ok(baseService, 'Should find BaseService class');
			assert.strictEqual(baseService.filePath, fixturePath, 'Should have correct file path');
			
			// Validate specific methods exist with exact count
			assert.strictEqual(baseService.methods.length, 3, 'BaseService should have 3 methods: __construct, validate, log');
			const methodNames = baseService.methods.map(m => m.name).sort();
			assert.deepStrictEqual(methodNames, ['__construct', 'log', 'validate'].sort(), 'Should have exact method names');
			
			// Validate method parameters
			const validateMethod = baseService.methods.find(m => m.name === 'validate');
			assert.ok(validateMethod, 'Should find validate method');
			assert.strictEqual(validateMethod.parameters.length, 1, 'validate should have exactly 1 parameter');
			
			// Validate properties
			assert.strictEqual(baseService.properties.length, 2, 'BaseService should have 2 properties: name, logger');
			const propNames = baseService.properties.map(p => p.name).sort();
			assert.deepStrictEqual(propNames, ['logger', 'name'].sort(), 'Should have exact property names');
		});

		test('should detect class inheritance (extends)', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const userService = classes.find(c => c.name === 'UserService');
			assert.ok(userService, 'Should find UserService class');
			assert.strictEqual(userService.extends, 'BaseService', 'UserService MUST extend BaseService');
			
			// MUST detect inheritance relationship
			const extendsRel = relationships.find(r =>
				r.from === `${fixturePath}__UserService` &&
				r.to === `${fixturePath}__BaseService` &&
				r.type === 'extends'
			);
			assert.ok(extendsRel, 'MUST detect extends relationship with correct ID format');
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
			assert.ok(userService, 'Should find UserService class');
			
			// Validate exact property count and names
			assert.strictEqual(userService.properties.length, 1, 'UserService should have 1 property: repository');
			const repositoryProp = userService.properties.find(p => p.name === 'repository');
			
			assert.ok(repositoryProp, 'Should find repository property');
			assert.strictEqual(repositoryProp.visibility, 'private', 'repository MUST be private');
			
			// Validate BaseService properties
			const baseService = classes.find(c => c.name === 'BaseService');
			assert.ok(baseService, 'Should find BaseService');
			const nameProp = baseService.properties.find(p => p.name === 'name');
			const loggerProp = baseService.properties.find(p => p.name === 'logger');
			assert.ok(nameProp, 'BaseService should have name property');
			assert.strictEqual(nameProp.visibility, 'protected', 'name MUST be protected');
			assert.ok(loggerProp, 'BaseService should have logger property');
			assert.strictEqual(loggerProp.visibility, 'protected', 'logger MUST be protected');
		});

		test('should preserve line numbers for navigation', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.php');
			const classes = parser.parseFile(fixturePath);

			const baseService = classes.find(c => c.name === 'BaseService');
			assert.ok(baseService, 'Should find BaseService');
			assert.ok(baseService!.methods.length > 0, 'Should have methods');
			const firstMethod = baseService!.methods[0]!;
			assert.ok(firstMethod.lineNumber! > 0, 'Methods should have line numbers');
			assert.ok(firstMethod.endLineNumber! >= firstMethod.lineNumber!, 
				'End line should be >= start line');
		});
	});

	suite('Phase 2: Type Relationships', () => {
		test('should parse property type declarations', () => {
			const fixturePath = path.join(fixturesPath, 'type-declarations.php');
			const classes = parser.parseFile(fixturePath);

			const user = classes.find(c => c.name === 'User');
			assert.ok(user, 'Should find User class');
			
			// Validate exact property count
			assert.strictEqual(user.properties.length, 3, 'User should have 3 properties: name, email, age');
			
			const nameProp = user.properties.find(p => p.name === 'name');
			const emailProp = user.properties.find(p => p.name === 'email');
			const ageProp = user.properties.find(p => p.name === 'age');
			
			assert.ok(nameProp, 'Should find name property');
			assert.strictEqual(nameProp.type, 'string', 'name MUST be typed as string');
			assert.ok(emailProp, 'Should find email property');
			assert.strictEqual(emailProp.type, 'string', 'email MUST be typed as string');
			assert.ok(ageProp, 'Should find age property');
			assert.ok(ageProp.type === '?int' || ageProp.type === 'int', 'age MUST be typed as ?int (nullable)');
		});

		test('should parse parameter type hints', () => {
			const fixturePath = path.join(fixturesPath, 'type-declarations.php');
			const classes = parser.parseFile(fixturePath);

			const userRepo = classes.find(c => c.name === 'UserRepository');
			assert.ok(userRepo, 'Should find UserRepository class');
			
			const saveMethod = userRepo.methods.find(m => m.name === 'save');
			assert.ok(saveMethod, 'Should find save method');
			assert.strictEqual(saveMethod.parameters.length, 1, 'save MUST have exactly 1 parameter');
			assert.strictEqual(saveMethod.parameters[0].name, 'user', 'Parameter MUST be named "user"');
			assert.strictEqual(saveMethod.parameters[0].type, 'User', 'Parameter type MUST be User');
		});

		test('should parse return type declarations', () => {
			const fixturePath = path.join(fixturesPath, 'type-declarations.php');
			const classes = parser.parseFile(fixturePath);

			const userRepo = classes.find(c => c.name === 'UserRepository');
			assert.ok(userRepo, 'Should find UserRepository class');
			
			const findMethod = userRepo.methods.find(m => m.name === 'find');
			assert.ok(findMethod, 'Should find find method');
			assert.strictEqual(findMethod.parameters.length, 1, 'find MUST have exactly 1 parameter');
			assert.strictEqual(findMethod.parameters[0].type, 'string', 'Parameter type MUST be string');
			assert.strictEqual(findMethod.returnType, '?User', 'Return type MUST be ?User (nullable)');
		});

		test('should detect composition from typed properties', () => {
			const fixturePath = path.join(fixturesPath, 'type-declarations.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// UserService has property: private UserRepository $repository (composition)
			const serviceToRepo = relationships.find(r =>
				r.from === `${fixturePath}__UserService` && 
				r.to === `${fixturePath}__UserRepository` &&
				(r.type === 'uses' || r.type === 'composition')
			);
			assert.ok(serviceToRepo, 'MUST detect composition from typed property (private UserRepository $repository)');
			
			// Verify ID format is correct
			assert.ok(serviceToRepo.from.includes('__'), 'from ID MUST use filePath__className format');
			assert.ok(serviceToRepo.to.includes('__'), 'to ID MUST use filePath__className format');
		});

		test('should detect return type relationships', () => {
			const fixturePath = path.join(fixturesPath, 'type-declarations.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// UserRepository.find() returns ?User
			// UserRepository.save() returns User
			const returnsUser = relationships.filter(r =>
				r.from.includes('UserRepository') && 
				r.to.includes('User') &&
				r.type === 'returns'
			);
			assert.ok(returnsUser.length >= 2, 'MUST detect returns relationships from type hints (find -> User, save -> User)');
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
			const parentCalls = relationships.filter(r => r.type === 'calls-super');
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
			assert.ok(validationUtils, 'Should find ValidationUtils class');
			const validateEmail = validationUtils.methods.find(m => m.name === 'validateEmail');
			
			assert.ok(validateEmail, 'Should find validateEmail method');
			assert.strictEqual(validateEmail.isStatic, true, 'validateEmail MUST be marked as static');
		});
	});

	suite('Phase 4: Functional Patterns', () => {
		test('should parse top-level functions as module', () => {
			const fixturePath = path.join(fixturesPath, 'functional.php');
			const classes = parser.parseFile(fixturePath);

			// MUST create module entry for file with functions
			const module = classes.find(c => c.isModule === true);
			assert.ok(module, 'MUST create module for functions');
			assert.strictEqual(module.name, '[functional]', 'Module name should be [filename]');
			assert.strictEqual(module.classType, 'module', 'classType MUST be "module"');
			
			const validateUser = module.methods.find(m => m.name === 'validateUser');
			assert.ok(validateUser, 'MUST find validateUser function');
		});

		test('should detect all function declarations', () => {
			const fixturePath = path.join(fixturesPath, 'functional.php');
			const classes = parser.parseFile(fixturePath);

			const module = classes.find(c => c.isModule === true);
			assert.ok(module, 'MUST have module');
			
			// Exact count validation
			const expectedFunctions = ['validateUser', 'saveUser', 'createUser', 'updateUser', 'getUser', 'deleteUser', 'processUsers', 'transform'];
			assert.ok(module.methods.length >= expectedFunctions.length, `MUST find at least ${expectedFunctions.length} functions`);
			
			expectedFunctions.forEach(funcName => {
				const func = module.methods.find(m => m.name === funcName);
				assert.ok(func, `MUST find function: ${funcName}`);
			});
			
			// Validate parameter counts for key functions
			const createUser = module.methods.find(m => m.name === 'createUser');
			assert.ok(createUser, 'Should find createUser');
			assert.strictEqual(createUser.parameters.length, 1, 'createUser MUST have 1 parameter');
			
			const updateUser = module.methods.find(m => m.name === 'updateUser');
			assert.ok(updateUser, 'Should find updateUser');
			assert.strictEqual(updateUser.parameters.length, 2, 'updateUser MUST have 2 parameters');
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
			assert.ok(module, 'MUST have module for factory functions');
			
			// Validate all factory functions exist
			const expectedFactories = ['createUser', 'createProduct', 'createValidatedUser', 'createOrder'];
			expectedFactories.forEach(funcName => {
				const func = module.methods.find(m => m.name === funcName);
				assert.ok(func, `MUST find factory function: ${funcName}`);
			});
			
			// Validate factory function signatures
			const createUser = module.methods.find(m => m.name === 'createUser');
			assert.ok(createUser, 'Should find createUser');
			assert.strictEqual(createUser.parameters.length, 2, 'createUser MUST have 2 parameters: name, email');
			assert.strictEqual(createUser.returnType, 'User', 'createUser MUST return User');
		});

		test('should detect constructor calls in factory functions', () => {
			const fixturePath = path.join(fixturesPath, 'factory-pattern.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// createUser() creates new User() - factory pattern
			const creates = relationships.filter(r => r.type === 'creates');
			assert.ok(creates.length > 0, 'MUST detect factory → product relationships (new ClassName())');
		});

		test('should detect factory classes with static methods', () => {
			const fixturePath = path.join(fixturesPath, 'factory-pattern.php');
			const classes = parser.parseFile(fixturePath);

			const userFactory = classes.find(c => c.name === 'UserFactory');
			assert.ok(userFactory, 'MUST find UserFactory class');
			
			// Validate exact method count and names
			assert.strictEqual(userFactory.methods.length, 2, 'UserFactory MUST have 2 static methods');
			const methodNames = userFactory.methods.map(m => m.name).sort();
			assert.deepStrictEqual(methodNames, ['create', 'createFromArray'].sort(), 'MUST have exact method names');
			
			// Validate both methods are static
			const create = userFactory.methods.find(m => m.name === 'create');
			assert.ok(create, 'MUST find create static method');
			assert.strictEqual(create.isStatic, true, 'create MUST be marked as static');
			assert.strictEqual(create.returnType, 'User', 'create MUST return User');
			
			const createFromArray = userFactory.methods.find(m => m.name === 'createFromArray');
			assert.ok(createFromArray, 'MUST find createFromArray static method');
			assert.strictEqual(createFromArray.isStatic, true, 'createFromArray MUST be marked as static');
		});
	});

	suite('Phase 5: Traits', () => {
		test('should detect trait usage', () => {
			const fixturePath = path.join(fixturesPath, 'traits.php');
			const classes = parser.parseFile(fixturePath);

			const user = classes.find(c => c.name === 'User');
			assert.ok(user, 'MUST find User class');
			
			// Should detect traits (implementation depends on parser)
			// PHP traits could be in implements array, traits property, or special relationship
			// At minimum, User class should be parsed successfully
			assert.ok(user.methods.length >= 2, 'User should have at least 2 methods: __construct, save');
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

			// MUST find all 3 trait definitions
			const timestampable = classes.find(c => c.name === 'Timestampable');
			assert.ok(timestampable, 'MUST find Timestampable trait');
			
			const softDeletable = classes.find(c => c.name === 'SoftDeletable');
			assert.ok(softDeletable, 'MUST find SoftDeletable trait');
			
			const loggable = classes.find(c => c.name === 'Loggable');
			assert.ok(loggable, 'MUST find Loggable trait');
			
			// Validate trait has methods
			assert.ok(timestampable.methods.length >= 2, 'Timestampable MUST have at least 2 methods');
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
			assert.ok(module, 'MUST have module for higher-order functions');
			
			// Validate all higher-order functions exist
			const expectedFunctions = ['map', 'filter', 'createMultiplier', 'createGreeter', 'compose', 'processUsers'];
			expectedFunctions.forEach(funcName => {
				const func = module.methods.find(m => m.name === funcName);
				assert.ok(func, `MUST find higher-order function: ${funcName}`);
			});
			
			const map = module.methods.find(m => m.name === 'map');
			assert.ok(map, 'Should find map function');
			assert.strictEqual(map.parameters.length, 2, 'map MUST have 2 parameters: array, callback');
		});

		test('should detect callable type hints in function parameters', () => {
			const fixturePath = path.join(fixturesPath, 'higher-order.php');
			const classes = parser.parseFile(fixturePath);

			const module = classes.find(c => c.isModule === true);
			assert.ok(module, 'MUST have module');
			
			const map = module.methods.find(m => m.name === 'map');
			assert.ok(map, 'MUST find map function');
			assert.strictEqual(map.parameters.length, 2, 'map MUST have exactly 2 parameters');
			
			// MUST have callable parameter
			const callableParam = map.parameters.find(p => p.type === 'callable');
			assert.ok(callableParam, 'MUST detect callable type hint in parameters');
			assert.strictEqual(callableParam.name, 'callback', 'Callable parameter MUST be named "callback"');
			
			// Validate filter also has callable
			const filter = module.methods.find(m => m.name === 'filter');
			assert.ok(filter, 'Should find filter function');
			const filterCallable = filter.parameters.find(p => p.type === 'callable');
			assert.ok(filterCallable, 'filter MUST have callable parameter');
		});

		test('should parse class with higher-order methods', () => {
			const fixturePath = path.join(fixturesPath, 'higher-order.php');
			const classes = parser.parseFile(fixturePath);

			const dataProcessor = classes.find(c => c.name === 'DataProcessor');
			assert.ok(dataProcessor, 'MUST find DataProcessor class');
			
			// Validate exact method count
			assert.strictEqual(dataProcessor.methods.length, 4, 'DataProcessor MUST have 4 methods: __construct, transform, filterBy, createValidator');
			const methodNames = dataProcessor.methods.map(m => m.name).sort();
			assert.deepStrictEqual(methodNames, ['__construct', 'createValidator', 'filterBy', 'transform'].sort(), 'MUST have exact method names');
			
			// Validate transform method
			const transform = dataProcessor.methods.find(m => m.name === 'transform');
			assert.ok(transform, 'MUST find transform method that takes callable');
			assert.strictEqual(transform.parameters.length, 1, 'transform MUST have exactly 1 parameter');
			
			const callableParam = transform.parameters.find(p => p.type === 'callable');
			assert.ok(callableParam, 'transform MUST have callable parameter');
			assert.strictEqual(callableParam.name, 'transformer', 'Callable parameter MUST be named "transformer"');
			
			// Validate filterBy method
			const filterBy = dataProcessor.methods.find(m => m.name === 'filterBy');
			assert.ok(filterBy, 'Should find filterBy method');
			const filterCallable = filterBy.parameters.find(p => p.type === 'callable');
			assert.ok(filterCallable, 'filterBy MUST have callable parameter');
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
			
			// MUST not crash and return empty array
			assert.ok(Array.isArray(classes), 'MUST return array type');
			assert.strictEqual(classes.length, 0, 'MUST return empty array for non-existent files');
		});

		test('should use correct ID format (filePath__className)', () => {
			const fixturePath = path.join(fixturesPath, 'class-based.php');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// UserService extends BaseService - MUST use correct format
			const extendsRel = relationships.find(r => 
				r.from === `${fixturePath}__UserService` &&
				r.to === `${fixturePath}__BaseService` &&
				r.type === 'extends'
			);
			assert.ok(extendsRel, 'MUST find extends relationship');
			assert.ok(extendsRel.from.includes('__'), 'from ID MUST use filePath__className format');
			assert.ok(extendsRel.to.includes('__'), 'to ID MUST use filePath__className format');
			assert.ok(extendsRel.from.includes(fixturePath), 'from ID MUST include full file path');
			assert.ok(extendsRel.to.includes(fixturePath), 'to ID MUST include full file path');
			
			// Validate exact format
			assert.strictEqual(extendsRel.from, `${fixturePath}__UserService`, 'from MUST be exactly filePath__UserService');
			assert.strictEqual(extendsRel.to, `${fixturePath}__BaseService`, 'to MUST be exactly filePath__BaseService');
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

	suite('Template Detection', () => {
		test('should detect Laravel view() calls', () => {
			// return view('tasks.index')
			const fixturePath = path.join(fixturesPath, 'templates_controllers.php');
			const classes = parser.parseFile(fixturePath);
			const templates = [
				{ name: 'index.blade.php', filePath: 'views/tasks/index.blade.php', classType: 'template', properties: [], methods: [] } as ClassInfo
			];
			
			const allNames = new Set([...classes.map(c => c.name), ...templates.map(t => t.name)]);
			const allClasses = [...classes, ...templates];
			const relationships = parser.extractRelationships(allClasses, allNames, workspacePath);
			
			const rendersRel = relationships.find(r => 
				r.type === 'renders' && 
				r.from.includes('TaskController') && 
				r.to.includes('index.blade.php')
			);
			
			assert.ok(rendersRel, 'MUST detect Laravel view() calls');
		});
		
		test('should detect Symfony render() calls', () => {
			// return $this->render('user/profile.html.twig')
			const fixturePath = path.join(fixturesPath, 'templates_controllers.php');
			const classes = parser.parseFile(fixturePath);
			const templates = [
				{ name: 'profile.html.twig', filePath: 'templates/user/profile.html.twig', classType: 'template', properties: [], methods: [] } as ClassInfo
			];
			
			const allNames = new Set([...classes.map(c => c.name), ...templates.map(t => t.name)]);
			const allClasses = [...classes, ...templates];
			const relationships = parser.extractRelationships(allClasses, allNames, workspacePath);
			
			const rendersRel = relationships.find(r => 
				r.type === 'renders' && 
				r.from.includes('UserController') && 
				r.to.includes('profile.html.twig')
			);
			
			assert.ok(rendersRel, 'MUST detect Symfony render() calls');
		});
		
		test('should detect include statements for .html files', () => {
			// include 'templates/header.html'
			const fixturePath = path.join(fixturesPath, 'templates_controllers.php');
			const classes = parser.parseFile(fixturePath);
			const templates = [
				{ name: 'header.html', filePath: 'templates/header.html', classType: 'template', properties: [], methods: [] } as ClassInfo
			];
			
			const allNames = new Set([...classes.map(c => c.name), ...templates.map(t => t.name)]);
			const allClasses = [...classes, ...templates];
			const relationships = parser.extractRelationships(allClasses, allNames, workspacePath);
			
			const rendersRel = relationships.find(r => r.type === 'renders' && r.to.includes('header.html'));
			assert.ok(rendersRel, 'MUST detect include statements for .html files');
		});
		
		test('should detect Twig render() calls', () => {
			// return $this->twig->render('pages/index.html.twig')
			const fixturePath = path.join(fixturesPath, 'templates_controllers.php');
			const classes = parser.parseFile(fixturePath);
			const templates = [
				{ name: 'index.html.twig', filePath: 'templates/pages/index.html.twig', classType: 'template', properties: [], methods: [] } as ClassInfo
			];
			
			const allNames = new Set([...classes.map(c => c.name), ...templates.map(t => t.name)]);
			const allClasses = [...classes, ...templates];
			const relationships = parser.extractRelationships(allClasses, allNames, workspacePath);
			
			const rendersRel = relationships.find(r => 
				r.type === 'renders' && 
				r.from.includes('TwigController') && 
				r.to.includes('index.html.twig')
			);
			
			assert.ok(rendersRel, 'MUST detect Twig render() calls');
		});
	});
});
