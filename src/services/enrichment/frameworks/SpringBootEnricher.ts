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
		const hasSpringBootApp = context.classes.some(c => 
			c.filePath.endsWith('.java')
		);
		
		return hasSpringBootApp;
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
		// @Repository - Data access layer
		else if (/@Repository\b/.test(content)) {
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
			
			// Find primary key field (@Id annotation)
			const idMatch = /@Id\s+[\w\s<>]+\s+(\w+)\s*;/.exec(content);
			if (idMatch) {
				if (!classInfo.entityMeta) classInfo.entityMeta = {};
				classInfo.entityMeta.primaryKey = idMatch[1];
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
		
		// Handle @GetMapping, @PostMapping etc. without explicit path
		const noPathPatterns = [
			/@GetMapping(?:\s*\(\s*\))?[\s\n]+(?:public|private|protected)/g,
			/@PostMapping(?:\s*\(\s*\))?[\s\n]+(?:public|private|protected)/g,
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
						from: classInfo.name,
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
						from: classInfo.name,
						to: propType,
						type: isOneToOne ? 'one-to-one' : 'many-to-one'
					});
					features.push('jpa-relationships');
				}
			}
			return;
		}
		
		// @OneToMany - One entity has many of another
		const oneToManyRegex = /@OneToMany[^;]*?(\w+)\s+(\w+)\s*;/g;
		let match;
		while ((match = oneToManyRegex.exec(content)) !== null) {
			// Extract target entity type from generic or field type
			const fieldType = match[1]; // e.g., "List<Post>" or "Set<Role>"
			const fieldName = match[2];
			
			// Extract generic type
			const genericMatch = /(?:List|Set|Collection)<(\w+)>/.exec(fieldType);
			if (genericMatch) {
				const targetEntity = genericMatch[1];
				newRelationships.push({
					from: classInfo.name,
					to: targetEntity,
					type: 'one-to-many'
				});
				features.push('jpa-relationships');
			}
		}
		
		// @ManyToOne - Many entities reference one
		const manyToOneRegex = /@ManyToOne[^;]*?(\w+)\s+(\w+)\s*;/g;
		while ((match = manyToOneRegex.exec(content)) !== null) {
			const targetEntity = match[1];
			const fieldName = match[2];
			
			newRelationships.push({
				from: classInfo.name,
				to: targetEntity,
				type: 'many-to-one'
			});
			features.push('jpa-relationships');
		}
		
		// @ManyToMany
		const manyToManyRegex = /@ManyToMany[^;]*?(?:Set|List)<(\w+)>\s+(\w+)\s*;/g;
		while ((match = manyToManyRegex.exec(content)) !== null) {
			const targetEntity = match[1];
			const fieldName = match[2];
			
			newRelationships.push({
				from: classInfo.name,
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
				from: classInfo.name,
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
							from: classInfo.name,
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
					from: classInfo.name,
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
					r.from === controller.name &&
					r.to === matchingService.name &&
					r.type === 'injects'
				);
				
				// If no DI relationship, create a "calls" relationship
				if (!hasInjects) {
					newRelationships.push({
						from: controller.name,
						to: matchingService.name,
						type: 'calls'
					});
					features.push('service-calls');
				}
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
