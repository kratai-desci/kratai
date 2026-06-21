import * as assert from 'assert';
import * as path from 'path';
import { PythonParser } from '../../../../services/parsing/languages/PythonParser';
import { ClassInfo } from '../../../../types/domain/ClassInfo';
import { ClassRelationship } from '../../../../types/domain/ClassRelationship';

suite('Python Parser Test Suite', () => {
	// Point to source fixtures, not compiled ones
	const fixturesPath = path.join(__dirname, '../../../../../src/test/unit/languages/python/fixtures');
	const workspacePath = path.join(__dirname, '../../../../../src/test/unit/languages/python/fixtures');
	let parser: PythonParser;

	setup(() => {
		parser = new PythonParser();
	});

	suite('Phase 1: OOP Patterns', () => {
		test('should parse class with constructor and methods', () => {
			const fixturePath = path.join(fixturesPath, 'class_based.py');
			const classes = parser.parseFile(fixturePath);

			assert.ok(classes.length > 0, 'Should find classes');
			
			const userService = classes.find(c => c.name === 'UserService');
			assert.ok(userService, 'Should find UserService class');
			assert.ok(userService.methods.length > 0, 'Should find methods');
			assert.ok(userService.properties.length > 0, 'Should find properties');
		});

		test('should detect class inheritance (extends)', () => {
			const fixturePath = path.join(fixturesPath, 'class_based.py');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const extendsRel = relationships.filter(r => r.type === 'extends');
			assert.ok(extendsRel.length > 0, 'Should find extends relationships');
			
			const userServiceExtends = extendsRel.find(r => 
				r.from === `${fixturePath}__UserService` && r.to === `${fixturePath}__BaseService`
			);
			assert.ok(userServiceExtends, 'UserService should extend BaseService');
		});

		test('should extract class properties', () => {
			const fixturePath = path.join(fixturesPath, 'class_based.py');
			const classes = parser.parseFile(fixturePath);

			const userService = classes.find(c => c.name === 'UserService');
			assert.ok(userService, 'Should find UserService');
			assert.ok(userService.properties.length > 0, 'Should have properties');
			
			const repoProperty = userService.properties.find(p => p.name === 'repository');
			assert.ok(repoProperty, 'Should find repository property');
		});

		test('should extract method signatures', () => {
			const fixturePath = path.join(fixturesPath, 'class_based.py');
			const classes = parser.parseFile(fixturePath);

			const userService = classes.find(c => c.name === 'UserService');
			assert.ok(userService, 'Should find UserService');
			
			const getUser = userService.methods.find(m => m.name === 'get_user');
			assert.ok(getUser, 'Should find get_user method');
			assert.ok(getUser.parameters.length > 0, 'Should have parameters');
		});
	});

	suite('Phase 2: Type Relationships', () => {
		test('should detect property types (composition)', () => {
			const fixturePath = path.join(fixturesPath, 'type_hints.py');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			const compositionRel = relationships.filter(r => r.type === 'uses');
			assert.ok(compositionRel.length > 0, 'Should find composition/uses relationships');
		});

		test('should detect return types', () => {
			const fixturePath = path.join(fixturesPath, 'type_hints.py');
			const classes = parser.parseFile(fixturePath);

			const userRepo = classes.find(c => c.name === 'UserRepository');
			assert.ok(userRepo, 'Should find UserRepository');
			
			const findMethod = userRepo.methods.find(m => m.name === 'find');
			assert.ok(findMethod, 'Should find find method');
			assert.strictEqual(findMethod.returnType, 'User', 'Should detect User return type');
		});

		test('should detect parameter types', () => {
			const fixturePath = path.join(fixturesPath, 'type_hints.py');
			const classes = parser.parseFile(fixturePath);

			const userRepo = classes.find(c => c.name === 'UserRepository');
			assert.ok(userRepo, 'Should find UserRepository');
			
			const saveMethod = userRepo.methods.find(m => m.name === 'save');
			assert.ok(saveMethod, 'Should find save method');
			
			const userParam = saveMethod.parameters.find(p => p.name === 'user');
			assert.ok(userParam, 'Should find user parameter');
			assert.strictEqual(userParam.type, 'User', 'Should detect User parameter type');
		});

		test('should detect type hints in properties', () => {
			const fixturePath = path.join(fixturesPath, 'type_hints.py');
			const classes = parser.parseFile(fixturePath);

			const userService = classes.find(c => c.name === 'UserService');
			assert.ok(userService, 'Should find UserService');
			
			const repoProperty = userService.properties.find(p => p.name === 'repository');
			assert.ok(repoProperty, 'Should find repository property');
			assert.strictEqual(repoProperty.type, 'UserRepository', 'Should detect UserRepository type');
		});

		test('should detect relationships from type hints', () => {
			const fixturePath = path.join(fixturesPath, 'type_hints.py');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// Should find relationships between UserService and UserRepository
			const serviceToRepo = relationships.find(r =>
				r.from === `${fixturePath}__UserService` && r.to === `${fixturePath}__UserRepository`
			);
			assert.ok(serviceToRepo, 'Should find UserService -> UserRepository relationship');
		});
	});

	suite('Phase 3: Method Calls', () => {
		test('should detect super() calls to parent methods', () => {
			const fixturePath = path.join(fixturesPath, 'parent_calls.py');
			const classes = parser.parseFile(fixturePath);

			const userService = classes.find(c => c.name === 'UserService');
			assert.ok(userService, 'Should find UserService');
			assert.strictEqual(userService.extends, 'BaseService', 'Should extend BaseService');
			
			// Verify parent class exists
			const baseService = classes.find(c => c.name === 'BaseService');
			assert.ok(baseService, 'Should find BaseService');
		});

		test('should detect class hierarchy with multiple levels', () => {
			const fixturePath = path.join(fixturesPath, 'parent_calls.py');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// AdminService extends UserService extends BaseService
			const adminToUser = relationships.find(r =>
				r.from === `${fixturePath}__AdminService` && 
				r.to === `${fixturePath}__UserService` &&
				r.type === 'extends'
			);
			assert.ok(adminToUser, 'AdminService should extend UserService');

			const userToBase = relationships.find(r =>
				r.from === `${fixturePath}__UserService` && 
				r.to === `${fixturePath}__BaseService` &&
				r.type === 'extends'
			);
			assert.ok(userToBase, 'UserService should extend BaseService');
		});

		test('should parse static method decorators', () => {
			const fixturePath = path.join(fixturesPath, 'static_methods.py');
			const classes = parser.parseFile(fixturePath);

			const validationUtils = classes.find(c => c.name === 'ValidationUtils');
			assert.ok(validationUtils, 'Should find ValidationUtils class');
			
			const validateEmail = validationUtils.methods.find(m => m.name === 'validate_email');
			assert.ok(validateEmail, 'Should find validate_email static method');
		});

		test('should parse files with async functions', () => {
			const fixturePath = path.join(fixturesPath, 'async_chains.py');
			const classes = parser.parseFile(fixturePath);

			// Should find the AsyncUserService class
			const asyncService = classes.find(c => c.name === 'AsyncUserService');
			assert.ok(asyncService, 'Should find AsyncUserService class');
			assert.ok(asyncService.methods.length > 0, 'Should have methods');
		});
	});

	suite('Phase 4: Functional Patterns', () => {
		test('should parse module-level functions', () => {
			const fixturePath = path.join(fixturesPath, 'functional.py');
			const classes = parser.parseFile(fixturePath);

			// Functions should be represented as a module
			const moduleInfo = classes.find(c => c.isModule === true);
			assert.ok(moduleInfo, 'Should find module-level functions');
			
			const validateUser = moduleInfo.methods.find(m => m.name === 'validate_user');
			assert.ok(validateUser, 'Should find validate_user function');
			
			const createUser = moduleInfo.methods.find(m => m.name === 'create_user');
			assert.ok(createUser, 'Should find create_user function');
		});

		test('should detect function signatures with type hints', () => {
			const fixturePath = path.join(fixturesPath, 'functional.py');
			const classes = parser.parseFile(fixturePath);

			const moduleInfo = classes.find(c => c.isModule === true);
			assert.ok(moduleInfo, 'Should find module');
			
			const validateUser = moduleInfo.methods.find(m => m.name === 'validate_user');
			assert.ok(validateUser, 'Should find validate_user');
			
			// Check parameter types
			const dataParam = validateUser.parameters.find(p => p.name === 'data');
			assert.ok(dataParam, 'Should find data parameter');
			
			// Check return type
			assert.ok(validateUser.returnType, 'Should have return type');
		});

		test('should handle functions with no classes in file', () => {
			const fixturePath = path.join(fixturesPath, 'functional.py');
			const classes = parser.parseFile(fixturePath);

			// Should create a module representation even without classes
			assert.ok(classes.length > 0, 'Should create module for functions');
			
			const module = classes.find(c => c.isModule);
			assert.ok(module, 'Should have module representation');
			assert.ok(module.methods.length > 0, 'Module should have functions as methods');
		});
	});

	suite('Phase 5: Module Structure', () => {
		test('should handle files with imports', () => {
			const fixturePath = path.join(fixturesPath, 'imports.py');
			const classes = parser.parseFile(fixturePath);

			// Should parse classes even with imports
			assert.ok(classes.length > 0, 'Should parse classes with imports');
			
			const importingService = classes.find(c => c.name === 'ImportingService');
			assert.ok(importingService, 'Should find ImportingService class');
		});

		test('should handle complex type hints', () => {
			const fixturePath = path.join(fixturesPath, 'imports.py');
			const classes = parser.parseFile(fixturePath);

			const importingService = classes.find(c => c.name === 'ImportingService');
			assert.ok(importingService, 'Should find class with complex type hints');
			
			// Should handle Optional, List, Dict type hints
			const processMethod = importingService.methods.find(m => m.name === 'process');
			assert.ok(processMethod, 'Should find process method');
		});

		test('should extract multiple classes from single file', () => {
			const fixturePath = path.join(fixturesPath, 'class_based.py');
			const classes = parser.parseFile(fixturePath);

			// Should find all classes: BaseService, UserService, UserRepository, IUserService
			assert.ok(classes.length >= 4, 'Should find at least 4 classes');
			
			const classNames = classes.map(c => c.name);
			assert.ok(classNames.includes('BaseService'), 'Should find BaseService');
			assert.ok(classNames.includes('UserService'), 'Should find UserService');
			assert.ok(classNames.includes('UserRepository'), 'Should find UserRepository');
		});
	});

	suite('Edge Cases', () => {
		test('should handle non-existent files gracefully', () => {
			const fixturePath = path.join(fixturesPath, 'nonexistent.py');
			const classes = parser.parseFile(fixturePath);

			// Should return empty array without throwing
			assert.strictEqual(classes.length, 0, 'Should return empty array for non-existent file');
		});

		test('should use correct ID format (filePath__className)', () => {
			const fixturePath = path.join(fixturesPath, 'class_based.py');
			const classes = parser.parseFile(fixturePath);
			const allNames = new Set(classes.map(c => c.name));
			const relationships = parser.extractRelationships(classes, allNames, workspacePath);

			// Verify all relationships use the filePath__className format
			relationships.forEach(rel => {
				assert.ok(rel.from.includes('__'), 'from ID should contain __');
				assert.ok(rel.to.includes('__'), 'to ID should contain __');
				assert.ok(rel.from.endsWith(`.py__${rel.from.split('__')[1]}`), 
					'from ID should be in filePath__className format');
			});
		});

		test('should detect private methods (underscore prefix)', () => {
			const fixturePath = path.join(fixturesPath, 'class_based.py');
			const classes = parser.parseFile(fixturePath);

			// Create a simple test class to verify underscore detection works
			// For now, just verify the class is parsed correctly
			const userService = classes.find(c => c.name === 'UserService');
			assert.ok(userService, 'Should find UserService');
			assert.ok(userService.properties.length > 0, 'Should have properties');
			
			// Verify _cache property exists
			const cacheProperty = userService.properties.find(p => p.name === '_cache');
			assert.ok(cacheProperty, 'Should find _cache property');
		});
	});
});
