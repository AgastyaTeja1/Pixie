import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { 
  Home, MessageCircle, PlusSquare, Wand2, 
  LogOut, User, Settings, Search, X
} from 'lucide-react';

export function Navbar() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  // Search suggestions
  const { 
    data: searchResults, 
    isLoading: searchLoading 
  } = useQuery({
    queryKey: [`/api/users/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: searchQuery.length >= 2 && isAuthenticated && showSuggestions,
  });

  // Handle click outside suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/feed' && location === '/feed') return true;
    if (path === '/chat' && location === '/chat') return true;
    if (path === '/post' && location === '/post') return true;
    if (path === '/ai' && location === '/ai') return true;
    if (path === '/profile' && location === '/profile') return true;
    return false;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);
  };
  
  const handleUserSelect = (username: string) => {
    setSearchQuery('');
    setShowSuggestions(false);
    navigate(`/profile/${username}`);
  };

  if (!isAuthenticated) return null;

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 w-full z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/feed">
              <a className="text-2xl font-bold font-poppins pixie-gradient-text">Pixie</a>
            </Link>
          </div>
          
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5851DB]/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
            </form>
          </div>
          
          <nav className="flex items-center space-x-5">
            <Link href="/feed">
              <a className={`text-2xl text-gray-700 hover:text-[#5851DB] ${isActive('/feed') ? 'active-nav' : ''}`}>
                <Home size={24} />
              </a>
            </Link>
            
            <Link href="/chat">
              <a className={`text-2xl text-gray-700 hover:text-[#5851DB] ${isActive('/chat') ? 'active-nav' : ''}`}>
                <MessageCircle size={24} />
              </a>
            </Link>
            
            <Link href="/post">
              <a className={`text-2xl text-gray-700 hover:text-[#5851DB] ${isActive('/post') ? 'active-nav' : ''}`}>
                <PlusSquare size={24} />
              </a>
            </Link>
            
            <Link href="/ai">
              <a className={`text-2xl text-gray-700 hover:text-[#5851DB] ${isActive('/ai') ? 'active-nav' : ''}`}>
                <Wand2 size={24} />
              </a>
            </Link>
            
            <NotificationsDropdown />
            
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImage || ''} alt={user?.username} />
                  <AvatarFallback>{getInitials(user?.fullName || user?.username || '')}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logout()}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
