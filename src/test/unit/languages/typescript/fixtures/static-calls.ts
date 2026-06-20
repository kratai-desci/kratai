// Test fixture: Static method calls - Class.staticMethod()

export class ValidationUtils {
	static validate(data: any): boolean {
		return data !== null && data !== undefined;
	}
	
	static validateEmail(email: string): boolean {
		return email.includes('@');
	}
	
	static validateAge(age: number): boolean {
		return age >= 0 && age <= 120;
	}
}

export class StringUtils {
	static trim(value: string): string {
		return value.trim();
	}
	
	static isEmpty(value: string): boolean {
		return value.length === 0;
	}
}

export class UserService {
	createUser(data: any): User | null {
		// Static method call
		if (ValidationUtils.validate(data)) {
			// Multiple static calls
			if (ValidationUtils.validateEmail(data.email)) {
				const name = StringUtils.trim(data.name);
				if (!StringUtils.isEmpty(name)) {
					return new User(name, data.email);
				}
			}
		}
		return null;
	}
	
	updateUser(id: string, data: any): User | null {
		// Static validation
		const isValid = ValidationUtils.validate(data) && 
		                ValidationUtils.validateEmail(data.email);
		
		if (isValid) {
			return new User(StringUtils.trim(data.name), data.email);
		}
		return null;
	}
}

class User {
	constructor(public name: string, public email: string) {}
}
