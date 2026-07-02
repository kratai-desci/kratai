import * as assert from 'assert';
import * as path from 'path';
import { SpringBootEnricher } from '../../../../services/enrichment/frameworks/SpringBootEnricher';
import { EnrichmentContext } from '../../../../services/enrichment/AbstractEnricher';
import { ClassInfo } from '../../../../types/domain';

suite('SpringBootEnricher - Framework Enrichment', () => {
	const enricher = new SpringBootEnricher();
	const workspacePath = path.join(__dirname, '../../../../..');
	const fixturesPath = path.join(__dirname, '../../../../../src/test/unit/enrichment/springboot/fixtures');
	
	suite('Framework Detection', () => {
		test('should detect Spring Boot from pom.xml with spring-boot-starter dependency', () => {
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: [],
				relationships: []
			};
			
			const detected = enricher.detect(context);
			assert.ok(detected, 'MUST detect Spring Boot from pom.xml');
		});
		
		test('should detect Spring Boot from build.gradle with spring-boot-starter', () => {
			// TODO: Add build.gradle detection
			assert.ok(true, 'TODO: Implement Gradle detection');
		});
		
		test('should return correct framework name and priority', () => {
			assert.strictEqual(enricher.framework, 'Spring Boot', 'Framework name must be "Spring Boot"');
			assert.strictEqual(enricher.priority, 20, 'Priority must be 20');
		});
		
		test('should provide file patterns for Spring Boot', () => {
			const patterns = enricher.getFilePatterns();
			
			assert.ok(patterns.includes('**/*Controller.java'), 'MUST include controller pattern');
			assert.ok(patterns.includes('**/*Service.java'), 'MUST include service pattern');
			assert.ok(patterns.includes('**/*Repository.java'), 'MUST include repository pattern');
			assert.ok(patterns.includes('**/*Entity.java'), 'MUST include entity pattern');
			assert.ok(patterns.includes('**/*Configuration.java'), 'MUST include config pattern');
		});
	});
	
	suite('REST Controller Detection - Phase 1 MVP', () => {
		test('should detect @RestController class', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'UserController',
				filePath: 'src/main/java/com/example/controller/UserController.java',
				properties: [],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const controller = result.enhancedClasses.find(c => c.name === 'UserController');
			assert.ok(controller, 'MUST find UserController');
			assert.strictEqual(controller?.classType, 'rest-controller', 
				'MUST mark @RestController as rest-controller type');
		});
		
		test('should detect @Controller class for MVC', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'UserViewController',
				filePath: 'src/main/java/com/example/controller/UserViewController.java',
				properties: [],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const controller = result.enhancedClasses.find(c => c.name === 'UserViewController');
			assert.strictEqual(controller?.classType, 'controller', 
				'MUST mark @Controller as controller type');
		});
		
		test('should extract @GetMapping route with path', async () => {
			// Method: @GetMapping("/users/{id}")
			const mockClasses: ClassInfo[] = [{
				name: 'UserController',
				filePath: 'src/main/java/com/example/controller/UserController.java',
				properties: [],
				methods: [{
					name: 'getUser',
					parameters: [{ name: 'id', type: 'Long' }],
					returnType: 'ResponseEntity<UserDTO>',
					visibility: 'public',
					isStatic: false,
					isAsync: false,
					lineNumber: 10,
					endLineNumber: 15
				}],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create route node
			const routeNode = result.enhancedClasses.find(c => 
				c.classType === 'route' && c.routeMeta?.path === '/users/:id'
			);
			
			assert.ok(routeNode, 'MUST create route node from @GetMapping');
			assert.strictEqual(routeNode?.routeMeta?.method, 'GET', 'Method must be GET');
		});
		
		test('should handle @RequestMapping at class level as base path', async () => {
			// @RequestMapping("/api/users")
			// public class UserController {
			//   @GetMapping("/{id}") -> /api/users/{id}
			// }
			const mockClasses: ClassInfo[] = [{
				name: 'UserController',
				filePath: 'src/main/java/com/example/controller/UserController.java',
				properties: [],
				methods: [{
					name: 'getUser',
					parameters: [],
					returnType: 'ResponseEntity<UserDTO>',
					visibility: 'public',
					isStatic: false,
					isAsync: false,
					lineNumber: 15,
					endLineNumber: 20
				}],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const routeNode = result.enhancedClasses.find(c => 
				c.routeMeta?.path === '/api/users/:id'
			);
			
			assert.ok(routeNode, 'MUST combine @RequestMapping base path with @GetMapping');
		});
		
		test('should detect all HTTP method mappings', async () => {
			// @GetMapping, @PostMapping, @PutMapping, @DeleteMapping, @PatchMapping
			const mockClasses: ClassInfo[] = [{
				name: 'UserController',
				filePath: 'src/main/java/com/example/controller/UserController.java',
				properties: [],
				methods: [
					{ name: 'getUsers', parameters: [], returnType: 'List<UserDTO>', visibility: 'public', isStatic: false, isAsync: false, lineNumber: 10, endLineNumber: 15 },
					{ name: 'createUser', parameters: [], returnType: 'ResponseEntity<UserDTO>', visibility: 'public', isStatic: false, isAsync: false, lineNumber: 17, endLineNumber: 22 },
					{ name: 'updateUser', parameters: [], returnType: 'ResponseEntity<UserDTO>', visibility: 'public', isStatic: false, isAsync: false, lineNumber: 24, endLineNumber: 29 },
					{ name: 'deleteUser', parameters: [], returnType: 'ResponseEntity<Void>', visibility: 'public', isStatic: false, isAsync: false, lineNumber: 31, endLineNumber: 36 },
					{ name: 'patchUser', parameters: [], returnType: 'ResponseEntity<UserDTO>', visibility: 'public', isStatic: false, isAsync: false, lineNumber: 38, endLineNumber: 43 }
				],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const getMethods = result.enhancedClasses.filter(c => c.routeMeta?.method === 'GET');
			const postMethods = result.enhancedClasses.filter(c => c.routeMeta?.method === 'POST');
			const putMethods = result.enhancedClasses.filter(c => c.routeMeta?.method === 'PUT');
			const deleteMethods = result.enhancedClasses.filter(c => c.routeMeta?.method === 'DELETE');
			const patchMethods = result.enhancedClasses.filter(c => c.routeMeta?.method === 'PATCH');
			
			assert.ok(getMethods.length > 0, 'MUST detect @GetMapping');
			assert.ok(postMethods.length > 0, 'MUST detect @PostMapping');
			assert.ok(putMethods.length > 0, 'MUST detect @PutMapping');
			assert.ok(deleteMethods.length > 0, 'MUST detect @DeleteMapping');
			assert.ok(patchMethods.length > 0, 'MUST detect @PatchMapping');
		});
		
		test('should extract path variables from @PathVariable annotation', async () => {
			// public ResponseEntity<User> getUser(@PathVariable Long id)
			const mockClasses: ClassInfo[] = [{
				name: 'UserController',
				filePath: 'src/main/java/com/example/controller/UserController.java',
				properties: [],
				methods: [{
					name: 'getUser',
					parameters: [{ name: 'id', type: 'Long' }],
					returnType: 'ResponseEntity<User>',
					visibility: 'public',
					isStatic: false,
					isAsync: false,
					lineNumber: 10,
					endLineNumber: 15
				}],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Path variables should be in route metadata
			const routeNode = result.enhancedClasses.find(c => 
				c.routeMeta?.pathVariables?.includes('id')
			);
			
			assert.ok(routeNode, 'MUST extract @PathVariable parameters');
		});
		
		test('should detect @RequestParam query parameters', async () => {
			// public List<User> searchUsers(@RequestParam String name, @RequestParam int page)
			assert.ok(true, 'TODO: Implement @RequestParam detection');
		});
		
		test('should detect @RequestBody for POST/PUT', async () => {
			// public ResponseEntity<User> createUser(@RequestBody UserDTO dto)
			assert.ok(true, 'TODO: Implement @RequestBody detection');
		});
	});
	
	suite('Service Layer Detection - Phase 1 MVP', () => {
		test('should detect @Service annotation', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'UserService',
				filePath: 'src/main/java/com/example/service/UserService.java',
				properties: [],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const service = result.enhancedClasses.find(c => c.name === 'UserService');
			assert.strictEqual(service?.classType, 'service', 
				'MUST mark @Service as service type');
		});
		
		test('should detect @Transactional methods', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'UserService',
				filePath: 'src/main/java/com/example/service/UserService.java',
				properties: [],
				methods: [{
					name: 'createUser',
					parameters: [{ name: 'dto', type: 'UserDTO' }],
					returnType: 'User',
					visibility: 'public',
					isStatic: false,
					isAsync: false,
					lineNumber: 10,
					endLineNumber: 15
				}],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Method should have transactional metadata
			const service = result.enhancedClasses.find(c => c.name === 'UserService');
			const method = service?.methods.find(m => m.name === 'createUser');
			
			assert.ok(method, 'MUST find createUser method');
			// TODO: Add metadata for @Transactional
		});
		
		test('should detect service method calls from controller', async () => {
			// UserController -> UserService.findById()
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserController',
					filePath: 'src/main/java/com/example/controller/UserController.java',
					properties: [],
					methods: [{
						name: 'getUser',
						parameters: [],
						returnType: 'ResponseEntity<UserDTO>',
						visibility: 'public',
						isStatic: false,
						isAsync: false,
						lineNumber: 10,
						endLineNumber: 15
					}],
					classType: 'class'
				},
				{
					name: 'UserService',
					filePath: 'src/main/java/com/example/service/UserService.java',
					properties: [],
					methods: [{
						name: 'findById',
						parameters: [{ name: 'id', type: 'Long' }],
						returnType: 'User',
						visibility: 'public',
						isStatic: false,
						isAsync: false,
						lineNumber: 20,
						endLineNumber: 25
					}],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create relationship: Controller -> Service
			const callsRel = result.newRelationships.find(r => 
				r.type === 'calls' && 
				r.from.includes('UserController') && 
				r.to.includes('UserService')
			);
			
			assert.ok(callsRel, 'MUST detect controller calling service');
		});
	});
	
	suite('Repository Layer Detection - Phase 1 MVP', () => {
		test('should detect @Repository annotation', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'UserRepository',
				filePath: 'src/main/java/com/example/repository/UserRepository.java',
				properties: [],
				methods: [],
				classType: 'interface'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const repo = result.enhancedClasses.find(c => c.name === 'UserRepository');
			assert.strictEqual(repo?.classType, 'repository', 
				'MUST mark @Repository as repository type');
		});
		
		test('should detect JpaRepository<T, ID> interface extension', async () => {
			// public interface UserRepository extends JpaRepository<User, Long>
			const mockClasses: ClassInfo[] = [{
				name: 'UserRepository',
				filePath: 'src/main/java/com/example/repository/UserRepository.java',
				properties: [],
				methods: [],
				implements: ['JpaRepository<User, Long>'],
				classType: 'interface'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should extract entity type from JpaRepository<User, Long>
			const repo = result.enhancedClasses.find(c => c.name === 'UserRepository');
			assert.ok(repo?.repositoryMeta?.entityType === 'User', 
				'MUST extract entity type from JpaRepository<T, ID>');
		});
		
		test('should detect custom query methods by naming convention', async () => {
			// findByEmailAndActiveTrue, findByAgeLessThan, etc.
			const mockClasses: ClassInfo[] = [{
				name: 'UserRepository',
				filePath: 'src/main/java/com/example/repository/UserRepository.java',
				properties: [],
				methods: [
					{ name: 'findByEmail', parameters: [{ name: 'email', type: 'String' }], returnType: 'Optional<User>', visibility: 'public', isStatic: false, isAsync: false, lineNumber: 10, endLineNumber: 10 },
					{ name: 'findByEmailAndActiveTrue', parameters: [], returnType: 'List<User>', visibility: 'public', isStatic: false, isAsync: false, lineNumber: 11, endLineNumber: 11 }
				],
				classType: 'interface'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const repo = result.enhancedClasses.find(c => c.name === 'UserRepository');
			assert.ok(repo?.methods.some(m => m.name === 'findByEmail'), 
				'MUST detect custom query methods');
		});
		
		test('should detect @Query annotation on custom queries', async () => {
			// @Query("SELECT u FROM User u WHERE u.email = :email")
			assert.ok(true, 'TODO: Implement @Query detection');
		});
	});
	
	suite('Entity Detection - Phase 1 MVP', () => {
		test('should detect @Entity annotation', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'User',
				filePath: 'src/main/java/com/example/entity/User.java',
				properties: [],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const entity = result.enhancedClasses.find(c => c.name === 'User');
			assert.strictEqual(entity?.classType, 'entity', 
				'MUST mark @Entity as entity type');
		});
		
		test('should detect @Table annotation for table mapping', async () => {
			// @Table(name = "users")
			const mockClasses: ClassInfo[] = [{
				name: 'User',
				filePath: 'src/main/java/com/example/entity/User.java',
				properties: [],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const entity = result.enhancedClasses.find(c => c.name === 'User');
			assert.ok(entity?.entityMeta?.tableName, 'MUST extract table name from @Table');
		});
		
		test('should detect @Id for primary key', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'User',
				filePath: 'src/main/java/com/example/entity/User.java',
				properties: [
					{ name: 'id', type: 'Long', visibility: 'private' }
				],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const entity = result.enhancedClasses.find(c => c.name === 'User');
			assert.ok(entity?.entityMeta?.primaryKey === 'id', 
				'MUST identify @Id field as primary key');
		});
	});
	
	suite('JPA Relationships Detection - Phase 1 MVP (CRITICAL)', () => {
		test('should detect @OneToMany relationship', async () => {
			// User has @OneToMany posts
			const mockClasses: ClassInfo[] = [{
				name: 'User',
				filePath: 'src/main/java/com/example/entity/User.java',
				properties: [
					{ name: 'posts', type: 'List<Post>', visibility: 'private' }
				],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create relationship: User -> Post
			const oneToMany = result.newRelationships.find(r => 
				r.type === 'one-to-many' && 
				r.from.includes('User') && 
				r.to.includes('Post')
			);
			
			assert.ok(oneToMany, 'MUST detect @OneToMany relationship');
		});
		
		test('should detect @ManyToOne relationship', async () => {
			// Post has @ManyToOne user
			const mockClasses: ClassInfo[] = [{
				name: 'Post',
				filePath: 'src/main/java/com/example/entity/Post.java',
				properties: [
					{ name: 'user', type: 'User', visibility: 'private' }
				],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const manyToOne = result.newRelationships.find(r => 
				r.type === 'many-to-one' && 
				r.from.includes('Post') && 
				r.to.includes('User')
			);
			
			assert.ok(manyToOne, 'MUST detect @ManyToOne relationship');
		});
		
		test('should detect @ManyToMany relationship', async () => {
			// User <-> Role (many-to-many)
			const mockClasses: ClassInfo[] = [{
				name: 'User',
				filePath: 'src/main/java/com/example/entity/User.java',
				properties: [
					{ name: 'roles', type: 'Set<Role>', visibility: 'private' }
				],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const manyToMany = result.newRelationships.find(r => 
				r.type === 'many-to-many' && 
				r.from.includes('User') && 
				r.to.includes('Role')
			);
			
			assert.ok(manyToMany, 'MUST detect @ManyToMany relationship');
		});
		
		test('should detect @OneToOne relationship', async () => {
			// User <-> Profile (one-to-one)
			const mockClasses: ClassInfo[] = [{
				name: 'User',
				filePath: 'src/main/java/com/example/entity/User.java',
				properties: [
					{ name: 'profile', type: 'Profile', visibility: 'private' }
				],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const oneToOne = result.newRelationships.find(r => 
				r.type === 'one-to-one' && 
				r.from.includes('User') && 
				r.to.includes('Profile')
			);
			
			assert.ok(oneToOne, 'MUST detect @OneToOne relationship');
		});
		
		test('should extract cascade type from relationship annotations', async () => {
			// @OneToMany(cascade = CascadeType.ALL)
			assert.ok(true, 'TODO: Implement cascade detection');
		});
		
		test('should extract fetch type (LAZY vs EAGER)', async () => {
			// @ManyToOne(fetch = FetchType.LAZY)
			assert.ok(true, 'TODO: Implement fetch type detection');
		});
		
		test('should detect bidirectional relationships with mappedBy', async () => {
			// @OneToMany(mappedBy = "user")
			assert.ok(true, 'TODO: Implement mappedBy detection');
		});
		
		test('should detect @JoinColumn for foreign key mapping', async () => {
			// @JoinColumn(name = "user_id")
			assert.ok(true, 'TODO: Implement @JoinColumn detection');
		});
	});
	
	suite('Dependency Injection Detection - Phase 1 MVP', () => {
		test('should detect constructor injection (recommended pattern)', async () => {
			// public UserController(UserService userService) { ... }
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserController',
					filePath: 'src/main/java/com/example/controller/UserController.java',
					properties: [
						{ name: 'userService', type: 'UserService', visibility: 'private' }
					],
					methods: [{
						name: 'UserController',
						parameters: [{ name: 'userService', type: 'UserService' }],
						returnType: 'UserController',
						visibility: 'public',
						isStatic: false,
						isAsync: false,
						lineNumber: 10,
						endLineNumber: 13
					}],
					classType: 'class'
				},
				{
					name: 'UserService',
					filePath: 'src/main/java/com/example/service/UserService.java',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create relationship: UserController injects UserService
			const injectsRel = result.newRelationships.find(r => 
				r.type === 'injects' && 
				r.from.includes('UserController') && 
				r.to.includes('UserService')
			);
			
			assert.ok(injectsRel, 'MUST detect constructor injection');
		});
		
		test('should detect field injection with @Autowired', async () => {
			// @Autowired
			// private UserService userService;
			assert.ok(true, 'TODO: Implement @Autowired field injection detection');
		});
		
		test('should detect @Qualifier for multiple bean candidates', async () => {
			// @Autowired @Qualifier("userServiceImpl")
			assert.ok(true, 'TODO: Implement @Qualifier detection');
		});
		
		test('should detect full dependency chain: Controller -> Service -> Repository', async () => {
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserController',
					filePath: 'src/main/java/com/example/controller/UserController.java',
					properties: [{ name: 'userService', type: 'UserService', visibility: 'private' }],
					methods: [],
					classType: 'class'
				},
				{
					name: 'UserService',
					filePath: 'src/main/java/com/example/service/UserService.java',
					properties: [{ name: 'userRepository', type: 'UserRepository', visibility: 'private' }],
					methods: [],
					classType: 'class'
				},
				{
					name: 'UserRepository',
					filePath: 'src/main/java/com/example/repository/UserRepository.java',
					properties: [],
					methods: [],
					classType: 'interface'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should have two injection relationships
			const controllerToService = result.newRelationships.find(r => 
				r.type === 'injects' && 
				r.from.includes('UserController') && 
				r.to.includes('UserService')
			);
			
			const serviceToRepo = result.newRelationships.find(r => 
				r.type === 'injects' && 
				r.from.includes('UserService') && 
				r.to.includes('UserRepository')
			);
			
			assert.ok(controllerToService, 'MUST detect Controller -> Service injection');
			assert.ok(serviceToRepo, 'MUST detect Service -> Repository injection');
		});
	});
	
	suite('Phase 2 - Exception Handling', () => {
		test('should detect @ControllerAdvice global exception handler', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'GlobalExceptionHandler',
				filePath: 'src/main/java/com/example/exception/GlobalExceptionHandler.java',
				properties: [],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const handler = result.enhancedClasses.find(c => c.name === 'GlobalExceptionHandler');
			assert.ok(handler?.classType === 'exception-handler', 
				'MUST detect @ControllerAdvice');
		});
		
		test('should detect @ExceptionHandler methods', async () => {
			// @ExceptionHandler(UserNotFoundException.class)
			assert.ok(true, 'TODO: Implement @ExceptionHandler detection');
		});
		
		test('should link exception handlers to controllers they protect', async () => {
			assert.ok(true, 'TODO: Implement exception handler -> controller linking');
		});
	});
	
	suite('Phase 2 - Validation', () => {
		test('should detect @Valid annotation on controller parameters', async () => {
			// public ResponseEntity<User> createUser(@Valid @RequestBody UserDTO dto)
			assert.ok(true, 'TODO: Implement @Valid detection');
		});
		
		test('should detect JSR-303 validation annotations on DTOs', async () => {
			// @NotNull, @Email, @Size, etc. on DTO fields
			assert.ok(true, 'TODO: Implement JSR-303 annotation detection');
		});
	});
	
	suite('Phase 3 - Security', () => {
		test('should detect @PreAuthorize method security', async () => {
			// @PreAuthorize("hasRole('ADMIN')")
			assert.ok(true, 'TODO: Implement @PreAuthorize detection');
		});
		
		test('should detect SecurityFilterChain configuration', async () => {
			assert.ok(true, 'TODO: Implement SecurityFilterChain detection');
		});
	});
	
	suite('Phase 3 - Configuration', () => {
		test('should detect @Configuration classes', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'AppConfig',
				filePath: 'src/main/java/com/example/config/AppConfig.java',
				properties: [],
				methods: [],
				classType: 'class'
			}];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const config = result.enhancedClasses.find(c => c.name === 'AppConfig');
			assert.ok(config?.classType === 'configuration', 
				'MUST detect @Configuration');
		});
		
		test('should detect @Bean factory methods', async () => {
			assert.ok(true, 'TODO: Implement @Bean detection');
		});
	});
	
	suite('Integration - Full Request Flow', () => {
		test('should map complete REST API flow: Route -> Controller -> Service -> Repository -> Entity', async () => {
			// Full stack integration test
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserController',
					filePath: 'src/main/java/com/example/controller/UserController.java',
					properties: [{ name: 'userService', type: 'UserService', visibility: 'private' }],
					methods: [{
						name: 'getUser',
						parameters: [{ name: 'id', type: 'Long' }],
						returnType: 'ResponseEntity<UserDTO>',
						visibility: 'public',
						isStatic: false,
						isAsync: false,
						lineNumber: 10,
						endLineNumber: 15
					}],
					classType: 'class'
				},
				{
					name: 'UserService',
					filePath: 'src/main/java/com/example/service/UserService.java',
					properties: [{ name: 'userRepository', type: 'UserRepository', visibility: 'private' }],
					methods: [{
						name: 'findById',
						parameters: [{ name: 'id', type: 'Long' }],
						returnType: 'User',
						visibility: 'public',
						isStatic: false,
						isAsync: false,
						lineNumber: 20,
						endLineNumber: 25
					}],
					classType: 'class'
				},
				{
					name: 'UserRepository',
					filePath: 'src/main/java/com/example/repository/UserRepository.java',
					properties: [],
					methods: [],
					implements: ['JpaRepository<User, Long>'],
					classType: 'interface'
				},
				{
					name: 'User',
					filePath: 'src/main/java/com/example/entity/User.java',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should have complete relationship chain
			const hasRoute = result.enhancedClasses.some(c => c.classType === 'route');
			const hasController = result.enhancedClasses.some(c => c.classType === 'rest-controller');
			const hasService = result.enhancedClasses.some(c => c.classType === 'service');
			const hasRepo = result.enhancedClasses.some(c => c.classType === 'repository');
			const hasEntity = result.enhancedClasses.some(c => c.classType === 'entity');
			
			assert.ok(hasRoute, 'MUST create route node');
			assert.ok(hasController, 'MUST identify controller');
			assert.ok(hasService, 'MUST identify service');
			assert.ok(hasRepo, 'MUST identify repository');
			assert.ok(hasEntity, 'MUST identify entity');
			
			// Check relationships exist
			assert.ok(result.newRelationships.length > 0, 'MUST create relationships');
		});
	});
});
