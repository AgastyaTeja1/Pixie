import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfilePosts } from '@/components/profile/ProfilePosts';
import { useAuth } from '@/hooks/use-auth';
import { UserWithStats, PostWithDetails } from '@shared/types';
import { Loader2 } from 'lucide-react';

export default function Profile() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const username = params.username || user?.username || '';
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Get profile data
  const { data: profileData, isLoading, error } = useQuery<UserWithStats>({
    queryKey: [`/api/users/profile/${username}`],
    enabled: !!isAuthenticated && !!username,
  });

  // Get connection status 
  const { data: connectionStatus, isLoading: connectionLoading } = useQuery<{
    isConnected: boolean;
    isPending: boolean;
    hasPendingRequest: boolean;
  }>({
    queryKey: [`/api/connections/status/${profileData?.id}`],
    enabled: !!isAuthenticated && !!profileData && user && profileData.id !== user.id,
  });

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <Navbar />
      <MobileNav />
      
      <main className="flex-1 pt-16 md:pt-16 pb-16">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
          {isLoading ? (
            // Loading state
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
            </div>
          ) : error ? (
            // Error state
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-red-500">Failed to load profile. Please try again later.</p>
            </div>
          ) : !profileData ? (
            // User not found
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">User Not Found</h3>
              <p className="text-gray-500">
                The user you're looking for doesn't exist or may have been removed.
              </p>
            </div>
          ) : (
            // Profile
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <ProfileHeader 
                profileUser={profileData as UserWithStats}
                isConnected={connectionStatus?.isConnected || false}
                isPending={connectionStatus?.isPending || false}
                hasPendingRequest={connectionStatus?.hasPendingRequest || false}
              />
              
              {/* Story Highlights */}
              <div className="px-6 py-4 border-t border-b">
                <div className="flex space-x-6 overflow-x-auto pb-2 scrollbar-hide">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center bg-gray-50">
                      <i className="ri-add-line text-xl text-gray-400"></i>
                    </div>
                    <span className="text-xs mt-1">New</span>
                  </div>
                  
                  {profileData.highlights?.map((highlight: any, index: number) => (
                    <div key={index} className="flex flex-col items-center flex-shrink-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                        <img src={highlight.imageUrl} alt={highlight.title} className="h-full w-full object-cover" />
                      </div>
                      <span className="text-xs mt-1">{highlight.title}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <ProfilePosts posts={profileData.posts || []} username={profileData.username} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
