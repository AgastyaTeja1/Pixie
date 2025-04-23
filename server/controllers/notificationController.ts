import { Request, Response } from 'express';
import { storage } from '../storage';

// Extend Session type to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Get notifications for the current user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    
    // Get notifications with user details
    const notifications = await storage.getNotifications(userId);
    
    // Get from user details for each notification
    const notificationsWithUsers = await Promise.all(
      notifications.map(async (notification) => {
        const fromUser = await storage.getUser(notification.fromUserId);
        if (!fromUser) {
          return null;
        }
        
        // Remove password from user data
        const { password, ...fromUserWithoutPassword } = fromUser;
        
        return {
          ...notification,
          fromUser: fromUserWithoutPassword
        };
      })
    );
    
    // Filter out null values (in case some users were deleted)
    const validNotifications = notificationsWithUsers.filter(n => n !== null);
    
    return res.status(200).json(validNotifications);
    
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    
    // Check if notificationId is valid
    if (!notificationId || isNaN(parseInt(notificationId))) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    
    const id = parseInt(notificationId);
    
    // Log the notification ID being processed
    console.log(`Marking notification as read, ID: ${id}`);
    
    await storage.markNotificationAsRead(id);
    
    return res.status(200).json({ message: 'Notification marked as read' });
    
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    
    await storage.markAllNotificationsAsRead(userId);
    
    return res.status(200).json({ message: 'All notifications marked as read' });
    
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    
    const count = await storage.getUnreadNotificationCount(userId);
    
    return res.status(200).json({ count });
    
  } catch (error) {
    console.error('Get unread notification count error:', error);
    return res.status(500).json({ message: 'Failed to fetch unread notification count' });
  }
};