import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Middleware to authenticate user
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.session.userId;
    
    if (userId) {
      const user = await storage.getUser(userId);
      
      if (user) {
        // Set user on request for use in controllers
        req.user = user;
      } else {
        // Clear invalid session
        req.session.userId = undefined;
        
        // In deployment, we need to explicitly save session changes
        if (req.session.save) {
          req.session.save();
        }
      }
    }
    
    // Debug log to track authentication process
    if (process.env.NODE_ENV === 'production') {
      console.log(`Auth middleware: userId=${userId}, hasUser=${!!req.user}`);
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next();
  }
};

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  next();
};

// Declare user property on Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
