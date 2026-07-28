/**
 * Next.js Layout Component
 * 
 * Simulates: app/users/layout.tsx
 * MUST detect:
 * - Layout component for /users route
 * - Layout wraps child pages
 * - Component composition
 */

import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

// MUST detect: Layout component for /users
// MUST detect: Renders Sidebar and Header components
export default function UsersLayout({ children }: { children: ReactNode }) {
    return (
        <div>
            <Header title="User Management" />
            <div className="container">
                <Sidebar />
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}

// MUST detect: Layout metadata
export const metadata = {
    title: 'Users - Admin Panel',
    description: 'Manage users'
};
