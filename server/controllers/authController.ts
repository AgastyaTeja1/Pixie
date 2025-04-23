import { Request, Response } from 'express';
import { storage } from '../storage';
import { loginSchema, insertUserSchema } from '@shared/schema';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Sign up a new user
export const signup = async (req: Request, res: Response) => {
  try {
    // Validate input using schema
    const parsedUserData = insertUserSchema.parse(req.body);
    
    // Check if email already exists
    const existingUserByEmail = await storage.getUserByEmail(parsedUserData.email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Create user
    const newUser = await storage.createUser(parsedUserData);
    
    // Set session
    req.session.userId = newUser.id;
    
    // Send response with user (excluding password)
    const { password, ...userWithoutPassword } = newUser;
    
    return res.status(201).json({
      user: userWithoutPassword,
      isNewUser: true
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Failed to create user' });
  }
};

// Login existing user
export const login = async (req: Request, res: Response) => {
  try {
    // Validate login data
    const parsedLoginData = loginSchema.parse(req.body);
    
    // Find user by email
    const user = await storage.getUserByEmail(parsedLoginData.email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    if (user.password !== parsedLoginData.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Set session
    req.session.userId = user.id;
    
    // Check if user has completed profile setup
    const isNewUser = !user.username;
    
    // Send response with user (excluding password)
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      user: userWithoutPassword,
      isNewUser
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    console.error('Login error:', error);
    return res.status(500).json({ message: 'An error occurred during login' });
  }
};

// Logout user
export const logout = (req: Request, res: Response) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Failed to logout' });
  }
};

// Get current authenticated user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
};
