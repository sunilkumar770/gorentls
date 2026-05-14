import { jwtDecode } from 'jwt-decode';

export interface UserJWT {
  sub: string;      // userId or email
  role: 'ADMIN' | 'OWNER' | 'USER';
  userType?: string; // Sometimes roles are mapped to userType
  exp: number;
  iat: number;
}

export function parseToken(token: string): UserJWT | null {
  try {
    const decoded = jwtDecode<UserJWT>(token);
    // Standardize role/userType
    if (!decoded.role && decoded.userType) {
      decoded.role = decoded.userType as any;
    }
    return decoded;
  } catch (err) {
    return null;
  }
}

export function isTokenExpired(token: string | UserJWT): boolean {
  const payload = typeof token === 'string' ? parseToken(token) : token;
  if (!payload) return true;
  
  // exp is in seconds, Date.now() is in ms
  const buffer = 10; // 10s buffer
  return (payload.exp - buffer) < (Date.now() / 1000);
}

