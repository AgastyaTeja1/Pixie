import { useContext } from 'react';
import { WebSocketContext } from '@/context/WebSocketContext';
import { useAuth } from './use-auth';
import { WebSocketMessage } from '@shared/types';

export const useChat = () => {
  const context = useContext(WebSocketContext);
  const { user } = useAuth();
  
  if (context === undefined) {
    throw new Error('useChat must be used within a WebSocketProvider');
  }
  
  const sendChatMessage = (receiverId: number, content: string, receiverUsername: string) => {
    if (!user) return;
    
    const message: WebSocketMessage = {
      type: 'message',
      payload: {
        senderId: user.id,
        senderUsername: user.username,
        receiverId,
        receiverUsername,
        content,
        timestamp: new Date().toISOString(),
      },
    };
    
    context.sendMessage(message);
  };
  
  const markAsRead = (senderId: number) => {
    if (!user) return;
    
    const readMessage: WebSocketMessage = {
      type: 'read',
      payload: {
        userId: user.id,
        senderId,
      },
    };
    
    context.sendMessage(readMessage);
  };
  
  const sendTypingIndicator = (receiverId: number) => {
    if (!user) return;
    
    const typingMessage: WebSocketMessage = {
      type: 'typing',
      payload: {
        userId: user.id,
        receiverId,
      },
    };
    
    context.sendMessage(typingMessage);
  };
  
  return {
    ...context,
    sendChatMessage,
    markAsRead,
    sendTypingIndicator,
  };
};
