import * as fs from 'fs';
import * as path from 'path';
import { AbstractEnricher, EnrichmentContext, EnrichmentResult } from '../AbstractEnricher';
import { ClassRelationship } from '../../../types/domain';

/**
 * Django Framework Enricher
 * 
 * Detects and enriches Django-specific patterns:
 * 
 * 1. URL patterns → Views
 *    - path('users/', views.UserListView) → Route /users/
 *    - Dynamic parameters: <int:pk>, <slug:slug>
 * 
 * 2. ORM Model relationships
 *    - ForeignKey → belongs-to relationships
 *    - ManyToManyField → many-to-many relationships
 *    - OneToOneField → one-to-one relationships
 * 
 * 3. Django REST Framework
 *    - ViewSets → Serializers
 *    - Serializers → Models
 *    - API view decorators (@api_view)
 * 
 * 4. Class-based views
 *    - ListView, DetailView, CreateView, etc.
 *    - View → Model relationships
 * 
 * 5. Function-based views
 *    - @login_required, @permission_required decorators
 *    - Request/response handling
 * 
 * 6. Middleware
 *    - Middleware → View protection
 */
export class DjangoEnricher extends AbstractEnricher {
	readonly framework = 'Django';
	readonly priority = 10; // Run early (lower = earlier)
	
	/**
	 * Detect if Django is present in the workspace
	 */
	detect(context: EnrichmentContext): boolean {
		// Method 1: Check for manage.py
		if (fs.existsSync(path.join(context.workspacePath, 'manage.py'))) {
			return true;
		}
		
		// Method 2: Check for Django-specific files
		const hasDjangoFiles = this.checkDjangoFiles(context.workspacePath);
		if (hasDjangoFiles) {
			return true;
		}
		
		return false;
	}
	
	/**
	 * Check for Django-specific files in workspace
	 */
	private checkDjangoFiles(workspacePath: string): boolean {
		// Check for files with Django-specific patterns
		const djangoFilePatterns = [
			'urls.py', 'models.py', 'views.py', 'admin.py', 'serializers.py',
			'serializer', 'middleware.py', 'permissions.py'
		];
		
		// Recursively check for Django files
		const checkDir = (dir: string, depth: number = 0): boolean => {
			if (depth > 3) return false; // Limit recursion depth
			
			try {
				const entries = fs.readdirSync(dir, { withFileTypes: true });
				
				for (const entry of entries) {
					if (entry.isFile() && entry.name.endsWith('.py')) {
						// Check if filename matches Django patterns
						for (const pattern of djangoFilePatterns) {
							if (entry.name.includes(pattern)) {
								return true;
							}
						}
					}
					
					if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
						const subDir = path.join(dir, entry.name);
						if (checkDir(subDir, depth + 1)) {
							return true;
						}
					}
				}
			} catch (error) {
				// Ignore permission errors
			}
			
			return false;
		};
		
