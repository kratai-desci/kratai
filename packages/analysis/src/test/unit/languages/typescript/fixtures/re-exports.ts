// Test fixture: Re-exports - Module graph with re-exported items

// Re-export named items
export { UserService } from './class-based';
export { createUser, validateUser } from './functional';

// Re-export with alias
export { User as UserModel } from './type-relationships';
export { BaseService as Service } from './parent-calls';

// Wildcard re-export
export * from './static-calls';

// Re-export type
export type { UserDTO } from './class-based';

// Re-export interface
export type { IUserService } from './class-based';

// Combined re-exports
export { UserRepository, User } from './class-based';

// Re-export default (if any)
export { default as DefaultValidator } from './validator';

// Transitive dependencies through re-exports
import { ValidationUtils } from './static-calls';
export { ValidationUtils };

// Re-export namespace
export * as Utils from './static-calls';
