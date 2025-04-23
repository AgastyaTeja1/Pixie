import { Request, Response } from 'express';
import { storage } from '../storage';
import { profileSetupSchema } from '@shared/schema';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Set up user profile
export const setupProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    
    // Validate input
    const parsedProfileData = profileSetupSchema.parse(req.body);
    
    // Check if username is already taken
    const existingUserByUsername = await storage.getUserByUsername(parsedProfileData.username);
    if (existingUserByUsername && existingUserByUsername.id !== userId) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Update user profile
    const updatedUser = await storage.updateUserProfile(userId, parsedProfileData);
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    
    return res.status(200).json({
      user: userWithoutPassword
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    console.error('Profile setup error:', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Get user profile by username
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const currentUserId = req.session.userId!;
    
    // Get user with profile data
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user posts
    const posts = await storage.getUserPosts(user.id);
    
    // Get follower count
    const followerCount = await storage.getFollowerCount(user.id);
    
    // Get following count
    const followingCount = await storage.getFollowingCount(user.id);
    
    // Return profile data without password
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      ...userWithoutPassword,
      posts,
      postCount: posts.length,
      followerCount,
      followingCount
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

// Search users
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const users = await storage.searchUsers(q);
    
    // Remove passwords from results
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    
    return res.status(200).json(sanitizedUsers);
    
  } catch (error) {
    console.error('Search users error:', error);
    return res.status(500).json({ message: 'Failed to search users' });
  }
};

// Request connection with another user
export const requestConnection = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    const { userId } = req.params;
    const followingId = parseInt(userId);
    
    if (currentUserId === followingId) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }
    
    // Check if user exists
    const userToFollow = await storage.getUser(followingId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if connection already exists
    const existingConnection = await storage.getConnection(currentUserId, followingId);
    if (existingConnection) {
      return res.status(400).json({ message: 'Connection already exists' });
    }
    
    // Create connection request
    await storage.createConnection({
      followerId: currentUserId,
      followingId: followingId,
      status: 'pending'
    });
    
    // Create notification for the user receiving the connection request
    await storage.createNotification({
      type: 'connection_request',
      userId: followingId,
      fromUserId: currentUserId
    });
    
    return res.status(201).json({ message: 'Connection request sent' });
    
  } catch (error) {
    console.error('Request connection error:', error);
    return res.status(500).json({ message: 'Failed to send connection request' });
  }
};

// Accept connection request
export const acceptConnection = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    const { userId } = req.params;
    const followerId = parseInt(userId);
    
    // Check if request exists
    const connectionRequest = await storage.getConnection(followerId, currentUserId);
    if (!connectionRequest) {
      return res.status(404).json({ message: 'Connection request not found' });
    }
    
    if (connectionRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request already processed' });
    }
    
    // Accept connection
    await storage.updateConnectionStatus(followerId, currentUserId, 'accepted');
    
    // Create reverse connection (for mutual following)
    const existingReverseConnection = await storage.getConnection(currentUserId, followerId);
    if (!existingReverseConnection) {
      await storage.createConnection({
        followerId: currentUserId,
        followingId: followerId,
        status: 'accepted'
      });
    } else if (existingReverseConnection.status === 'pending') {
      await storage.updateConnectionStatus(currentUserId, followerId, 'accepted');
    }
    
    // Create notification for the user whose request was accepted
    await storage.createNotification({
      type: 'connection_accepted',
      userId: followerId,
      fromUserId: currentUserId
    });
    
    return res.status(200).json({ message: 'Connection accepted' });
    
  } catch (error) {
    console.error('Accept connection error:', error);
    return res.status(500).json({ message: 'Failed to accept connection' });
  }
};

// Cancel connection request
export const cancelConnectionRequest = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    const { userId } = req.params;
    const followingId = parseInt(userId);
    
    // Check if request exists
    const connectionRequest = await storage.getConnection(currentUserId, followingId);
    if (!connectionRequest) {
      return res.status(404).json({ message: 'Connection request not found' });
    }
    
    // Delete connection
    await storage.deleteConnection(currentUserId, followingId);
    
    return res.status(200).json({ message: 'Connection request cancelled' });
    
  } catch (error) {
    console.error('Cancel connection request error:', error);
    return res.status(500).json({ message: 'Failed to cancel connection request' });
  }
};

// Remove connection
export const removeConnection = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    const { userId } = req.params;
    const otherUserId = parseInt(userId);
    
    // Delete both connections
    await storage.deleteConnection(currentUserId, otherUserId);
    await storage.deleteConnection(otherUserId, currentUserId);
    
    return res.status(200).json({ message: 'Connection removed' });
    
  } catch (error) {
    console.error('Remove connection error:', error);
    return res.status(500).json({ message: 'Failed to remove connection' });
  }
};

// Get user connections
export const getConnections = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    
    // Get connections
    const connections = await storage.getUserConnections(currentUserId);
    
    return res.status(200).json(connections);
    
  } catch (error) {
    console.error('Get connections error:', error);
    return res.status(500).json({ message: 'Failed to fetch connections' });
  }
};

// Get pending connection requests
export const getPendingConnections = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    
    // Get pending requests
    const pendingRequests = await storage.getPendingConnectionRequests(currentUserId);
    
    return res.status(200).json(pendingRequests);
    
  } catch (error) {
    console.error('Get pending connections error:', error);
    return res.status(500).json({ message: 'Failed to fetch pending connections' });
  }
};

// Get connection status with specific user
export const getConnectionStatus = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    const { userId } = req.params;
    const otherUserId = parseInt(userId);
    
    if (isNaN(otherUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Get connections in both directions
    const outgoingConnection = await storage.getConnection(currentUserId, otherUserId);
    const incomingConnection = await storage.getConnection(otherUserId, currentUserId);
    
    const connectionStatus = {
      isConnected: false,
      isPending: false,
      hasPendingRequest: false
    };
    
    if (outgoingConnection && outgoingConnection.status === 'accepted') {
      connectionStatus.isConnected = true;
    } else if (outgoingConnection && outgoingConnection.status === 'pending') {
      connectionStatus.isPending = true;
    }
    
    if (incomingConnection && incomingConnection.status === 'pending') {
      connectionStatus.hasPendingRequest = true;
    }
    
    return res.status(200).json(connectionStatus);
    
  } catch (error) {
    console.error('Get connection status error:', error);
    return res.status(500).json({ message: 'Failed to fetch connection status' });
  }
};

// Get users for stories
export const getStoriesUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    
    // Get connected users for stories
    const connectedUsers = await storage.getConnectedUsers(currentUserId);
    
    // Return basic info for stories
    const storiesUsers = connectedUsers.map(user => ({
      id: user.id,
      username: user.username,
      profileImage: user.profileImage
    }));
    
    return res.status(200).json(storiesUsers);
    
  } catch (error) {
    console.error('Get stories users error:', error);
    return res.status(500).json({ message: 'Failed to fetch stories users' });
  }
};
