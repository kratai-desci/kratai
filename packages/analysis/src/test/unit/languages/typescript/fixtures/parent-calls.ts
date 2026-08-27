// Test fixture: Parent class calls - super.method() calls

export class BaseService {
	protected validate(data: any): boolean {
		return data !== null && data !== undefined;
	}
	
	protected save(data: any): any {
		console.log('BaseService.save', data);
		return data;
	}
	
	protected log(message: string): void {
		console.log('[BaseService]', message);
	}
}

export class UserService extends BaseService {
	// Override with super call
	protected override validate(data: any): boolean {
		super.log('Validating user data');
		return super.validate(data) && data.email !== undefined;
	}
	
	// Override with super call in body
	protected override save(data: any): any {
		super.log('Saving user');
		const validated = super.validate(data);
		if (validated) {
			return super.save(data);
		}
		throw new Error('Validation failed');
	}
	
	createUser(data: any): any {
		// Super call to parent method
		if (super.validate(data)) {
			return super.save(data);
		}
		return null;
	}
}

export class AdminService extends UserService {
	protected override validate(data: any): boolean {
		// Chained super calls
		super.log('Admin validation');
		return super.validate(data) && data.role === 'admin';
	}
}
