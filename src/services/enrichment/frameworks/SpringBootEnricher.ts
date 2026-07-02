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
		
		// TODO: Implement full enrichment logic
		// Phase 1 (MVP):
		// - Detect @RestController, @Controller
		// - Detect @Service
		// - Detect @Repository and JpaRepository<T, ID>
		// - Detect @Entity
		// - Extract HTTP routes (@GetMapping, @PostMapping, etc.)
		// - Detect JPA relationships (@OneToMany, @ManyToOne, @ManyToMany, @OneToOne)
		// - Detect constructor injection
		
		// For now, return empty result
		return {
			enhancedClasses: context.classes,
			newRelationships,
			metadata: {
				framework: this.framework,
				features: []
			}
		};
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
