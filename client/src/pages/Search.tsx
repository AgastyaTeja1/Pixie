import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Loader2, User2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { PostWithDetails, User } from '@shared/types';
import { useAuth } from '@/hooks/use-auth';

export default function Search() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get search term from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearchTerm(q);
    }
  }, []);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Query users by search term
  const { 
    data: users, 
    isLoading: usersLoading,
    error: usersError
  } = useQuery<User[]>({
    queryKey: [`/api/users/search?q=${encodeURIComponent(searchTerm)}`],
    enabled: !!isAuthenticated && !!searchTerm,
  });
  
  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }
  
  return (
    <>
      <Navbar />
      <MobileNav />
      
      <main className="flex-1 pt-16 md:pt-16 pb-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Search Results for "{searchTerm}"</h1>
          
          {usersLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
            </div>
          ) : usersError ? (
            <div className="bg-red-50 p-4 rounded-md text-red-500 mb-6">
              An error occurred while searching. Please try again.
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 mt-8 mb-4">Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((user) => (
                  <Link key={user.id} href={`/profile/${user.username}`}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profileImage || ''} alt={user.username} />
                          <AvatarFallback>{getInitials(user.fullName || user.username)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{user.username}</p>
                          <p className="text-gray-500 text-sm">{user.fullName}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <User2 className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
              <p className="text-gray-500 max-w-md">
                We couldn't find any users or posts matching "{searchTerm}". Try checking for typos or using different keywords.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}