// Test fixture: Module imports/exports - Dependency graph

// Named imports
import { User, UserDTO } from './class-based';
import { validateUser, createUser } from './functional';
import { ValidationUtils, StringUtils } from './static-calls';

// Import with alias
import { UserService as Service } from './class-based';
import { BaseService as Base } from './parent-calls';

// Default import
import DefaultValidator from './validator';

// Namespace import
import * as Utils from './static-calls';
import * as Factories from './factory-pattern';

// Type-only imports
import type { IUserService } from './class-based';
import type { User as UserType } from './type-relationships';

// Multiple imports from same module
import {
	UserRepository,
	UserService,
	IUserService as IService
} from './class-based';

// Side-effect import
import './init';

// Using imported items
export class UserManager implements IUserService {
	private service: Service;
	private validator: DefaultValidator;
	
	constructor() {
		this.service = new Service(new UserRepository());
		this.validator = new DefaultValidator();
	}
	
	getUser(id: string): User | null {
		// Using imported functions
		const validated = Utils.ValidationUtils.validate(id);
		if (validated) {
			return this.service.getUser(id);
		}
		return null;
	}
	
	createUser(data: UserDTO): User {
		// Using imported function
		if (validateUser(data)) {
			// Using imported factory
			return Factories.createUser(data);
		}
		throw new Error('Invalid user data');
	}
}

// Re-exporting for module graph
export { User, UserDTO, validateUser };
export { ValidationUtils };
