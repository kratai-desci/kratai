// Test fixture: Type relationships - Property, return, parameter types

export class UserRepository {
	findById(id: string): User | null {
		return null;
	}
	
	findAll(): User[] {
		return [];
	}
	
	save(data: any): Promise<User> {
		return Promise.resolve(new User('1', data.name, data.email));
	}
}

export class UserDTO {
	constructor(
		public name: string,
		public email: string
	) {}
}

export class User {
	id: string;
	name: string;
	email: string;
	
	constructor(id: string, name: string, email: string) {
		this.id = id;
		this.name = name;
		this.email = email;
	}
}

export class UserService {
	// Property type - composition
	private repo: UserRepository;
	private validator: UserValidator;
	
	constructor(repo: UserRepository) {
		this.repo = repo;
		this.validator = new UserValidator();
	}
	
	// Return type
	getUsers(): User[] {
		return this.repo.findAll();
	}
	
	// Parameter type + Return type
	create(data: UserDTO): Promise<User> {
		return this.repo.save(data);
	}
	
	// Multiple type relationships
	async updateUser(id: string, data: UserDTO): Promise<User | null> {
		const existing = await this.repo.findById(id);
		if (existing) {
			return this.repo.save({ ...existing, ...data });
		}
		return null;
	}
}

class UserValidator {
	validate(data: any): boolean {
		return true;
	}
}
