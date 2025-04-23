import { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatTimeAgo, getInitials } from '@/lib/utils';
import { PostWithDetails, CommentWithUser } from '@shared/types';
import { useAuth } from '@/hooks/use-auth';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Trash2, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface PostDetailViewProps {
  post: PostWithDetails;
  onBack?: () => void;
}

export function PostDetailView({ post, onBack }: PostDetailViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [comments, setComments] = useState<CommentWithUser[]>(post.comments || []);
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
      navigate('/feed');
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
      const newComment = await apiRequest('POST', `/api/posts/${post.id}/comment`, { comment });
      // Add the new comment to the existing comments
      setComments(prev => [
        ...prev, 
        { 
          ...newComment, 
          user: {
            id: user!.id,
            username: user!.username,
            profileImage: user!.profileImage
          }
        }
      ]);
      setComment('');
      
      // Invalidate post data to refresh comments
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}`] });
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
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Back button */}
      {onBack && (
        <div className="p-4 border-b border-gray-100">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-700 hover:text-[#5851DB]"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to feed</span>
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {/* Image section */}
        <div className="w-full md:w-1/2 aspect-square bg-gray-100">
          <img 
            src={post.mediaUrl} 
            alt={post.altText || 'Post image'} 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content section */}
        <div className="w-full md:w-1/2 flex flex-col">
          {/* Header with user info */}
          <div className="p-4 border-b border-gray-100 flex items-center">
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
          
          {/* Comments section with scrolling */}
          <div className="flex-1 overflow-y-auto p-4 max-h-[300px] md:max-h-none">
            {/* Caption */}
            {post.caption && (
              <div className="flex items-start mb-4">
                <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                  <AvatarImage src={post.user.profileImage || ''} />
                  <AvatarFallback className="bg-gray-200">
                    {getInitials(post.user.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center">
                    <Link href={`/profile/${post.user.username}`}>
                      <a className="font-medium">{post.user.username}</a>
                    </Link>
                    <span className="ml-2 text-xs text-gray-400">
                      {formatTimeAgo(post.createdAt || new Date())}
                    </span>
                  </div>
                  <p className="mt-1">{post.caption}</p>
                </div>
              </div>
            )}
            
            {/* Comments */}
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start mb-4">
                <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                  <AvatarImage src={comment.user.profileImage || ''} />
                  <AvatarFallback className="bg-gray-200">
                    {getInitials(comment.user.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center">
                    <Link href={`/profile/${comment.user.username}`}>
                      <a className="font-medium">{comment.user.username}</a>
                    </Link>
                    <span className="ml-2 text-xs text-gray-400">
                      {formatTimeAgo(comment.createdAt || new Date())}
                    </span>
                  </div>
                  <p className="mt-1">{comment.comment}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="p-4 border-t border-gray-100">
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
            
            <p className="font-medium mb-4">{likeCount} likes</p>
            
            {/* Add comment form */}
            <form onSubmit={handleComment} className="flex items-start">
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
          </div>
        </div>
      </div>
    </div>
  );
}