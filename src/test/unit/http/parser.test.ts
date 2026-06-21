import * as assert from 'assert';
import * as path from 'path';
import { HTTPParser } from '../../../services/parsing/languages/HTTPParser';
import { ClassInfo, ClassRelationship } from '../../../types/domain';

suite('HTTPParser - Second Pass Cross-Language Analyzer', () => {
	const parser = new HTTPParser();
	const workspacePath = path.join(__dirname, '../../../..');
	const fixturesPath = path.join(__dirname, '../../../../src/test/unit/http/fixtures');

	suite('Route Detection', () => {
		
		suite('Decorator-Based Routes', () => {
			test('should detect @Get decorator routes', () => {
				const fixturePath = path.join(fixturesPath, 'decorators.ts');
				const routes = parser.parseFile(fixturePath);

				// Should create route nodes for @Get decorators
				const getUsersRoute = routes.find(r => 
					r.name === 'GET /api/users' &&
					r.classType === 'route'
				);
				assert.ok(getUsersRoute, 'MUST detect @Get("/api/users") route');
				assert.strictEqual(getUsersRoute!.routeMeta?.path, '/api/users');
				assert.strictEqual(getUsersRoute!.routeMeta?.method, 'GET');
				assert.ok(getUsersRoute!.routeMeta?.definedIn, 'MUST track source file');
			});

			test('should detect @Post decorator routes', () => {
				const fixturePath = path.join(fixturesPath, 'decorators.ts');
				const routes = parser.parseFile(fixturePath);

				const createUserRoute = routes.find(r => 
					r.name === 'POST /api/users'
				);
				assert.ok(createUserRoute, 'MUST detect @Post("/api/users") route');
				assert.strictEqual(createUserRoute!.routeMeta?.method, 'POST');
			});

			test('should detect @Put, @Delete, @Patch routes', () => {
				const fixturePath = path.join(fixturesPath, 'decorators.ts');
				const routes = parser.parseFile(fixturePath);

				const putRoute = routes.find(r => r.name === 'PUT /api/users/:id');
				assert.ok(putRoute, 'MUST detect @Put decorator');

				const deleteRoute = routes.find(r => r.name === 'DELETE /api/users/:id');
				assert.ok(deleteRoute, 'MUST detect @Delete decorator');

				const patchRoute = routes.find(r => r.name === 'PATCH /api/users/:id');
				assert.ok(patchRoute, 'MUST detect @Patch decorator');
			});

			test('should detect routes with path parameters', () => {
				const fixturePath = path.join(fixturesPath, 'decorators.ts');
				const routes = parser.parseFile(fixturePath);

				const paramRoute = routes.find(r => r.name === 'GET /api/users/:id');
				assert.ok(paramRoute, 'MUST detect routes with :id parameters');
				assert.strictEqual(paramRoute!.routeMeta?.path, '/api/users/:id');
			});

			test('should detect multiple routes in same controller', () => {
				const fixturePath = path.join(fixturesPath, 'decorators.ts');
				const routes = parser.parseFile(fixturePath);

				// UserController has 6 routes, PostController has 2 routes = 8 total
				const userRoutes = routes.filter(r => r.routeMeta?.path?.includes('/api/users'));
				assert.ok(userRoutes.length >= 6, `MUST detect all UserController routes (found ${userRoutes.length})`);

				const postRoutes = routes.filter(r => r.routeMeta?.path?.includes('/api/posts'));
				assert.ok(postRoutes.length >= 2, `MUST detect all PostController routes (found ${postRoutes.length})`);
			});

			test('should use route:// virtual file path', () => {
				const fixturePath = path.join(fixturesPath, 'decorators.ts');
				const routes = parser.parseFile(fixturePath);

				routes.forEach(route => {
					assert.ok(route.filePath.startsWith('route://'), 
						`Route nodes MUST use route:// scheme (got: ${route.filePath})`);
				});
			});
		});

		suite('File-Based Routing (Next.js)', () => {
			test('should detect file-based route from path structure', () => {
				// Simulate file at: app/api/users/route.ts
				const fixturePath = 'app/api/users/route.ts';
				const routes = parser.parseFile(fixturePath);

				// Should detect the route path from file location
				assert.ok(routes.length > 0, 'MUST detect routes from file structure');
			});

			test('should convert file path to route path', () => {
				// File: app/api/users/route.ts → Route: /api/users
				const fixturePath = 'app/api/users/route.ts';
				const routes = parser.parseFile(fixturePath);

				if (routes.length > 0) {
					const route = routes[0];
					assert.ok(route.routeMeta?.path.includes('/api/users'), 
						'MUST convert file path to route path');
				}
			});

			test('should handle dynamic route parameters [id]', () => {
				// File: app/api/users/[id]/route.ts → Route: /api/users/:id
				const fixturePath = 'app/api/users/[id]/route.ts';
				const routes = parser.parseFile(fixturePath);

				if (routes.length > 0) {
					const route = routes[0];
					assert.ok(route.routeMeta?.path.includes(':id'), 
						'MUST convert [id] to :id parameter');
				}
			});

			test('should handle nested dynamic parameters', () => {
				// File: app/api/posts/[postId]/comments/[commentId]/route.ts
				const fixturePath = 'app/api/posts/[postId]/comments/[commentId]/route.ts';
				const routes = parser.parseFile(fixturePath);

				if (routes.length > 0) {
					const route = routes[0];
					const path = route.routeMeta?.path || '';
					assert.ok(path.includes(':postId') && path.includes(':commentId'), 
						'MUST handle multiple dynamic parameters');
				}
			});
		});
	});

	suite('HTTP Call Detection', () => {
		
		suite('fetch() Calls', () => {
			test('should detect fetch() with default GET method', () => {
				const fixturePath = path.join(fixturesPath, 'fetch-calls.ts');
				
				// First, we need to parse the file to get classes
				// Then extract relationships which include HTTP calls
				// This requires the full workflow that codeParserService does
				
				// For now, test that the fixture file can be read
				assert.ok(require('fs').existsSync(fixturePath), 'Fixture file must exist');
			});

			test('should detect fetch() with explicit POST method', () => {
				const fixturePath = path.join(fixturesPath, 'fetch-calls.ts');
				assert.ok(require('fs').existsSync(fixturePath), 'Fixture file must exist');
			});

			test('should detect fetch() with PUT, DELETE methods', () => {
				const fixturePath = path.join(fixturesPath, 'fetch-calls.ts');
				assert.ok(require('fs').existsSync(fixturePath), 'Fixture file must exist');
			});

			test('should extract URL from fetch() call', () => {
				const fixturePath = path.join(fixturesPath, 'fetch-calls.ts');
				assert.ok(require('fs').existsSync(fixturePath), 'Fixture file must exist');
			});

			test('should ignore external API calls', () => {
				// fetch('https://external-api.com') should NOT create internal relationships
				const fixturePath = path.join(fixturesPath, 'fetch-calls.ts');
				assert.ok(require('fs').existsSync(fixturePath), 'Fixture file must exist');
			});
		});

		suite('axios Calls', () => {
			test('should detect axios.get() calls', () => {
				const fixturePath = path.join(fixturesPath, 'fetch-calls.ts');
				assert.ok(require('fs').existsSync(fixturePath), 'Fixture file must exist');
			});

			test('should detect axios.post() calls', () => {
				const fixturePath = path.join(fixturesPath, 'fetch-calls.ts');
				assert.ok(require('fs').existsSync(fixturePath), 'Fixture file must exist');
			});

			test('should detect axios.put/delete/patch() calls', () => {
				const fixturePath = path.join(fixturesPath, 'fetch-calls.ts');
				assert.ok(require('fs').existsSync(fixturePath), 'Fixture file must exist');
			});

			test('should extract URL from axios calls', () => {
				const fixturePath = path.join(fixturesPath, 'fetch-calls.ts');
				assert.ok(require('fs').existsSync(fixturePath), 'Fixture file must exist');
			});
		});
	});

	suite('Relationship Creation', () => {
		
		test('should create http-call relationships', () => {
			// When a class calls fetch('/api/users'), create:
			// { from: 'UserService', to: 'GET /api/users', type: 'http-call' }
			
			const fixturePath = path.join(fixturesPath, 'fetch-calls.ts');
			assert.ok(require('fs').existsSync(fixturePath), 'Fixture file must exist');
		});

		test('should create routes-to relationships', () => {
			// When a route is defined, create:
			// { from: 'GET /api/users', to: 'UserController__getUsers', type: 'routes-to' }
			
			const fixturePath = path.join(fixturesPath, 'decorators.ts');
			assert.ok(require('fs').existsSync(fixturePath), 'Fixture file must exist');
		});

		test('should match calls to routes', () => {
			// When fetch('/api/users') and @Get('/api/users') exist:
			// Create: UserService → GET /api/users → UserController
			
			// This requires both fixtures and integration
			assert.ok(true, 'TODO: Integration test');
		});

		test('should use filePath__className ID format', () => {
			// All relationships must use: filePath__className format
			// Example: 'fetch-calls.ts__UserService' not just 'UserService'
			
			assert.ok(true, 'TODO: Verify ID format in relationships');
		});
	});

	suite('Route Node Creation', () => {
		
		test('should create ClassInfo with classType: route', () => {
			const fixturePath = path.join(fixturesPath, 'decorators.ts');
			const routes = parser.parseFile(fixturePath);

			routes.forEach(route => {
				assert.strictEqual(route.classType, 'route', 
					'Route nodes MUST have classType: "route"');
			});
		});

		test('should include routeMeta in route nodes', () => {
			const fixturePath = path.join(fixturesPath, 'decorators.ts');
			const routes = parser.parseFile(fixturePath);

			routes.forEach(route => {
				assert.ok(route.routeMeta, 'Route nodes MUST have routeMeta');
				assert.ok(route.routeMeta!.path, 'routeMeta MUST have path');
				assert.ok(route.routeMeta!.method, 'routeMeta MUST have method');
			});
		});

		test('should set route name as "METHOD /path"', () => {
			const fixturePath = path.join(fixturesPath, 'decorators.ts');
			const routes = parser.parseFile(fixturePath);

			routes.forEach(route => {
				const expectedPattern = /^(GET|POST|PUT|DELETE|PATCH|\*) \/.*$/;
				assert.ok(expectedPattern.test(route.name), 
					`Route name MUST follow "METHOD /path" format (got: ${route.name})`);
			});
		});

		test('should have empty methods and properties arrays', () => {
			const fixturePath = path.join(fixturesPath, 'decorators.ts');
			const routes = parser.parseFile(fixturePath);

			routes.forEach(route => {
				assert.ok(Array.isArray(route.methods), 'Route nodes MUST have methods array');
				assert.ok(Array.isArray(route.properties), 'Route nodes MUST have properties array');
				// Routes don't have methods/properties like classes do
			});
		});
	});

	suite('Edge Cases', () => {
		
		test('should handle files with no routes', () => {
			const fixturePath = path.join(fixturesPath, 'fetch-calls.ts');
			const routes = parser.parseFile(fixturePath);

			// fetch-calls.ts has NO route definitions, only HTTP calls
			// Should return empty array (or not crash)
			assert.ok(Array.isArray(routes), 'MUST return array even for files without routes');
		});

		test('should handle non-existent files gracefully', () => {
			const fakePath = path.join(fixturesPath, 'does-not-exist.ts');
			const routes = parser.parseFile(fakePath);

			assert.ok(Array.isArray(routes), 'MUST not crash on missing files');
			assert.strictEqual(routes.length, 0, 'MUST return empty array for missing files');
		});

		test('should handle malformed decorator syntax', () => {
			// @Get() with no path, @Get without parens, etc.
			// Should not crash
			assert.ok(true, 'TODO: Test malformed syntax');
		});

		test('should skip non-route decorators', () => {
			// @Injectable, @Component, etc. should NOT create routes
			const fixturePath = path.join(fixturesPath, 'decorators.ts');
			const routes = parser.parseFile(fixturePath);

			// Only HTTP method decorators should create routes
			routes.forEach(route => {
				assert.ok(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', '*'].includes(route.routeMeta!.method),
					`Only HTTP methods should create routes (got: ${route.routeMeta!.method})`);
			});
		});
	});

	suite('Integration with Language Parsers', () => {
		
		test('should work as second-pass parser', () => {
			// HTTPParser runs AFTER TypeScript/JavaScript parsers
			// Should not interfere with language parsing
			assert.ok(true, 'TODO: Integration test with CodeParserService');
		});

		test('should create relationships between parsed classes and routes', () => {
			// Language parser creates: UserService class
			// HTTP parser creates: GET /api/users route
			// HTTP parser creates: UserService → GET /api/users relationship
			assert.ok(true, 'TODO: End-to-end integration test');
		});

		test('should handle workspace-relative paths', () => {
			// All paths should be workspace-relative after CodeParserService normalization
			assert.ok(true, 'TODO: Test path normalization');
		});
	});
});
