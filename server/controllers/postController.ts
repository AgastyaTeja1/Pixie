import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertPostSchema, insertCommentSchema } from '@shared/schema';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Create a new post
export const createPost = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    
    // Validate input
    const parsedPostData = insertPostSchema.parse({
      ...req.body,
      userId
    });
    
    // Create post
    const newPost = await storage.createPost(parsedPostData);
    
    return res.status(201).json(newPost);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    console.error('Create post error:', error);
    return res.status(500).json({ message: 'Failed to create post' });
  }
};

// Get post by id
export const getPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.session.userId!;
    
    // Get post
    const post = await storage.getPostById(parseInt(id));
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Get post author
    const user = await storage.getUser(post.userId);
    if (!user) {
      return res.status(404).json({ message: 'Post author not found' });
    }
    
    // Get likes count
    const likeCount = await storage.getPostLikeCount(post.id);
    
    // Get comments count
    const commentCount = await storage.getPostCommentCount(post.id);
    
    // Check if current user liked the post
    const isLiked = await storage.hasUserLikedPost(currentUserId, post.id);
    
    // Check if current user saved the post
    const isSaved = await storage.isPostSavedByUser(currentUserId, post.id);
    
    // Get comments for the post
    const comments = await storage.getPostComments(post.id);
    
    // Get users for each comment
    const commentsWithUser = await Promise.all(
      comments.map(async (comment) => {
        const commentUser = await storage.getUser(comment.userId);
        return {
          ...comment,
          user: {
            id: commentUser.id,
            username: commentUser.username,
            profileImage: commentUser.profileImage
          }
        };
      })
    );
    
    // Return post with details
    return res.status(200).json({
      ...post,
      user: {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage
      },
      likeCount,
      commentCount,
      isLiked,
      isSaved,
      comments: commentsWithUser
    });
    
  } catch (error) {
    console.error('Get post error:', error);
    return res.status(500).json({ message: 'Failed to fetch post' });
  }
};

// Delete post
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.session.userId!;
    
    // Get post
    const post = await storage.getPostById(parseInt(id));
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if current user is the author
    if (post.userId !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    
    // Delete post
    await storage.deletePost(parseInt(id));
    
    return res.status(200).json({ message: 'Post deleted successfully' });
    
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ message: 'Failed to delete post' });
  }
};

// Like a post
export const likePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.session.userId!;
    
    // Check if post exists
    const post = await storage.getPostById(parseInt(id));
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if already liked
    const isLiked = await storage.hasUserLikedPost(currentUserId, parseInt(id));
    if (isLiked) {
      return res.status(400).json({ message: 'Post already liked' });
    }
    
    // Create like
    await storage.createLike({
      postId: parseInt(id),
      userId: currentUserId
    });
    
    return res.status(201).json({ message: 'Post liked successfully' });
    
  } catch (error) {
    console.error('Like post error:', error);
    return res.status(500).json({ message: 'Failed to like post' });
  }
};

// Unlike a post
export const unlikePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.session.userId!;
    
    // Check if post exists
    const post = await storage.getPostById(parseInt(id));
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if liked
    const isLiked = await storage.hasUserLikedPost(currentUserId, parseInt(id));
    if (!isLiked) {
      return res.status(400).json({ message: 'Post not liked' });
    }
    
    // Delete like
    await storage.deleteLike(currentUserId, parseInt(id));
    
    return res.status(200).json({ message: 'Post unliked successfully' });
    
  } catch (error) {
    console.error('Unlike post error:', error);
    return res.status(500).json({ message: 'Failed to unlike post' });
  }
};

