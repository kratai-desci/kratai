// Test fixture: Async chains - async/await patterns

export async function fetchUser(id: string): Promise<User | null> {
	// Simulated async operation
	return new Promise(resolve => {
		setTimeout(() => resolve({ id, name: 'John', email: 'john@example.com' }), 100);
	});
}

export async function validateUserAsync(user: User): Promise<boolean> {
	return new Promise(resolve => {
		setTimeout(() => resolve(user.email.includes('@')), 50);
	});
}

export async function saveUserAsync(user: User): Promise<User> {
	return new Promise(resolve => {
		setTimeout(() => resolve(user), 50);
	});
}

// Async function with await chain
export async function getUser(id: string): Promise<User | null> {
	const data = await fetchUser(id);  // Async call
	if (data) {
		const isValid = await validateUserAsync(data);  // Chained async call
		if (isValid) {
			return data;
		}
	}
	return null;
}

// Complex async chain
export async function createAndSaveUser(data: any): Promise<User | null> {
	const user = await transformUserData(data);
	if (user) {
		const validated = await validateUserAsync(user);
		if (validated) {
			const saved = await saveUserAsync(user);
			return saved;
		}
	}
	return null;
}

// Parallel async operations
export async function getUsersParallel(ids: string[]): Promise<User[]> {
	const promises = ids.map(id => fetchUser(id));
	const users = await Promise.all(promises);
	return users.filter((u): u is User => u !== null);
}

// Async with error handling
export async function getValidatedUser(id: string): Promise<User | null> {
	try {
		const user = await fetchUser(id);
		if (user) {
			const isValid = await validateUserAsync(user);
			return isValid ? user : null;
		}
	} catch (error) {
		console.error(error);
	}
	return null;
}

async function transformUserData(data: any): Promise<User> {
	return new Promise(resolve => {
		setTimeout(() => resolve({
			id: '123',
			name: data.name,
			email: data.email
		}), 50);
	});
}

interface User {
	id: string;
	name: string;
	email: string;
}
