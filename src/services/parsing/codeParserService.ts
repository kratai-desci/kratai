import * as fs from 'fs';
import * as path from 'path';
import { ClassInfo, DiagramData, ClassRelationship } from '../../types/domain';
import { KrataiConfig } from '../../types/config';
import { ConfigService } from '../config/configService';
import { ParserFactory } from './parsers/ParserFactory';
import { HttpCallDetector } from './httpCallDetector';

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

		// Detect HTTP API calls (fetch, axios, etc.) if enabled
		if (config.detectHttpCalls !== false) {
			const httpDetector = new HttpCallDetector();
			const routeMap = httpDetector.buildRouteMap(classes);
			console.log(`🌐 Built route map with ${routeMap.size} API routes`);
			
			const httpRelationships = httpDetector.createHttpRelationships(
				classes,
				routeMap
			);
			console.log(`🌐 Detected ${httpRelationships.length} HTTP call relationships`);
			relationships.push(...httpRelationships);
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
