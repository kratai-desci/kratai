import * as assert from 'assert';
import { FolderStructureBuilder } from '../../../services/diagram/folderStructure';
import { ReactFlowNode } from '../../../types/view';
import { ClassInfo } from '../../../types/domain';

suite('FolderStructureBuilder Test Suite', () => {
	
	test('should organize Java files into folder hierarchy', () => {
		const mockClassInfo = (name: string, filePath: string): ClassInfo => ({
			name,
			filePath,
			properties: [],
			methods: [],
			classType: 'class'
		});

		const nodes: ReactFlowNode[] = [
			{
				id: 'com/example/controller/UserController.java__UserController',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'UserController',
					classInfo: mockClassInfo('UserController', 'com/example/controller/UserController.java')
				}
			},
			{
				id: 'com/example/service/UserService.java__UserService',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'UserService',
					classInfo: mockClassInfo('UserService', 'com/example/service/UserService.java')
				}
			},
			{
				id: 'com/example/model/User.java__User',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'User',
					classInfo: mockClassInfo('User', 'com/example/model/User.java')
				}
			}
		];

		const root = FolderStructureBuilder.build(nodes);

		// Should not have classes at root (all should be in folders)
		assert.strictEqual(root.classes.length, 0, 'Root should have no classes (all organized in folders)');

		// Should have "com" folder
		assert.ok(root.children.has('com'), 'Should have "com" folder');
		const com = root.children.get('com')!;

		// Should have "com/example" folder
		assert.ok(com.children.has('example'), 'Should have "example" folder under "com"');
		const example = com.children.get('example')!;

		// Should have controller, service, model folders
		assert.ok(example.children.has('controller'), 'Should have "controller" folder');
		assert.ok(example.children.has('service'), 'Should have "service" folder');
		assert.ok(example.children.has('model'), 'Should have "model" folder');

		// Each folder should have one class
		const controller = example.children.get('controller')!;
		const service = example.children.get('service')!;
		const model = example.children.get('model')!;

		assert.strictEqual(controller.classes.length, 1, 'Controller folder should have 1 class');
		assert.strictEqual(service.classes.length, 1, 'Service folder should have 1 class');
		assert.strictEqual(model.classes.length, 1, 'Model folder should have 1 class');

		assert.strictEqual(controller.classes[0].data.label, 'UserController');
		assert.strictEqual(service.classes[0].data.label, 'UserService');
		assert.strictEqual(model.classes[0].data.label, 'User');
	});

	test('should support Kotlin files (.kt)', () => {
		const mockClassInfo = (name: string, filePath: string): ClassInfo => ({
			name,
			filePath,
			properties: [],
			methods: [],
			classType: 'class'
		});

		const nodes: ReactFlowNode[] = [
			{
				id: 'com/example/UserController.kt__UserController',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'UserController',
					classInfo: mockClassInfo('UserController', 'com/example/UserController.kt')
				}
			}
		];

		const root = FolderStructureBuilder.build(nodes);

		// Should not be at root
		assert.strictEqual(root.classes.length, 0, 'Kotlin file should be organized in folders');
		
		const com = root.children.get('com')!;
		const example = com.children.get('example')!;
		assert.strictEqual(example.classes.length, 1, 'Should have 1 Kotlin class in folder');
	});

	test('should support Groovy files (.groovy)', () => {
		const mockClassInfo = (name: string, filePath: string): ClassInfo => ({
			name,
			filePath,
			properties: [],
			methods: [],
			classType: 'class'
		});

		const nodes: ReactFlowNode[] = [
			{
				id: 'com/example/UserService.groovy__UserService',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'UserService',
					classInfo: mockClassInfo('UserService', 'com/example/UserService.groovy')
				}
			}
		];

		const root = FolderStructureBuilder.build(nodes);

		// Should not be at root
		assert.strictEqual(root.classes.length, 0, 'Groovy file should be organized in folders');
		
		const com = root.children.get('com')!;
		const example = com.children.get('example')!;
		assert.strictEqual(example.classes.length, 1, 'Should have 1 Groovy class in folder');
	});

	test('should handle deep Spring Boot package structure (7+ levels)', () => {
		const mockClassInfo = (name: string, filePath: string): ClassInfo => ({
			name,
			filePath,
			properties: [],
			methods: [],
			classType: 'class'
		});

		const nodes: ReactFlowNode[] = [
			{
				id: 'src/main/java/com/company/app/module/UserController.java__UserController',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'UserController',
					classInfo: mockClassInfo('UserController', 'src/main/java/com/company/app/module/UserController.java')
				}
			}
		];

		const root = FolderStructureBuilder.build(nodes);

		// Navigate through 7 levels
		assert.ok(root.children.has('src'), 'Should have src folder');
		const src = root.children.get('src')!;
		
		assert.ok(src.children.has('main'), 'Should have main folder');
		const main = src.children.get('main')!;
		
		assert.ok(main.children.has('java'), 'Should have java folder');
		const java = main.children.get('java')!;
		
		assert.ok(java.children.has('com'), 'Should have com folder');
		const com = java.children.get('com')!;
		
		assert.ok(com.children.has('company'), 'Should have company folder');
		const company = com.children.get('company')!;
		
		assert.ok(company.children.has('app'), 'Should have app folder');
		const app = company.children.get('app')!;
		
		assert.ok(app.children.has('module'), 'Should have module folder');
		const module = app.children.get('module')!;
		
		assert.strictEqual(module.classes.length, 1, 'Deepest folder should have 1 class');
		assert.strictEqual(module.classes[0].data.label, 'UserController');
	});

	test('should count classes and folders correctly', () => {
		const mockClassInfo = (name: string, filePath: string): ClassInfo => ({
			name,
			filePath,
			properties: [],
			methods: [],
			classType: 'class'
		});

		const nodes: ReactFlowNode[] = [
			{
				id: '1',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'A',
					classInfo: mockClassInfo('A', 'com/example/A.java')
				}
			},
			{
				id: '2',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'B',
					classInfo: mockClassInfo('B', 'com/example/B.java')
				}
			},
			{
				id: '3',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'C',
					classInfo: mockClassInfo('C', 'com/other/C.java')
				}
			}
		];

		const root = FolderStructureBuilder.build(nodes);

		// Count total classes
		const totalClasses = FolderStructureBuilder.countClasses(root);
		assert.strictEqual(totalClasses, 3, 'Should count 3 classes total');

		// Count folders (root + com + example + other = 4)
		const totalFolders = FolderStructureBuilder.countFolders(root);
		assert.strictEqual(totalFolders, 4, 'Should count 4 folders (root + com + example + other)');
	});

	test('should support Spring template files (JSP, FreeMarker, Mustache)', () => {
		const mockClassInfo = (name: string, filePath: string): ClassInfo => ({
			name,
			filePath,
			properties: [],
			methods: [],
			classType: 'class'
		});

		const nodes: ReactFlowNode[] = [
			{
				id: 'jsp',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'userList',
					classInfo: mockClassInfo('userList', 'WEB-INF/views/user/userList.jsp')
				}
			},
			{
				id: 'ftl',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'dashboard',
					classInfo: mockClassInfo('dashboard', 'templates/admin/dashboard.ftl')
				}
			},
			{
				id: 'mustache',
				type: 'customClass',
				position: { x: 0, y: 0 },
				data: {
					label: 'home',
					classInfo: mockClassInfo('home', 'templates/home.mustache')
				}
			}
		];

		const root = FolderStructureBuilder.build(nodes);

		// All should be in folders, not at root
		assert.strictEqual(root.classes.length, 0, 'All template files should be organized in folders');

		// JSP in WEB-INF/views/user/
		const webinf = root.children.get('WEB-INF')!;
		assert.ok(webinf, 'Should have WEB-INF folder');
		const views = webinf.children.get('views')!;
		const user = views.children.get('user')!;
		assert.strictEqual(user.classes.length, 1, 'Should have JSP in user folder');
		assert.strictEqual(user.classes[0].data.label, 'userList');

		// FreeMarker in templates/admin/
		const templates = root.children.get('templates')!;
		assert.ok(templates, 'Should have templates folder');
		const admin = templates.children.get('admin')!;
		assert.strictEqual(admin.classes.length, 1, 'Should have FTL in admin folder');
		assert.strictEqual(admin.classes[0].data.label, 'dashboard');

		// Mustache in templates/
		assert.strictEqual(templates.classes.length, 1, 'Should have Mustache in templates folder');
		assert.strictEqual(templates.classes[0].data.label, 'home');
	});
});
