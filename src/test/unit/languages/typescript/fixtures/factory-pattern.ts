// Test fixture: Factory patterns - Constructor calls and object creation

export class User {
	constructor(
		public id: string,
		public name: string,
		public email: string
	) {}
}

export class UserDTO {
	constructor(
		public name: string,
		public email: string
	) {}
}

// Factory function that creates instances
export function createUser(data: UserDTO): User {
	const id = generateId();
	return new User(id, data.name, data.email);  // Factory creates User
}

// Factory with validation
export function createValidatedUser(data: any): User | null {
	if (validate(data)) {
		return new User(generateId(), data.name, data.email);
	}
	return null;
}

// Factory that returns different types
export function createEntity(type: string, data: any): User | Admin {
	if (type === 'admin') {
		return new Admin(generateId(), data.name, data.role);
	}
	return new User(generateId(), data.name, data.email);
}

// Factory class (Factory pattern)
export class UserFactory {
	static create(data: UserDTO): User {
		return new User(generateId(), data.name, data.email);
	}
	
	static createBatch(dataList: UserDTO[]): User[] {
		return dataList.map(data => new User(generateId(), data.name, data.email));
	}
}

// Builder pattern (also a factory)
export class UserBuilder {
	private id: string = '';
	private name: string = '';
	private email: string = '';
	
	setId(id: string): this {
		this.id = id;
		return this;
	}
	
	setName(name: string): this {
		this.name = name;
		return this;
	}
	
	setEmail(email: string): this {
		this.email = email;
		return this;
	}
	
	build(): User {
		return new User(this.id, this.name, this.email);
	}
}

class Admin {
	constructor(
		public id: string,
		public name: string,
		public role: string
	) {}
}

function generateId(): string {
	return Math.random().toString(36);
}

function validate(data: any): boolean {
	return data && data.name && data.email;
}
