import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'interviewai-default-jwt-secret-key-change-in-prod';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'candidate' | 'interviewer' | 'admin';
  fullName: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: { id: string; email: string; role: string; fullName: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    
    // Verify user exists and is not blocked
    const user = await db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
    }

    req.user = {
      id: user.id || (user._id ? user._id.toString() : decoded.id),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
    next();
  } catch (err: any) {
    return res.status(403).json({ error: 'Invalid or expired session token.' });
  }
}

// Role Authorization middleware
export function requireRole(allowedRoles: Array<'candidate' | 'interviewer' | 'admin'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Treat legacy "user" as candidate
    const userRole = (req.user.role as any) === 'user' ? 'candidate' : req.user.role;

    if (!allowedRoles.includes(userRole as any)) {
      return res.status(403).json({ error: `Access denied. Requires one of: ${allowedRoles.join(', ')}.` });
    }

    next();
  };
}
