import { handlers } from '@/3_infrastructure/auth';

// Next.js requires the Auth.js route handler at this exact path - the only
// place in the app allowed to import 3_infrastructure/auth directly rather
// than through 1_application/auth.ts, same as app/'s routing constraints
// elsewhere.
export const { GET, POST } = handlers;
