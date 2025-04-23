import { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  setupProfile: (username: string, bio?: string, profileImage?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  setupProfile: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: true,
    retry: false,
    onError: () => {
      setUser(null);
      setLoading(false);
    },
    onSuccess: (data) => {
      setUser(data);
      setLoading(false);
    }
  });

  // Update user state when data changes
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error((await response.json()).message || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      
      if (data.isNewUser) {
        navigate('/profile-setup');
      } else {
        navigate('/feed');
      }
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in',
      });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error((await response.json()).message || 'Signup failed');
      }

      const data = await response.json();
      setUser(data.user);
      navigate('/profile-setup');
      
      toast({
        title: 'Account created',
        description: 'Please set up your profile',
      });
    } catch (error) {
      toast({
        title: 'Signup failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      navigate('/');
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'An error occurred while logging out',
        variant: 'destructive',
      });
    }
  };

  const setupProfile = async (username: string, bio?: string, profileImage?: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/profile-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, bio, profileImage }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error((await response.json()).message || 'Profile setup failed');
      }

      const data = await response.json();
      setUser(data.user);
      navigate('/feed');
      
      toast({
        title: 'Profile created',
        description: 'Your profile has been successfully set up',
      });
    } catch (error) {
      toast({
        title: 'Profile setup failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        setupProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
