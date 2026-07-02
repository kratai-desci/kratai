import * as fs from 'fs';
import * as path from 'path';
import { AbstractEnricher, EnrichmentContext, EnrichmentResult } from '../AbstractEnricher';
import { ClassInfo, ClassRelationship } from '../../../types/domain';

/**
 * Spring Boot Framework Enricher
 * 
 * Detects and enriches Spring Boot applications with framework-specific knowledge:
 * - REST Controllers (@RestController, @Controller)
 * - Service layer (@Service) with transactions
 * - Repository layer (@Repository, JpaRepository)
 * - Entity layer (@Entity) with JPA relationships
 * - Dependency injection (constructor, field, setter)
 * - HTTP route mapping
 * - Exception handling (@ControllerAdvice)
 * - Validation (@Valid, JSR-303)
 * - Security (@PreAuthorize)
 * - Configuration (@Configuration, @Bean)
 */
export class SpringBootEnricher extends AbstractEnricher {
	readonly framework = 'Spring Boot';
	readonly priority = 20;
	
	/**
	 * Detect Spring Boot from pom.xml or build.gradle
	 */
	detect(context: EnrichmentContext): boolean {
		// Check for pom.xml with spring-boot-starter dependencies
		const pomPath = path.join(context.workspacePath, 'pom.xml');
		if (fs.existsSync(pomPath)) {
			const content = fs.readFileSync(pomPath, 'utf-8');
			if (content.includes('spring-boot-starter')) {
				return true;
			}
		}
		
		// Check for build.gradle with Spring Boot
		const gradlePath = path.join(context.workspacePath, 'build.gradle');
		if (fs.existsSync(gradlePath)) {
			const content = fs.readFileSync(gradlePath, 'utf-8');
			if (content.includes('org.springframework.boot')) {
				return true;
			}
		}
		
		// Check for @SpringBootApplication in any Java file
		for (const classInfo of context.classes) {
			if (classInfo.filePath.endsWith('.java')) {
				const fullPath = path.join(context.workspacePath, classInfo.filePath);
				if (fs.existsSync(fullPath)) {
					const content = fs.readFileSync(fullPath, 'utf-8');
					if (content.includes('@SpringBootApplication') || 
					    content.includes('@RestController') ||
					    content.includes('@Controller') ||
					    content.includes('@Service') ||
					    content.includes('@Repository') ||
					    content.includes('@Entity')) {
						return true;
					}
				}
			}
		}
		
		return false;
	}

