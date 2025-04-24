import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatTimeAgo, getInitials } from '@/lib/utils';
import { ChatInfo, WebSocketMessage } from '@shared/types';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { 
  Send, Phone, Video, Info, Image as ImageIcon, 
  Smile, FileText, MoreHorizontal, Share2 
} from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';

interface ChatWindowProps {
  selectedChat: ChatInfo;
}

export function ChatWindow({ selectedChat }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, sendChatMessage, markAsRead, onlineUsers } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  
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
    if ((!inputMessage.trim() && !attachment) || !user) return;
    
    // Handle file attachment if present
    if (attachment) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target?.result as string;
        const fileType = attachment.type;
        
        // Send message with attachment
        sendChatMessage(
          selectedChat.userId, 
          inputMessage || 'Sent an attachment', 
          selectedChat.username,
          {
            type: fileType,
            data: fileData
          }
        );
        
        // Reset attachment
        setAttachment(null);
      };
      
      reader.readAsDataURL(attachment);
    } else {
      // Send regular text message
      sendChatMessage(selectedChat.userId, inputMessage, selectedChat.username);
    }
    
    setInputMessage('');
  };
  
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setAttachment(file);
      toast({
        title: "File selected",
        description: `${file.name} ready to send`,
      });
    }
  };
  
  const handleSharePost = () => {
    toast({
      title: "Share post",
      description: "Post sharing coming soon!",
    });
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
          <div className="flex items-center">
            <span
              className={`inline-block w-2 h-2 rounded-full mr-1 ${
                onlineUsers.includes(selectedChat.userId) 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-gray-300'
              }`}
            />
            <p className="text-xs text-gray-500">
              {onlineUsers.includes(selectedChat.userId) ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="ml-auto flex space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-[#5851DB]"
            onClick={() => toast({
              title: "Feature coming soon",
              description: "Voice calling will be available soon"
            })}
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-[#5851DB]"
            onClick={() => toast({
              title: "Feature coming soon",
              description: "Video calling will be available soon"
            })}
          >
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
            const { senderId, content, timestamp, attachment } = message.payload;
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
                  {attachment ? (
                    <>
                      {attachment.type.startsWith('image/') ? (
                        <div className="mb-2">
                          <img src={attachment.data} alt="Attachment" className="rounded-lg max-w-full" />
                        </div>
                      ) : (
                        <div className="mb-2 flex items-center p-2 bg-gray-200 bg-opacity-20 rounded">
                          <FileText className="h-5 w-5 mr-2" />
                          <span className="text-sm truncate">Attachment</span>
                        </div>
                      )}
                      {content && <p>{content}</p>}
                    </>
                  ) : (
                    <p>{content}</p>
                  )}
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
      
      {attachment && (
        <div className="p-2 border-t flex items-center bg-gray-50">
          <div className="flex-1 truncate">
            <span className="text-sm">Attachment: {attachment.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-500"
            onClick={() => setAttachment(null)}
          >
            Remove
          </Button>
        </div>
      )}
      
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,text/plain,application/msword"
          />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="text-gray-500 hover:text-[#5851DB] mr-2">
                <MoreHorizontal className="h-6 w-6" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-48 p-0">
              <div className="flex flex-col divide-y divide-gray-100">
                <Button variant="ghost" size="sm" className="w-full justify-start py-2 px-3" onClick={handleAttachmentClick}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start py-2 px-3" onClick={handleSharePost}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Post
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
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
            disabled={!inputMessage.trim() && !attachment}
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
