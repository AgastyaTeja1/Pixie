import { useState } from 'react';
import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatTimeAgo, getInitials } from '@/lib/utils';
import { PostWithDetails } from '@shared/types';
import { useAuth } from '@/hooks/use-auth';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface FeedPostProps {
  post: PostWithDetails;
}

export function FeedPost({ post }: FeedPostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isSendingComment, setIsSendingComment] = useState(false);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await apiRequest('DELETE', `/api/posts/${post.id}/like`);
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await apiRequest('POST', `/api/posts/${post.id}/like`);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like post',
        variant: 'destructive',
      });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSendingComment(true);
    try {
      await apiRequest('POST', `/api/posts/${post.id}/comment`, { comment });
      setComment('');
      // Invalidate post data to refresh comments
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSendingComment(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-6">
      <div className="p-4 flex items-center">
        <Link href={`/profile/${post.user.username}`}>
          <a className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={post.user.profileImage || ''} />
              <AvatarFallback className="bg-gray-200">
                {getInitials(post.user.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.user.username}</p>
              {post.location && <p className="text-xs text-gray-500">{post.location}</p>}
            </div>
          </a>
        </Link>
        <button className="ml-auto text-gray-500">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="aspect-w-1 aspect-h-1 bg-gray-100">
        <img 
          src={post.mediaUrl} 
          alt={post.altText || 'Post image'} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <div className="flex space-x-4 mb-2">
          <button 
            className={`text-2xl ${isLiked ? 'text-[#E1306C]' : 'text-gray-700 hover:text-[#E1306C]'}`}
            onClick={handleLike}
          >
            {isLiked ? (
              <Heart className="h-6 w-6 fill-[#E1306C] text-[#E1306C]" />
            ) : (
              <Heart className="h-6 w-6" />
            )}
          </button>
          <button className="text-2xl text-gray-700 hover:text-[#5851DB]">
            <MessageCircle className="h-6 w-6" />
          </button>
          <button className="text-2xl text-gray-700 hover:text-[#FCAF45]">
            <Share2 className="h-6 w-6" />
          </button>
          <button className="text-2xl ml-auto text-gray-700 hover:text-[#5851DB]">
            <Bookmark className="h-6 w-6" />
          </button>
        </div>
        
        <p className="font-medium mb-1">{likeCount} likes</p>
        
        {post.caption && (
          <p>
            <Link href={`/profile/${post.user.username}`}>
              <a className="font-medium">{post.user.username}</a>
            </Link>{' '}
            {post.caption}
          </p>
        )}
        
        {post.commentCount > 0 && (
          <p className="text-gray-500 text-sm mt-2">
            View all {post.commentCount} comments
          </p>
        )}
        
        <form onSubmit={handleComment} className="mt-3 flex items-start">
          <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
            <AvatarImage src={user?.profileImage || ''} />
            <AvatarFallback className="bg-gray-200">
              {getInitials(user?.username || '')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Add a comment..."
              className="w-full px-3 py-2 bg-gray-50 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#5851DB]/50"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button
              type="submit"
              disabled={!comment.trim() || isSendingComment}
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-[#5851DB] font-medium p-1 h-6"
            >
              {isSendingComment ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#5851DB] border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
        
        <p className="text-gray-400 text-xs mt-2">
          {formatTimeAgo(post.createdAt)}
        </p>
      </div>
    </div>
  );
}
