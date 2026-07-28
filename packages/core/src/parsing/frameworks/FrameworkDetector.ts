import * as fs from 'fs';
import * as path from 'path';

/**
 * Detects frameworks used in the workspace
 * 
 * Detection strategies:
 * 1. package.json dependencies
 * 2. File patterns (pages/, components/, etc.)
 * 3. Import patterns
 * 4. Configuration files
 */
export class FrameworkDetector {
	
	/**
	 * Detect all frameworks in use in the workspace
	 */
	static detect(workspacePath: string): Set<string> {
		const frameworks = new Set<string>();
		
		// Check package.json for dependencies
		const packageJsonPath = path.join(workspacePath, 'package.json');
		if (fs.existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
				const allDeps = {
					...packageJson.dependencies || {},
					...packageJson.devDependencies || {}
				};
				
				// React / Next.js
				if (allDeps['react']) frameworks.add('react');
				if (allDeps['next']) frameworks.add('nextjs');
				
				// Vue
				if (allDeps['vue']) frameworks.add('vue');
				if (allDeps['nuxt']) frameworks.add('nuxt');
				
				// Angular
				if (allDeps['@angular/core']) frameworks.add('angular');
				
				// NestJS
				if (allDeps['@nestjs/core']) frameworks.add('nestjs');
				
				// Express
				if (allDeps['express']) frameworks.add('express');
				
			} catch (error) {
				console.warn('Could not parse package.json:', error);
			}
		}
		
		// Check for Python frameworks
		const requirementsTxt = path.join(workspacePath, 'requirements.txt');
		if (fs.existsSync(requirementsTxt)) {
			const content = fs.readFileSync(requirementsTxt, 'utf-8');
			if (content.includes('django')) frameworks.add('django');
			if (content.includes('fastapi')) frameworks.add('fastapi');
			if (content.includes('flask')) frameworks.add('flask');
		}
		
		// Check for PHP frameworks
		const composerJson = path.join(workspacePath, 'composer.json');
		if (fs.existsSync(composerJson)) {
			try {
				const composer = JSON.parse(fs.readFileSync(composerJson, 'utf-8'));
				const allDeps = { ...composer.require || {}, ...composer['require-dev'] || {} };
				
				if (allDeps['laravel/framework']) frameworks.add('laravel');
				if (allDeps['symfony/symfony']) frameworks.add('symfony');
				
			} catch (error) {
				console.warn('Could not parse composer.json:', error);
			}
		}
		
		console.log(`🔍 Detected frameworks: ${Array.from(frameworks).join(', ') || 'none'}`);
		return frameworks;
	}
}
