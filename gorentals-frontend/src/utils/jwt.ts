import { jwtDecode } from 'jwt-decode';

/**
 * H-2 Fix: UserJWT interface
 *
 * - Added 'RENTER' to the role union type. The backend previously emitted
 *   'RENTER' from UserType.name() before the H-2 JwtUtil fix normalized it
 *   to 'USER'. Keeping RENTER here ensures backward compatibility during
 *   any rolling deployment where old tokens may still be in circulation.
 * - userType is the legacy field from the JWT payload shape (kept for compatibility)
 */
export interface UserJWT {
  sub: string;           // userId or email (subject)
  role: 'ADMIN' | 'OWNER' | 'USER' | 'RENTER';  // H-2 Fix: added RENTER
  userType?: 'ADMIN' | 'OWNER' | 'USER' | 'RENTER'; // Legacy fallback field
  exp: number;           // Expiry (seconds since epoch)
  iat: number;           // Issued at (seconds since epoch)
  userId?: string;       // Some tokens include userId explicitly
}

/**
 * Parse and decode a raw JWT string.
 * Normalizes role/userType inconsistency (H-2 Fix).
 */
export function parseToken(token: string): UserJWT | null {
  try {
    const decoded = jwtDecode<UserJWT>(token);

    // H-2 Fix: Normalize role field
    // 1. If role is missing, try to fall back to userType
    if (!decoded.role && decoded.userType) {
      decoded.role = decoded.userType;
    }

    // 2. Normalize 'RENTER' to 'USER' for frontend RBAC checks
    //    (matches the backend H-2 fix in JwtUtil.java)
    if ((decoded.role as string) === 'RENTER') {
      decoded.role = 'USER';
    }
    if (decoded.userType === 'RENTER') {
      decoded.userType = 'USER';
    }

    return decoded;
  } catch (err) {
    // Malformed or non-JWT string — return null silently
    return null;
  }
}

/**
 * Check whether a token (string or already-decoded payload) is expired.
 * Includes a 10-second clock-skew buffer.
 */
export function isTokenExpired(token: string | UserJWT): boolean {
  const payload = typeof token === 'string' ? parseToken(token) : token;
  if (!payload) return true;

  // exp is in seconds; Date.now() is in milliseconds
  const buffer = 10; // 10-second skew buffer
  return (payload.exp - buffer) < (Date.now() / 1000);
}

/**
 * Get the remaining token lifetime in seconds.
 * Returns 0 if already expired.
 */
export function getTokenRemainingSeconds(token: string | UserJWT): number {
  const payload = typeof token === 'string' ? parseToken(token) : token;
  if (!payload) return 0;
  const remaining = payload.exp - Math.floor(Date.now() / 1000);
  return Math.max(0, remaining);
}
