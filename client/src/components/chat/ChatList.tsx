import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { formatTimeAgo, getInitials } from '@/lib/utils';
import { ChatInfo } from '@shared/types';
import { useChat } from '@/hooks/use-chat';
import { Search } from 'lucide-react';

interface ChatListProps {
  chats: ChatInfo[];
  selectedChat: ChatInfo | null;
  onSelectChat: (chat: ChatInfo) => void;
}

export function ChatList({ chats, selectedChat, onSelectChat }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { onlineUsers } = useChat();
  
  const filteredChats = searchQuery.trim()
    ? chats.filter(chat => 
        chat.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chat.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )
    : chats;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold font-poppins">Messages</h2>
      </div>
      
      <div className="p-3 border-b">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search messages"
            className="w-full pl-9 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5851DB]/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div
              key={chat.userId}
              className={`p-3 flex items-center border-b hover:bg-gray-50 cursor-pointer ${
                selectedChat?.userId === chat.userId ? 'bg-gray-50' : ''
              }`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 mr-3 relative">
                <Avatar className="h-full w-full">
                  <AvatarImage src={chat.profileImage || ''} />
                  <AvatarFallback className="bg-gray-200">
                    {getInitials(chat.username)}
                  </AvatarFallback>
                </Avatar>
                {onlineUsers.includes(chat.userId) && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="font-medium">{chat.fullName || chat.username}</p>
                  {chat.lastMessage && (
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(chat.lastMessage.createdAt)}
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  <p className={`text-sm ${chat.unreadCount > 0 ? 'font-medium text-gray-800' : 'text-gray-600'} truncate`}>
                    {chat.lastMessage ? chat.lastMessage.content : 'Start a conversation!'}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 bg-[#5851DB] text-white text-xs px-2 py-0.5 rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : searchQuery ? (
          <div className="flex flex-col items-center justify-center p-6 text-center h-48">
            <p className="text-gray-500">No messages found</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center h-48">
            <p className="text-gray-500">No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
