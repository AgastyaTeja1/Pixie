import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Stories } from '@/components/feed/Stories';
import { FeedPost } from '@/components/feed/FeedPost';
import { useAuth } from '@/hooks/use-auth';
import { PostWithDetails } from '@shared/types';

export default function Feed() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Get feed data
  const { data: feedData, isLoading, error } = useQuery({
    queryKey: ['/api/feed'],
    enabled: !!isAuthenticated,
  });

  // Mock user data for stories until we fetch real connections
  const { data: storyUsers } = useQuery({
    queryKey: ['/api/connections/stories'],
    enabled: !!isAuthenticated,
  });

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <Navbar />
      <MobileNav />
      
      <main className="flex-1 pt-16 md:pt-16 pb-16">
        <div className="max-w-xl mx-auto px-4 py-6 md:py-10">
          {/* Stories Row */}
          {storyUsers && <Stories users={storyUsers} />}
          
          {/* Posts */}
          <div className="space-y-6">
            {isLoading ? (
              // Loading state
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
                  <div className="p-4 flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/5"></div>
                    </div>
                  </div>
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              // Error state
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <p className="text-red-500">Failed to load posts. Please try again later.</p>
              </div>
            ) : feedData?.length === 0 ? (
              // Empty state
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
                <p className="text-gray-500 mb-4">
                  Connect with people or create your first post to see content here.
                </p>
              </div>
            ) : (
              // Posts
              feedData?.map((post: PostWithDetails) => (
                <FeedPost key={post.id} post={post} />
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
