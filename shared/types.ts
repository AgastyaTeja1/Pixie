import { User, Post, Comment, Message, Connection, AiImage, Notification } from "./schema";

// Auth types
export interface AuthResponse {
  user: User;
  token: string;
  isNewUser: boolean;
}

export interface UserWithStats extends User {
  postCount: number;
  followerCount: number;
  followingCount: number;
}

// Post with extended information
export interface PostWithDetails extends Post {
  user: {
    id: number;
    username: string;
    profileImage: string | null;
  };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  comments?: CommentWithUser[];
}

// Comment with user information
export interface CommentWithUser extends Comment {
  user: {
    id: number;
    username: string;
    profileImage: string | null;
  };
}

// Connection with user information
export interface ConnectionWithUser extends Connection {
  user: {
    id: number;
    username: string;
    profileImage: string | null;
    fullName: string | null;
  };
}

// Chat message with user information
export interface ChatMessageWithUser extends Message {
  user: {
    id: number;
    username: string;
    profileImage: string | null;
  };
}

// Chat information
export interface ChatInfo {
  userId: number;
  username: string;
  profileImage: string | null;
  fullName: string | null;
  lastMessage: Message | null;
  unreadCount: number;
  isOnline: boolean;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'online' | 'offline';
  payload: any;
}

// AI Image generation types
export interface TextToImageRequest {
  prompt: string;
}

export interface ImageEditRequest {
  image: string; // base64 encoded image
  prompt: string;
}

export interface ArtStyleRequest {
  image: string; // base64 encoded image
  style: string;
}

export interface AiImageResponse {
  imageUrl: string;
  id: number;
}

export interface ArtStyle {
  id: string;
  name: string;
  imageUrl: string;
}

// Notification types
export interface NotificationWithUser extends Notification {
  fromUser: {
    id: number;
    username: string;
    profileImage: string | null;
  };
}

export interface NotificationCount {
  total: number;
  unread: number;
}
