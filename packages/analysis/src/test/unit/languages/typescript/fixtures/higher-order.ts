// Test fixture: Higher-order functions - Callbacks, generics

// Generic higher-order function
export function map<T, U>(items: T[], fn: (item: T) => U): U[] {
	return items.map(fn);
}

// Generic filter
export function filter<T>(items: T[], predicate: (item: T) => boolean): T[] {
	return items.filter(predicate);
}

// Generic reduce
export function reduce<T, U>(items: T[], fn: (acc: U, item: T) => U, initial: U): U {
	return items.reduce(fn, initial);
}

// Callback function parameter
export function processUsers(users: User[], callback: (user: User) => void): void {
	users.forEach(callback);
}

// Higher-order function returning function
export function createValidator<T>(rule: (item: T) => boolean): (item: T) => boolean {
	return (item: T) => rule(item);
}

// Generic class
export class Repository<T> {
	private items: T[] = [];
	
	add(item: T): void {
		this.items.push(item);
	}
	
	findBy(predicate: (item: T) => boolean): T | undefined {
		return this.items.find(predicate);
	}
	
	map<U>(fn: (item: T) => U): U[] {
		return this.items.map(fn);
	}
}

// Usage with callbacks
export function getUserNames(users: User[]): string[] {
	return map(users, user => user.name);  // Callback: user => user.name
}

export function getActiveUsers(users: User[]): User[] {
	return filter(users, user => user.isActive);  // Callback: user => user.isActive
}

// Compose functions
export function compose<T>(fn1: (x: T) => T, fn2: (x: T) => T): (x: T) => T {
	return (x: T) => fn1(fn2(x));
}

// Curry function
export function curry<T, U, V>(fn: (a: T, b: U) => V): (a: T) => (b: U) => V {
	return (a: T) => (b: U) => fn(a, b);
}

// Generic constraint
export function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
	return obj[key];
}

// Multiple generic parameters
export function pair<T, U>(first: T, second: U): [T, U] {
	return [first, second];
}

interface User {
	id: string;
	name: string;
	email: string;
	isActive: boolean;
}

// Generic factory
export function createFactory<T>(constructor: new (...args: any[]) => T): (...args: any[]) => T {
	return (...args: any[]) => new constructor(...args);
}
