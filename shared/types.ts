import { User, Post, Comment, Message, Connection, AiImage, DbNotification } from "./schema";

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
  isSaved?: boolean;
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
export interface MessageAttachment {
  type: string;
  data: string;
}

export interface MessagePayload {
  senderId: number;
  senderUsername: string;
  receiverId: number;
  receiverUsername: string;
  content: string;
  timestamp: string;
  attachment?: MessageAttachment;
}

export interface TypingPayload {
  userId: number;
  receiverId: number;
}

export interface ReadPayload {
  userId: number;
  senderId: number;
}

export interface OnlinePayload {
  userId: number;
}

export interface OnlineUsersPayload {
  users: number[];
}

export interface ConnectionPayload {
  fromUserId: number;
  toUserId: number;
  status?: 'pending' | 'accepted' | 'rejected';
}

export interface SharePostPayload {
  fromUserId: number;
  toUserId: number;
  postId: number;
}

export interface NotificationPayload {
  type: string;
  fromUserId: number;
  fromUsername?: string;
  entityId?: number;
}

export interface LikeUpdatePayload {
  postId: number;
  count: number;
  userId?: number;
}

export interface CommentUpdatePayload {
  postId: number;
  count: number;
  userId?: number;
  commentId?: number;
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'online' | 'offline' | 'online-users' | 
        'connection_request' | 'connection_update' | 'connection_status' | 
        'notification' | 'share_post' | 'like_update' | 'comment_update';
  payload: MessagePayload | TypingPayload | ReadPayload | OnlinePayload | 
          OnlineUsersPayload | ConnectionPayload | SharePostPayload | 
          NotificationPayload | LikeUpdatePayload | CommentUpdatePayload | any;
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
export interface NotificationWithUser extends DbNotification {
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
