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
		
		// 10. Detect middleware
		this.enrichMiddleware(enhancedClasses);
		features.push('middleware');
		
		// 11. Create middleware protection relationships
		const middlewareRels = this.createMiddlewareRelationships(enhancedClasses);
		newRelationships.push(...middlewareRels);
		
		// 12. Detect URL patterns (synthetic route nodes)
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
	 * Create URL route relationships (simplified - would need AST parsing for real implementation)
	 */
	private createURLRouteRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[] {
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
		
		// For each view, create a synthetic route node (simplified)
		for (const view of views) {
			// Create synthetic route based on view name
			// e.g., UserListView → /users/
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
	 * Infer route path from view name (heuristic)
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
