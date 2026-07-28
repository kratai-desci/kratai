import { IFrameworkEnricher } from './IFrameworkEnricher';

/**
 * Factory for framework enrichers
 * 
 * Manages framework-specific parsers that add patterns beyond basic syntax:
 * - React: Components, hooks, props, context
 * - Vue: SFC, composition API, directives
 * - Angular: Decorators, DI, modules
 * - Django: Models, views, serializers
 * - Laravel: Eloquent, routes, middleware
 */
export class FrameworkEnricherFactory {
	private static enrichers: Map<string, IFrameworkEnricher> = new Map();
	
	/**
	 * Register a framework enricher
	 */
	static register(enricher: IFrameworkEnricher): void {
		this.enrichers.set(enricher.name.toLowerCase(), enricher);
	}
	
	/**
	 * Get enricher for a specific framework
	 */
	static get(framework: string): IFrameworkEnricher | undefined {
		return this.enrichers.get(framework.toLowerCase());
	}
	
	/**
	 * Get all registered frameworks
	 */
	static getSupportedFrameworks(): string[] {
		return Array.from(this.enrichers.keys());
	}
	
	/**
	 * Check if a framework is supported
	 */
	static isSupported(framework: string): boolean {
		return this.enrichers.has(framework.toLowerCase());
	}
}
