import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatTimeAgo, getInitials } from '@/lib/utils';
import { ChatInfo, WebSocketMessage } from '@shared/types';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { Send, Phone, Video, Info, Image, Smile } from 'lucide-react';

interface ChatWindowProps {
  selectedChat: ChatInfo;
}

export function ChatWindow({ selectedChat }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, sendChatMessage, markAsRead, onlineUsers } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatMessages = messages[selectedChat.userId] || [];
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Mark messages as read
  useEffect(() => {
    if (selectedChat) {
      markAsRead(selectedChat.userId);
    }
  }, [selectedChat, markAsRead]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;
    
    sendChatMessage(selectedChat.userId, inputMessage, selectedChat.username);
    setInputMessage('');
  };

  // Filter and sort messages for this chat
  const chatMessagesForDisplay = chatMessages
    .filter((msg: WebSocketMessage) => {
      if (msg.type !== 'message') return false;
      const { senderId, receiverId } = msg.payload;
      return (
        (senderId === user?.id && receiverId === selectedChat.userId) ||
        (senderId === selectedChat.userId && receiverId === user?.id)
      );
    })
    .sort((a: WebSocketMessage, b: WebSocketMessage) => {
      return new Date(a.payload.timestamp).getTime() - new Date(b.payload.timestamp).getTime();
    });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={selectedChat.profileImage || ''} />
          <AvatarFallback className="bg-gray-200">
            {getInitials(selectedChat.username)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{selectedChat.fullName || selectedChat.username}</p>
          <p className="text-xs text-gray-500">
            {onlineUsers.includes(selectedChat.userId) ? 'Active now' : 'Offline'}
          </p>
        </div>
        <div className="ml-auto flex space-x-3">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#5851DB]">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#5851DB]">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#5851DB]">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessagesForDisplay.length > 0 ? (
          chatMessagesForDisplay.map((message: WebSocketMessage, index: number) => {
            const { senderId, content, timestamp } = message.payload;
            const isCurrentUser = senderId === user?.id;
            
            return (
              <div key={index} className={`flex items-end ${isCurrentUser ? 'justify-end' : ''}`}>
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                    <AvatarImage src={selectedChat.profileImage || ''} />
                    <AvatarFallback className="bg-gray-200">
                      {getInitials(selectedChat.username)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div 
                  className={`rounded-2xl px-4 py-2 max-w-xs ${
                    isCurrentUser 
                      ? 'pixie-gradient text-white rounded-br-none' 
                      : 'bg-gray-100 rounded-bl-none'
                  }`}
                >
                  <p>{content}</p>
                </div>
                <span className="text-xs text-gray-500 mx-2">
                  {formatTimeAgo(timestamp)}
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Send className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-600">Start a conversation with {selectedChat.username}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center">
          <Button type="button" variant="ghost" size="icon" className="text-gray-500 hover:text-[#5851DB] mr-2">
            <Image className="h-6 w-6" />
          </Button>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Message..."
              className="w-full px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5851DB]/50"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#5851DB]"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          <Button 
            type="submit" 
            disabled={!inputMessage.trim()}
            variant="ghost" 
            size="icon" 
            className="ml-2 text-[#5851DB] hover:text-[#E1306C]"
          >
            <Send className="h-6 w-6" />
          </Button>
        </div>
      </form>
    </div>
  );
}
