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
		
		// Method 2: Check for Django-specific files in workspace
		const djangoFiles = [
			'**/urls.py',
			'**/models.py',
			'**/views.py',
			'**/admin.py'
		];
		
		// Check if any Python files exist with Django imports
		// This is a simplified check - real implementation would scan files
		const hasUrls = fs.existsSync(path.join(context.workspacePath, 'urls.py'));
		const hasModels = fs.existsSync(path.join(context.workspacePath, 'models.py'));
		
		if (hasUrls || hasModels) {
			return true;
		}
		
		return false;
	}
	
	/**
	 * Enrich the code graph with Django-specific knowledge
	 */
	async enrich(context: EnrichmentContext): Promise<EnrichmentResult> {
		const enhancedClasses = [...context.classes];
		const newRelationships: ClassRelationship[] = [];
		
		// TODO: Implement enrichment logic (TDD - tests first)
		// 1. Detect URL patterns
		// 2. Detect models and relationships
		// 3. Detect views (class-based and function-based)
		// 4. Detect serializers
		// 5. Detect middleware
		// 6. Create relationships
		
		return {
			enhancedClasses,
			newRelationships,
			metadata: {
				framework: this.framework,
				features: [] // Will be populated as features are implemented
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
}
