import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GitHub from 'next-auth/providers/github';

export function isGitHubOAuthConfigured(): boolean {
	return Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
}

/**
 * The session shape this app actually produces, once the jwt/session
 * callbacks below have run - a plain exported type rather than ambient
 * `declare module` augmentation. (Auth.js's own callback param types are a
 * database-strategy/jwt-strategy intersection that ambient augmentation of
 * @auth/core's Session/User interfaces doesn't reliably merge into, at
 * least on next-auth 5.0.0-beta.32 - an explicit type here is simpler and
 * more reliable than fighting that.) Consumers (1_application/auth.ts,
 * 3_infrastructure/githubRepository.ts) import this type, not next-auth's
 * own `Session`.
 */
export interface AppSession {
	accessToken?: string;
	user: {
		id?: string;
		username?: string;
		name?: string | null;
		email?: string | null;
		image?: string | null;
	};
	expires: string;
}

interface AppJWT extends JWT {
	accessToken?: string;
	username?: string;
	userId?: string;
}

const {
	handlers,
	auth: nextAuth,
	signIn,
	signOut,
} = NextAuth({
	providers: [
		GitHub({
			clientId: process.env.AUTH_GITHUB_ID,
			clientSecret: process.env.AUTH_GITHUB_SECRET,
			// `repo` (not just `read:user`) because listing a user's private
			// repos - and eventually cloning them - needs it; classic GitHub
			// OAuth Apps don't have a narrower read-only-private-repos scope.
			authorization: { params: { scope: 'read:user user:email repo' } },
		}),
	],
	callbacks: {
		async jwt({ token, account, profile }) {
			const t = token as AppJWT;
			if (account?.access_token) {
				t.accessToken = account.access_token;
			}
			if (profile) {
				const githubProfile = profile as { login?: string; id?: number };
				t.username = githubProfile.login;
				t.userId = githubProfile.id != null ? String(githubProfile.id) : token.sub;
			}
			return token;
		},
		async session({ session, token }) {
			const t = token as AppJWT;
			const s = session as unknown as AppSession;
			s.accessToken = t.accessToken;
			s.user.id = t.userId ?? s.user.id;
			s.user.username = t.username;
			return session;
		},
	},
});

export { handlers, signIn, signOut };

export async function auth(): Promise<AppSession | null> {
	const session = await nextAuth();
	return session as unknown as AppSession | null;
}
