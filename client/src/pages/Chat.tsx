import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuth } from '@/hooks/use-auth';
import { ChatInfo } from '@shared/types';
import { MessageSquare } from 'lucide-react';

export default function Chat() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedChat, setSelectedChat] = useState<ChatInfo | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Handle window resize to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get chat connections
  const { data: chats, isLoading, error } = useQuery({
    queryKey: ['/api/chat/connections'],
    enabled: !!isAuthenticated,
  });

  // Get unread count for each chat
  const { data: unreadCounts } = useQuery({
    queryKey: ['/api/chat/unread'],
    enabled: !!isAuthenticated,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // If a chat was selected and we get updated data, make sure we update the selected chat
  useEffect(() => {
    if (selectedChat && chats) {
      const updatedSelectedChat = chats.find((chat: ChatInfo) => chat.userId === selectedChat.userId);
      if (updatedSelectedChat) {
        setSelectedChat(updatedSelectedChat);
      }
    }
  }, [chats, selectedChat]);

  // On mobile, we need to show either the list or the chat, not both
  const showChatList = isMobileView ? !selectedChat : true;
  const showChatWindow = isMobileView ? !!selectedChat : !!selectedChat;

  const handleSelectChat = (chat: ChatInfo) => {
    setSelectedChat(chat);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <Navbar />
      <MobileNav />
      
      <main className="flex-1 pt-16 md:pt-16 pb-16">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="md:grid md:grid-cols-3 md:divide-x h-[600px]">
              {/* Chat List */}
              {showChatList && (
                <div className="md:col-span-1 h-full flex flex-col">
                  {isLoading ? (
                    // Loading state
                    <div className="flex-1 flex flex-col p-4 space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center p-3 border-b animate-pulse">
                          <div className="h-12 w-12 rounded-full bg-gray-200 mr-3"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    // Error state
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-red-500">Failed to load chats. Please try again later.</p>
                    </div>
                  ) : chats?.length === 0 ? (
                    // Empty state
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No Conversations</h3>
                      <p className="text-gray-600 mb-4">
                        Connect with people to start messaging
                      </p>
                    </div>
                  ) : (
                    // Chat list
                    <ChatList 
                      chats={chats} 
                      selectedChat={selectedChat}
                      onSelectChat={handleSelectChat}
                    />
                  )}
                </div>
              )}
              
              {/* Chat Window */}
              {showChatWindow && selectedChat ? (
                <div className="md:col-span-2 flex flex-col h-full">
                  {isMobileView && (
                    <button 
                      onClick={handleBackToList}
                      className="p-2 text-gray-500 hover:text-gray-700 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      Back to messages
                    </button>
                  )}
                  <ChatWindow selectedChat={selectedChat} />
                </div>
              ) : !isMobileView && (
                // Empty state - desktop only
                <div className="md:col-span-2 hidden md:flex flex-col items-center justify-center p-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                  <p className="text-gray-600">Select a chat to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
