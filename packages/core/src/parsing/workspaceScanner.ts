import * as fs from 'fs';
import * as path from 'path';
import { ExtensionInfo } from '../types/view';
import { KrataiConfig } from '../types/config';
import { ConfigService } from '../util/configService';

export class WorkspaceScanner {
	private static readonly DEFAULT_EXCLUSIONS = [
		'node_modules', 'dist', 'build', 'out', '.git', '.vscode',
		// Python exclusions
		'venv', '.venv', 'env', '__pycache__', 'site-packages', '.tox', '.pytest_cache',
		// PHP exclusions
		'vendor',
		// General
		'.idea', '.DS_Store', 'coverage', '.next', '.nuxt'
	];

	/**
	 * Select folders from workspace (flat array for config)
	 * Returns only top-level source folders - scanForFiles() already recurses
	 * into all of their subdirectories (excluding non-source ones), so the
	 * list is intentionally NOT expanded to every descendant here: doing that
	 * previously made getFilesToParse() re-scan the same nested folder once
	 * per ancestor listed (e.g. "backend", then "backend/app", then
	 * "backend/app/api", ...), parsing some files up to 4x and corrupting the
	 * resulting class/relationship counts.
	 *
	 * @param workspacePath - Absolute path to workspace
	 * @returns Array of top-level folder paths (e.g., ["src", "lib", "mcp"])
	 */
	static selectFolders(workspacePath: string): string[] {
		const topLevelFolders = this.detectTopLevelSourceFolders(workspacePath);

		if (topLevelFolders.length === 0) {
			return ['.'];
		}

		return topLevelFolders;
	}

	/**
	 * Detect top-level source folders only
	 * Returns folder names if they exist (parsing will handle recursion)
	 *
	 * A folder qualifies by exclusion, not by matching a fixed name list: real
	 * projects name their source root anything (backend/, frontend/, server/,
	 * web/, ...) and no fixed whitelist can cover them all. A name-matching
	 * whitelist also produces false positives - e.g. a cookiecutter template's
	 * `hooks/` post-gen-script folder matching the "React hooks" candidate and
	 * being treated as the *only* source folder, silently hiding sibling
	 * `backend/`/`frontend/` folders that just weren't on the list. Instead,
	 * every top-level folder that isn't a known non-source folder
	 * (shouldExcludeFolder) and that actually contains parseable code
	 * (hasCodeInTree) qualifies.
	 */
	private static detectTopLevelSourceFolders(workspacePath: string): string[] {
		const found: string[] = [];

		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(workspacePath, { withFileTypes: true });
		} catch (error) {
			return found;
		}

		for (const entry of entries) {
			if (!entry.isDirectory() || this.shouldExcludeFolder(entry.name)) continue;

			const fullPath = path.join(workspacePath, entry.name);
			if (this.hasCodeInTree(fullPath)) {
				found.push(entry.name);
			}
		}

