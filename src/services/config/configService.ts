import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { KrataiConfig } from '../../types/config';

export class ConfigService {
	private static readonly CONFIG_FILE = '.vscode/kratai.json';

	static getDefaultConfig(): KrataiConfig {
		return {
			selectedFolders: [],  // Empty = all folders except node_modules/dist
			selectedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.php'],
			respectGitignore: true,
			followSymlinks: false,
			gitDiff: {
				enabled: true,
				baseCommit: 'HEAD~1'
			},
			detectHttpCalls: true  // Detect fetch/axios/useSWR calls to API routes
		};
	}

	static generateSmartDefaults(workspacePath: string): KrataiConfig {
		// Default to selecting the root folder only (simple and predictable)
		const selectedFolders = [''];

		// Detect file types in the project
		const extensions = this.detectFileExtensions(workspacePath);

		return {
			selectedFolders,
			selectedExtensions: extensions,
			respectGitignore: true,
			followSymlinks: false
		};
	}

	private static detectFileExtensions(workspacePath: string): string[] {
		// Default to TypeScript
		let detectedExtensions: string[] = ['.ts', '.tsx'];

		// Check for package.json (Node.js projects)
		const packageJsonPath = path.join(workspacePath, 'package.json');
		if (fs.existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
				const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

				// Check for TypeScript
				const hasTypeScript = deps['typescript'] || deps['@types/node'];
				// Check for JavaScript frameworks
				const hasReact = deps['react'];
				const hasVue = deps['vue'];
				
				if (hasTypeScript) {
					detectedExtensions = hasReact ? ['.ts', '.tsx'] : ['.ts'];
				} else {
					detectedExtensions = hasReact ? ['.js', '.jsx'] : ['.js'];
				}

				// Add .vue if Vue detected
				if (hasVue) {
					detectedExtensions.push('.vue');
				}
			} catch (error) {
				// Fallback to defaults
			}
			return detectedExtensions;
		}

		// Check for composer.json (PHP projects)
		const composerJsonPath = path.join(workspacePath, 'composer.json');
		if (fs.existsSync(composerJsonPath)) {
			return ['.php'];
		}

		// Check for requirements.txt or setup.py (Python projects)
		const requirementsTxtPath = path.join(workspacePath, 'requirements.txt');
		const setupPyPath = path.join(workspacePath, 'setup.py');
		const pyprojectTomlPath = path.join(workspacePath, 'pyproject.toml');
		if (fs.existsSync(requirementsTxtPath) || fs.existsSync(setupPyPath) || fs.existsSync(pyprojectTomlPath)) {
			return ['.py'];
		}

		// Check for Gemfile (Ruby projects)
		const gemfilePath = path.join(workspacePath, 'Gemfile');
		if (fs.existsSync(gemfilePath)) {
			return ['.rb'];
		}

		// Check for go.mod (Go projects)
		const goModPath = path.join(workspacePath, 'go.mod');
		if (fs.existsSync(goModPath)) {
			return ['.go'];
		}

		// Check for pom.xml or build.gradle (Java projects)
		const pomXmlPath = path.join(workspacePath, 'pom.xml');
		const buildGradlePath = path.join(workspacePath, 'build.gradle');
		if (fs.existsSync(pomXmlPath) || fs.existsSync(buildGradlePath)) {
			return ['.java'];
		}

		// Check for .csproj or .sln (C# projects)
		const csprojFiles = fs.readdirSync(workspacePath).filter((f: string) => f.endsWith('.csproj') || f.endsWith('.sln'));
		if (csprojFiles.length > 0) {
			return ['.cs'];
		}

		return detectedExtensions;
	}

	static getProjectInfo(config: KrataiConfig): string {
		if (config.selectedFolders.length === 0) {
			return '📂 Scanning all folders (except node_modules, dist, build, out, .git)';
		}

		const folderList = config.selectedFolders.join(', ');
		const extList = config.selectedExtensions.join(', ');
		return `📂 Folders: ${folderList}\n📄 Extensions: ${extList}`;
	}

	static async loadConfig(workspacePath: string): Promise<KrataiConfig> {
		const configPath = path.join(workspacePath, this.CONFIG_FILE);
		
		if (!fs.existsSync(configPath)) {
			// No config file exists - generate smart defaults
			return this.generateSmartDefaults(workspacePath);
		}

		try {
			const content = fs.readFileSync(configPath, 'utf-8');
			const config = JSON.parse(content) as KrataiConfig;
			
			// Merge with defaults to handle missing fields
			return {
				...this.getDefaultConfig(),
				...config
			};
		} catch (error) {
			console.error('Error loading Kratai config:', error);
			return this.generateSmartDefaults(workspacePath);
		}
	}

	static async saveConfig(workspacePath: string, config: KrataiConfig): Promise<void> {
		const configPath = path.join(workspacePath, this.CONFIG_FILE);
		const vscodeDir = path.dirname(configPath);

		// Create .vscode directory if it doesn't exist
		if (!fs.existsSync(vscodeDir)) {
			fs.mkdirSync(vscodeDir, { recursive: true });
		}

		const configWithTimestamp = {
			...config,
			lastUpdated: new Date().toISOString()
		};

		fs.writeFileSync(configPath, JSON.stringify(configWithTimestamp, null, 2), 'utf-8');
	}

	static shouldIncludeFolder(folderPath: string, config: KrataiConfig): boolean {
		// Default exclusions
		const defaultExclusions = ['node_modules', 'dist', 'build', 'out', '.git'];
		
		const relativePath = folderPath.replace(/\\/g, '/');
		
		// Check default exclusions
		for (const exclusion of defaultExclusions) {
			if (relativePath.includes(`/${exclusion}/`) || relativePath.endsWith(`/${exclusion}`) || relativePath === exclusion) {
				return false;
			}
		}

		// If no folders selected, include everything (except defaults)
		if (config.selectedFolders.length === 0) {
			return true;
		}

		// Check if folder is in selected list or is a parent/child of selected
		for (const selected of config.selectedFolders) {
			if (relativePath === selected || 
			    relativePath.startsWith(selected + '/') || 
			    selected.startsWith(relativePath + '/')) {
				return true;
			}
		}

		return false;
	}

	static shouldIncludeFile(filePath: string, config: KrataiConfig): boolean {
		const ext = path.extname(filePath);
		return config.selectedExtensions.includes(ext);
	}
}