	/**
	 * Enrich Spring Boot application with framework knowledge
	 */
	async enrich(context: EnrichmentContext): Promise<EnrichmentResult> {
		const enhancedClasses: ClassInfo[] = [];
		const newRelationships: ClassRelationship[] = [];
		const features: string[] = [];
		
		// Process each class
		for (const classInfo of context.classes) {
			// Only process Java files
			if (!classInfo.filePath.endsWith('.java')) {
				enhancedClasses.push(classInfo);
				continue;
			}
			
			// Read file content for annotation detection
			const fullPath = path.join(context.workspacePath, classInfo.filePath);
			if (!fs.existsSync(fullPath)) {
				// Skip if file doesn't exist
				enhancedClasses.push(classInfo);
				continue;
			}
			
			const fileContent = fs.readFileSync(fullPath, 'utf-8');
			
			// Clone the class info to avoid mutating original
			const enhanced = { ...classInfo };
			
			// Phase 1: Detect Spring stereotypes and set classType
			this.detectStereotypes(enhanced, fileContent, features);
			
			// Phase 1: Detect JPA entity
			this.detectEntity(enhanced, fileContent, features);
			
			// Phase 1: Detect repository specifics
			this.detectRepositoryDetails(enhanced, fileContent, features);
			
			// Phase 1: Extract HTTP routes from controllers
			if (enhanced.classType === 'rest-controller' || enhanced.classType === 'controller') {
				this.extractHttpRoutes(enhanced, fileContent, enhancedClasses, features);
			}
			
			// Phase 1: Extract view names from MVC controllers
			if (enhanced.classType === 'controller') {
			this.extractViewNames(enhanced, fileContent, context.classes, enhancedClasses, newRelationships, features);
		}
		
		// Phase 1: Detect JPA relationships
		this.detectJpaRelationships(enhanced, fileContent, newRelationships, features);
		
		// Phase 1: Detect dependency injection
		this.detectDependencyInjection(enhanced, fileContent, newRelationships, features);
		
		enhancedClasses.push(enhanced);
	}
	
	// Phase 1: Infer controller->service calls based on naming patterns
	this.inferServiceCalls(enhancedClasses, newRelationships, features);
	
	return {
		enhancedClasses,
		newRelationships,
		metadata: {
			framework: this.framework,
			features: Array.from(new Set(features))
		}
	};
}

/**
 * Detect Spring stereotype annotations and set classType
 */
private detectStereotypes(classInfo: ClassInfo, content: string, features: string[]): void {
		// @RestController - REST API controller (returns JSON)
		if (/@RestController\b/.test(content)) {
			classInfo.classType = 'rest-controller';
			features.push('rest-controller');
		}
		// @Controller - MVC controller (returns views)
		else if (/@Controller\b/.test(content)) {
			classInfo.classType = 'controller';
			features.push('controller');
		}
		// @Service - Service layer
		else if (/@Service\b/.test(content)) {
			classInfo.classType = 'service';
			features.push('service');
		}
		// @Repository - Data access layer (override 'interface' if needed)
		if (/@Repository\b/.test(content)) {
			classInfo.classType = 'repository';
			features.push('repository');
		}
		// @Configuration - Configuration class
		else if (/@Configuration\b/.test(content)) {
			classInfo.classType = 'configuration';
			features.push('configuration');
		}
		// @RestControllerAdvice or @ControllerAdvice - Exception handler
		else if (/@(Rest)?ControllerAdvice\b/.test(content)) {
			classInfo.classType = 'exception-handler';
			features.push('exception-handling');
		}
	}
	
