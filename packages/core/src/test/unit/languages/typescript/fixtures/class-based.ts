// Test fixture: OOP patterns - Classes, inheritance, interfaces

export interface IUserService {
	getUser(id: string): User | null;
	createUser(data: UserDTO): User;
}

export abstract class BaseService {
	protected abstract validate(data: any): boolean;
	
	protected log(message: string): void {
		console.log(message);
	}
}

export class UserRepository {
	find(id: string): User | null {
		return null;
	}
	
	save(user: User): User {
		return user;
	}
}

export class UserService extends BaseService implements IUserService {
	constructor(private repo: UserRepository) {
		super();
	}
	
	protected validate(data: any): boolean {
		return data !== null;
	}
	
	getUser(id: string): User | null {
		return this.repo.find(id);
	}
	
	createUser(data: UserDTO): User {
		if (this.validate(data)) {
			const user = new User(data.name, data.email);
			return this.repo.save(user);
		}
		throw new Error('Invalid data');
	}
}

export class User {
	constructor(
		public name: string,
		public email: string
	) {}
}

export interface UserDTO {
	name: string;
	email: string;
}
