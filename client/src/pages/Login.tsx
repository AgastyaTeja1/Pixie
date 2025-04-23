import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/use-auth';

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to feed if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/">
            <a className="inline-block">
              <h1 className="text-4xl font-bold font-poppins pixie-gradient-text">Pixie</h1>
            </a>
          </Link>
        </div>
        
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
