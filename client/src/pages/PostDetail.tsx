import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { PostDetailView } from '@/components/post/PostDetailView';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function PostDetail({ params }: { params: { id: string } }) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Get post data
  const { data: post, isLoading, error } = useQuery({
    queryKey: [`/api/posts/${params.id}`],
    enabled: !!isAuthenticated && !!params.id,
  });

  const handleBack = () => {
    navigate('/feed');
  };

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <Navbar />
      <MobileNav />
      
      <main className="flex-1 pt-16 md:pt-16 pb-16">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-xl text-center">
              <h3 className="text-xl font-semibold mb-2 text-red-600">Error Loading Post</h3>
              <p className="text-red-500">
                We couldn't load the post you're looking for. It may have been removed or you don't have permission to view it.
              </p>
              <button 
                onClick={handleBack}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Back to Feed
              </button>
            </div>
          ) : post ? (
            <PostDetailView post={post} onBack={handleBack} />
          ) : (
            <div className="bg-red-50 p-6 rounded-xl text-center">
              <h3 className="text-xl font-semibold mb-2 text-red-600">Post Not Found</h3>
              <p className="text-red-500">
                We couldn't find the post you're looking for. It may have been removed or you don't have permission to view it.
              </p>
              <button 
                onClick={handleBack}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Back to Feed
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}