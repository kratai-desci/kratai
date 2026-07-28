/**
 * Re-export Pattern Test Fixture
 * Tests module re-export patterns (export { X } from './path')
 */

// Re-export specific items from other modules
export { UserService } from './class-based.js';
export { validateUser, createUser } from './functional.js';

// Re-export all from a module
export * from './type-relationships.js';

// Re-export with alias
export { UserService as DefaultUserService } from './class-based.js';

// Import and re-export
import { BaseService } from './class-based.js';
export { BaseService };

// Named exports that will be re-exported
export class ConfigService {
    constructor() {
        this.config = {};
    }
    
    getConfig(key) {
        return this.config[key];
    }
}

export function loadConfig(path) {
    return { loaded: true };
}

// This file should create import/re-export relationships
