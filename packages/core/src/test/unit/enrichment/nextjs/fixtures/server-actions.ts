/**
 * Next.js Server Actions
 * 
 * MUST detect:
 * - "use server" directive
 * - Server action functions
 * - Form component → Server action relationship
 */

'use server';

import { UserService } from '@/services/UserService';
import { revalidatePath } from 'next/cache';

// MUST detect: Server action - createUserAction
// MUST detect: Calls UserService.createUser
export async function createUserAction(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    
    const userService = new UserService();
    const user = await userService.createUser({ name, email });
    
    revalidatePath('/users');
    return user;
}

// MUST detect: Server action - updateUserAction
// MUST detect: Calls UserService.updateUser
export async function updateUserAction(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    
    const userService = new UserService();
    const user = await userService.updateUser(id, { name, email });
    
    revalidatePath(`/users/${id}`);
    return user;
}

// MUST detect: Server action - deleteUserAction
// MUST detect: Calls UserService.deleteUser
export async function deleteUserAction(id: string) {
    const userService = new UserService();
    await userService.deleteUser(id);
    
    revalidatePath('/users');
}
