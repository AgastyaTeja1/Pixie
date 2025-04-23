import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/queryClient';
import { formatTimeAgo, getInitials } from '@/lib/utils';
import { NotificationWithUser } from '@shared/types';

export function NotificationsDropdown() {
  const [, navigate] = useLocation();
  const [hasUnread, setHasUnread] = useState(false);
  
  // Fetch notifications
  const { data: notifications, isLoading, error } = useQuery({
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
      const unreadExists = notifications.some((notification: NotificationWithUser) => !notification.isRead);
      setHasUnread(unreadExists);
    }
  }, [notifications]);
  
  // Handle notification click
  const handleNotificationClick = (notification: NotificationWithUser) => {
    // Navigate based on notification type
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
        navigate(`/profile/${notification.fromUser.username}`);
        break;
      default:
        navigate('/feed');
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
              className={`cursor-pointer flex items-start p-3 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
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
                  {formatTimeAgo(notification.createdAt || new Date())}
                </p>
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