// Add comment to post
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.session.userId!;
    
    // Check if post exists
    const post = await storage.getPostById(parseInt(id));
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Validate comment data
    const parsedCommentData = insertCommentSchema.parse({
      postId: parseInt(id),
      userId: currentUserId,
      comment: req.body.comment
    });
    
    // Create comment
    const newComment = await storage.createComment(parsedCommentData);
    
    // Get user for the comment
    const user = await storage.getUser(currentUserId);
    
    // Return comment with user details
    return res.status(201).json({
      ...newComment,
      user: {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    console.error('Add comment error:', error);
    return res.status(500).json({ message: 'Failed to add comment' });
  }
};

// Delete comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id, commentId } = req.params;
    const currentUserId = req.session.userId!;
    
    // Check if comment exists
    const comment = await storage.getCommentById(parseInt(commentId));
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if current user is the author of the comment or the post
    if (comment.userId !== currentUserId) {
      const post = await storage.getPostById(parseInt(id));
      if (!post || post.userId !== currentUserId) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }
    }
    
    // Delete comment
    await storage.deleteComment(parseInt(commentId));
    
    return res.status(200).json({ message: 'Comment deleted successfully' });
    
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
};

// Get feed
export const getFeed = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    
    // Get all posts for the feed, regardless of connection status
    // This ensures users see all posts in the system
    const posts = await storage.getAllPosts();
    
    // Enrich posts with details
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        // Get post author
        const user = await storage.getUser(post.userId);
        
        // Get likes count
        const likeCount = await storage.getPostLikeCount(post.id);
        
        // Get comments with user details
        const comments = await storage.getPostCommentsWithUserDetails(post.id);
        
        // Get comments count
        const commentCount = await storage.getPostCommentCount(post.id);
        
        // Check if current user liked the post
        const isLiked = await storage.hasUserLikedPost(currentUserId, post.id);
        
        // Check if current user saved the post
        const isSaved = await storage.isPostSavedByUser(currentUserId, post.id);
        
        return {
          ...post,
          user: {
            id: user.id,
            username: user.username,
            profileImage: user.profileImage
          },
          likeCount,
          commentCount,
          comments: comments.slice(0, 2), // Include the 2 most recent comments
          isLiked,
          isSaved
        };
      })
    );
    
    return res.status(200).json(postsWithDetails);
    
  } catch (error) {
    console.error('Get feed error:', error);
    return res.status(500).json({ message: 'Failed to fetch feed' });
  }
};

// Save a post
export const savePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.session.userId!;
    
    // Check if post exists
    const post = await storage.getPostById(parseInt(id));
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if already saved
    const isSaved = await storage.isPostSavedByUser(currentUserId, parseInt(id));
    if (isSaved) {
      return res.status(400).json({ message: 'Post already saved' });
    }
    
    // Save post
    await storage.savePost(currentUserId, parseInt(id));
    
    // Create notification for post owner
    if (post.userId !== currentUserId) {
      await storage.createNotification({
        userId: post.userId,
        fromUserId: currentUserId,
        type: 'save',
        entityId: parseInt(id)
      });
    }
    
    return res.status(201).json({ message: 'Post saved successfully' });
    
  } catch (error) {
    console.error('Save post error:', error);
    return res.status(500).json({ message: 'Failed to save post' });
  }
};

// Unsave a post
export const unsavePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.session.userId!;
    
    // Check if post exists
    const post = await storage.getPostById(parseInt(id));
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if saved
    const isSaved = await storage.isPostSavedByUser(currentUserId, parseInt(id));
    if (!isSaved) {
      return res.status(400).json({ message: 'Post not saved' });
    }
    
    // Unsave post
    await storage.unsavePost(currentUserId, parseInt(id));
    
    return res.status(200).json({ message: 'Post unsaved successfully' });
    
  } catch (error) {
    console.error('Unsave post error:', error);
    return res.status(500).json({ message: 'Failed to unsave post' });
  }
};

// Get saved posts
export const getSavedPosts = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    
    // Get saved posts
    const savedPosts = await storage.getSavedPosts(currentUserId);
    
    // Enhance posts with additional information
    const savedPostsWithDetails = await Promise.all(
      savedPosts.map(async (post) => {
        // Check if current user liked the post
        const isLiked = await storage.hasUserLikedPost(currentUserId, post.id);
        
        // Get comments with user details (2 most recent)
        const comments = await storage.getPostCommentsWithUserDetails(post.id);
        
        return {
          ...post,
          isLiked,
          comments: comments.slice(0, 2)
        };
      })
    );
    
    return res.status(200).json(savedPostsWithDetails);
    
  } catch (error) {
    console.error('Get saved posts error:', error);
    return res.status(500).json({ message: 'Failed to fetch saved posts' });
  }
};
