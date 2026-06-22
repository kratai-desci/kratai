import * as fs from 'fs';
import * as path from 'path';
import { ClassInfo, DiagramData, ClassRelationship } from '../../types/domain';
import { KrataiConfig } from '../../types/config';
import { ConfigService } from '../config/configService';
import { ParserFactory } from './languages/ParserFactory';
import { HttpCallDetector } from './httpCallDetector';
import { EnricherRegistry } from '../enrichment/EnricherRegistry';

const parserFactory = new ParserFactory();

export class CodeParserService {

	static async parseWorkspace(workspacePath: string, config?: KrataiConfig): Promise<DiagramData> {
		const classes: ClassInfo[] = [];

		if (!config) {
			config = await ConfigService.loadConfig(workspacePath);
		}

		const files = this.findFilesWithConfig(workspacePath, config);

		if (files.length === 0) {
			throw new Error('No files found to parse. Check your configuration.');
		}

		for (const file of files) {
			const fileClasses = this.parseFile(file);
			// Normalize all paths to workspace-relative immediately after parsing
			// This ensures consistent path format for all parsers (TS, JS, future languages)
			fileClasses.forEach(classInfo => {
				if (path.isAbsolute(classInfo.filePath)) {
					classInfo.filePath = path.relative(workspacePath, classInfo.filePath).replace(/\\/g, '/');
				}
			});
			classes.push(...fileClasses);
		}

		// Delegate relationship extraction to the parser that owns each file
		const allClassNames = new Set(classes.map(c => c.name));
		const relationships: ClassRelationship[] = [];

		// Group classes by the parser that handles their file extension
		const parserClassMap = new Map<string, ClassInfo[]>();
		for (const classInfo of classes) {
			const ext = path.extname(classInfo.filePath).toLowerCase();
			if (!parserClassMap.has(ext)) {
				parserClassMap.set(ext, []);
			}
			parserClassMap.get(ext)!.push(classInfo);
		}

		for (const [ext, extClasses] of parserClassMap) {
			const parser = parserFactory.getParser(`file${ext}`);
			if (parser) {
				const rels = parser.extractRelationships(extClasses, allClassNames, workspacePath);
				relationships.push(...rels);
			} else {
				// Fallback: basic extends/implements from classInfo fields
				for (const classInfo of extClasses) {
					if (classInfo.extends) {
						relationships.push({ from: classInfo.name, to: classInfo.extends, type: 'extends' });
					}
					if (classInfo.implements) {
						for (const iface of classInfo.implements) {
							relationships.push({ from: classInfo.name, to: iface, type: 'implements' });
						}
					}
				}
			}
		}

		// === SECOND PASS: HTTP Parser (Cross-Language Analysis) ===
		// Run after language parsers to detect HTTP patterns across all files
		if (config.detectHttpCalls !== false) {
			try {
				console.log('🌐 Running HTTP parser (second pass)...');
				const httpParser = parserFactory.getHttpParser();
				
				// Parse all files again for HTTP patterns
				for (const file of files) {
					try {
						const routes = httpParser.parseFile(file);
						if (routes.length > 0) {
							// Normalize paths for route nodes
							routes.forEach(route => {
								if (route.routeMeta?.definedIn && path.isAbsolute(route.routeMeta.definedIn)) {
									route.routeMeta.definedIn = path.relative(workspacePath, route.routeMeta.definedIn).replace(/\\/g, '/');
								}
							});
							classes.push(...routes);
							console.log(`   Found ${routes.length} HTTP routes in ${path.relative(workspacePath, file)}`);
						}
					} catch (error) {
						// Skip files that fail to parse for HTTP patterns
						continue;
					}
				}
				
				// Extract HTTP relationships (calls + route-to-handler links)
				const httpRelationships = httpParser.extractRelationships(classes, allClassNames, workspacePath);
				relationships.push(...httpRelationships);
				console.log(`🌐 HTTP parser: ${httpRelationships.length} relationships detected`);
			} catch (error) {
				console.warn('⚠️  HTTP parser failed, skipping HTTP analysis:', error);
			}
		}

		// Legacy HTTP detector (keeping for backward compatibility)
		// TODO: Remove after HTTPParser is fully tested
		if (config.detectHttpCalls !== false) {
			try {
				const httpDetector = new HttpCallDetector();
				const routeMap = httpDetector.buildRouteMap(classes);
				
				if (routeMap.size > 0) {
					console.log(`🌐 Legacy detector: Built route map with ${routeMap.size} API routes`);
					
					const httpRelationships = httpDetector.createHttpRelationships(
						classes,
						routeMap
					);
					console.log(`🌐 Legacy detector: ${httpRelationships.length} HTTP call relationships`);
					relationships.push(...httpRelationships);
				}
			} catch (error) {
				console.warn('⚠️  Legacy HTTP detector failed:', error);
			}
		}

		// === DEDUPLICATION ===
		// Deduplicate classes BEFORE enrichment to prevent orphaned relationships
		// (Config with overlapping folder paths can cause the same file to be parsed multiple times)
		const originalClassCount = classes.length;
		const classMap = new Map<string, ClassInfo>();
		classes.forEach(classInfo => {
			const key = `${classInfo.filePath}:${classInfo.name}`;
			if (!classMap.has(key)) {
				classMap.set(key, classInfo);
			}
		});
		classes.length = 0;
		classes.push(...Array.from(classMap.values()));
		
		if (originalClassCount > classes.length) {
			console.log(`🔧 Deduplicated: ${originalClassCount} → ${classes.length} classes (removed ${originalClassCount - classes.length} duplicates)`);
		}

		// === THIRD PASS: Framework Enrichers ===
		// Run after language parsers and HTTP parser to add framework-specific knowledge
		if (config.frameworkEnrichment !== false) {
			try {
				console.log('🎨 Running framework enrichers (third pass)...');
				const enricherRegistry = new EnricherRegistry();
				
				const enrichedContext = await enricherRegistry.enrichAll({
					workspacePath,
					classes,
					relationships
				});
				
				// Update with enriched results (enricher returns copies, safe to mutate)
				classes.length = 0;
				classes.push(...enrichedContext.classes);
				relationships.length = 0;
				relationships.push(...enrichedContext.relationships);
				
				console.log(`🎨 Framework enrichment complete: ${classes.length} classes, ${relationships.length} relationships`);
			} catch (error) {
				console.error('⚠️  Framework enrichment failed:', error);
				console.error('Stack trace:', error instanceof Error ? error.stack : error);
				// Don't fail diagram generation if enrichment fails - just skip it
			}
		}

		return { classes, relationships };
	}

