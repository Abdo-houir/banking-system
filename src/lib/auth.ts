import jwt from 'jsonwebtoken';
import { NextApiResponse } from 'next';
import { cookies } from 'next/headers';

// Cast JWT_SECRET to string
const JWT_SECRET = process.env.JWT_SECRET as string || 'your-fallback-secret-key-minimum-32-chars';
const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  if (!JWT_SECRET || JWT_SECRET === 'your-fallback-secret-key-minimum-32-chars') {
    console.warn('Warning: Using default JWT_SECRET. Change this in production!');
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  try {
    if (!JWT_SECRET) {
      throw new AuthError('JWT_SECRET is not configured');
    }
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.log(error);
    throw new AuthError('Invalid or expired token');
  }
}

// For pages/api routes - set cookie in response headers
export function setAuthCookie(res: NextApiResponse, token: string): void {
  const cookieOptions = [
    `token=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${60 * 60 * 24 * 7}`,
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
    process.env.NODE_ENV === 'production' ? 'SameSite=Strict' : 'SameSite=Lax'
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookieOptions);
}

// For App Router server components
export async function setServerAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

// For pages/api routes - remove cookie
export function removeAuthCookie(res: NextApiResponse): void {
  const cookieOptions = [
    'token=',
    'HttpOnly',
    'Path=/',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
    process.env.NODE_ENV === 'production' ? 'SameSite=Strict' : 'SameSite=Lax'
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookieOptions);
}

// For App Router server components - remove cookie
export async function removeServerAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('token');
}

// Get token from request headers (for pages/api routes)
export function getTokenFromRequest(req: any): string | null {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie: string) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = decodeURIComponent(value);
    return acc;
  }, {});

  return cookies.token || null;
}

// Get token from server components
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value || null;
}

// Verify user from token
export async function getCurrentUser(): Promise<JwtPayload | null> {
  try {
    const token = await getServerToken();
    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Verify user from request (for pages/api routes)
export function getCurrentUserFromRequest(req: any): JwtPayload | null {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    console.log(error);
    
    return null;
  }
}

export async function requireRole(allowedRoles: string[]): Promise<JwtPayload> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError('Authentication required');
  }

  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(`Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`);
  }

  return user;
}