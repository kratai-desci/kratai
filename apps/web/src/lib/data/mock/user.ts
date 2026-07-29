import type { User } from '../types';

// The one "signed in" identity in this UI-only phase - there's no real
// session yet (see REQUIREMENTS.md §4.1), so every visitor to the (app)
// route group is treated as this same mock user. Deliberately not one of
// the mock repo owners in repos.ts - a real GitHub user commonly has access
// to repos they don't own (org membership, collaborator access), so the
// two identities aren't meant to line up.
export const MOCK_USER: User = {
	id: 'user_demo',
	name: 'Alex Rivera',
	username: 'alexrivera',
	email: 'alex@example.com',
	avatarUrl: null,
};
