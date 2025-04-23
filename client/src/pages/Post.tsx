import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { CreatePost } from '@/components/post/CreatePost';
import { useAuth } from '@/hooks/use-auth';

export default function Post() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <Navbar />
      <MobileNav />
      
      <main className="flex-1 pt-16 md:pt-16 pb-16">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
          <CreatePost />
        </div>
      </main>
    </>
  );
}
