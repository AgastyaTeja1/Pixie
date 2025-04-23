import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ImageGenerator } from '@/components/ai/ImageGenerator';
import { ImageEditor } from '@/components/ai/ImageEditor';
import { ArtStyles } from '@/components/ai/ArtStyles';
import { useAuth } from '@/hooks/use-auth';

export default function AI() {
  const { isAuthenticated } = useAuth();
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
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 p-6">
            <h2 className="text-2xl font-bold font-poppins mb-6">Create with AI</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <ImageGenerator />
              <ImageEditor />
            </div>
            
            <ArtStyles />
          </div>
        </div>
      </main>
    </>
  );
}
