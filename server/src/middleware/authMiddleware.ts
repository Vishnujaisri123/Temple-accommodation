import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Owner, IOwner } from '../models/Owner';

export interface AuthenticatedRequest extends Request {
  owner?: IOwner;
}

const JWT_SECRET = process.env.JWT_SECRET || 'vadapalli-temple-secure-secret-key-2026';

export const requireOwnerAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // 2. Check cookies if cookie-parser is active
    else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No authorization token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    if (!decoded || decoded.role !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Insufficient permissions.'
      });
    }

    // Retrieve owner from database
    const owner = await Owner.findById(decoded.id);
    if (!owner) {
      return res.status(401).json({
        success: false,
        message: 'Authorized owner account not found or has been disabled.'
      });
    }

    // Check account lockout
    if (owner.isLocked()) {
      return res.status(403).json({
        success: false,
        message: 'Account is temporarily locked due to repeated failed logins. Please try again later.'
      });
    }

    req.owner = owner;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
};
