import { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { WebSocketMessage } from '@shared/types';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketContextType {
  connected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  messages: Record<number, WebSocketMessage[]>;
  onlineUsers: number[];
  connectionUpdates: Record<string, string>; // Map of userId to connection status
  recentNotifications: WebSocketMessage[];
  newNotifications: Record<string, WebSocketMessage>; // Map of notification IDs to notification data
  likeUpdates: {postId: number, count: number}[];
  commentUpdates: {postId: number, count: number}[];
}

export const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  sendMessage: () => {},
  messages: {},
  onlineUsers: [],
  connectionUpdates: {},
  recentNotifications: [],
  newNotifications: {},
  likeUpdates: [],
  commentUpdates: [],
});

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Record<number, WebSocketMessage[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [connectionUpdates, setConnectionUpdates] = useState<Record<string, string>>({});
  const [recentNotifications, setRecentNotifications] = useState<WebSocketMessage[]>([]);
  const [newNotifications, setNewNotifications] = useState<Record<string, WebSocketMessage>>({});
  const [likeUpdates, setLikeUpdates] = useState<{postId: number, count: number}[]>([]);
  const [commentUpdates, setCommentUpdates] = useState<{postId: number, count: number}[]>([]);
  
  const { user, isAuthenticated } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Handle notification toasts based on type
  const handleNotificationToast = useCallback((data: WebSocketMessage) => {
    const { type, fromUserId, fromUsername, entityId } = data.payload;
    
    // Notification content based on type
    const notificationContent: Record<string, {title: string, description: string}> = {
      'like': {
        title: 'New like',
        description: `${fromUsername} liked your post`
      },
      'comment': {
        title: 'New comment',
        description: `${fromUsername} commented on your post`
      },
      'connection_request': {
        title: 'Connection request',
        description: `${fromUsername} wants to connect with you`
      },
      'connection_accepted': {
        title: 'Connection accepted',
        description: `${fromUsername} accepted your connection request`
      },
      'connection_rejected': {
        title: 'Connection rejected',
        description: `${fromUsername} rejected your connection request`
      },
      'post_share': {
        title: 'Post shared',
        description: `${fromUsername} shared a post with you`
      },
      'mention': {
        title: 'You were mentioned',
        description: `${fromUsername} mentioned you in a comment`
      },
      'new_post': {
        title: 'New post',
        description: `${fromUsername} just posted something new`
      }
    };
    
    if (type && notificationContent[type]) {
      toast(notificationContent[type]);
      
      // Also invalidate related queries based on notification type
      if (type === 'like' || type === 'comment') {
        queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
        if (entityId) {
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${entityId}`] });
        }
      } else if (type.startsWith('connection_')) {
        queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      }
    }
  }, [toast, queryClient]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      // Send online status
      ws.send(JSON.stringify({
        type: 'online',
        payload: {
          userId: user.id,
        },
      }));
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection error',
        description: 'Failed to connect to chat server',
        variant: 'destructive',
      });
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case 'message': {
            const { senderId, receiverId } = data.payload;
            const chatId = user.id === senderId ? receiverId : senderId;
            
            setMessages(prev => ({
              ...prev,
              [chatId]: [...(prev[chatId] || []), data],
            }));
            
            // Only show toast for received messages
            if (data.payload.senderId !== user.id) {
              toast({
                title: `New message from ${data.payload.senderUsername}`,
                description: truncateMessage(data.payload.content),
              });
            }
            break;
          }
          case 'online':
            setOnlineUsers(prev => {
              if (!prev.includes(data.payload.userId)) {
                return [...prev, data.payload.userId];
              }
              return prev;
            });
            break;
          case 'offline':
            setOnlineUsers(prev => prev.filter(id => id !== data.payload.userId));
            break;
          
          case 'online-users':
            // Update the list of online users
            setOnlineUsers(data.payload.users || []);
            break;
            
          case 'notification':
            // Handle notifications
            setRecentNotifications(prev => {
              // Keep max 10 notifications in the recent list
              const newList = [data, ...prev].slice(0, 10);
              return newList;
            });
            
            // Add to newNotifications state with a unique key
            if (data.payload.id) {
              setNewNotifications(prev => ({
                ...prev,
                [data.payload.id]: data
              }));
            } else {
              // Use timestamp if id is not available
              const timestamp = new Date().getTime();
              setNewNotifications(prev => ({
                ...prev,
                [`temp_${timestamp}`]: data
              }));
            }
            
            // Show notification toast based on type
            if (data.payload.type) {
              handleNotificationToast(data);
            }
            
            // Invalidate notifications cache to trigger a refresh
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            break;
            
          case 'connection_status':
            // Update connection status
            const { fromUserId, status } = data.payload;
            if (fromUserId && status) {
              setConnectionUpdates(prev => ({
                ...prev,
                [fromUserId]: status
              }));
              
              // Invalidate relevant connections queries
              queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
              queryClient.invalidateQueries({ queryKey: [`/api/connections/status/${fromUserId}`] });
              
              // Show notification based on status
              const statusMessages: Record<string, string> = {
                'pending': 'Connection request received',
                'accepted': 'Connection request accepted',
                'rejected': 'Connection request rejected'
              };
              
              const statusMessage = statusMessages[status as keyof typeof statusMessages];
              if (statusMessage) {
                toast({
                  title: statusMessage,
                  description: `User ID: ${fromUserId}`
                });
              }
            }
            break;
            
          case 'like_update':
            // Update like count for a post
            const { postId, count } = data.payload;
            setLikeUpdates(prev => {
              const existing = prev.findIndex(item => item.postId === postId);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = { postId, count };
                return updated;
              }
              return [...prev, { postId, count }];
            });
            
            // Invalidate post queries to refresh like counts
            queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
            queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
            break;
            
          case 'comment_update':
            // Update comment count for a post
            const { postId: commentPostId, count: commentCount } = data.payload;
            setCommentUpdates(prev => {
              const existing = prev.findIndex(item => item.postId === commentPostId);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = { postId: commentPostId, count: commentCount };
                return updated;
              }
              return [...prev, { postId: commentPostId, count: commentCount }];
            });
            
            // Invalidate post queries to refresh comment counts
            queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
            queryClient.invalidateQueries({ queryKey: [`/api/posts/${commentPostId}`] });
            break;
          
          case 'share_post':
            // Handle post sharing
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            break;
            
          default:
            console.log('Unhandled WebSocket message type:', data.type);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'offline',
          payload: {
            userId: user.id,
          },
        }));
        ws.close();
      }
    };
  }, [isAuthenticated, user?.id, toast, queryClient, handleNotificationToast]);

  const sendMessage = (message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      
      // For messages, store in local state immediately
      if (message.type === 'message') {
        const { receiverId } = message.payload;
        setMessages(prev => ({
          ...prev,
          [receiverId]: [...(prev[receiverId] || []), message],
        }));
      }
    } else {
      toast({
        title: 'Connection error',
        description: 'Not connected to chat server',
        variant: 'destructive',
      });
    }
  };

  // Helper function to truncate message for toast
  const truncateMessage = (message: string) => {
    return message.length > 30 ? `${message.substring(0, 30)}...` : message;
  };

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        sendMessage,
        messages,
        onlineUsers,
        connectionUpdates,
        recentNotifications,
        newNotifications,
        likeUpdates,
        commentUpdates
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
