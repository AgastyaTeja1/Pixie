import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertMessageSchema } from '@shared/schema';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Get chat connections (users that the current user can chat with)
export const getChatConnections = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    
    // Get accepted connections
    const connections = await storage.getAcceptedConnections(currentUserId);
    
    // Enrich with last message and unread count
    const chatInfoList = await Promise.all(
      connections.map(async (connection) => {
        // Get last message between users
        const lastMessage = await storage.getLastMessage(currentUserId, connection.userId);
        
        // Get unread count
        const unreadCount = await storage.getUnreadMessageCount(connection.userId, currentUserId);
        
        // Check if user is online (mock for now)
        const isOnline = Math.random() > 0.5; // This would use the WebSocket service in a real app
        
        return {
          userId: connection.userId,
          username: connection.username,
          profileImage: connection.profileImage,
          fullName: connection.fullName,
          lastMessage,
          unreadCount,
          isOnline
        };
      })
    );
    
    // Sort by last message time
    chatInfoList.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      
      const timeA = new Date(a.lastMessage.createdAt).getTime();
      const timeB = new Date(b.lastMessage.createdAt).getTime();
      return timeB - timeA;
    });
    
    return res.status(200).json(chatInfoList);
    
  } catch (error) {
    console.error('Get chat connections error:', error);
    return res.status(500).json({ message: 'Failed to fetch chat connections' });
  }
};

// Get message history with a specific user
export const getMessageHistory = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    const { userId } = req.params;
    const otherUserId = parseInt(userId);
    
    // Check if users can chat (they have a connection)
    const canChat = await storage.canUsersChat(currentUserId, otherUserId);
    if (!canChat) {
      return res.status(403).json({ message: 'Cannot chat with this user' });
    }
    
    // Get messages
    const messages = await storage.getMessagesBetweenUsers(currentUserId, otherUserId);
    
    // Mark messages as read
    await storage.markMessagesAsRead(otherUserId, currentUserId);
    
    return res.status(200).json(messages);
    
  } catch (error) {
    console.error('Get message history error:', error);
    return res.status(500).json({ message: 'Failed to fetch message history' });
  }
};

// Send a message to another user
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    const { userId } = req.params;
    const receiverId = parseInt(userId);
    
    // Check if users can chat
    const canChat = await storage.canUsersChat(currentUserId, receiverId);
    if (!canChat) {
      return res.status(403).json({ message: 'Cannot send message to this user' });
    }
    
    // Validate message data
    const parsedMessageData = insertMessageSchema.parse({
      senderId: currentUserId,
      receiverId,
      content: req.body.content
    });
    
    // Create message
    const newMessage = await storage.createMessage(parsedMessageData);
    
    return res.status(201).json(newMessage);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    console.error('Send message error:', error);
    return res.status(500).json({ message: 'Failed to send message' });
  }
};

// Get unread message counts for all chats
export const getUnreadCounts = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    
    // Get all chat connections
    const connections = await storage.getAcceptedConnections(currentUserId);
    
    // Create map of user ID to unread count
    const unreadCounts: Record<number, number> = {};
    
    // Get unread count for each connection
    await Promise.all(
      connections.map(async (connection) => {
        const count = await storage.getUnreadMessageCount(connection.userId, currentUserId);
        unreadCounts[connection.userId] = count;
      })
    );
    
    return res.status(200).json(unreadCounts);
    
  } catch (error) {
    console.error('Get unread counts error:', error);
    return res.status(500).json({ message: 'Failed to fetch unread counts' });
  }
};

// Mark messages from a specific user as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    const { userId } = req.params;
    const senderId = parseInt(userId);
    
    // Mark messages as read
    await storage.markMessagesAsRead(senderId, currentUserId);
    
    return res.status(200).json({ message: 'Messages marked as read' });
    
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};
