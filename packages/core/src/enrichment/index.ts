/**
 * Enrichment Services
 * 
 * Framework enrichers add semantic knowledge about framework-specific patterns
 * that cannot be detected by generic language parsers.
 */

export { AbstractEnricher, EnrichmentContext, EnrichmentResult } from './AbstractEnricher';
export { EnricherRegistry } from './EnricherRegistry';
export { NextJSEnricher } from './frameworks/NextJSEnricher';
