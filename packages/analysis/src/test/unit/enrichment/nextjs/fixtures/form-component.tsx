/**
 * Client Component Using Server Actions
 * 
 * MUST detect:
 * - "use client" directive
 * - Form component
 * - Form → Server action relationship
 */

'use client';

import { createUserAction, deleteUserAction } from '@/actions/server-actions';
import { useFormStatus } from 'react-dom';

// MUST detect: Client component - UserForm
// MUST detect: Uses createUserAction (server action)
export function UserForm() {
    // MUST detect: Form action bound to createUserAction
    return (
        <form action={createUserAction}>
            <input name="name" placeholder="Name" required />
            <input name="email" type="email" placeholder="Email" required />
            <SubmitButton />
        </form>
    );
}

// MUST detect: Client component - DeleteButton
// MUST detect: Uses deleteUserAction (server action)
export function DeleteButton({ userId }: { userId: string }) {
    // MUST detect: Button onClick calls deleteUserAction
    const handleDelete = async () => {
        await deleteUserAction(userId);
    };
    
    return (
        <button onClick={handleDelete}>
            Delete
        </button>
    );
}

// Helper component (uses React hook)
function SubmitButton() {
    const { pending } = useFormStatus();
    return <button type="submit" disabled={pending}>Submit</button>;
}
