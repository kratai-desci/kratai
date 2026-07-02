import { AbstractEnricher, EnrichmentContext } from './AbstractEnricher';
import { NextJSEnricher } from './frameworks/NextJSEnricher';
import { DjangoEnricher } from './frameworks/DjangoEnricher';
import { SpringBootEnricher } from './frameworks/SpringBootEnricher';
import { ClassRelationship } from '../../types/domain/ClassRelationship';

/**
 * EnricherRegistry - Registry + Factory + Orchestrator Pattern
 * 
 * Responsibilities:
 * 1. Register all available framework enrichers
 * 2. Manage enricher execution priority
 * 3. Auto-detect which frameworks are present
 * 4. Orchestrate sequential enrichment (order matters)
 * 5. Accumulate and merge enrichment results
 * 
 * Design: Each enricher builds on previous enricher's output
 * Example flow: Base Classes → [Next.js] → [Prisma] → [Auth.js] → Final Enhanced Classes
 */
export class EnricherRegistry {
	private enrichers: AbstractEnricher[] = [];
	
	constructor() {
		// Register all framework enrichers
		// Add more enrichers here as they're implemented
		this.register(new SpringBootEnricher());
		this.register(new NextJSEnricher());
		this.register(new DjangoEnricher());
		// this.register(new LaravelEnricher());
		// this.register(new PrismaEnricher());
	}
	
	/**
	 * Register an enricher and maintain priority order
	 */
	private register(enricher: AbstractEnricher): void {
		this.enrichers.push(enricher);
		// Sort by priority (lower numbers run first)
		this.enrichers.sort((a, b) => a.priority - b.priority);
	}
	
	/**
	 * Detect which frameworks are present in the workspace
	 * 
	 * @param context - Current enrichment context
	 * @returns Array of enrichers for detected frameworks
	 */
	detectFrameworks(context: EnrichmentContext): AbstractEnricher[] {
		return this.enrichers.filter(enricher => {
			const detected = enricher.detect(context);
			if (detected) {
				console.log(`🎨 Detected framework: ${enricher.framework}`);
			}
			return detected;
		});
	}
	
	/**
	 * Run all applicable enrichers in priority order
	 * 
	 * Each enricher receives the cumulative output of previous enrichers.
	 * This allows enrichers to build on each other's enhancements.
	 * 
	 * @param context - Initial enrichment context
	 * @returns Enhanced context with accumulated results
	 */
	async enrichAll(context: EnrichmentContext): Promise<EnrichmentContext> {
		const detectedEnrichers = this.detectFrameworks(context);
		
		if (detectedEnrichers.length === 0) {
			console.log('🎨 No frameworks detected, skipping enrichment');
			// Return a copy to avoid reference issues
			return {
				...context,
				classes: [...context.classes],
				relationships: [...context.relationships]
			};
		}
		
		console.log(`🎨 Running ${detectedEnrichers.length} enrichers in order:`, 
			detectedEnrichers.map(e => `${e.framework} (priority ${e.priority})`).join(', '));
		
		let currentContext = context;
		
		for (const enricher of detectedEnrichers) {
			try {
				console.log(`🎨 Running ${enricher.framework} enricher...`);
				const result = await enricher.enrich(currentContext);
				
				console.log(`🎨 ${enricher.framework} added ${result.newRelationships.length} relationships, ` +
					`enhanced ${result.enhancedClasses.length - currentContext.classes.length} classes`);
				
				// Chain results: output of one enricher → input of next
				currentContext = {
					...currentContext,
					classes: result.enhancedClasses,
					relationships: [
						...currentContext.relationships,
						...result.newRelationships
					]
				};
			} catch (error) {
				console.error(`🎨 Error running ${enricher.framework} enricher:`, error);
				// Continue with other enrichers even if one fails
			}
		}
		
		console.log(`🎨 Enrichment complete. Total classes: ${currentContext.classes.length}, ` +
			`Total relationships: ${currentContext.relationships.length}`);
		
		// === RELATIONSHIP DEDUPLICATION ===
		// Collapse relationships with same from/to but different types into single relationship with type array
		// This prevents diagram bloat from multiple relationship types between same two classes
		const originalRelCount = currentContext.relationships.length;
		const relMap = new Map<string, ClassRelationship>();
		
		currentContext.relationships.forEach(rel => {
			const key = `${rel.from}::${rel.to}`; // Key by from/to only, ignoring type
			
			if (!relMap.has(key)) {
				// First occurrence - normalize type to array
				relMap.set(key, {
					...rel,
					type: Array.isArray(rel.type) ? rel.type : [rel.type as string]
				});
			} else {
				// Merge types into existing relationship
				const existing = relMap.get(key)!;
				const existingTypes = Array.isArray(existing.type) ? existing.type : [existing.type as string];
				const newTypes = Array.isArray(rel.type) ? rel.type : [rel.type as string];
				
				// Add new types that don't already exist
				for (const newType of newTypes) {
					if (!existingTypes.includes(newType)) {
						existingTypes.push(newType);
					}
				}
				
				existing.type = existingTypes;
				
				// Merge metadata
				if (rel.metadata) {
					existing.metadata = {
						...existing.metadata,
						...rel.metadata
					};
				}
			}
		});
		
		currentContext.relationships = Array.from(relMap.values());
		
		if (originalRelCount > currentContext.relationships.length) {
			console.log(`🔧 Deduplicated relationships: ${originalRelCount} → ${currentContext.relationships.length} ` +
				`(collapsed ${originalRelCount - currentContext.relationships.length} duplicate edges)`);
		}
		
		return currentContext;
	}
	
	/**
	 * Get all registered enrichers (for testing/debugging)
	 */
	getRegisteredEnrichers(): AbstractEnricher[] {
		return [...this.enrichers];
	}
}