		return checkDir(workspacePath);
	}
	
	/**
	 * Enrich the code graph with Django-specific knowledge
	 */
	async enrich(context: EnrichmentContext): Promise<EnrichmentResult> {
		// Filter out migrations and test files
		const enhancedClasses = context.classes.filter(c => {
			const filePath = c.filePath.replace(/\\/g, '/');
			
			// Ignore migrations
			if (filePath.includes('/migrations/') || filePath.includes('migrations/')) {
				return false;
			}
			
			// Ignore test files
			if (filePath.includes('test_') || filePath.includes('_test.py') || filePath.includes('/tests/')) {
				return false;
			}
			
			return true;
		});
		
		const newRelationships: ClassRelationship[] = [];
		const features: string[] = [];
		
		// 1. Detect and enrich models (ORM)
		this.enrichModels(enhancedClasses);
		features.push('models');
		
		// 2. Create ORM relationships (ForeignKey, ManyToMany, OneToOne)
		const ormRels = this.createORMRelationships(enhancedClasses);
		newRelationships.push(...ormRels);
		features.push('orm-relationships');
		
		// 3. Detect and enrich views
		this.enrichViews(enhancedClasses);
		features.push('views');
		
		// 4. Detect and enrich serializers (DRF)
		this.enrichSerializers(enhancedClasses);
		features.push('serializers');
		
		// 5. Detect and enrich ViewSets (DRF)
		this.enrichViewSets(enhancedClasses);
		features.push('viewsets');
		
		// 6. Create View → Model relationships
		const viewModelRels = this.createViewModelRelationships(enhancedClasses);
		newRelationships.push(...viewModelRels);
		
		// 7. Create View → Serializer relationships
		const viewSerializerRels = this.createViewSerializerRelationships(enhancedClasses);
		newRelationships.push(...viewSerializerRels);
		
		// 8. Create Serializer → Model relationships
		const serializerModelRels = this.createSerializerModelRelationships(enhancedClasses);
		newRelationships.push(...serializerModelRels);
		
		// 9. Create nested serializer relationships
		const nestedSerializerRels = this.createNestedSerializerRelationships(enhancedClasses);
		newRelationships.push(...nestedSerializerRels);
		
		// 10. Create View → Template relationships
		const viewTemplateRels = this.createViewTemplateRelationships(enhancedClasses, context);
		newRelationships.push(...viewTemplateRels);
		features.push('view-templates');
		
		// 11. Detect middleware
		this.enrichMiddleware(enhancedClasses);
		features.push('middleware');
		
		// 12. Create middleware protection relationships
		const middlewareRels = this.createMiddlewareRelationships(enhancedClasses);
		newRelationships.push(...middlewareRels);
		
		// 13. Detect URL patterns (synthetic route nodes)
		const urlRels = this.createURLRouteRelationships(enhancedClasses, context);
		newRelationships.push(...urlRels);
		features.push('url-routing');
		
		return {
			enhancedClasses,
			newRelationships,
			metadata: {
				framework: this.framework,
				features
			}
		};
	}
	
	/**
	 * Get file patterns for Django files
	 */
	getFilePatterns(): string[] {
		return [
			'**/urls.py',
			'**/views.py',
			'**/models.py',
			'**/serializers.py',
			'**/admin.py',
			'**/forms.py',
			'**/middleware.py',
			'**/permissions.py',
			'**/signals.py'
		];
	}
	
	// ========================================
	// Private helper methods
	// ========================================
	
	/**
	 * Enrich Django models
	 */
	private enrichModels(classes: any[]): void {
		for (const classInfo of classes) {
			// Check if it extends models.Model
			if (classInfo.extends && 
			    (classInfo.extends === 'models.Model' || 
			     classInfo.extends === 'Model' ||
			     classInfo.extends.includes('models.Model'))) {
				classInfo.classType = 'model';
			}
		}
	}
	
	/**
	 * Create ORM relationships (ForeignKey, ManyToMany, OneToOne)
	 */
	private createORMRelationships(classes: any[]): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		const models = classes.filter(c => c.classType === 'model');
		
		for (const model of models) {
			if (!model.properties) continue;
			
			for (const prop of model.properties) {
				const propType = prop.type || '';
				
				// ForeignKey relationships (belongs-to)
				if (propType.includes('ForeignKey') || propType.includes('models.ForeignKey')) {
					// Try to extract target model from property name or type
					const targetModel = this.inferTargetModel(prop.name, propType, models);
					if (targetModel) {
						relationships.push({
							from: this.getClassId(model),
							to: this.getClassId(targetModel),
							type: 'belongs-to',
							metadata: { field: prop.name }
						});
					}
				}
				
				// ManyToManyField relationships
				if (propType.includes('ManyToManyField') || propType.includes('models.ManyToManyField')) {
					const targetModel = this.inferTargetModel(prop.name, propType, models);
					if (targetModel) {
						relationships.push({
							from: this.getClassId(model),
							to: this.getClassId(targetModel),
							type: 'many-to-many',
							metadata: { field: prop.name }
						});
					}
				}
				
				// OneToOneField relationships
				if (propType.includes('OneToOneField') || propType.includes('models.OneToOneField')) {
					const targetModel = this.inferTargetModel(prop.name, propType, models);
					if (targetModel) {
						relationships.push({
							from: this.getClassId(model),
							to: this.getClassId(targetModel),
							type: 'one-to-one',
							metadata: { field: prop.name }
						});
					}
				}
			}
		}
		
		return relationships;
	}
	
	/**
	 * Infer target model from property name and type
	 */
	private inferTargetModel(propertyName: string, propertyType: string, models: any[]): any | null {
		// First, try to extract from type if it includes model name
		for (const model of models) {
			if (propertyType.includes(`(${model.name})`) ||
			    propertyType.includes(`<${model.name}>`) ||
			    propertyType === model.name) {
				return model;
			}
		}
		
		// Second, try naming conventions
		// 'author' → 'User' or 'Author'
		// 'categories' → 'Category' (singularize)
		// 'user' → 'User' (capitalize)
		
		const propertyLower = propertyName.toLowerCase();
		
		for (const model of models) {
			const modelLower = model.name.toLowerCase();
			
			// Exact match (case-insensitive)
			if (propertyLower === modelLower) {
				return model;
			}
			
			// Plural to singular (simplified English pluralization)
			if (propertyLower.endsWith('ies') && modelLower === propertyLower.slice(0, -3) + 'y') {
				// categories → category
				return model;
			}
			if (propertyLower.endsWith('es') && modelLower === propertyLower.slice(0, -2)) {
				// boxes → box
				return model;
			}
			if (propertyLower.endsWith('s') && modelLower === propertyLower.slice(0, -1)) {
				// users → user
				return model;
			}
			
			// Special cases: author → User (common pattern in Django)
			if (propertyName === 'author' && model.name === 'User') {
				return model;
			}
		}
		
		return null;
	}
	
	/**
	 * Enrich Django views
	 */
	private enrichViews(classes: any[]): void {
		for (const classInfo of classes) {
			// Check for class-based views (extends Django view classes)
			if (classInfo.extends) {
				const djangoViews = ['ListView', 'DetailView', 'CreateView', 'UpdateView', 'DeleteView', 
				                     'TemplateView', 'RedirectView', 'View'];
				if (djangoViews.some(v => classInfo.extends.includes(v))) {
					classInfo.classType = 'view';
				}
			}
			
			// Note: Function-based views keep classType='function' but we still treat them as views
		}
	}
	
	/**
	 * Enrich Django REST Framework serializers
	 */
	private enrichSerializers(classes: any[]): void {
		for (const classInfo of classes) {
			// Check if it extends serializers.ModelSerializer or serializers.Serializer
			if (classInfo.extends && 
			    (classInfo.extends.includes('Serializer') || 
			     classInfo.extends.includes('serializers.'))) {
				classInfo.classType = 'serializer';
			}
		}
	}
	
	/**
	 * Enrich Django REST Framework ViewSets
	 */
	private enrichViewSets(classes: any[]): void {
		for (const classInfo of classes) {
			// Check if it extends ViewSet classes
			if (classInfo.extends && 
			    (classInfo.extends.includes('ViewSet') || 
			     classInfo.extends.includes('viewsets.'))) {
				classInfo.classType = 'viewset';
			}
		}
	}
	
	/**
	 * Create View → Model relationships
	 */
	private createViewModelRelationships(classes: any[]): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		const views = classes.filter(c => c.classType === 'view' || c.classType === 'viewset');
		const models = classes.filter(c => c.classType === 'model');
		
		for (const view of views) {
			if (!view.properties) continue;
			
			// Check for 'model' property in class-based views
			for (const prop of view.properties) {
				if (prop.name === 'model' || prop.name === 'queryset') {
					// Find matching model
					const modelClass = models.find(m => 
						prop.type === m.name || 
						prop.type.includes(m.name)
					);
					
					if (modelClass) {
						relationships.push({
							from: this.getClassId(view),
							to: this.getClassId(modelClass),
							type: 'uses',
							metadata: { property: prop.name }
						});
					}
				}
			}
		}
		
		return relationships;
	}
	
	/**
	 * Create View/ViewSet → Serializer relationships
	 */
	private createViewSerializerRelationships(classes: any[]): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		const views = classes.filter(c => c.classType === 'view' || c.classType === 'viewset');
		const serializers = classes.filter(c => c.classType === 'serializer');
		
		for (const view of views) {
			if (!view.properties) continue;
			
			// Check for 'serializer_class' property in ViewSets
			for (const prop of view.properties) {
				if (prop.name === 'serializer_class') {
					// Find matching serializer
					const serializerClass = serializers.find(s => 
						prop.type === s.name || 
						prop.type.includes(s.name)
					);
					
					if (serializerClass) {
						relationships.push({
							from: this.getClassId(view),
							to: this.getClassId(serializerClass),
							type: 'uses',
							metadata: { property: 'serializer_class' }
						});
					}
				}
			}
		}
		
		return relationships;
	}
	
	/**
	 * Create Serializer → Model relationships
	 */
	private createSerializerModelRelationships(classes: any[]): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		const serializers = classes.filter(c => c.classType === 'serializer');
		const models = classes.filter(c => c.classType === 'model');
		
		for (const serializer of serializers) {
			// Infer model from serializer name (e.g., UserSerializer → User)
			const serializerName = serializer.name;
			if (serializerName.endsWith('Serializer')) {
				const modelName = serializerName.replace('Serializer', '');
				const modelClass = models.find(m => m.name === modelName);
				
				if (modelClass) {
					relationships.push({
						from: this.getClassId(serializer),
						to: this.getClassId(modelClass),
						type: 'serializes',
						metadata: { inferred: true }
					});
				}
			}
		}
		
		return relationships;
	}
	
	/**
	 * Create nested serializer relationships
	 */
	private createNestedSerializerRelationships(classes: any[]): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		const serializers = classes.filter(c => c.classType === 'serializer');
		
		for (const serializer of serializers) {
			if (!serializer.properties) continue;
			
			for (const prop of serializer.properties) {
				// Check if property type is another serializer
				const nestedSerializer = serializers.find(s => 
					prop.type === s.name || 
					prop.type.includes(s.name)
				);
				
				if (nestedSerializer && nestedSerializer !== serializer) {
					relationships.push({
						from: this.getClassId(serializer),
						to: this.getClassId(nestedSerializer),
						type: 'uses',
						metadata: { nested: true, field: prop.name }
					});
				}
			}
		}
		
		return relationships;
	}
	
	/**
	 * Create View → Template relationships
	 * Detects template_name property in class-based views and render() calls in function-based views
	 */
	private createViewTemplateRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		// Find views and templates
		const views = classes.filter(c => 
			c.classType === 'view' || 
			c.classType === 'class' || 
			c.classType === 'function'
		);
		const templates = classes.filter(c => c.classType === 'template');
		
		if (templates.length === 0) {
			return relationships; // No templates to link to
		}
		
		for (const view of views) {
			let templatePath: string | null = null;
			
			// Method 1: Check for template_name property in class-based views (from PropertyInfo)
			if (view.properties) {
				const templateNameProp = view.properties.find((p: any) => p.name === 'template_name');
				if (templateNameProp) {
					// Try to extract from source file first (for real files)
					templatePath = this.extractTemplateFromSource(view.filePath, view.name, 'template_name', context.workspacePath);
				}
			}
			
			// Method 2: Check for render() calls in function-based views (requires reading source)
			if (!templatePath && view.classType === 'function') {
				templatePath = this.extractTemplateFromRenderCall(view.filePath, view.name, context.workspacePath);
			}
			
			// Match template by path
			if (templatePath) {
				const matchedTemplate = this.findTemplateByPath(templatePath, templates);
				
				if (matchedTemplate) {
					relationships.push({
						from: this.getClassId(view),
						to: this.getClassId(matchedTemplate),
						type: 'renders',
						metadata: { template: templatePath }
					});
				}
			}
		}
		
		return relationships;
	}
	
	/**
	 * Extract template path from template_name = 'path' in source file for a specific class
	 */
	private extractTemplateFromSource(filePath: string, className: string, propertyName: string, workspacePath: string): string | null {
		try {
			const fullPath = path.join(workspacePath, filePath);
			
			if (!fs.existsSync(fullPath)) {
				return null;
			}
			
			const sourceCode = fs.readFileSync(fullPath, 'utf-8');
			
			// Find the class definition first
			const classRegex = new RegExp(`class\\s+${className}\\s*\\([^)]+\\):`, 'g');
			const classMatch = classRegex.exec(sourceCode);
			
			if (!classMatch) {
				return null; // Class not found
			}
			
			// Look for template_name after the class definition
			const afterClass = sourceCode.substring(classMatch.index);
			
			// Find the next class definition or end of file to limit search scope
			const nextClassMatch = /\nclass\s+\w+/.exec(afterClass.substring(1));
			const searchScope = nextClassMatch 
				? afterClass.substring(0, nextClassMatch.index + 1)
				: afterClass;
			
			// Match: template_name = 'webapp/task_form.html' or "webapp/task_form.html"
			const regex = new RegExp(`${propertyName}\\s*=\\s*['"]([^'"]+)['"]`, 'g');
			const match = regex.exec(searchScope);
			
			if (match && match[1]) {
				return match[1]; // Return the template path
			}
		} catch (error) {
			// Ignore errors (file not found, permission denied, etc.)
		}
		
		return null;
	}
	
	/**
	 * Extract template path from render(request, 'template.html') calls
	 */
	private extractTemplateFromRenderCall(filePath: string, functionName: string, workspacePath: string): string | null {
		try {
			const fullPath = path.join(workspacePath, filePath);
			if (!fs.existsSync(fullPath)) {
				return null;
			}
			
			const sourceCode = fs.readFileSync(fullPath, 'utf-8');
			
			// Find the function definition
			const funcRegex = new RegExp(`def\\s+${functionName}\\s*\\([^)]*\\):`, 'g');
			const funcMatch = funcRegex.exec(sourceCode);
			
			if (!funcMatch) {
				return null;
			}
			
			// Look for render() call after function definition
			const afterFunc = sourceCode.substring(funcMatch.index);
			
			// Match: render(request, 'webapp/task_list.html') or render(request, "template.html", ...)
			const renderRegex = /render\s*\([^,]+,\s*['"]([^'"]+)['"]/g;
			const renderMatch = renderRegex.exec(afterFunc);
			
			if (renderMatch && renderMatch[1]) {
				return renderMatch[1]; // Return the template path
			}
		} catch (error) {
			// Ignore errors
		}
		
		return null;
	}
	
	/**
	 * Find template by path (matches by filename, handles nested paths)
	 * E.g., 'webapp/task_list.html' matches 'templates/webapp/task_list.html'
	 */
	private findTemplateByPath(templatePath: string, templates: any[]): any | null {
		// Extract filename from template path
		const templateFileName = path.basename(templatePath);
		
		// Try exact filename match first
		for (const template of templates) {
			if (template.name === templateFileName) {
				// Additional check: ensure path components match if possible
				if (template.filePath.includes(templatePath) || 
				    template.filePath.endsWith(templatePath)) {
					return template;
				}
			}
		}
		
		// Fallback: just match by filename
		return templates.find(t => t.name === templateFileName) || null;
	}
	
	/**
	 * Enrich middleware classes
	 */
	private enrichMiddleware(classes: any[]): void {
		for (const classInfo of classes) {
			// Check if it extends MiddlewareMixin or is in middleware.py
			if (classInfo.extends && classInfo.extends.includes('Middleware')) {
				classInfo.classType = 'middleware';
			}
			
			// Also check filename
			if (classInfo.filePath.includes('middleware.py') && classInfo.classType === 'class') {
				classInfo.classType = 'middleware';
			}
		}
	}
	
	/**
	 * Create middleware → view protection relationships
	 */
	private createMiddlewareRelationships(classes: any[]): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		const middleware = classes.filter(c => c.classType === 'middleware');
		
		// Find all views (class-based and function-based)
		const views = classes.filter(c => {
			if (c.classType === 'view' || c.classType === 'viewset') {
				return true;
			}
			// Function-based views in views.py
			if (c.classType === 'function') {
				const filePath = (c.filePath || '').replace(/\\/g, '/');
				return filePath.includes('views.py');
			}
			return false;
		});
		
		// Create relationships: middleware → view (protected-by)
		// This means "middleware protects view"
		for (const mw of middleware) {
			for (const view of views) {
				relationships.push({
					from: this.getClassId(mw),
					to: this.getClassId(view),
					type: 'protected-by',
					metadata: { middleware: mw.name }
				});
			}
		}
		
		return relationships;
	}
	
	/**
	 * Create URL route relationships (by parsing urls.py files)
	 */
	private createURLRouteRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		// Find all urls.py files in workspace
		const urlFiles = this.findUrlFiles(context.workspacePath);
		
		if (urlFiles.length === 0) {
			// Fallback to heuristic approach if no urls.py found
			return this.createHeuristicRoutes(classes);
		}
		
		// Parse each urls.py file
		for (const urlFile of urlFiles) {
			const patterns = this.parseUrlFile(urlFile, classes);
			
			for (const pattern of patterns) {
				// Create synthetic route node
				const routeNode = {
					name: pattern.path,
					filePath: `route://${pattern.path}`,
					classType: 'route',
					properties: [],
					methods: [],
					routeMeta: {
						path: pattern.path,
						method: 'GET',
						definedIn: urlFile,
						viewName: pattern.viewName,
						dynamicParams: pattern.dynamicParams
					}
				};
				
				classes.push(routeNode);
				
				// Create route → view relationship
				if (pattern.viewClass) {
					relationships.push({
						from: this.getClassId(routeNode),
						to: this.getClassId(pattern.viewClass),
						type: 'routes-to',
						metadata: { 
							path: pattern.path,
							urlFile: urlFile
						}
					});
				}
			}
		}
		
		return relationships;
	}
	
	/**
	 * Find all urls.py files in workspace
	 */
	private findUrlFiles(workspacePath: string): string[] {
		const urlFiles: string[] = [];
		
		const searchDir = (dir: string, depth: number = 0): void => {
			if (depth > 5) return; // Limit recursion
			
			try {
				const entries = fs.readdirSync(dir, { withFileTypes: true });
				
				for (const entry of entries) {
					if (entry.isFile() && entry.name === 'urls.py') {
						urlFiles.push(path.join(dir, entry.name));
					} else if (entry.isDirectory() && 
					           entry.name !== 'node_modules' && 
					           entry.name !== '.git' &&
					           entry.name !== '__pycache__' &&
					           !entry.name.startsWith('.')) {
						searchDir(path.join(dir, entry.name), depth + 1);
					}
				}
			} catch (error) {
				// Ignore permission errors
			}
		};
		
		searchDir(workspacePath);
		return urlFiles;
	}
	
	/**
	 * Parse urls.py file and extract URL patterns
	 */
	private parseUrlFile(filePath: string, classes: any[]): UrlPattern[] {
		const patterns: UrlPattern[] = [];
		
		try {
			const content = fs.readFileSync(filePath, 'utf-8');
			
			// Regex to match: path('route/', views.ViewName or path('route/', views.view_func)
			// Handles both .as_view() and direct function references
			const pathRegex = /path\s*\(\s*['"r]([^'"]+)['"]\s*,\s*views\.(\w+)(?:\.as_view\(\))?/g;
			
			let match;
			while ((match = pathRegex.exec(content)) !== null) {
				const routePath = match[1];  // 'users/' or 'users/<int:pk>/'
				const viewName = match[2];   // 'UserListView' or 'list_users_api'
				
				// Find matching view class/function
				const viewClass = this.findViewByName(viewName, classes);
				
				// Extract dynamic parameters
				const dynamicParams = this.extractDynamicParams(routePath);
				
				patterns.push({
					path: routePath,
					viewName: viewName,
					viewClass: viewClass,
					dynamicParams: dynamicParams
				});
			}
		} catch (error) {
			// Ignore file read errors
			console.warn(`Failed to parse ${filePath}:`, error);
		}
		
		return patterns;
	}
	
	/**
	 * Extract dynamic parameters from route path
	 */
	private extractDynamicParams(routePath: string): DynamicParam[] {
		const params: DynamicParam[] = [];
		
		// Match <int:pk>, <slug:slug>, <str:username>, <uuid:id>, etc.
		const paramRegex = /<(\w+):(\w+)>/g;
		
		let match;
		while ((match = paramRegex.exec(routePath)) !== null) {
			params.push({
				type: match[1],  // 'int', 'slug', 'str', 'uuid'
				name: match[2]   // 'pk', 'slug', 'username', 'id'
			});
		}
		
		return params;
	}
	
	/**
	 * Find view class/function by name
	 */
	private findViewByName(viewName: string, classes: any[]): any | null {
		// Try exact match first
		let view = classes.find(c => c.name === viewName);
		if (view) return view;
		
		// Try case-insensitive match
		const lowerViewName = viewName.toLowerCase();
		view = classes.find(c => c.name.toLowerCase() === lowerViewName);
		if (view) return view;
		
		return null;
	}
	
	/**
	 * Fallback: Create heuristic routes if no urls.py found
	 */
	private createHeuristicRoutes(classes: any[]): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		// Find all views (class-based and function-based)
		const views = classes.filter(c => {
			if (c.classType === 'view' || c.classType === 'viewset') {
				return true;
			}
			// Function-based views in views.py
			if (c.classType === 'function') {
				const filePath = (c.filePath || '').replace(/\\/g, '/');
				return filePath.includes('views.py');
			}
			return false;
		});
		
		// For each view, infer route from name
		for (const view of views) {
			const routePath = this.inferRouteFromViewName(view.name);
			
			if (routePath) {
				// Create synthetic route node
				const routeNode = {
					name: routePath,
					filePath: `route://${routePath}`,
					classType: 'route',
					properties: [],
					methods: [],
					routeMeta: {
						path: routePath,
						method: 'GET',
						definedIn: view.filePath
					}
				};
				
				classes.push(routeNode);
				
				// Create route → view relationship
				relationships.push({
					from: this.getClassId(routeNode),
					to: this.getClassId(view),
					type: 'routes-to',
					metadata: { inferred: true }
				});
			}
		}
		
		return relationships;
	}
	
	/**
	 * Infer route path from view name (heuristic fallback)
	 */
	private inferRouteFromViewName(viewName: string): string | null {
		// UserListView → /users/
		// PostDetailView → /posts/<int:pk>/
		// user_list → /user_list/
		
		const lower = viewName.toLowerCase();
		
		// Remove common suffixes
		let route = lower
			.replace('viewset', '')
			.replace('listview', '')
			.replace('detailview', '')
			.replace('createview', '')
			.replace('updateview', '')
			.replace('deleteview', '')
			.replace('view', '')
			.replace('_', '/');
		
		// Add leading slash
		if (!route.startsWith('/')) {
			route = '/' + route;
		}
		
		// Add trailing slash
		if (!route.endsWith('/')) {
			route += '/';
		}
		
		// Add parameter for detail views
		if (viewName.includes('Detail')) {
			route = route.replace(/\/$/, '/<int:pk>/');
		}
		
		return route || null;
	}
	
	/**
	 * Get class ID in format: filePath__className
	 */
	private getClassId(classInfo: any): string {
		return `${classInfo.filePath}__${classInfo.name}`;
	}
}

/**
 * URL pattern parsed from urls.py
 */
interface UrlPattern {
	path: string;           // 'users/' or 'users/<int:pk>/'
	viewName: string;       // 'UserListView'
	viewClass: any | null;  // Matched ClassInfo object
	dynamicParams: DynamicParam[];
}

/**
 * Dynamic parameter in URL route
 */
interface DynamicParam {
	type: string;  // 'int', 'slug', 'str', 'uuid'
	name: string;  // 'pk', 'slug', 'username'
}
