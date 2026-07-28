/**
 * Next.js Middleware
 * 
 * Simulates: middleware.ts at root
 * MUST detect:
 * - Middleware function
 * - Protected routes (matcher)
 * - Middleware → Route relationship
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// MUST detect: Middleware function
// MUST detect: Protects routes matching /api/*, /admin/*
export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token');
    
    // Check authentication
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check admin access
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const isAdmin = verifyAdminToken(token.value);
        if (!isAdmin) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }
    
    return NextResponse.next();
}

// MUST detect: Matcher configuration - which routes are protected
export const config = {
    matcher: [
        '/api/:path*',
        '/admin/:path*',
        '/dashboard/:path*'
    ]
};

// Helper function (should not be detected as middleware)
function verifyAdminToken(token: string): boolean {
    return token === 'admin-token';
}
