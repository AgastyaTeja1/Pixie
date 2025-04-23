import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  profileImage: string | null;
}

interface StoriesProps {
  users: User[];
}

export function Stories({ users }: StoriesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const storiesContainerRef = useRef<HTMLDivElement>(null);

  const handleCreateStory = () => {
    toast({
      title: 'Coming Soon',
      description: 'The story feature is coming soon!',
    });
  };

  const handleViewStory = (username: string) => {
    toast({
      title: 'Coming Soon',
      description: `Viewing ${username}'s story will be available soon!`,
    });
  };

  const scrollLeft = () => {
    if (storiesContainerRef.current) {
      storiesContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (storiesContainerRef.current) {
      storiesContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative mb-6">
      <div 
        className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
        ref={storiesContainerRef}
      >
        <div className="flex flex-col items-center flex-shrink-0">
          <button 
            onClick={handleCreateStory}
            className="story-border rounded-full cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-white">
              <div className="h-full w-full flex items-center justify-center bg-gray-50">
                <PlusCircle className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </button>
          <span className="text-xs mt-1">Your story</span>
        </div>
        
        {users.map((storyUser) => (
          <div key={storyUser.id} className="flex flex-col items-center flex-shrink-0">
            <button 
              onClick={() => handleViewStory(storyUser.username)}
              className="story-border rounded-full cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-white">
                <Avatar className="h-full w-full">
                  <AvatarImage src={storyUser.profileImage || ''} />
                  <AvatarFallback className="bg-gray-200">
                    {getInitials(storyUser.username)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </button>
            <span className="text-xs mt-1">{storyUser.username}</span>
          </div>
        ))}
      </div>
      
      {users.length > 0 && (
        <>
          <button 
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow-md p-1 hidden md:block"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow-md p-1 hidden md:block"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
