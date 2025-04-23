import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { ProfileSetupForm } from '@/components/auth/ProfileSetupForm';
import { useAuth } from '@/hooks/use-auth';

export default function ProfileSetup() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.username) {
      // If user already has a username (profile is already set up), redirect to feed
      navigate('/feed');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-poppins pixie-gradient-text">Pixie</h1>
        </div>
        
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10">
          <ProfileSetupForm />
        </div>
      </div>
    </div>
  );
}
