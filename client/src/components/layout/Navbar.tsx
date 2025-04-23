import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
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
import { 
  Home, MessageCircle, PlusSquare, Wand2, 
  LogOut, User, Settings, Search
} from 'lucide-react';

export function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

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
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery);
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
