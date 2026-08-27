// @kratai/core - parsing, enrichment, diagram generation, export, and shared types.
// This is the single source of truth for kratai's architecture-analysis logic,
// currently consumed by @kratai/cli (and, through it, @kratai/diagram-view's
// HTML output).

export * from './parsing';
export * from './enrichment';
export * from './diagram';
export * from './export/MarkdownExporter';
export * from './export/CodeIndex';
export * from './util';
export * from './git';
export * from './telemetry';

export * from './types/domain';
export * from './types/config';
export * from './types/view';
