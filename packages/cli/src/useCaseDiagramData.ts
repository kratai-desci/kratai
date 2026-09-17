export interface UseCaseActor {
	id: string;
	name: string;
	side: 'left' | 'right';
}

export interface UseCaseItem {
	id: string;
	name: string;
}

export interface UseCaseAssociation {
	actorId: string;
	useCaseId: string;
}

export interface UseCaseRelation {
	kind: 'include' | 'extend';
	fromId: string;
	toId: string;
}

export interface UseCaseDiagramData {
	workspaceName: string;
	systemName: string;
	actors: UseCaseActor[];
	useCases: UseCaseItem[];
	associations: UseCaseAssociation[];
	relations: UseCaseRelation[];
}

/**
 * Real extraction (actors/use cases from route handlers, auth guards, etc.)
 * needs LLM assistance to name things meaningfully - deferred. This mock
 * dataset exists purely to get the view's layout/interaction/styling in
 * front of the user before that analysis exists, so the shape here
 * (actors either side of a system boundary, associations, include/extend
 * between use cases) is what real data will eventually have to match.
 */
export function buildMockUseCaseDiagramData(workspaceName: string): UseCaseDiagramData {
	return {
		workspaceName,
		systemName: workspaceName,
		actors: [
			{ id: 'guest', name: 'Guest', side: 'left' },
			{ id: 'user', name: 'User', side: 'left' },
			{ id: 'admin', name: 'Admin', side: 'right' },
			{ id: 'scheduler', name: 'Scheduler\n(cron)', side: 'right' }
		],
		useCases: [
			{ id: 'register', name: 'Register' },
			{ id: 'login', name: 'Login' },
			{ id: 'authenticate', name: 'Authenticate\nCredentials' },
			{ id: 'view-profile', name: 'View Profile' },
			{ id: 'update-profile', name: 'Update Profile' },
			{ id: 'manage-users', name: 'Manage Users' },
			{ id: 'ban-user', name: 'Ban User' },
			{ id: 'promote-user', name: 'Promote User' },
			{ id: 'send-digest', name: 'Send Daily\nDigest Email' },
			{ id: 'logout', name: 'Logout' }
		],
		associations: [
			{ actorId: 'guest', useCaseId: 'register' },
			{ actorId: 'guest', useCaseId: 'login' },
			{ actorId: 'user', useCaseId: 'login' },
			{ actorId: 'user', useCaseId: 'view-profile' },
			{ actorId: 'user', useCaseId: 'update-profile' },
			{ actorId: 'user', useCaseId: 'logout' },
			{ actorId: 'admin', useCaseId: 'manage-users' },
			{ actorId: 'admin', useCaseId: 'login' },
			{ actorId: 'scheduler', useCaseId: 'send-digest' }
		],
		relations: [
			{ kind: 'include', fromId: 'login', toId: 'authenticate' },
			{ kind: 'include', fromId: 'register', toId: 'authenticate' },
			{ kind: 'extend', fromId: 'ban-user', toId: 'manage-users' },
			{ kind: 'extend', fromId: 'promote-user', toId: 'manage-users' }
		]
	};
}
