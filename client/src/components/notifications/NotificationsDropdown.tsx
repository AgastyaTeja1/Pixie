import { useState, useEffect, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Bell, Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { formatTimeAgo, getInitials } from '@/lib/utils';
import { NotificationWithUser, WebSocketMessage } from '@shared/types';
import { DbNotification } from '@shared/schema';
import { toast } from '@/hooks/use-toast';
import { WebSocketContext } from '@/context/WebSocketContext';
import { useAuth } from '@/hooks/use-auth';

export function NotificationsDropdown() {
  const [, navigate] = useLocation();
  const [hasUnread, setHasUnread] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { newNotifications, sendMessage } = useContext(WebSocketContext);
  
  // Fetch notifications
  const { data: notifications, isLoading, error } = useQuery<NotificationWithUser[]>({
    queryKey: ['/api/notifications'],
  });
  
  // Mark all notifications as read when opening dropdown
  const handleOpenChange = async (open: boolean) => {
    if (open && hasUnread) {
      try {
        await apiRequest('POST', '/api/notifications/read/all');
        setHasUnread(false);
      } catch (error) {
        console.error('Failed to mark notifications as read', error);
      }
    }
  };
  
  // Check for unread notifications when component mounts
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const unreadExists = notifications.some((notification: NotificationWithUser) => notification.isRead === false);
      setHasUnread(unreadExists);
    }
  }, [notifications]);
  
  // Listen for new notifications via WebSocket
  useEffect(() => {
    if (newNotifications && Object.keys(newNotifications).length > 0) {
      // If we have new notifications, invalidate the notifications query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      // Set the unread flag to true as we just received a new notification
      setHasUnread(true);
    }
  }, [newNotifications, queryClient]);
  
  // Handle accept connection request
  const handleAcceptConnection = async (notification: NotificationWithUser, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown item click event
    
    try {
      console.log('Accepting connection request, notification ID:', notification.id);
      
      // Mark notification as read
      if (notification.isRead === false) {
        console.log('Marking notification as read...');
        const response = await apiRequest('POST', `/api/notifications/read/${notification.id}`);
        console.log('Mark as read response:', await response.text());
      }
      
      // Accept connection request
      console.log('Accepting connection from user ID:', notification.fromUser.id);
      const acceptResponse = await apiRequest('POST', `/api/connections/accept/${notification.fromUser.id}`);
      console.log('Accept connection response:', await acceptResponse.text());
      
      // Send real-time websocket notification
      if (user) {
        sendMessage({
          type: 'connection_status',
          payload: {
            fromUserId: user.id,
            toUserId: notification.fromUser.id,
            status: 'accepted'
          }
        });
      }
      
      // Refresh notifications and connection status
      console.log('Refreshing notifications and connection status...');
      await queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/connections/status'] }); // Invalidate connection status
      await queryClient.invalidateQueries({ queryKey: ['/api/chat/connections'] }); // Invalidate chat connections
      
      toast({
        title: "Connection accepted",
        description: `You are now connected with ${notification.fromUser.username}`,
      });
    } catch (error) {
      console.error('Failed to accept connection', error);
      toast({
        title: "Error",
        description: "Failed to accept connection request",
        variant: "destructive"
      });
    }
  };
  
  // Handle reject connection request
  const handleRejectConnection = async (notification: NotificationWithUser, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown item click event
    
    try {
      console.log('Rejecting connection request, notification ID:', notification.id);
      
      // Mark notification as read
      if (notification.isRead === false) {
        console.log('Marking notification as read...');
        const readResponse = await apiRequest('POST', `/api/notifications/read/${notification.id}`);
        console.log('Mark as read response:', await readResponse.text());
      }
      
      // Reject connection request
      console.log('Rejecting connection from user ID:', notification.fromUser.id);
      const rejectResponse = await apiRequest('POST', `/api/connections/reject/${notification.fromUser.id}`);
      console.log('Reject connection response:', await rejectResponse.text());
      
      // Send real-time websocket notification
      if (user) {
        sendMessage({
          type: 'connection_status',
          payload: {
            fromUserId: user.id,
            toUserId: notification.fromUser.id,
            status: 'rejected'
          }
        });
      }
      
      // Refresh notifications, connection status, and chat connections
      console.log('Refreshing notifications and connection status...');
      await queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/connections/status'] }); // Invalidate connection status
      await queryClient.invalidateQueries({ queryKey: ['/api/chat/connections'] }); // Invalidate chat connections
      
      toast({
        title: "Connection rejected",
        description: `Connection request from ${notification.fromUser.username} was rejected`,
      });
    } catch (error) {
      console.error('Failed to reject connection', error);
      toast({
        title: "Error",
        description: "Failed to reject connection request",
        variant: "destructive"
      });
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification: NotificationWithUser) => {
    try {
      console.log('Handling notification click:', notification);
      
      // Mark notification as read if it's not already
      if (notification.isRead === false) {
        console.log('Marking notification as read, ID:', notification.id);
        try {
          const response = await apiRequest('POST', `/api/notifications/read/${notification.id}`);
          const responseText = await response.text();
          console.log('Mark as read response:', responseText);
        } catch (markError) {
          console.error('Error marking notification as read:', markError);
        }
      }
      
      // Navigate based on notification type
      console.log('Navigating based on notification type:', notification.type);
      switch (notification.type) {
        case 'like':
        case 'comment':
        case 'save':
          if (notification.entityId) {
            navigate(`/post/${notification.entityId}`);
          }
          break;
        case 'follow':
        case 'follow_request':
        case 'connection_request':
          navigate(`/profile/${notification.fromUser.username}`);
          break;
        default:
          navigate('/feed');
      }
    } catch (error) {
      console.error('Failed to handle notification click', error);
      // Still navigate even if marking as read failed
      navigate(`/profile/${notification.fromUser.username}`);
    }
  };
  
  // Get notification message based on type
  const getNotificationMessage = (notification: NotificationWithUser) => {
    const username = notification.fromUser.username;
    
    switch (notification.type) {
      case 'like':
        return `${username} liked your post`;
      case 'comment':
        return `${username} commented on your post`;
      case 'follow':
        return `${username} started following you`;
      case 'follow_request':
        return `${username} requested to follow you`;
      case 'connection_request':
        return `${username} sent you a connection request`;
      case 'connection_accepted':
        return `${username} accepted your connection request`;
      case 'connection_rejected':
        return `${username} rejected your connection request`;
      case 'save':
        return `${username} saved your post`;
      default:
        return `New notification from ${username}`;
    }
  };
  
  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger className="focus:outline-none relative">
        <Bell className="h-6 w-6 text-gray-700 hover:text-[#5851DB]" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            •
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading notifications...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">Failed to load notifications</div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification: NotificationWithUser) => (
            <DropdownMenuItem
              key={notification.id}
              className={`cursor-pointer flex items-start p-3 hover:bg-gray-50 ${notification.isRead === false ? 'bg-blue-50' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                <AvatarImage src={notification.fromUser.profileImage || ''} />
                <AvatarFallback className="bg-gray-200">
                  {getInitials(notification.fromUser.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{getNotificationMessage(notification)}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(notification.createdAt ? new Date(notification.createdAt) : new Date())}
                </p>
                
                {/* Show accept/reject buttons for connection requests */}
                {notification.type === 'connection_request' && (
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                      onClick={(e) => handleAcceptConnection(notification, e)}
                    >
                      <Check className="h-3 w-3" />
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                      onClick={(e) => handleRejectConnection(notification, e)}
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">No notifications yet</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}