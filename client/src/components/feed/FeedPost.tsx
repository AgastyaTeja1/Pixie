import { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatTimeAgo, getInitials } from '@/lib/utils';
import { PostWithDetails } from '@shared/types';
import { useAuth } from '@/hooks/use-auth';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface FeedPostProps {
  post: PostWithDetails;
}

export function FeedPost({ post }: FeedPostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

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

  const handleSavePost = async () => {
    try {
      if (isSaved) {
        // Unsave post
        await apiRequest('DELETE', `/api/posts/${post.id}/save`);
        setIsSaved(false);
        toast({
          title: 'Post removed from saved',
          description: 'Post has been removed from your saved collection',
        });
      } else {
        // Save post
        await apiRequest('POST', `/api/posts/${post.id}/save`);
        setIsSaved(true);
        toast({
          title: 'Post saved',
          description: 'Post has been added to your saved collection',
        });
      }
      // Invalidate saved posts query if it exists
      queryClient.invalidateQueries({ queryKey: ['/api/posts/saved'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: isSaved 
          ? 'Failed to remove post from saved' 
          : 'Failed to save post',
        variant: 'destructive',
      });
    }
  };

  const handleSharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: `${post.user.username}'s post on Pixie`,
        text: post.caption || 'Check out this post on Pixie',
        url: window.location.href,
      })
      .catch(() => {
        // If share fails, copy to clipboard instead
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied',
          description: 'Post link copied to clipboard',
        });
      });
    } else {
      // Fallback for browsers that don't support sharing
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Post link copied to clipboard',
      });
    }
  };

  const focusCommentInput = () => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await apiRequest('DELETE', `/api/posts/${post.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-auto text-gray-500 hover:text-gray-700">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem 
              onClick={() => navigate(`/post/${post.id}`)}
              className="cursor-pointer"
            >
              View details
            </DropdownMenuItem>
            
            {user && post.user.id === user.id && (
              <DropdownMenuItem 
                onClick={handleDeletePost}
                className="cursor-pointer text-red-500 focus:text-red-500"
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    Deleting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete post
                  </span>
                )}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
          <button 
            className="text-2xl text-gray-700 hover:text-[#5851DB]"
            onClick={focusCommentInput}
          >
            <MessageCircle className="h-6 w-6" />
          </button>
          <button 
            className="text-2xl text-gray-700 hover:text-[#FCAF45]"
            onClick={handleSharePost}
          >
            <Share2 className="h-6 w-6" />
          </button>
          <button 
            className={`text-2xl ml-auto ${isSaved ? 'text-[#5851DB]' : 'text-gray-700 hover:text-[#5851DB]'}`}
            onClick={handleSavePost}
          >
            {isSaved ? (
              <Bookmark className="h-6 w-6 fill-[#5851DB] text-[#5851DB]" />
            ) : (
              <Bookmark className="h-6 w-6" />
            )}
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
        
        {post.comments && post.comments.length > 0 && (
          <div className="mt-2">
            {post.comments.slice(0, 2).map((comment, index) => (
              <p key={comment.id} className="text-sm">
                <Link href={`/profile/${comment.user.username}`}>
                  <a className="font-medium">{comment.user.username}</a>
                </Link>{' '}
                {comment.comment}
              </p>
            ))}
          </div>
        )}
        
        {post.commentCount > (post.comments?.length || 0) && (
          <p 
            className="text-gray-500 text-sm mt-1 cursor-pointer hover:text-gray-700"
            onClick={() => navigate(`/post/${post.id}`)}
          >
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
              ref={commentInputRef}
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
          {formatTimeAgo(post.createdAt || new Date())}
        </p>
      </div>
    </div>
  );
}