	/**
	 * Detect @Entity annotation
	 */
	private detectEntity(classInfo: ClassInfo, content: string, features: string[]): void {
		if (/@Entity\b/.test(content)) {
			classInfo.classType = 'entity';
			features.push('jpa-entity');
			
			// Extract @Table name if present
			const tableMatch = /@Table\s*\(\s*name\s*=\s*"([^"]+)"/.exec(content);
			if (tableMatch) {
				classInfo.entityMeta = {
					tableName: tableMatch[1]
				};
			}
			
			// Find primary key field (@Id annotation) - handle multi-line
			const idPattern = /@Id[\s\S]*?private\s+(\w+)\s+(\w+)\s*;/;
			const idMatch = idPattern.exec(content);
			if (idMatch) {
				if (!classInfo.entityMeta) classInfo.entityMeta = {};
				classInfo.entityMeta.primaryKey = idMatch[2]; // Field name is second capture group
			}
		}
	}
	
	/**
	 * Detect repository details (JpaRepository<T, ID>)
	 */
	private detectRepositoryDetails(classInfo: ClassInfo, content: string, features: string[]): void {
		if (classInfo.classType !== 'repository') return;
		
		// For mocks, check implements array
		if (!content && classInfo.implements) {
			for (const impl of classInfo.implements) {
				const jpaMatch = /JpaRepository<(\w+),\s*(\w+)>/.exec(impl);
				if (jpaMatch) {
					classInfo.repositoryMeta = {
						entityType: jpaMatch[1],
						idType: jpaMatch[2]
					};
					features.push('jpa-repository');
					return;
				}
			}
			return;
		}
		
		// Extract entity and ID type from JpaRepository<Entity, ID>
		const jpaMatch = /extends\s+JpaRepository<(\w+),\s*(\w+)>/.exec(content);
		if (jpaMatch) {
			classInfo.repositoryMeta = {
				entityType: jpaMatch[1],
				idType: jpaMatch[2]
			};
			features.push('jpa-repository');
		}
	}
	
	/**
	 * Extract HTTP routes from controller methods
	 */
	private extractHttpRoutes(
		classInfo: ClassInfo,
		content: string,
		enhancedClasses: ClassInfo[],
		features: string[]
	): void {
		// Get base path from @RequestMapping at class level
		let basePath = '';
		const classRequestMapping = /@RequestMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/.exec(content);
		if (classRequestMapping) {
			basePath = classRequestMapping[1];
		}
		
		// Extract route mappings from methods
		const routePatterns = [
			/@GetMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']\)/g,
			/@PostMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']\)/g,
			/@PutMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']\)/g,
			/@DeleteMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']\)/g,
			/@PatchMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']\)/g,
		];
		
		const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
		
		routePatterns.forEach((pattern, index) => {
			const method = methods[index];
			let match;
			
			while ((match = pattern.exec(content)) !== null) {
				const routePath = match[1];
				let fullPath = basePath + routePath;
				
				// Extract path variables
				const pathVariables: string[] = [];
				const pathVarRegex = /\{(\w+)\}/g;
				let pathVarMatch;
				while ((pathVarMatch = pathVarRegex.exec(fullPath)) !== null) {
					pathVariables.push(pathVarMatch[1]);
				}
				
				// Convert {id} syntax to :id syntax for consistency
				fullPath = fullPath.replace(/\{(\w+)\}/g, ':$1');
				
				// Create route node
				const routeNode: ClassInfo = {
					name: `${method} ${fullPath}`,
					filePath: classInfo.filePath,
					properties: [],
					methods: [],
					classType: 'route',
					routeMeta: {
						path: fullPath,
						method: method,
						definedIn: classInfo.name,
						pathVariables: pathVariables.length > 0 ? pathVariables : undefined
					}
				};
				
				enhancedClasses.push(routeNode);
				features.push('http-routes');
			}
		});
		
		// Handle @GetMapping, @PostMapping etc. without explicit path (just basePath)
		const noPathPatterns = [
			/@GetMapping(?:\s*\(\s*\))?\s+/g,
			/@PostMapping(?:\s*\(\s*\))?\s+/g,
			/@PutMapping(?:\s*\(\s*\))?\s+/g,
			/@DeleteMapping(?:\s*\(\s*\))?\s+/g,
			/@PatchMapping(?:\s*\(\s*\))?\s+/g,
		];
		
		noPathPatterns.forEach((pattern, index) => {
			if (pattern.test(content) && basePath) {
				const method = methods[index];
				const routeNode: ClassInfo = {
					name: `${method} ${basePath}`,
					filePath: classInfo.filePath,
					properties: [],
					methods: [],
					classType: 'route',
					routeMeta: {
						path: basePath,
						method: method,
						definedIn: classInfo.name
					}
				};
				
				enhancedClasses.push(routeNode);
				features.push('http-routes');
			}
		});
	}
	
	/**
	 * Extract view names from MVC controller methods
	 * MVC controllers return String (view name) instead of ResponseEntity
	 * 
	 * Strategy:
	 * 1. Check if real JSP file exists for the view name
	 * 2. If yes, link to real JSP file (don't create virtual view)
	 * 3. If no, create virtual view node (fallback)
	 */
	private extractViewNames(
		classInfo: ClassInfo,
		content: string,
		allClasses: ClassInfo[],
		enhancedClasses: ClassInfo[],
		newRelationships: ClassRelationship[],
		features: string[]
	): void {
		const viewNames = new Set<string>();
		
		console.log(`🎨 [SpringBoot] Extracting view names from controller: ${classInfo.name}`);
		
		// Pattern 1: Simple string return - return "viewName";
		const returnPattern = /return\s+"([^"]+)"\s*;/g;
		let match;
		while ((match = returnPattern.exec(content)) !== null) {
			const viewName = match[1];
			
			// Skip empty strings and common non-view returns
			if (!viewName || 
			    viewName === 'redirect:' || 
			    viewName.startsWith('redirect:') ||
			    viewName.startsWith('forward:')) {
				continue;
			}
			
			console.log(`🎨   Pattern 1 detected: "${viewName}"`);
			viewNames.add(viewName);
		}
		
		// Pattern 2: ModelAndView constructor - new ModelAndView("viewName")
		// Matches: return new ModelAndView("viewName");
		// Matches: ModelAndView mv = new ModelAndView("viewName");
		const modelAndViewPattern = /new\s+ModelAndView\s*\(\s*"([^"]+)"\s*\)/g;
		while ((match = modelAndViewPattern.exec(content)) !== null) {
			const viewName = match[1];
			
			// Skip redirects and forwards
			if (!viewName || 
			    viewName.startsWith('redirect:') ||
			    viewName.startsWith('forward:')) {
				continue;
			}
			
			console.log(`🎨   Pattern 2 detected: "${viewName}"`);
			viewNames.add(viewName);
		}
		
		console.log(`🎨   Total unique view names: ${viewNames.size}`);
		
		// Create view nodes and relationships
		for (const viewName of viewNames) {
			// Check if a real JSP file exists for this view name
			const matchingJsp = this.findMatchingJspFile(viewName, allClasses);
			
			if (matchingJsp) {
				// Link to real JSP file (don't create virtual view)
				console.log(`🎨   ✅ Linked "${viewName}" → real JSP: ${matchingJsp.name}`);
				newRelationships.push({
				from: `${classInfo.filePath}__${classInfo.name}`,
				to: `${matchingJsp.filePath}__${matchingJsp.name}`,
					type: 'renders'
				});
				features.push('mvc-views');
			} else {
				// No JSP file found - create virtual view node (fallback)
				const viewNode: ClassInfo = {
					name: viewName,
					filePath: classInfo.filePath, // Same file as controller
					properties: [],
					methods: [],
					classType: 'view'
				};
				
				console.log(`🎨   ⚪ Created virtual view node: ${viewName}`);
				enhancedClasses.push(viewNode);
				
				// Create controller -> view relationship
				newRelationships.push({
					from: classInfo.name,
					to: viewName,
					type: 'renders'
				});
				
				features.push('mvc-views');
			}
		}
	}
	
	/**
	 * Find matching JSP file for a view name
	 * 
	 * @param viewName - View name from controller (e.g., "users/list")
	 * @param classes - All classes including template nodes from HTMLParser
	 * @returns Matching JSP ClassInfo or undefined
	 */
	private findMatchingJspFile(viewName: string, classes: ClassInfo[]): ClassInfo | undefined {
		// Normalize view name (remove leading/trailing slashes)
		const normalizedViewName = viewName.replace(/^\/+|\/+$/g, '');
		
		// Look for JSP files (classType: 'template')
		const jspFiles = classes.filter(c => c.classType === 'template');
		
		for (const jsp of jspFiles) {
			// Strategy 1: Check if filePath matches viewName + .jsp
			// Example: viewName="users/list" matches filePath="users/list.jsp"
			if (jsp.filePath.endsWith(`${normalizedViewName}.jsp`) ||
			    jsp.filePath.endsWith(`${normalizedViewName}.jspx`)) {
				return jsp;
			}
			
			// Strategy 2: Extract base name from view name and check JSP name
			// Example: viewName="users/list" → basename="list" → match "list.jsp"
			const viewBasename = normalizedViewName.split('/').pop();
			if (viewBasename && jsp.name === `${viewBasename}.jsp`) {
				// Also verify the path contains the directory structure
				const viewDir = normalizedViewName.substring(0, normalizedViewName.lastIndexOf('/'));
				if (!viewDir || jsp.filePath.includes(viewDir)) {
					return jsp;
				}
			}
		}
		
		return undefined;
	}
	
	/**
	 * Detect JPA relationships
	 */
	private detectJpaRelationships(
		classInfo: ClassInfo,
		content: string,
		newRelationships: ClassRelationship[],
		features: string[]
	): void {
		if (classInfo.classType !== 'entity') return;
		
		// For mocks without file content, infer from property types
		if (!content) {
			for (const prop of classInfo.properties) {
				const propType = prop.type;
				const propName = prop.name.toLowerCase();
				
				// @OneToMany / @ManyToMany - Collection types (List<T>, Set<T>)
				const collectionMatch = /(?:List|Set|Collection)<(\w+)>/.exec(propType);
				if (collectionMatch) {
					const targetEntity = collectionMatch[1];
					
					// Heuristic: roles, tags, categories, permissions -> ManyToMany
					// posts, comments, orders -> OneToMany
					const manyToManyKeywords = ['role', 'tag', 'category', 'permission', 'group'];
					const isManyToMany = manyToManyKeywords.some(keyword => propName.includes(keyword));
					
					newRelationships.push({
						from: `${classInfo.filePath}__${classInfo.name}`,
						to: targetEntity,
						type: isManyToMany ? 'many-to-many' : 'one-to-many'
					});
					features.push('jpa-relationships');
					continue;
				}
				
				// @ManyToOne or @OneToOne - Single entity reference
				// Check if it's not a primitive or common type
				if (!this.isPrimitiveOrCommon(propType) && !propType.includes('<')) {
					// Heuristic: profile, address, wallet -> OneToOne
					// user, author, owner, parent -> ManyToOne
					const oneToOneKeywords = ['profile', 'address', 'wallet', 'setting', 'config'];
					const isOneToOne = oneToOneKeywords.some(keyword => propName.includes(keyword));
					
					newRelationships.push({
						from: `${classInfo.filePath}__${classInfo.name}`,
						to: propType,
						type: isOneToOne ? 'one-to-one' : 'many-to-one'
					});
					features.push('jpa-relationships');
				}
			}
			return;
		}
		
		// @OneToMany - One entity has many of another (handle multi-line)
		const oneToManyPattern = /@OneToMany[\s\S]*?(?:private|public|protected)\s+(?:List|Set|Collection)<(\w+)>\s+(\w+)\s*[=;]/g;
		let match;
		while ((match = oneToManyPattern.exec(content)) !== null) {
			const targetEntity = match[1];
			const fieldName = match[2];
			
			newRelationships.push({
				from: `${classInfo.filePath}__${classInfo.name}`,
				to: targetEntity,
				type: 'one-to-many'
			});
			features.push('jpa-relationships');
		}
		
		// @ManyToOne - Many entities reference one
		const manyToOneRegex = /@ManyToOne[^;]*?(\w+)\s+(\w+)\s*;/g;
		while ((match = manyToOneRegex.exec(content)) !== null) {
			const targetEntity = match[1];
			const fieldName = match[2];
			
			newRelationships.push({
				from: `${classInfo.filePath}__${classInfo.name}`,
				to: targetEntity,
				type: 'many-to-one'
			});
			features.push('jpa-relationships');
		}
		
		// @ManyToMany (handle multi-line)
		const manyToManyPattern = /@ManyToMany[\s\S]*?(?:private|public|protected)\s+(?:Set|List|Collection)<(\w+)>\s+(\w+)\s*[=;]/g;
		while ((match = manyToManyPattern.exec(content)) !== null) {
			const targetEntity = match[1];
			const fieldName = match[2];
			
			newRelationships.push({
				from: `${classInfo.filePath}__${classInfo.name}`,
				to: targetEntity,
				type: 'many-to-many'
			});
			features.push('jpa-relationships');
		}
		
		// @OneToOne
		const oneToOneRegex = /@OneToOne[^;]*?(\w+)\s+(\w+)\s*;/g;
		while ((match = oneToOneRegex.exec(content)) !== null) {
			const targetEntity = match[1];
			const fieldName = match[2];
			
			newRelationships.push({
				from: `${classInfo.filePath}__${classInfo.name}`,
				to: targetEntity,
				type: 'one-to-one'
			});
			features.push('jpa-relationships');
		}
	}
	
	/**
	 * Detect dependency injection (constructor and field)
	 */
	private detectDependencyInjection(
		classInfo: ClassInfo,
		content: string,
		newRelationships: ClassRelationship[],
		features: string[]
	): void {
		// Constructor injection (recommended pattern)
		// Look for constructor parameters
		const constructorRegex = new RegExp(`public\\s+${classInfo.name}\\s*\\(([^)]*)\\)`, 'g');
		const constructorMatch = constructorRegex.exec(content);
		
		if (constructorMatch && constructorMatch[1].trim()) {
			const params = constructorMatch[1].split(',');
			for (const param of params) {
				// Extract type from parameter (e.g., "UserService userService")
				const paramMatch = /(\w+)\s+\w+/.exec(param.trim());
				if (paramMatch) {
					const injectedType = paramMatch[1];
					
					// Skip primitive types and common Java types
					if (!this.isPrimitiveOrCommon(injectedType)) {
						newRelationships.push({
							from: `${classInfo.filePath}__${classInfo.name}`,
							to: injectedType,
							type: 'injects'
						});
						features.push('dependency-injection');
					}
				}
			}
		}
		
		// Field injection with @Autowired
		const fieldInjectionRegex = /@Autowired\s+(?:private|protected|public)?\s*(\w+)\s+(\w+)\s*;/g;
		let match;
		while ((match = fieldInjectionRegex.exec(content)) !== null) {
			const injectedType = match[1];
			
			if (!this.isPrimitiveOrCommon(injectedType)) {
				newRelationships.push({
					from: `${classInfo.filePath}__${classInfo.name}`,
					to: injectedType,
					type: 'injects'
				});
				features.push('dependency-injection');
			}
		}
	}
	
	/**
	 * Infer controller->service "calls" relationships based on naming patterns
	 * E.g., UserController likely calls UserService
	 */
	private inferServiceCalls(
		classes: ClassInfo[],
		newRelationships: ClassRelationship[],
		features: string[]
	): void {
		const controllers = classes.filter(c => 
			c.classType === 'rest-controller' || c.classType === 'controller'
		);
		const services = classes.filter(c => c.classType === 'service');
		
		for (const controller of controllers) {
			// Extract base name: UserController -> User
			const baseName = controller.name
				.replace(/Controller$/, '')
				.replace(/RestController$/, '');
			
			// Find matching service: User -> UserService
			const matchingService = services.find(s => 
				s.name === `${baseName}Service` || 
				s.name.startsWith(baseName)
			);
			
			if (matchingService) {
				// Check if there's already an "injects" relationship (from DI)
				const hasInjects = newRelationships.some(r =>
				r.from === `${controller.filePath}__${controller.name}` &&
				r.to === matchingService.name &&
				r.type === 'injects'
			);
			
			}
		}
	}
	
	/**
	 * Check if type is primitive or common Java type
	 */
	private isPrimitiveOrCommon(type: string): boolean {
		const primitiveTypes = [
			'int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short',
			'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Character', 'Byte', 'Short',
			'String', 'Object', 'List', 'Set', 'Map', 'Collection', 'Optional',
			'Date', 'LocalDate', 'LocalDateTime', 'Instant'
		];
		return primitiveTypes.includes(type);
	}
	
	/**
	 * File patterns for Spring Boot projects
	 */
	getFilePatterns(): string[] {
		return [
			'**/*Controller.java',
			'**/*Service.java',
			'**/*Repository.java',
			'**/*Entity.java',
			'**/*Configuration.java',
			'**/*DTO.java',
			'**/*Config.java',
			'**/pom.xml',
			'**/build.gradle'
		];
	}
}