		return found;
	}

	/**
	 * Check if folder tree contains any parseable code files
	 * Recursively checks folder and all descendants
	 */
	private static hasCodeInTree(
		folderPath: string,
		maxDepth: number = 5,
		currentDepth: number = 0
	): boolean {
		// Prevent infinite recursion
		if (currentDepth > maxDepth) return false;
		
		try {
			const entries = fs.readdirSync(folderPath, { withFileTypes: true });
			
			for (const entry of entries) {
				if (entry.isFile()) {
					// Check if this is a parseable file
					const ext = path.extname(entry.name).toLowerCase();
					const PARSEABLE_EXTENSIONS = [
						'.ts', '.tsx', '.js', '.jsx', 
						'.py', '.php', '.java', '.kt', 
						'.html', '.jsp', '.go', '.rs',
					];
					if (PARSEABLE_EXTENSIONS.includes(ext)) {
						return true;
					}
				} else if (entry.isDirectory()) {
					// Skip excluded folders
					if (this.shouldExcludeFolder(entry.name)) continue;
					
					// Recurse into subdirectory
					const childPath = path.join(folderPath, entry.name);
					if (this.hasCodeInTree(childPath, maxDepth, currentDepth + 1)) {
						return true;
					}
				}
			}
		} catch (error) {
			// Can't read folder
		}
		
		return false;
	}

	/**
	 * Check if folder should be excluded (non-source folders)
	 */
	private static shouldExcludeFolder(name: string): boolean {
		const lowerName = name.toLowerCase();
		
		const exclusions = [
			// Build/Dependencies (from DEFAULT_EXCLUSIONS)
			'node_modules', 'dist', 'build', 'out', 'vendor',
			'venv', '.venv', 'env', '__pycache__', 'site-packages',
			'.tox', '.pytest_cache',
			
			// VCS/IDE
			'.git', '.vscode', '.idea', '.ds_store', '.next', '.nuxt', '.cache',
			
			// Non-source folders
			'test', 'tests', '__tests__', 'spec', 'specs', 'e2e',
			'doc', 'docs', 'documentation',
			'example', 'examples', 'demo', 'demos', 'sample', 'samples',
			'script', 'scripts', 'tool', 'tools', 'util', 'utilities',
			'config', 'configs', 'configuration',
			'public', 'static', 'assets', 'resources', 'images',
			'coverage', 'reports',
			
			// Framework-specific non-source
			'migrations', 'seeds', 'fixtures', 'locales', 'i18n',
		];
		
		return exclusions.includes(lowerName);
	}

	/**
	 * Check if folder contains parseable source files
	 */
	private static hasParseableFiles(
		folderPath: string,
		maxCheck: number = 50  // Don't scan thousands of files
	): boolean {
		const PARSEABLE_EXTENSIONS = [
			'.ts', '.tsx', '.js', '.jsx', 
			'.py', '.php', '.java', '.kt', 
			'.html', '.jsp', '.go', '.rs',
			'.c', '.cpp', '.h', '.hpp',
			'.cs', '.rb', '.swift', '.scala'
		];
		
		try {
			const entries = fs.readdirSync(folderPath, { withFileTypes: true });
			let checked = 0;
			
			for (const entry of entries) {
				if (checked++ > maxCheck) break;
				
				if (entry.isFile()) {
					const ext = path.extname(entry.name).toLowerCase();
					if (PARSEABLE_EXTENSIONS.includes(ext)) {
						return true;
					}
				}
			}
		} catch (error) {
			// Can't read folder
		}
		
		return false;
	}

	/**
	 * Scan workspace and count file extensions
	 * Used by UI to display extension statistics
	 */
	static scanExtensionCounts(workspacePath: string): ExtensionInfo[] {
		const extensionMap = new Map<string, number>();
		
		this.scanExtensions(workspacePath, '', extensionMap);

		// Convert to array and sort by count
		const extensions: ExtensionInfo[] = Array.from(extensionMap.entries())
			.map(([ext, count]) => ({
				extension: ext,
				count,
				selected: ext === '.ts' || ext === '.tsx' // Default selections
			}))
			.sort((a, b) => b.count - a.count);

		return extensions;
	}

	private static scanExtensions(
		workspacePath: string,
		relativePath: string,
		extensionMap: Map<string, number>
	): void {
		const fullPath = path.join(workspacePath, relativePath);
		
		if (!fs.existsSync(fullPath)) {
			return;
		}

		const entries = fs.readdirSync(fullPath, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.isDirectory()) {
				// Skip default exclusions
				if (this.DEFAULT_EXCLUSIONS.includes(entry.name)) {
					continue;
				}
				
				const childRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
				this.scanExtensions(workspacePath, childRelativePath, extensionMap);
			} else {
				const ext = path.extname(entry.name);
				if (ext) {
					extensionMap.set(ext, (extensionMap.get(ext) || 0) + 1);
				}
			}
		}
	}

	/**
	 * Get list of files to parse based on config
	 * Starts parsing from selected folders directly, includes all subdirectories
	 * 
	 * @param workspacePath - Absolute path to workspace
	 * @param config - Configuration with selected folders and extensions
	 * @returns Array of absolute file paths ready to parse
	 */
	static getFilesToParse(workspacePath: string, config: KrataiConfig): string[] {
		const files: string[] = [];
		
		// Get selected folders using helper (supports both old and new format)
		const selectedFolders = ConfigService.getSelectedFolders(config);
		
		// If no folders selected, parse entire workspace
		if (selectedFolders.length === 0) {
			this.scanForFiles(workspacePath, workspacePath, config, files);
			return files;
		}
		
		// Parse each selected folder + all subdirectories
		for (const folder of selectedFolders) {
			const folderPath = path.join(workspacePath, folder);
			if (fs.existsSync(folderPath)) {
				this.scanForFiles(folderPath, workspacePath, config, files);
			}
		}
		
		return files;
	}

	/**
	 * Recursively scan directory for files matching config
	 * Parses everything in the given directory + all subdirectories (except exclusions)
	 * Private - callers should use getFilesToParse()
	 */
	private static scanForFiles(
		dir: string,
		workspacePath: string,
		config: KrataiConfig,
		files: string[]
	): void {
		try {
			const items = fs.readdirSync(dir);
			
			for (const item of items) {
				const fullPath = path.join(dir, item);
				const stat = fs.statSync(fullPath);

				if (stat.isDirectory()) {
					// Skip excluded folders only (tests, node_modules, etc.)
					if (!this.isExcludedFolder(item)) {
						this.scanForFiles(fullPath, workspacePath, config, files);
					}
				} else {
					if (this.shouldIncludeFile(fullPath, config.selectedExtensions)) {
						files.push(fullPath);
					}
				}
			}
		} catch (error) {
			// Skip directories we can't read
		}
	}

	/**
	 * Check if a folder should be excluded from parsing
	 * Combines DEFAULT_EXCLUSIONS and comprehensive exclusions
	 */
	private static isExcludedFolder(folderName: string): boolean {
		// Check DEFAULT_EXCLUSIONS (node_modules, dist, .git, etc.)
		if (this.DEFAULT_EXCLUSIONS.includes(folderName)) {
			return true;
		}
		
		// Check comprehensive exclusions (tests, docs, etc.)
		return this.shouldExcludeFolder(folderName);
	}

	/**
	 * Check if a file should be included based on extension
	 * Private - inclusion logic is internal to WorkspaceScanner
	 */
	private static shouldIncludeFile(filePath: string, selectedExtensions: string[]): boolean {
		const ext = path.extname(filePath);
		if (!selectedExtensions.includes(ext)) return false;
		return !this.looksMinified(filePath);
	}

	// Below this size, checking content isn't worth the extra read - even a
	// dense one-liner (a long import, a big object literal) won't be large
	// enough to trip a parser, and this keeps the check off the vast
	// majority of ordinary source files.
	private static readonly MINIFIED_SIZE_THRESHOLD_BYTES = 50_000;
	// A hand-written line rarely runs past a couple hundred characters;
	// minified/bundled output packs an entire file onto one line
	// (kratai's own vendored three.js averages ~110,000 chars/line), so
	// this threshold sits comfortably above any real editing convention.
	private static readonly MINIFIED_AVG_LINE_LENGTH_THRESHOLD = 500;

	/**
	 * Vendored/bundled/minified code checked into a repo (a committed
	 * `vendor/three.min.js`, a bundler's output, ...) isn't something
	 * anyone wants "architecture" insight into, and its pathologically
	 * deep, line-less structure can blow a parser's call stack - so it's
	 * worth skipping proactively rather than relying only on
	 * CodeParserService's per-file try/catch to survive it. Extension
	 * alone (`*.min.js`) doesn't catch bundler output that omits that
	 * convention, so this also checks actual line density for anything
	 * unusually large.
	 */
	private static looksMinified(filePath: string): boolean {
		if (/\.min\.(m|c)?jsx?$/i.test(filePath)) return true;

		try {
			const stat = fs.statSync(filePath);
			if (stat.size < this.MINIFIED_SIZE_THRESHOLD_BYTES) return false;

			const content = fs.readFileSync(filePath, 'utf-8');
			const lineCount = (content.match(/\n/g) || []).length + 1;
			return content.length / lineCount > this.MINIFIED_AVG_LINE_LENGTH_THRESHOLD;
		} catch (error) {
			return false;
		}
	}
}
