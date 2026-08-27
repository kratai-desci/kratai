/**
 * File-Based Routing Test Fixture (Next.js style)
 * Tests detection of routes from file structure: app/api/users/route.ts
 * 
 * File path patterns:
 * app/api/users/route.ts becomes /api/users
 * app/api/users/[id]/route.ts becomes /api/users/:id  
 * app/api/posts/[postId]/comments/route.ts becomes /api/posts/:postId/comments
 */

// This file simulates: app/api/users/route.ts
// MUST detect: Route path /api/users

// MUST detect: GET /api/users
export async function GET(request: Request) {
    return Response.json({ users: [] });
}

// MUST detect: POST /api/users
export async function POST(request: Request) {
    const data = await request.json();
    return Response.json(data, { status: 201 });
}

// MUST detect: DELETE /api/users (bulk delete)
export async function DELETE(request: Request) {
    return Response.json({ deleted: true });
}

// Regular function (not HTTP method - should NOT be detected)
export function helper() {
    return 'helper';
}
