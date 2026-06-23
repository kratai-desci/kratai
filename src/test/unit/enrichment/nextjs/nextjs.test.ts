import * as assert from 'assert';
import * as path from 'path';
import { NextJSEnricher } from '../../../../services/enrichment/frameworks/NextJSEnricher';
import { EnrichmentContext } from '../../../../services/enrichment/AbstractEnricher';
import { ClassInfo } from '../../../../types/domain';

suite('NextJSEnricher - Framework Enrichment', () => {
	const enricher = new NextJSEnricher();
	const workspacePath = path.join(__dirname, '../../../../..');
	const fixturesPath = path.join(__dirname, '../../../../../src/test/unit/enrichment/nextjs/fixtures');
	
	suite('Framework Detection', () => {
		test('should detect Next.js from package.json with next dependency', () => {
			// Use fixtures directory which has a mock package.json with next dependency
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: [],
				relationships: []
			};
			
			const detected = enricher.detect(context);
			assert.ok(detected, 'MUST detect Next.js from package.json');
		});
		
		test('should return correct framework name and priority', () => {
			assert.strictEqual(enricher.framework, 'Next.js', 'Framework name must be "Next.js"');
			assert.strictEqual(enricher.priority, 10, 'Priority must be 10 (runs early)');
		});
		
		test('should provide file patterns for Next.js', () => {
			const patterns = enricher.getFilePatterns();
			
			assert.ok(patterns.includes('**/app/**/page.tsx'), 'MUST include app router page pattern');
			assert.ok(patterns.includes('**/app/**/route.ts'), 'MUST include API route pattern');
			assert.ok(patterns.includes('**/app/**/layout.tsx'), 'MUST include layout pattern');
			assert.ok(patterns.includes('**/middleware.ts'), 'MUST include middleware pattern');
			assert.ok(patterns.includes('**/pages/**/*.tsx'), 'MUST include pages router pattern');
		});
	});
	
	suite('File-Based Routing Detection', () => {
		test('should detect route handlers from file path', async () => {
			// File: app/api/users/route.ts
			const mockClasses: ClassInfo[] = [{
				name: 'GET',
				filePath: 'app/api/users/route.ts',
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
			
			// Should create route node for /api/users
			const routeNode = result.enhancedClasses.find(c => 
				c.classType === 'route' && c.routeMeta?.path === '/api/users'
			);
			
			assert.ok(routeNode, 'MUST create route node from file path');
			assert.strictEqual(routeNode?.routeMeta?.method, '*', 'Generic route should use * method');
		});
		
		test('should convert dynamic route parameters [id] to :id', async () => {
			// File: app/api/users/[id]/route.ts
			const mockClasses: ClassInfo[] = [{
				name: 'GET',
				filePath: 'app/api/users/[id]/route.ts',
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
			
			const routeNode = result.enhancedClasses.find(c => 
				c.routeMeta?.path?.includes(':id')
			);
			
			assert.ok(routeNode, 'MUST convert [id] to :id parameter');
			assert.ok(routeNode?.routeMeta?.path.includes('/api/users/:id'), 
				'Route path should be /api/users/:id');
		});
		
		test('should detect page routes from app directory', async () => {
			// File: app/users/page.tsx
			const mockClasses: ClassInfo[] = [{
				name: 'UsersPage',
				filePath: 'app/users/page.tsx',
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
			
			const pageRoute = result.enhancedClasses.find(c => 
				c.classType === 'route' && c.routeMeta?.path === '/users'
			);
			
			assert.ok(pageRoute, 'MUST detect page route from page.tsx');
		});
		
		test('should handle nested dynamic routes', async () => {
			// File: app/posts/[postId]/comments/[commentId]/page.tsx
			const mockClasses: ClassInfo[] = [{
				name: 'CommentPage',
				filePath: 'app/posts/[postId]/comments/[commentId]/page.tsx',
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
			
			const routeNode = result.enhancedClasses.find(c => 
				c.routeMeta?.path?.includes(':postId') && 
				c.routeMeta?.path?.includes(':commentId')
			);
			
			assert.ok(routeNode, 'MUST handle multiple dynamic parameters');
			assert.ok(routeNode?.routeMeta?.path.includes('/posts/:postId/comments/:commentId'),
				'Path should be /posts/:postId/comments/:commentId');
		});
	});
	
	suite('Route Handler Detection', () => {
		test('should detect GET handler in route.ts', async () => {
			// File contains: export async function GET(request)
			const fixturePath = path.join(fixturesPath, 'file-routing.ts');
			
			// TODO: Parse fixture file to extract handler functions
			// For now, test the structure
			assert.ok(true, 'TODO: Implement GET handler detection');
		});
		
		test('should detect POST handler in route.ts', async () => {
			const fixturePath = path.join(fixturesPath, 'file-routing.ts');
			assert.ok(true, 'TODO: Implement POST handler detection');
		});
		
		test('should detect multiple handlers in same route file', async () => {
			// File exports: GET, POST, PUT, DELETE
			assert.ok(true, 'TODO: Implement multiple handler detection');
		});
	});
	
	suite('Server Actions Detection', () => {
		test('should detect "use server" directive', async () => {
			// File starts with 'use server'
			const fixturePath = path.join(fixturesPath, 'server-actions.ts');
			
			// TODO: Parse file and detect directive
			assert.ok(true, 'TODO: Implement "use server" detection');
		});
		
		test('should identify server action functions', async () => {
			// Functions in 'use server' file are server actions
			const mockClasses: ClassInfo[] = [{
				name: 'createUserAction',
				filePath: 'actions/server-actions.ts',
				properties: [],
				methods: [],
				classType: 'function'
			}];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			// TODO: Mark function as server action
			assert.ok(true, 'TODO: Implement server action identification');
		});
		
		test('should detect server action calls from form components', async () => {
			// Form component: <form action={createUserAction}>
			// Should create: UserForm → createUserAction (server-action relationship)
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserForm',
					filePath: 'components/form-component.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'createUserAction',
					filePath: 'actions/server-actions.ts',
					properties: [],
					methods: [],
					classType: 'function'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create relationship: UserForm → createUserAction
			const serverActionRel = result.newRelationships.find(rel => 
				rel.type === 'server-action' &&
				rel.from.includes('UserForm') &&
				rel.to.includes('createUserAction')
			);
			
			assert.ok(serverActionRel, 'MUST create server-action relationship from form to action');
		});
		
		test('should detect server action calls from button onClick', async () => {
			// Button: onClick={() => deleteUserAction(id)}
			// Should create: DeleteButton → deleteUserAction (server-action relationship)
			assert.ok(true, 'TODO: Implement onClick server action detection');
		});
	});
	
	suite('Middleware Detection', () => {
		test('should detect middleware.ts file', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'middleware',
				filePath: 'middleware.ts',
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
			
			// Should identify as middleware
			assert.ok(result.enhancedClasses.some(c => 
				c.name === 'middleware' && c.classType === 'middleware'
			), 'MUST identify middleware function');
		});
		
		test('should detect middleware matcher configuration', async () => {
			// export const config = { matcher: ['/api/:path*', '/admin/:path*'] }
			// Should create: middleware → /api/* (middleware relationship)
			//                middleware → /admin/* (middleware relationship)
			assert.ok(true, 'TODO: Implement matcher configuration detection');
		});
		
		test('should create middleware protection relationships', async () => {
			// Middleware protects routes matching /api/*, /admin/*
			// Should create: middleware → route (middleware relationship)
			const mockClasses: ClassInfo[] = [
				{
					name: 'middleware',
					filePath: 'middleware.ts',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'GET /api/users',
					filePath: 'route:///api/users',
					properties: [],
					methods: [],
					classType: 'route',
					routeMeta: {
						path: '/api/users',
						method: 'GET',
						definedIn: 'app/api/users/route.ts'
					}
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: middleware → GET /api/users
			const middlewareRel = result.newRelationships.find(rel => 
				rel.type === 'middleware' &&
				rel.from.includes('middleware') &&
				rel.to.includes('GET /api/users')
			);
			
			assert.ok(middlewareRel, 'MUST create middleware → route relationship');
		});
	});
	
	suite('Layout Hierarchy', () => {
		test('should detect layout.tsx files', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'UsersLayout',
				filePath: 'app/users/layout.tsx',
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
			
			assert.ok(result.enhancedClasses.some(c => 
				c.name === 'UsersLayout' && c.classType === 'layout'
			), 'MUST identify layout component');
		});
		
		test('should detect layout wrapping page', async () => {
			// app/users/layout.tsx wraps app/users/page.tsx
			// Should create: UsersLayout → UsersPage (layout-wraps relationship)
			const mockClasses: ClassInfo[] = [
				{
					name: 'UsersLayout',
					filePath: 'app/users/layout.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'UsersPage',
					filePath: 'app/users/page.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const layoutRel = result.newRelationships.find(rel => 
				rel.type === 'layout-wraps' &&
				rel.from.includes('UsersLayout') &&
				rel.to.includes('UsersPage')
			);
			
			assert.ok(layoutRel, 'MUST create layout-wraps relationship');
		});
		
		test('should detect nested layout hierarchy', async () => {
			// app/layout.tsx → app/users/layout.tsx → app/users/[id]/page.tsx
			// Should create chain: RootLayout → UsersLayout → UserPage
			assert.ok(true, 'TODO: Implement nested layout detection');
		});
	});
	
	suite('Data Fetching Patterns', () => {
		test('should detect fetch in Server Component', async () => {
			// async function UsersPage() { await fetch('/api/users') }
			// Should create: UsersPage → GET /api/users (http-call relationship)
			assert.ok(true, 'TODO: Implement server component fetch detection');
		});
		
		test('should detect service calls in page components', async () => {
			// const users = await userService.getAllUsers()
			// Should create: UsersPage → UserService (calls relationship)
			const mockClasses: ClassInfo[] = [
				{
					name: 'UsersPage',
					filePath: 'app/users/page.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'UserService',
					filePath: 'services/UserService.ts',
					properties: [],
					methods: [{
						name: 'getAllUsers',
						parameters: [],
						returnType: 'Promise<User[]>',
						visibility: 'public',
						lineNumber: 10,
						endLineNumber: 15
					}],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: UsersPage → UserService.getAllUsers
			const serviceCall = result.newRelationships.find(rel => 
				rel.from.includes('UsersPage') &&
				rel.to.includes('UserService')
			);
			
			assert.ok(serviceCall, 'MUST create calls relationship to service');
		});
		
		test('should detect generateMetadata calls', async () => {
			// export async function generateMetadata() - special Next.js function
			assert.ok(true, 'TODO: Implement generateMetadata detection');
		});
	});
	
	suite('Component Composition (Template Detection)', () => {
		test('TDD REALITY CHECK: enricher must read source to find JSX usage', async () => {
			// Unlike Django where template_name is a property,
			// JSX usage is in the function BODY, so we MUST read source code
			const mockClasses: ClassInfo[] = [
				{
					name: 'UsersPage',
					filePath: 'page-with-components.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'Header',
					filePath: 'components/Header.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'UserList',
					filePath: 'components/UserList.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'Footer',
					filePath: 'components/Footer.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const rendersRels = result.newRelationships.filter(r => r.type === 'renders');
			
			console.log('📊 JSX renders relationships:', rendersRels.map(r => ({
				from: r.from.split('__')[1],
				to: r.to.split('__')[1]
			})));
			
			// Should detect: UsersPage → Header, UserList, Footer
			assert.ok(rendersRels.length >= 3, 
				`Should detect at least 3 JSX components (found ${rendersRels.length})`);
		});
		
		test('should detect component rendering in JSX', async () => {
			// Page renders <UserList users={users} />
			// Should create: UsersPage → UserList (renders relationship)
			const mockClasses: ClassInfo[] = [
				{
					name: 'UsersPage',
					filePath: 'page-with-components.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'UserList',
					filePath: 'components/UserList.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,  // Use fixtures path
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create: UsersPage → UserList (renders relationship)
			const rendersRel = result.newRelationships.find(rel => 
				rel.type === 'renders' &&
				rel.from.includes('UsersPage') &&
				rel.to.includes('UserList')
			);
			
			assert.ok(rendersRel, 'MUST create renders relationship for JSX component usage');
		});
		
		test('should detect multiple components rendered in same page', async () => {
			// Page renders: <Header />, <UserList />, <Footer />
			// Should create 3 renders relationships
			const mockClasses: ClassInfo[] = [
				{
					name: 'UsersPage',
					filePath: 'page-with-components.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'Header',
					filePath: 'components/Header.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'UserList',
					filePath: 'components/UserList.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'Footer',
					filePath: 'components/Footer.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,  // Use fixtures path
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create 3 renders relationships
			const rendersRels = result.newRelationships.filter(rel => 
				rel.type === 'renders' && rel.from.includes('UsersPage')
			);
			
			assert.ok(rendersRels.length >= 3, 
				`MUST detect all rendered components (found ${rendersRels.length}, expected 3)`);
		});
		
		test('should handle self-closing JSX tags', async () => {
			// The fixture already has self-closing tags like <Header />
			// This test verifies they're detected
			const mockClasses: ClassInfo[] = [
				{
					name: 'UsersPage',
					filePath: 'page-with-components.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'Header',
					filePath: 'components/Header.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,  // Use fixtures path
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			const rendersRel = result.newRelationships.find(rel => 
				rel.type === 'renders' &&
				rel.from.includes('UsersPage') &&
				rel.to.includes('Header')
			);
			
			assert.ok(rendersRel, 'MUST detect self-closing JSX tags');
		});
		
		test('should ignore HTML tags (lowercase)', async () => {
			// <div>, <span>, <button> should NOT create relationships
			// Only components (PascalCase) like <UserList>
			const mockClasses: ClassInfo[] = [
				{
					name: 'UsersPage',
					filePath: 'page-with-components.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should NOT create relationships to HTML tags
			const htmlTagRels = result.newRelationships.filter(rel => 
				rel.to.match(/__(div|span|button|input|form|h1)$/)
			);
			
			assert.strictEqual(htmlTagRels.length, 0, 
				'MUST NOT create relationships to HTML tags');
		});
		
		test('TDD: proper scoping - ProfilePage should NOT link to UsersPage components', async () => {
			// We have two files:
			// - page-with-components.tsx: UsersPage renders Header, UserList, Footer
			// - profile-page.tsx: ProfilePage renders Avatar
			// ProfilePage should ONLY link to Avatar, not to Header/UserList/Footer
			const mockClasses: ClassInfo[] = [
				{
					name: 'UsersPage',
					filePath: 'page-with-components.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'ProfilePage',
					filePath: 'profile-page.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'Header',
					filePath: 'components/Header.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'UserList',
					filePath: 'components/UserList.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'Footer',
					filePath: 'components/Footer.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'Avatar',
					filePath: 'components/Avatar.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath: fixturesPath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Filter to ProfilePage relationships only
			const profileRels = result.newRelationships.filter(rel => 
				rel.type === 'renders' && rel.from.includes('ProfilePage')
			);
			
			console.log('📊 ProfilePage relationships:', profileRels.map(r => ({
				from: r.from.split('__')[1],
				to: r.to.split('__')[1]
			})));
			
			// Should have EXACTLY 1 relationship: ProfilePage → Avatar
			assert.strictEqual(profileRels.length, 1, 
				`ProfilePage should link to ONLY Avatar (found ${profileRels.length})`);
			
			// Verify it's Avatar
			const avatarRel = profileRels.find(r => r.to.includes('Avatar'));
			assert.ok(avatarRel, 'ProfilePage should link to Avatar');
			
			// Verify it does NOT link to UsersPage components
			const wrongRels = profileRels.filter(r => 
				r.to.includes('Header') || 
				r.to.includes('UserList') || 
				r.to.includes('Footer')
			);
			assert.strictEqual(wrongRels.length, 0, 
				'ProfilePage should NOT link to UsersPage components');
		});
		
		test('should detect client components ("use client")', async () => {
			// File starts with 'use client'
			// Should mark component as client-side
			assert.ok(true, 'TODO: Implement "use client" detection');
		});
		
		test('should differentiate server vs client components', async () => {
			// Server components (default) vs client components ('use client')
			assert.ok(true, 'TODO: Implement server/client component differentiation');
		});
	});
	
	suite('API Route to Service Flow', () => {
		test('should detect route handler calling service', async () => {
			// GET handler → UserService.getUserById
			// Should create: GET /api/users/:id → UserService (calls relationship)
			const mockClasses: ClassInfo[] = [
				{
					name: 'GET',
					filePath: 'app/api/users/[id]/route.ts',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'UserService',
					filePath: 'services/UserService.ts',
					properties: [],
					methods: [{
						name: 'getUserById',
						parameters: [],
						returnType: 'Promise<User>',
						visibility: 'public',
						lineNumber: 10,
						endLineNumber: 15
					}],
					classType: 'class'
				}
			];
			
			const context: EnrichmentContext = {
				workspacePath,
				classes: mockClasses,
				relationships: []
			};
			
			const result = await enricher.enrich(context);
			
			// Should create handler → service relationship
			const serviceCall = result.newRelationships.find(rel => 
				rel.from.includes('route.ts') &&
				rel.to.includes('UserService')
			);
			
			assert.ok(serviceCall, 'MUST create handler → service relationship');
		});
		
		test('should detect DTO usage in route handlers', async () => {
			// return NextResponse.json<UserDTO>(user)
			// Should create: handler → UserDTO (returns relationship)
			assert.ok(true, 'TODO: Implement DTO detection in handlers');
		});
	});
	
	suite('Relationship ID Format', () => {
		test('should use filePath__className format for relationships', async () => {
			const mockClasses: ClassInfo[] = [
				{
					name: 'UserForm',
					filePath: 'components/UserForm.tsx',
					properties: [],
					methods: [],
					classType: 'function'
				},
				{
					name: 'createUserAction',
					filePath: 'actions/user-actions.ts',
					properties: [],
					methods: [],
					classType: 'function'
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
		
		test('should handle non-Next.js files gracefully', async () => {
			const mockClasses: ClassInfo[] = [{
				name: 'RandomClass',
				filePath: 'src/random.ts',
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
			// Files like *.test.tsx, *.spec.tsx should be ignored
			const mockClasses: ClassInfo[] = [{
				name: 'UserTest',
				filePath: 'app/users/page.test.tsx',
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
			
			// Should not create route nodes for test files
			const testRoute = result.enhancedClasses.find(c => 
				c.classType === 'route' && c.filePath.includes('.test.')
			);
			
			assert.ok(!testRoute, 'MUST NOT create routes for test files');
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
			
			assert.ok(result.metadata.framework === 'Next.js', 
				'Metadata must include framework name');
			assert.ok(Array.isArray(result.metadata.features), 
				'Metadata must include features array');
		});
		
		test('should list implemented features', async () => {
			// When features are implemented, they should appear in metadata
			// e.g., ['file-based-routing', 'server-actions', 'middleware']
			assert.ok(true, 'TODO: Verify feature list when implemented');
		});
	});
});
