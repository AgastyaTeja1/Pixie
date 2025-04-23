import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { WebSocketMessage } from '@shared/types';
import { useToast } from '@/hooks/use-toast';

interface WebSocketContextType {
  connected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  messages: Record<number, WebSocketMessage[]>;
  onlineUsers: number[];
}

export const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  sendMessage: () => {},
  messages: {},
  onlineUsers: [],
});

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Record<number, WebSocketMessage[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const { user, isAuthenticated } = useContext(AuthContext);
  const { toast } = useToast();

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
          default:
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
  }, [isAuthenticated, user?.id]);

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
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
