import { useState, useEffect, useContext } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, Edit3 } from 'lucide-react';
import { UserWithStats, WebSocketMessage } from '@shared/types';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { WebSocketContext } from '@/context/WebSocketContext';
import { EditProfileDialog } from './EditProfileDialog';

interface ProfileHeaderProps {
  profileUser: UserWithStats;
  isConnected: boolean;
  isPending: boolean;
  hasPendingRequest: boolean;
}

export function ProfileHeader({ 
  profileUser, 
  isConnected, 
  isPending, 
  hasPendingRequest 
}: ProfileHeaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { connectionUpdates, sendMessage } = useContext(WebSocketContext);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected,
    isPending,
    hasPendingRequest
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  
  const isOwnProfile = user?.id === profileUser.id;
  
  // Listen for real-time connection status updates
  useEffect(() => {
    // Check if there's an update for this profile user
    const statusKey = profileUser?.id?.toString();
    if (statusKey && connectionUpdates[statusKey]) {
      const status = connectionUpdates[statusKey];
      
      // Update the connection status based on the update received
      if (status === 'accepted') {
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: true,
          isPending: false,
          hasPendingRequest: false
        }));
      } else if (status === 'rejected') {
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          isPending: false,
          hasPendingRequest: false
        }));
      } else if (status === 'pending') {
        setConnectionStatus(prev => ({
          ...prev,
          hasPendingRequest: true
        }));
      }
    }
  }, [connectionUpdates, profileUser.id]);
  
  const handleConnection = async () => {
    if (isOwnProfile) return;
    
    setIsLoading(true);
    try {
      if (connectionStatus.isConnected) {
        // Disconnect
        await apiRequest('DELETE', `/api/connections/${profileUser.id}`);
        setConnectionStatus({
          isConnected: false,
          isPending: false,
          hasPendingRequest: false
        });
        
        // Send real-time connection update
        if (user) {
          sendMessage({
            type: 'connection_status',
            payload: {
              fromUserId: user.id,
              toUserId: profileUser.id,
              status: 'disconnected'
            }
          });
        }
        
        toast({
          title: 'Disconnected',
          description: `You are no longer connected with ${profileUser.username}`,
        });
      } else if (connectionStatus.isPending) {
        // Cancel request
        await apiRequest('DELETE', `/api/connections/request/${profileUser.id}`);
        setConnectionStatus({
          isConnected: false,
          isPending: false,
          hasPendingRequest: false
        });
        
        // Send real-time connection update
        if (user) {
          sendMessage({
            type: 'connection_status',
            payload: {
              fromUserId: user.id,
              toUserId: profileUser.id,
              status: 'cancelled'
            }
          });
        }
        
        toast({
          title: 'Request cancelled',
          description: `You cancelled your connection request to ${profileUser.username}`,
        });
      } else if (connectionStatus.hasPendingRequest) {
        // Accept request
        await apiRequest('POST', `/api/connections/accept/${profileUser.id}`);
        setConnectionStatus({
          isConnected: true,
          isPending: false,
          hasPendingRequest: false
        });
        
        // Send real-time connection update
        if (user) {
          sendMessage({
            type: 'connection_status',
            payload: {
              fromUserId: user.id,
              toUserId: profileUser.id,
              status: 'accepted'
            }
          });
        }
        
        toast({
          title: 'Connected',
          description: `You are now connected with ${profileUser.username}`,
        });
      } else {
        // Send request
        await apiRequest('POST', `/api/connections/request/${profileUser.id}`);
        setConnectionStatus({
          isConnected: false,
          isPending: true,
          hasPendingRequest: false
        });
        
        // Send real-time connection update
        if (user) {
          sendMessage({
            type: 'connection_status',
            payload: {
              fromUserId: user.id,
              toUserId: profileUser.id,
              status: 'pending'
            }
          });
        }
        
        toast({
          title: 'Request sent',
          description: `You sent a connection request to ${profileUser.username}`,
        });
      }
      
      // Refresh profile and connections data
      queryClient.invalidateQueries({ queryKey: [`/api/users/profile/${profileUser.username}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update connection',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getConnectionButtonText = () => {
    if (connectionStatus.isConnected) return 'Connected';
    if (connectionStatus.isPending) return 'Requested';
    if (connectionStatus.hasPendingRequest) return 'Accept';
    return 'Connect';
  };

  return (
    <div className="p-6 md:p-8">
      {isOwnProfile && user && (
        <EditProfileDialog 
          open={editProfileOpen} 
          onOpenChange={setEditProfileOpen} 
          user={user} 
        />
      )}
      
      <div className="flex flex-col md:flex-row items-center">
        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-2 border-white shadow-md mb-4 md:mb-0 md:mr-8">
          <AvatarImage src={profileUser.profileImage || ''} />
          <AvatarFallback className="bg-gray-200 text-gray-600 text-2xl">
            {getInitials(profileUser.fullName || profileUser.username)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center mb-4">
            <h2 className="text-2xl font-bold font-poppins mb-2 md:mb-0">{profileUser.username}</h2>
            <div className="md:ml-4 space-x-2 flex justify-center md:justify-start">
              {isOwnProfile ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="px-4 py-1.5 rounded-lg"
                    onClick={() => setEditProfileOpen(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                  <Button variant="outline" size="icon" className="p-1.5 rounded-lg">
                    <Settings className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleConnection}
                  disabled={isLoading}
                  variant={connectionStatus.isConnected ? "outline" : "default"}
                  size="sm" 
                  className={`px-4 py-1.5 rounded-lg ${
                    connectionStatus.isConnected 
                      ? '' 
                      : 'pixie-gradient text-white hover:shadow-lg'
                  }`}
                >
                  {isLoading ? 'Loading...' : getConnectionButtonText()}
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex justify-center md:justify-start space-x-8 mb-4">
            <div className="text-center">
              <p className="font-semibold">{profileUser.postCount}</p>
              <p className="text-sm text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">{profileUser.followerCount}</p>
              <p className="text-sm text-gray-500">Connected</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">{profileUser.followingCount}</p>
              <p className="text-sm text-gray-500">Connecting</p>
            </div>
          </div>
          
          <div>
            {profileUser.fullName && <p className="font-semibold">{profileUser.fullName}</p>}
            {profileUser.bio && (
              <p className="text-gray-600 mt-1 whitespace-pre-line">{profileUser.bio}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
