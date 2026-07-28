// @kratai/core - parsing, enrichment, diagram generation, export, and shared types.
// This is the single source of truth for kratai's architecture-analysis logic,
// shared by apps/vsextension, apps/mcp-server, and (later) apps/web and apps/desktop.

export * from './parsing';
export * from './enrichment';
export * from './diagram';
export * from './export/MarkdownExporter';
export * from './util';
export * from './git';
export * from './view';
export * from './telemetry';

export * from './types/domain';
export * from './types/config';
export * from './types/view';
