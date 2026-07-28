// Test fixture: Functional programming - Functions, calls, composition

export function validateUser(data: any): boolean {
	return data && data.name && data.email;
}

export function saveUser(data: any): User {
	return { id: '123', ...data };
}

export function createUser(data: any): User | null {
	return validateUser(data) ? saveUser(data) : null;
}

// Arrow function
export const updateUser = (id: string, data: any): User | null => {
	const existing = findUser(id);
	if (existing && validateUser(data)) {
		return saveUser({ ...existing, ...data });
	}
	return null;
};

function findUser(id: string): User | null {
	return null;
}

// Function composition
export function processUser(data: any): User | null {
	const validated = validateUser(data);
	if (validated) {
		const user = createUser(data);
		return user;
	}
	return null;
}

interface User {
	id?: string;
	name: string;
	email: string;
}
