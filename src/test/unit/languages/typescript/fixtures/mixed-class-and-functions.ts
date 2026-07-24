// Test fixture: a file with both a class and standalone top-level functions.
// The class must keep its own box; the standalone functions should be bundled
// into ONE companion "[mixed-class-and-functions]" module box, not exploded
// into one box per function (mirrors how JavaScriptParser/PythonParser/PHPParser
// already behave - TypeScriptParser currently does not).

export class UserService {
	constructor(private repository: UserRepository) {}

	getUser(id: string): User | null {
		return this.repository.find(id);
	}
}

interface UserRepository {
	find(id: string): User | null;
}

interface User {
	id: string;
	name: string;
}

export function formatUserName(user: User): string {
	return user.name.trim();
}

export function logUserAccess(user: User): void {
	console.log(`Accessed user: ${formatUserName(user)}`);
}

export const isValidUser = (user: User): boolean => {
	return !!user.id && !!user.name;
};

function auditUserAccess(user: User): void {
	// A named function nested inside another function - should NOT become
	// its own top-level diagram node.
	function buildAuditLine(): string {
		return `audit:${user.id}`;
	}
	logUserAccess(user);
	console.log(buildAuditLine());
}
