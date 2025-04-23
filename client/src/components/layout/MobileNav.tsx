import { Link, useLocation } from 'wouter';
import { Home, MessageCircle, PlusSquare, Wand2, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@/lib/utils';

export function MobileNav() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const isActive = (path: string) => {
    if (path === '/feed' && location === '/feed') return true;
    if (path === '/chat' && location === '/chat') return true;
    if (path === '/post' && location === '/post') return true;
    if (path === '/ai' && location === '/ai') return true;
    if (path === '/profile' && location === '/profile') return true;
    return false;
  };

  return (
    <>
      {/* Mobile Search - Only visible on small screens */}
      <div className="block md:hidden bg-white border-b border-gray-200 pt-16 px-4 py-2 fixed w-full z-40">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5851DB]/50"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <Link href="/feed">
            <a className={`text-2xl ${isActive('/feed') ? 'text-[#5851DB]' : 'text-gray-600'}`}>
              <Home size={24} />
            </a>
          </Link>
          
          <Link href="/chat">
            <a className={`text-2xl ${isActive('/chat') ? 'text-[#5851DB]' : 'text-gray-600'}`}>
              <MessageCircle size={24} />
            </a>
          </Link>
          
          <Link href="/post">
            <a className={`text-2xl ${isActive('/post') ? 'text-[#5851DB]' : 'text-gray-600'}`}>
              <PlusSquare size={24} />
            </a>
          </Link>
          
          <Link href="/ai">
            <a className={`text-2xl ${isActive('/ai') ? 'text-[#5851DB]' : 'text-gray-600'}`}>
              <Wand2 size={24} />
            </a>
          </Link>
          
          <Link href="/profile">
            <a className={`text-2xl ${isActive('/profile') ? 'text-[#5851DB]' : 'text-gray-600'}`}>
              {isActive('/profile') ? (
                <Avatar className="h-7 w-7 border-2 border-[#5851DB]">
                  <AvatarImage src={user?.profileImage || ''} alt={user?.username} />
                  <AvatarFallback>{getInitials(user?.fullName || user?.username || '')}</AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.profileImage || ''} alt={user?.username} />
                  <AvatarFallback>{getInitials(user?.fullName || user?.username || '')}</AvatarFallback>
                </Avatar>
              )}
            </a>
          </Link>
        </div>
      </nav>
    </>
  );
}
