/**
 * Next.js Page with Server-Side Rendering
 * 
 * Simulates: app/users/page.tsx
 * MUST detect:
 * - Page component route /users
 * - Server-side data fetching
 * - Component rendering
 */

import { UserService } from '@/services/UserService';
import { User } from '@/types/User';
import UserList from '@/components/UserList';

// MUST detect: Page component for route /users
export default async function UsersPage() {
    // MUST detect: Server-side fetch - calls UserService.getAllUsers
    const userService = new UserService();
    const users = await userService.getAllUsers();
    
    // MUST detect: Renders UserList component
    return (
        <div>
            <h1>Users</h1>
            <UserList users={users} />
        </div>
    );
}

// MUST detect: Metadata export (Next.js 13+ pattern)
export const metadata = {
    title: 'Users',
    description: 'List of all users'
};

// MUST detect: Dynamic metadata function
export async function generateMetadata({ params }: { params: { id: string } }) {
    return {
        title: `User ${params.id}`
    };
}
