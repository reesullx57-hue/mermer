/**
 * Authentication and authorization helpers
 * F2 Gate 2 - ADR-015, ADR-017
 */

import { NextRequest, NextResponse } from 'next/server';

export type UserRole = 'ADMIN' | 'USER' | 'DEALER';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Extract user from request headers (stub implementation)
 * In production, this would validate JWT/session token
 * 
 * For F2 Gate 2, checks X-User-Role header (test stub)
 */
export function getCurrentUser(request: NextRequest): AuthUser | null {
  // Stub: read from header for testing
  const userId = request.headers.get('X-User-Id');
  const userEmail = request.headers.get('X-User-Email');
  const userRole = request.headers.get('X-User-Role') as UserRole | null;

  if (!userId || !userRole) {
    return null;
  }

  return {
    id: userId,
    email: userEmail || `user-${userId}@example.com`,
    role: userRole,
  };
}

/**
 * Check if user has ADMIN role
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}

/**
 * Middleware helper: require admin role for API route
 * Returns 403 JSON error if not admin (ADR-017)
 * 
 * Usage in route handler:
 * ```
 * const user = getCurrentUser(request);
 * const authError = requireAdmin(user);
 * if (authError) return authError;
 * ```
 */
export function requireAdmin(user: AuthUser | null): NextResponse | null {
  if (!isAdmin(user)) {
    return NextResponse.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Admin role required',
        },
      },
      { status: 403 }
    );
  }
  return null;
}
