/**
 * API Route with Service Integration
 * 
 * Simulates: app/api/users/[id]/route.ts
 * MUST detect: 
 * - Route path /api/users/:id
 * - Handler → Service call
 * - Service → DTO transformation
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/UserService';
import { UserDTO } from '@/types/UserDTO';

// MUST detect: GET /api/users/:id → getUserByIdHandler
// MUST detect: Calls UserService.getUserById
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const userService = new UserService();
    const user = await userService.getUserById(params.id);
    
    // MUST detect: Returns UserDTO
    return NextResponse.json<UserDTO>(user);
}

// MUST detect: PUT /api/users/:id → updateUserHandler
// MUST detect: Calls UserService.updateUser
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const body = await request.json();
    const userService = new UserService();
    const user = await userService.updateUser(params.id, body);
    
    return NextResponse.json(user);
}

// MUST detect: DELETE /api/users/:id → deleteUserHandler
// MUST detect: Calls UserService.deleteUser
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const userService = new UserService();
    await userService.deleteUser(params.id);
    
    return NextResponse.json({ success: true });
}
