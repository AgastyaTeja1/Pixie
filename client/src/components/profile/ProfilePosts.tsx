import { useState } from 'react';
import { Link } from 'wouter';
import { Post } from '@shared/types';
import { Grid, Bookmark, User2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface ProfilePostsProps {
  posts: Post[];
  username: string;
}

export function ProfilePosts({ posts, username }: ProfilePostsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');
  const isOwnProfile = user?.username === username;
  
  return (
    <>
      <div className="flex border-b">
        <button 
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'posts' 
              ? 'border-b-2 border-[#5851DB] text-[#5851DB]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('posts')}
        >
          <Grid className="h-4 w-4 inline-block mr-1" /> Posts
        </button>
        
        {isOwnProfile && (
          <button 
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'saved' 
                ? 'border-b-2 border-[#5851DB] text-[#5851DB]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark className="h-4 w-4 inline-block mr-1" /> Saved
          </button>
        )}
        
        <button 
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'tagged' 
              ? 'border-b-2 border-[#5851DB] text-[#5851DB]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('tagged')}
        >
          <User2 className="h-4 w-4 inline-block mr-1" /> Tagged
        </button>
      </div>
      
      {activeTab === 'posts' && (
        posts.length > 0 ? (
          <div className="post-grid p-1 md:p-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <a className="aspect-w-1 aspect-h-1 cursor-pointer">
                  <img 
                    src={post.mediaUrl} 
                    alt={post.altText || 'Post image'} 
                    className="w-full h-full object-cover"
                  />
                  <div className="opacity-0 hover:opacity-100 absolute inset-0 bg-black/30 flex items-center justify-center text-white transition-opacity">
                    <span className="mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      100
                    </span>
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      24
                    </span>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Grid className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
            <p className="text-gray-500 max-w-sm">
              {isOwnProfile 
                ? "When you share photos, they'll appear on your profile." 
                : `When ${username} shares photos, they'll appear here.`}
            </p>
            {isOwnProfile && (
              <Link href="/post">
                <a className="mt-6 px-6 py-3 rounded-lg pixie-gradient text-white font-medium hover:shadow-md transition">
                  Share Your First Photo
                </a>
              </Link>
            )}
          </div>
        )
      )}
      
      {activeTab === 'saved' && isOwnProfile && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Bookmark className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Save</h3>
          <p className="text-gray-500 max-w-sm">
            Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.
          </p>
        </div>
      )}
      
      {activeTab === 'tagged' && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <User2 className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Photos of You</h3>
          <p className="text-gray-500 max-w-sm">
            When people tag you in photos, they'll appear here.
          </p>
        </div>
      )}
    </>
  );
}