	private static findFilesWithConfig(workspacePath: string, config: KrataiConfig): string[] {
		const files: string[] = [];
		
		const foldersToScan = config.selectedFolders.length > 0 
			? config.selectedFolders 
			: [''];

		for (const folder of foldersToScan) {
			const fullPath = path.join(workspacePath, folder);
			if (fs.existsSync(fullPath)) {
				this.scanDirectory(fullPath, workspacePath, config, files);
			}
		}

		return files;
	}

	private static scanDirectory(
		dir: string,
		workspacePath: string,
		config: KrataiConfig,
		files: string[]
	): void {
		const items = fs.readdirSync(dir);
		
		for (const item of items) {
			const fullPath = path.join(dir, item);
			const stat = fs.statSync(fullPath);
			const relativePath = path.relative(workspacePath, fullPath);

			if (stat.isDirectory()) {
				if (ConfigService.shouldIncludeFolder(relativePath, config)) {
					this.scanDirectory(fullPath, workspacePath, config, files);
				}
			} else {
				if (ConfigService.shouldIncludeFile(fullPath, config)) {
					files.push(fullPath);
				}
			}
		}
	}

	/**
	 * Parse a single file using the appropriate parser strategy.
	 * Public method for backward compatibility (used by gitDiffEnricher).
	 */
	public static parseFile(filePath: string): ClassInfo[] {
		const parser = parserFactory.getParser(filePath);
		if (parser) {
			return parser.parseFile(filePath);
		}
		return [];
	}
}
