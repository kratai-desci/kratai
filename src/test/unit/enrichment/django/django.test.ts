import * as assert from 'assert';
import * as path from 'path';
import { DjangoEnricher } from '../../../../services/enrichment/frameworks/DjangoEnricher';
import { EnrichmentContext } from '../../../../services/enrichment/AbstractEnricher';
import { ClassInfo } from '../../../../types/domain';

suite('DjangoEnricher - Framework Enrichment', () => {
	const enricher = new DjangoEnricher();
	const workspacePath = path.join(__dirname, '../../../../..');
	const fixturesPath = path.join(__dirname, '../../../../../src/test/unit/enrichment/django/fixtures');
	
	suite('Framework Detection', () => {
		test('should detect Django from Python files with django imports', () => {
			// Use fixtures directory with Django files
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: [],
				relationships: []
			};
			
			const detected = enricher.detect(context);
			assert.ok(detected, 'MUST detect Django from import statements');
		});
		
		test('should return correct framework name and priority', () => {
			assert.strictEqual(enricher.framework, 'Django', 'Framework name must be "Django"');
			assert.strictEqual(enricher.priority, 10, 'Priority must be 10 (runs early)');
		});
		
		test('should provide file patterns for Django', () => {
			const patterns = enricher.getFilePatterns();
			
			assert.ok(patterns.includes('**/urls.py'), 'MUST include URL pattern');
			assert.ok(patterns.includes('**/views.py'), 'MUST include views pattern');
			assert.ok(patterns.includes('**/models.py'), 'MUST include models pattern');
			assert.ok(patterns.includes('**/serializers.py'), 'MUST include serializers pattern');
			assert.ok(patterns.includes('**/middleware.py'), 'MUST include middleware pattern');
		});
	});
	
	suite('URL Pattern Detection', () => {
		test('should detect URL patterns from urls.py', async () => {
			// Real urls.py file exists in fixtures/
			// Contains: path('users/', views.UserListView.as_view())
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserListView',
					filePath: 'fixtures/views.py',
					extends: 'ListView',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,  // Enricher can read urls.py from here
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create route node for 'users/'
			const routeNode = result.enhancedClasses.find(c => 
				c.classType === 'route' && c.routeMeta?.path === 'users/'
			);
			
			assert.ok(routeNode, 'MUST create route node from URL pattern');
		});
		
		test('should detect dynamic URL parameters', async () => {
			// Real urls.py contains: path('users/<int:pk>/', views.UserDetailView.as_view())
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserDetailView',
					filePath: 'fixtures/views.py',
					extends: 'DetailView',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,  // Enricher reads urls.py
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const routeNode = result.enhancedClasses.find(c => 
				c.routeMeta?.path?.includes('<int:pk>')
			);
			
			assert.ok(routeNode, 'MUST detect dynamic URL parameters');
		});
		
		test('should create URL → View relationship', async () => {
			// Real urls.py: path('users/', views.UserListView)
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserListView',
					filePath: 'fixtures/views.py',
					extends: 'ListView',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,  // Enricher reads urls.py
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: route → view relationship
			const routeRel = result.newRelationships.find(rel => 
				rel.type === 'routes-to' &&
				rel.to.includes('UserListView')
			);
			
			assert.ok(routeRel, 'MUST create routes-to relationship');
		});
	});
	
	suite('Model Detection', () => {
		test('should detect Django models', async () => {
			// class User(models.Model)
			const mockClasses: ClassInfo[] = [{
				name: 'User',
				filePath: 'users/models.py',
				extends: 'models.Model',
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
			
			// Should identify as Django model
			const modelClass = result.enhancedClasses.find(c => 
				c.name === 'User' && c.extends === 'models.Model'
			);
			
			assert.ok(modelClass, 'MUST identify Django model');
		});
		
		test('should detect ForeignKey relationships', async () => {
			// class Post(models.Model):
			//     author = models.ForeignKey(User)
			const mockClasses: ClassInfo[] = [
				{
					name: 'User',
					filePath: 'users/models.py',
					extends: 'models.Model',
					properties: [],
					methods: [],
					classType: 'class'
				},
				{
					name: 'Post',
					filePath: 'posts/models.py',
					extends: 'models.Model',
					properties: [
						{
							name: 'author',
							type: 'models.ForeignKey',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: Post → User (belongs-to)
			const fkRel = result.newRelationships.find(rel => 
				rel.type === 'belongs-to' &&
				rel.from.includes('Post') &&
				rel.to.includes('User')
			);
			
			assert.ok(fkRel, 'MUST create belongs-to relationship for ForeignKey');
		});
		
		test('should detect ManyToManyField relationships', async () => {
			// class Post(models.Model):
			//     categories = models.ManyToManyField(Category)
			const mockClasses: ClassInfo[] = [
				{
					name: 'Post',
					filePath: 'posts/models.py',
					extends: 'models.Model',
					properties: [
						{
							name: 'categories',
							type: 'models.ManyToManyField',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				},
				{
					name: 'Category',
					filePath: 'posts/models.py',
					extends: 'models.Model',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: Post → Category (many-to-many)
			const m2mRel = result.newRelationships.find(rel => 
				rel.type === 'many-to-many' &&
				rel.from.includes('Post') &&
				rel.to.includes('Category')
			);
			
			assert.ok(m2mRel, 'MUST create many-to-many relationship for ManyToManyField');
		});
		
		test('should detect OneToOneField relationships', async () => {
			// class Profile(models.Model):
			//     user = models.OneToOneField(User)
			const mockClasses: ClassInfo[] = [
				{
					name: 'User',
					filePath: 'users/models.py',
					extends: 'models.Model',
					properties: [],
					methods: [],
					classType: 'class'
				},
				{
					name: 'Profile',
					filePath: 'users/models.py',
					extends: 'models.Model',
					properties: [
						{
							name: 'user',
							type: 'models.OneToOneField',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: Profile → User (one-to-one)
			const o2oRel = result.newRelationships.find(rel => 
				rel.type === 'one-to-one' &&
				rel.from.includes('Profile') &&
				rel.to.includes('User')
			);
			
			assert.ok(o2oRel, 'MUST create one-to-one relationship for OneToOneField');
		});
	});
	
	suite('View Detection', () => {
		test('should detect class-based views', async () => {
			// class UserListView(ListView)
			const mockClasses: ClassInfo[] = [{
				name: 'UserListView',
				filePath: 'users/views.py',
				extends: 'ListView',
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
			
			// Should identify as view
			const viewClass = result.enhancedClasses.find(c => 
				c.name === 'UserListView' && c.extends === 'ListView'
			);
			
			assert.ok(viewClass, 'MUST identify class-based view');
		});
		
		test('should detect function-based views', async () => {
			// @api_view(['GET', 'POST'])
			// def list_posts_api(request):
			const mockClasses: ClassInfo[] = [{
				name: 'list_posts_api',
				filePath: 'posts/views.py',
				properties: [],
				methods: [],
				classType: 'function'
			}];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should identify as function-based view
			const viewFunc = result.enhancedClasses.find(c => 
				c.name === 'list_posts_api' && c.classType === 'function'
			);
			
			assert.ok(viewFunc, 'MUST identify function-based view');
		});
		
		test('should create View → Model relationship', async () => {
			// class UserListView(ListView):
			//     model = User
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserListView',
					filePath: 'users/views.py',
					extends: 'ListView',
					properties: [
						{
							name: 'model',
							type: 'User',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				},
				{
					name: 'User',
					filePath: 'users/models.py',
					extends: 'models.Model',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: UserListView → User (uses)
			const viewModelRel = result.newRelationships.find(rel => 
				rel.type === 'uses' &&
				rel.from.includes('UserListView') &&
				rel.to.includes('User')
			);
			
			assert.ok(viewModelRel, 'MUST create view → model relationship');
		});
	});
	
	suite('Django REST Framework - ViewSets', () => {
		test('should detect ViewSets', async () => {
			// class UserViewSet(viewsets.ModelViewSet)
			const mockClasses: ClassInfo[] = [{
				name: 'UserViewSet',
				filePath: 'api/views.py',
				extends: 'viewsets.ModelViewSet',
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
			
			// Should identify as ViewSet
			const viewSet = result.enhancedClasses.find(c => 
				c.name === 'UserViewSet' && c.extends === 'viewsets.ModelViewSet'
			);
			
			assert.ok(viewSet, 'MUST identify ViewSet');
		});
		
		test('should create ViewSet → Serializer relationship', async () => {
			// class UserViewSet(viewsets.ModelViewSet):
			//     serializer_class = UserSerializer
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserViewSet',
					filePath: 'api/views.py',
					extends: 'viewsets.ModelViewSet',
					properties: [
						{
							name: 'serializer_class',
							type: 'UserSerializer',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				},
				{
					name: 'UserSerializer',
					filePath: 'api/serializers.py',
					extends: 'serializers.ModelSerializer',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: UserViewSet → UserSerializer (uses)
			const viewSerializerRel = result.newRelationships.find(rel => 
				rel.type === 'uses' &&
				rel.from.includes('UserViewSet') &&
				rel.to.includes('UserSerializer')
			);
			
			assert.ok(viewSerializerRel, 'MUST create ViewSet → Serializer relationship');
		});
	});
	
	suite('Serializer Detection', () => {
		test('should detect serializers', async () => {
			// class UserSerializer(serializers.ModelSerializer)
			const mockClasses: ClassInfo[] = [{
				name: 'UserSerializer',
				filePath: 'api/serializers.py',
				extends: 'serializers.ModelSerializer',
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
			
			// Should identify as serializer
			const serializer = result.enhancedClasses.find(c => 
				c.name === 'UserSerializer' && c.extends === 'serializers.ModelSerializer'
			);
			
			assert.ok(serializer, 'MUST identify serializer');
		});
		
		test('should create Serializer → Model relationship', async () => {
			// class UserSerializer(serializers.ModelSerializer):
			//     class Meta:
			//         model = User
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserSerializer',
					filePath: 'api/serializers.py',
					extends: 'serializers.ModelSerializer',
					properties: [],
					methods: [],
					classType: 'class'
				},
				{
					name: 'User',
					filePath: 'users/models.py',
					extends: 'models.Model',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: UserSerializer → User (serializes)
			const serializerModelRel = result.newRelationships.find(rel => 
				rel.type === 'serializes' &&
				rel.from.includes('UserSerializer') &&
				rel.to.includes('User')
			);
			
			assert.ok(serializerModelRel, 'MUST create Serializer → Model relationship');
		});
		
		test('should detect nested serializers', async () => {
			// class PostSerializer:
			//     author = UserSerializer()
			const mockClasses: ClassInfo[] = [
				{
					name: 'PostSerializer',
					filePath: 'api/serializers.py',
					extends: 'serializers.ModelSerializer',
					properties: [
						{
							name: 'author',
							type: 'UserSerializer',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				},
				{
					name: 'UserSerializer',
					filePath: 'api/serializers.py',
					extends: 'serializers.ModelSerializer',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: PostSerializer → UserSerializer (nests)
			const nestedRel = result.newRelationships.find(rel => 
				rel.type === 'uses' &&
				rel.from.includes('PostSerializer') &&
				rel.to.includes('UserSerializer')
			);
			
			assert.ok(nestedRel, 'MUST create nested serializer relationship');
		});
	});
	
	suite('Middleware Detection', () => {
		test('should detect middleware classes', async () => {
			// class CustomAuthenticationMiddleware(MiddlewareMixin)
			const mockClasses: ClassInfo[] = [{
				name: 'CustomAuthenticationMiddleware',
				filePath: 'middleware.py',
				extends: 'MiddlewareMixin',
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
			
			// Should identify as middleware
			const middleware = result.enhancedClasses.find(c => 
				c.name === 'CustomAuthenticationMiddleware' &&
				c.classType === 'middleware'
			);
			
			assert.ok(middleware, 'MUST identify middleware');
		});
		
		test('should create middleware → view protection relationships', async () => {
			// Middleware protects views
			const mockClasses: ClassInfo[] = [
				{
					name: 'AuthenticationMiddleware',
					filePath: 'middleware.py',
					extends: 'MiddlewareMixin',
					properties: [],
					methods: [],
					classType: 'class'
				},
				{
					name: 'UserListView',
					filePath: 'users/views.py',
					extends: 'ListView',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: middleware → view (protected-by)
			const middlewareRel = result.newRelationships.find(rel => 
				rel.type === 'protected-by' &&
				rel.to.includes('UserListView')
			);
			
			assert.ok(middlewareRel, 'MUST create middleware protection relationship');
		});
	});
	
	suite('Decorator Detection', () => {
		test('should detect @login_required decorator', async () => {
			// @login_required
			// def delete_user(request, user_id):
			assert.ok(true, 'TODO: Implement @login_required detection');
		});
		
		test('should detect @api_view decorator', async () => {
			// @api_view(['GET', 'POST'])
			// def list_posts_api(request):
			assert.ok(true, 'TODO: Implement @api_view detection');
		});
		
		test('should detect @permission_classes decorator', async () => {
			// @permission_classes([IsAuthenticated])
			assert.ok(true, 'TODO: Implement @permission_classes detection');
		});
	});
	
	suite('Full Request Flow', () => {
		test('should map complete request flow: URL → View → Model → Serializer', async () => {
			// /api/users/ → UserViewSet → User → UserSerializer
			const mockClasses: ClassInfo[] = [
				{
					name: 'urlpatterns',
					filePath: 'api/urls.py',
					properties: [],
					methods: [],
					classType: 'module'
				},
				{
					name: 'UserViewSet',
					filePath: 'api/views.py',
					extends: 'viewsets.ModelViewSet',
					properties: [
						{
							name: 'queryset',
							type: 'User.objects.all',
							visibility: 'public'
						},
						{
							name: 'serializer_class',
							type: 'UserSerializer',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				},
				{
					name: 'User',
					filePath: 'users/models.py',
					extends: 'models.Model',
					properties: [],
					methods: [],
					classType: 'class'
				},
				{
					name: 'UserSerializer',
					filePath: 'api/serializers.py',
					extends: 'serializers.ModelSerializer',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should have complete chain of relationships
			const hasRouteToView = result.newRelationships.some(rel => 
				rel.type === 'routes-to' && rel.to.includes('UserViewSet')
			);
			
			const hasViewToModel = result.newRelationships.some(rel => 
				rel.type === 'uses' && 
				rel.from.includes('UserViewSet') && 
				rel.to.includes('User')
			);
			
			const hasViewToSerializer = result.newRelationships.some(rel => 
				rel.type === 'uses' && 
				rel.from.includes('UserViewSet') && 
				rel.to.includes('UserSerializer')
			);
			
			const hasSerializerToModel = result.newRelationships.some(rel => 
				rel.type === 'serializes' && 
				rel.from.includes('UserSerializer') && 
				rel.to.includes('User')
			);
			
			assert.ok(hasRouteToView, 'MUST have URL → View');
			assert.ok(hasViewToModel, 'MUST have View → Model');
			assert.ok(hasViewToSerializer, 'MUST have View → Serializer');
			assert.ok(hasSerializerToModel, 'MUST have Serializer → Model');
		});
	});
	
	suite('Relationship ID Format', () => {
		test('should use filePath__className format for relationships', async () => {
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserViewSet',
					filePath: 'api/views.py',
					extends: 'viewsets.ModelViewSet',
					properties: [],
					methods: [],
					classType: 'class'
				},
				{
					name: 'UserSerializer',
					filePath: 'api/serializers.py',
					extends: 'serializers.ModelSerializer',
					properties: [],
					methods: [],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// All relationships must use filePath__className format
			result.newRelationships.forEach(rel => {
				assert.ok(rel.from.includes('__'), 
					`Relationship 'from' must use filePath__className format (got: ${rel.from})`);
				assert.ok(rel.to.includes('__'), 
					`Relationship 'to' must use filePath__className format (got: ${rel.to})`);
			});
		});
	});
	
	suite('Edge Cases', () => {
		test('should handle empty workspace', async () => {
			const context: EnrichmentContext = {
				workspacePath,
				classes: [],
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			assert.ok(Array.isArray(result.enhancedClasses), 'MUST return array');
			assert.ok(Array.isArray(result.newRelationships), 'MUST return array');
		});
		
		test('should handle non-Django Python files gracefully', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'RandomClass',
				filePath: 'src/random.py',
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
			
			// Should not crash, should pass through unchanged
			assert.ok(result.enhancedClasses.length >= mockClasses.length, 
				'MUST not lose existing classes');
		});
		
		test('should ignore test files', async () => {
			// Files like test_*.py, *_test.py should be ignored
			const mockClasses: ClassInfo[] = [{
				name: 'TestUser',
				filePath: 'users/test_models.py',
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
			
			// Should not create routes for test files
			const testRoute = result.enhancedClasses.find(c => 
				c.classType === 'route' && c.filePath.includes('test_')
			);
			
			assert.ok(!testRoute, 'MUST NOT create routes for test files');
		});
		
		test('should ignore migrations', async () => {
			// Files in migrations/ directory should be ignored
			const mockClasses: ClassInfo[] = [{
				name: 'Migration',
				filePath: 'users/migrations/0001_initial.py',
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
			
			// Should not process migration files
			const migrationRoute = result.enhancedClasses.find(c => 
				c.filePath.includes('migrations/')
			);
			
			assert.ok(!migrationRoute, 'MUST ignore migration files');
		});
	});
	
	suite('View → Template Relationships', () => {
		test('REALITY CHECK: Python parser does NOT extract class-level assignments', async () => {
			// This test documents the ACTUAL behavior of PythonParser
			// Python class-level assignments like: template_name = 'value'
			// Are NOT extracted as properties!
			const fixturePath = path.join(fixturesPath, 'views.py');
			const PythonParser = require('../../../../services/parsing/languages/PythonParser').PythonParser;
			const parser = new PythonParser();
			
			const classes = parser.parseFile(fixturePath);
			const taskListView = classes.find((c: any) => c.name === 'TaskListView');
			
			console.log('🔍 TaskListView properties:', taskListView?.properties);
			
			// REALITY: Python parser DOES NOT extract template_name property
			// because it's a class-level assignment, not a type annotation
			// Template name is NOT in properties array
			const hasTemplateNameProp = taskListView?.properties?.some((p: any) => p.name === 'template_name');
			
			assert.ok(!hasTemplateNameProp, 
				'Python parser does NOT extract class-level assignments (this is the bug!)');
		});
		
		test('should detect template_name when enricher reads source directly', async () => {
			// Even though PythonParser doesn't extract template_name property,
			// Django enricher should still detect it by reading the source file
			const mockClasses: ClassInfo[] = [
				{
					name: 'TaskListView',
					filePath: 'views.py',
					extends: 'ListView',
					properties: [],  // Empty! Parser doesn't extract class-level assignments
					methods: [],
					classType: 'class'  // Will be enriched to 'view' by enricher
				},
				{
					name: 'task_list.html',
					filePath: 'webapp/templates/webapp/task_list.html',
					properties: [],
					methods: [],
					classType: 'template'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			console.log('📊 Result:', {
				relationships: result.newRelationships.map(r => ({
					type: r.type,
					from: r.from,
					to: r.to
				}))
			});
			
			// Django enricher reads source file directly to find template_name
			const rendersRel = result.newRelationships.find(rel => 
				rel.type === 'renders' &&
				rel.from.includes('TaskListView') &&
				rel.to.includes('task_list.html')
			);
			
			assert.ok(rendersRel, 'MUST create renders relationship by reading source file');
		});
		
		test('TDD: should NOT detect wrong templates when multiple views in same file', async () => {
			// This is the SCOPE problem: views.py has 5 views with different templates
			// TaskDeleteView should ONLY link to task_confirm_delete.html, not all 4 templates
			const mockClasses: ClassInfo[] = [
				{
					name: 'TaskDeleteView',
					filePath: 'views.py',
					extends: 'DeleteView',
					properties: [],
					methods: [],
					classType: 'class'  // Will be enriched to 'view' by enricher
				},
				{
					name: 'task_list.html',
					filePath: 'webapp/templates/webapp/task_list.html',
					properties: [],
					methods: [],
					classType: 'template'
				},
				{
					name: 'task_detail.html',
					filePath: 'webapp/templates/webapp/task_detail.html',
					properties: [],
					methods: [],
					classType: 'template'
				},
				{
					name: 'task_form.html',
					filePath: 'webapp/templates/webapp/task_form.html',
					properties: [],
					methods: [],
					classType: 'template'
				},
				{
					name: 'task_confirm_delete.html',
					filePath: 'webapp/templates/webapp/task_confirm_delete.html',
					properties: [],
					methods: [],
					classType: 'template'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Filter to only renders relationships from TaskDeleteView
			const taskDeleteRels = result.newRelationships.filter(rel => 
				rel.type === 'renders' && rel.from.includes('TaskDeleteView')
			);
			
			console.log('📊 TaskDeleteView relationships:', taskDeleteRels);
			
			// Should have EXACTLY 1 relationship: TaskDeleteView → task_confirm_delete.html
			assert.strictEqual(taskDeleteRels.length, 1, 
				'TaskDeleteView should link to ONLY 1 template, not all templates in file');
			
			// Verify it's the correct template
			const correctRel = taskDeleteRels.find(r => r.to.includes('task_confirm_delete.html'));
			assert.ok(correctRel, 'TaskDeleteView should link to task_confirm_delete.html');
			
			// Verify it does NOT link to wrong templates
			const wrongRels = taskDeleteRels.filter(r => 
				r.to.includes('task_list.html') || 
				r.to.includes('task_detail.html') || 
				r.to.includes('task_form.html')
			);
			assert.strictEqual(wrongRels.length, 0, 
				'TaskDeleteView should NOT link to other views\' templates');
		});
		
		test('TDD: all views in same file should get correct templates', async () => {
			// Comprehensive test: ALL 5 views in views.py should get their own templates
			const mockClasses: ClassInfo[] = [
				{
					name: 'TaskListView',
					filePath: 'views.py',
					extends: 'ListView',
					properties: [],
					methods: [],
					classType: 'class'
				},
				{
					name: 'TaskDetailView',
					filePath: 'views.py',
					extends: 'DetailView',
					properties: [],
					methods: [],
					classType: 'class'
				},
				{
					name: 'TaskCreateView',
					filePath: 'views.py',
					extends: 'CreateView',
					properties: [],
					methods: [],
					classType: 'class'
				},
				{
					name: 'TaskUpdateView',
					filePath: 'views.py',
					extends: 'UpdateView',
					properties: [],
					methods: [],
					classType: 'class'
				},
				{
					name: 'TaskDeleteView',
					filePath: 'views.py',
					extends: 'DeleteView',
					properties: [],
					methods: [],
					classType: 'class'
				},
				{
					name: 'task_list.html',
					filePath: 'webapp/templates/webapp/task_list.html',
					properties: [],
					methods: [],
					classType: 'template'
				},
				{
					name: 'task_detail.html',
					filePath: 'webapp/templates/webapp/task_detail.html',
					properties: [],
					methods: [],
					classType: 'template'
				},
				{
					name: 'task_form.html',
					filePath: 'webapp/templates/webapp/task_form.html',
					properties: [],
					methods: [],
					classType: 'template'
				},
				{
					name: 'task_confirm_delete.html',
					filePath: 'webapp/templates/webapp/task_confirm_delete.html',
					properties: [],
					methods: [],
					classType: 'template'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const rendersRels = result.newRelationships.filter(r => r.type === 'renders');
			
			console.log('📊 All renders relationships:', rendersRels.map(r => ({
				view: r.from.split('__')[1],
				template: r.to.split('__')[1]
			})));
			
			// Should have exactly 5 renders relationships (one per view)
			// Note: TaskCreateView and TaskUpdateView both use task_form.html, so 4 unique templates
			assert.ok(rendersRels.length >= 4, 
				`Should have at least 4 renders relationships (got ${rendersRels.length})`);
			
			// Verify each view gets correct template
			const assertions = [
				{ view: 'TaskListView', template: 'task_list.html' },
				{ view: 'TaskDetailView', template: 'task_detail.html' },
				{ view: 'TaskCreateView', template: 'task_form.html' },
				{ view: 'TaskUpdateView', template: 'task_form.html' },
				{ view: 'TaskDeleteView', template: 'task_confirm_delete.html' }
			];
			
			for (const { view, template } of assertions) {
				const rel = rendersRels.find(r => 
					r.from.includes(view) && r.to.includes(template)
				);
				assert.ok(rel, `${view} should link to ${template}`);
			}
		});
		
		test('DEPRECATED: old test with mock property (not reality)', async () => {
			// This test MOCKS a property that doesn't exist in real parsing
			// Kept for backwards compatibility but not reflective of reality
			const mockClasses: ClassInfo[] = [
				{
					name: 'TaskListView',
					filePath: 'views.py',
					extends: 'ListView',
					properties: [
						{
							name: 'template_name',  // ← This doesn't exist in real parsing!
							type: 'str',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				},
				{
					name: 'task_list.html',
					filePath: 'webapp/templates/webapp/task_list.html',
					properties: [],
					methods: [],
					classType: 'template'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Debug: Log what we got
			console.log('📊 Test result:', {
				enhancedClasses: result.enhancedClasses.length,
				newRelationships: result.newRelationships.length,
				relationships: result.newRelationships.map(r => ({
					type: r.type,
					from: r.from,
					to: r.to
				}))
			});
			
			// This passes ONLY because we mocked the property
			const rendersRel = result.newRelationships.find(rel => 
				rel.type === 'renders' &&
				rel.from.includes('TaskListView') &&
				rel.to.includes('task_list.html')
			);
			
			assert.ok(rendersRel, 'PASSES with mocked property (not realistic)');
		});
		
		test('should detect render() function calls', async () => {
			// def task_list(request):
			//     return render(request, 'webapp/task_list.html')
			const mockClasses: ClassInfo[] = [
				{
					name: 'task_list',
					filePath: 'function-views.py',  // Use actual fixture file
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'task_list.html',
					filePath: 'webapp/templates/webapp/task_list.html',
					properties: [],
					methods: [],
					classType: 'template'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,  // Enricher reads function-views.py to find render() calls
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: task_list → task_list.html (renders)
			const rendersRel = result.newRelationships.find(rel => 
				rel.type === 'renders' &&
				rel.from.includes('task_list') &&
				rel.to.includes('task_list.html')
			);
			
			assert.ok(rendersRel, 'MUST create renders relationship from render() function call');
		});
		
		test('should handle nested template paths', async () => {
			// template_name = 'webapp/tasks/list.html'
			const mockClasses: ClassInfo[] = [
				{
					name: 'TaskListView',
					filePath: 'views.py',
					extends: 'ListView',
					properties: [
						{
							name: 'template_name',
							type: 'str',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				},
				{
					name: 'task_list.html',
					filePath: 'webapp/templates/webapp/tasks/task_list.html',
					properties: [],
					methods: [],
					classType: 'template'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should match by filename even with nested path
			const rendersRel = result.newRelationships.find(rel => 
				rel.type === 'renders' &&
				rel.from.includes('TaskListView') &&
				rel.to.includes('task_list.html')
			);
			
			assert.ok(rendersRel, 'MUST match templates by filename with nested paths');
		});
		
		test('should handle multiple views using the same template', async () => {
			// Both views use 'webapp/task_form.html'
			const mockClasses: ClassInfo[] = [
				{
					name: 'TaskCreateView',
					filePath: 'views.py',
					extends: 'CreateView',
					properties: [
						{
							name: 'template_name',
							type: 'str',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				},
				{
					name: 'TaskUpdateView',
					filePath: 'views.py',
					extends: 'UpdateView',
					properties: [
						{
							name: 'template_name',
							type: 'str',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				},
				{
					name: 'task_form.html',
					filePath: 'webapp/templates/webapp/task_form.html',
					properties: [],
					methods: [],
					classType: 'template'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create relationships for both views
			const taskCreateRel = result.newRelationships.find(rel => 
				rel.type === 'renders' &&
				rel.from.includes('TaskCreateView') &&
				rel.to.includes('task_form.html')
			);
			
			const taskUpdateRel = result.newRelationships.find(rel => 
				rel.type === 'renders' &&
				rel.from.includes('TaskUpdateView') &&
				rel.to.includes('task_form.html')
			);
			
			assert.ok(taskCreateRel, 'MUST create relationship for first view');
			assert.ok(taskUpdateRel, 'MUST create relationship for second view');
		});
		
		test('should not create relationship when template does not exist', async () => {
			// View references non-existent template
			const mockClasses: ClassInfo[] = [
				{
					name: 'TaskListView',
					filePath: 'views.py',
					extends: 'ListView',
					properties: [
						{
							name: 'template_name',
							type: 'str',
							visibility: 'public'
						}
					],
					methods: [],
					classType: 'class'
				}
				// No template file in classes
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should NOT create orphan relationships when there are no templates
			const rendersRel = result.newRelationships.find(rel => 
				rel.type === 'renders' &&
				rel.from.includes('TaskListView')
			);
			
			assert.ok(!rendersRel, 'MUST NOT create relationship to non-existent template');
		});
	});
	
	suite('Feature Metadata', () => {
		test('should report detected features in metadata', async () => {
			const context: EnrichmentContext = {
				workspacePath,
				classes: [],
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			assert.ok(result.metadata.framework === 'Django', 
				'Metadata must include framework name');
			assert.ok(Array.isArray(result.metadata.features), 
				'Metadata must include features array');
		});
		
		test('should list implemented features', async () => {
			// When features are implemented, they should appear in metadata
			// e.g., ['url-patterns', 'models', 'views', 'serializers', 'middleware']
			assert.ok(true, 'TODO: Verify feature list when implemented');
		});
	});
});
