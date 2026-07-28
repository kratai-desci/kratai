/**
 * File-Based Routing Fixture (Next.js App Router)
 * 
 * File structure simulation:
 * - app/api/users/route.ts       → /api/users
 * - app/api/users/[id]/route.ts  → /api/users/:id
 * - app/users/page.tsx           → /users
 * - app/users/[id]/page.tsx      → /users/:id
 */

// This file simulates: app/api/users/route.ts
// MUST detect: Route path /api/users, handler methods

import { NextRequest, NextResponse } from 'next/server';

// MUST detect: GET /api/users → getUsersHandler
export async function GET(request: NextRequest) {
    const users = await fetchUsers();
    return NextResponse.json(users);
}

// MUST detect: POST /api/users → createUserHandler
export async function POST(request: NextRequest) {
    const body = await request.json();
    const user = await createUser(body);
    return NextResponse.json(user, { status: 201 });
}

// Helper functions (should NOT be detected as route handlers)
async function fetchUsers() {
    return [];
}

async function createUser(data: any) {
    return data;
}
