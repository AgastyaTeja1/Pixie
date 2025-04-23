import { 
  users, 
  type User, 
  type InsertUser, 
  type Post, 
  type InsertPost,
  type Comment,
  type InsertComment,
  type Like,
  type InsertLike,
  type Connection,
  type InsertConnection,
  type Message,
  type InsertMessage,
  type AiImage,
  type InsertAiImage,
  type ProfileSetup
} from "@shared/schema";
import { ConnectionWithUser, UserWithStats, PostWithDetails, CommentWithUser, ChatInfo } from "@shared/types";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserWithStats(userId: number): Promise<UserWithStats | null>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: number, profileData: ProfileSetup): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
  
  // Post methods
  createPost(post: InsertPost): Promise<Post>;
  getPostById(id: number): Promise<Post | undefined>;
  getPostWithUserDetails(postId: number): Promise<PostWithDetails | null>;
  deletePost(id: number): Promise<void>;
  getUserPosts(userId: number): Promise<Post[]>;
  getFeedPosts(userIds: number[]): Promise<Post[]>;
  getPostLikeCount(postId: number): Promise<number>;
  getPostCommentCount(postId: number): Promise<number>;
  hasUserLikedPost(userId: number, postId: number): Promise<boolean>;
  
  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentById(id: number): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<void>;
  getPostComments(postId: number): Promise<Comment[]>;
  getPostCommentsWithUserDetails(postId: number): Promise<CommentWithUser[]>;
  
  // Like methods
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(userId: number, postId: number): Promise<void>;
  
  // Connection methods
  createConnection(connection: InsertConnection): Promise<Connection>;
  getConnection(followerId: number, followingId: number): Promise<Connection | undefined>;
  updateConnectionStatus(followerId: number, followingId: number, status: 'pending' | 'accepted' | 'rejected'): Promise<Connection>;
  deleteConnection(followerId: number, followingId: number): Promise<void>;
  getUserConnections(userId: number): Promise<ConnectionWithUser[]>;
  getPendingConnectionRequests(userId: number): Promise<ConnectionWithUser[]>;
  getAcceptedConnections(userId: number): Promise<ConnectionWithUser[]>;
  getFollowerCount(userId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;
  canUsersChat(user1Id: number, user2Id: number): Promise<boolean>;
  getConnectedUsers(userId: number): Promise<User[]>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getLastMessage(user1Id: number, user2Id: number): Promise<Message | null>;
  getUnreadMessageCount(senderId: number, receiverId: number): Promise<number>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  
  // Saved Posts methods
  savePost(userId: number, postId: number): Promise<SavedPost>;
  unsavePost(userId: number, postId: number): Promise<void>;
  getSavedPosts(userId: number): Promise<PostWithDetails[]>;
  isPostSavedByUser(userId: number, postId: number): Promise<boolean>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  
  // AI Image methods
  createAiImage(aiImage: InsertAiImage): Promise<AiImage>;
  getAiImagesByUser(userId: number): Promise<AiImage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private likes: Map<string, Like>; // userId_postId as key
  private connections: Map<string, Connection>; // followerId_followingId as key
  private messages: Map<number, Message>;
  private aiImages: Map<number, AiImage>;
  private savedPosts: Map<string, SavedPost>; // userId_postId as key
  private notifications: Map<number, Notification>;
  
  private userId: number;
  private postId: number;
  private commentId: number;
  private connectionId: number;
  private messageId: number;
  private aiImageId: number;
  private savedPostId: number;
  private notificationId: number;
  
  currentId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.connections = new Map();
    this.messages = new Map();
    this.aiImages = new Map();
    this.savedPosts = new Map();
    this.notifications = new Map();
    
    this.userId = 1;
    this.postId = 1;
    this.commentId = 1;
    this.connectionId = 1;
    this.messageId = 1;
    this.aiImageId = 1;
    this.savedPostId = 1;
    this.notificationId = 1;
    
    this.currentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserWithStats(userId: number): Promise<UserWithStats | null> {
    const user = await this.getUser(userId);
    
    if (!user) return null;
    
    const postCount = Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .length;
      
    const followerCount = await this.getFollowerCount(userId);
    const followingCount = await this.getFollowingCount(userId);
    
    return {
      ...user,
      postCount,
      followerCount,
      followingCount
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserProfile(userId: number, profileData: ProfileSetup): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = { 
      ...user, 
      username: profileData.username,
      bio: profileData.bio || null,
      profileImage: profileData.profileImage || null
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async searchUsers(query: string): Promise<User[]> {
    query = query.toLowerCase();
    return Array.from(this.users.values()).filter(user => 
      (user.username && user.username.toLowerCase().includes(query)) || 
      (user.fullName && user.fullName.toLowerCase().includes(query))
    );
  }
  
  // Post methods
  async createPost(post: InsertPost): Promise<Post> {
    const id = this.postId++;
    const newPost: Post = { ...post, id, createdAt: new Date() };
    this.posts.set(id, newPost);
    return newPost;
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }
  
  async getPostWithUserDetails(postId: number): Promise<PostWithDetails | null> {
    const post = await this.getPostById(postId);
    if (!post) return null;
    
    const user = await this.getUser(post.userId);
    if (!user) return null;
    
    const likeCount = await this.getPostLikeCount(postId);
    const commentCount = await this.getPostCommentCount(postId);
    
    return {
      ...post,
      user: {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage
      },
      likeCount,
      commentCount,
      isLiked: false, // This will be set by the controller based on the current user
      comments: [] // Comments will be loaded separately if needed
    };
  }
  
  async deletePost(id: number): Promise<void> {
    this.posts.delete(id);
    
    // Delete associated comments and likes
    Array.from(this.comments.entries())
      .filter(([_, comment]) => comment.postId === id)
      .forEach(([commentId, _]) => this.comments.delete(commentId));
      
    Array.from(this.likes.entries())
      .filter(([_, like]) => like.postId === id)
      .forEach(([likeKey, _]) => this.likes.delete(likeKey));
  }
  
  async getUserPosts(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getFeedPosts(userIds: number[]): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => userIds.includes(post.userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getPostLikeCount(postId: number): Promise<number> {
    return Array.from(this.likes.values())
      .filter(like => like.postId === postId)
      .length;
  }
  
  async getPostCommentCount(postId: number): Promise<number> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .length;
  }
  
  async hasUserLikedPost(userId: number, postId: number): Promise<boolean> {
    const key = `${userId}_${postId}`;
    return this.likes.has(key);
  }
  
  // Comment methods
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentId++;
    const newComment: Comment = { ...comment, id, createdAt: new Date() };
    this.comments.set(id, newComment);
    return newComment;
  }
  
  async getCommentById(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }
  
  async deleteComment(id: number): Promise<void> {
    this.comments.delete(id);
  }
  
  async getPostComments(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async getPostCommentsWithUserDetails(postId: number): Promise<CommentWithUser[]> {
    const comments = await this.getPostComments(postId);
    
    return Promise.all(comments.map(async (comment) => {
      const user = await this.getUser(comment.userId);
      if (!user) throw new Error(`User ${comment.userId} not found`);
      
      return {
        ...comment,
        user: {
          id: user.id,
          username: user.username,
          profileImage: user.profileImage
        }
      };
    }));
  }
  
  // Like methods
  async createLike(like: InsertLike): Promise<Like> {
    const key = `${like.userId}_${like.postId}`;
    const newLike: Like = { ...like, id: key, createdAt: new Date() };
    this.likes.set(key, newLike);
    return newLike;
  }
  
  async deleteLike(userId: number, postId: number): Promise<void> {
    const key = `${userId}_${postId}`;
    this.likes.delete(key);
  }
  
  // Connection methods
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const id = this.connectionId++;
    const key = `${connection.followerId}_${connection.followingId}`;
    const newConnection: Connection = { ...connection, id, createdAt: new Date() };
    this.connections.set(key, newConnection);
    return newConnection;
  }
  
  async getConnection(followerId: number, followingId: number): Promise<Connection | undefined> {
    const key = `${followerId}_${followingId}`;
    return this.connections.get(key);
  }
  
  async updateConnectionStatus(followerId: number, followingId: number, status: 'pending' | 'accepted' | 'rejected'): Promise<Connection> {
    const key = `${followerId}_${followingId}`;
    const connection = this.connections.get(key);
    
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    const updatedConnection = { ...connection, status };
    this.connections.set(key, updatedConnection);
    return updatedConnection;
  }
  
  async deleteConnection(followerId: number, followingId: number): Promise<void> {
    const key = `${followerId}_${followingId}`;
    this.connections.delete(key);
  }
  
  async getUserConnections(userId: number): Promise<ConnectionWithUser[]> {
    // Get connections where user is the follower
    const connections = Array.from(this.connections.values())
      .filter(conn => conn.followerId === userId && conn.status === 'accepted');
      
    // Enrich with user data
    return Promise.all(connections.map(async (conn) => {
      const user = await this.getUser(conn.followingId);
      return {
        ...conn,
        user: {
          id: user?.id || 0,
          username: user?.username || '',
          profileImage: user?.profileImage,
          fullName: user?.fullName
        }
      };
    }));
  }
  
  async getPendingConnectionRequests(userId: number): Promise<ConnectionWithUser[]> {
    // Get pending requests where user is the one being followed
    const connections = Array.from(this.connections.values())
      .filter(conn => conn.followingId === userId && conn.status === 'pending');
      
    // Enrich with user data
    return Promise.all(connections.map(async (conn) => {
      const user = await this.getUser(conn.followerId);
      return {
        ...conn,
        user: {
          id: user?.id || 0,
          username: user?.username || '',
          profileImage: user?.profileImage,
          fullName: user?.fullName
        }
      };
    }));
  }
  
  async getAcceptedConnections(userId: number): Promise<ConnectionWithUser[]> {
    // Get connections where user is the follower and status is accepted
    const connections = Array.from(this.connections.values())
      .filter(conn => conn.followerId === userId && conn.status === 'accepted');
      
    // Enrich with user data
    return Promise.all(connections.map(async (conn) => {
      const user = await this.getUser(conn.followingId);
      return {
        ...conn,
        user: {
          id: user?.id || 0,
          username: user?.username || '',
          profileImage: user?.profileImage,
          fullName: user?.fullName
        }
      };
    }));
  }
  
  async getFollowerCount(userId: number): Promise<number> {
    return Array.from(this.connections.values())
      .filter(conn => conn.followingId === userId && conn.status === 'accepted')
      .length;
  }
  
  async getFollowingCount(userId: number): Promise<number> {
    return Array.from(this.connections.values())
      .filter(conn => conn.followerId === userId && conn.status === 'accepted')
      .length;
  }
  
  async canUsersChat(user1Id: number, user2Id: number): Promise<boolean> {
    // Check if there's a mutual connection
    const connection1 = await this.getConnection(user1Id, user2Id);
    const connection2 = await this.getConnection(user2Id, user1Id);
    
    return (connection1 && connection1.status === 'accepted') || 
           (connection2 && connection2.status === 'accepted');
  }
  
  async getConnectedUsers(userId: number): Promise<User[]> {
    const connections = await this.getAcceptedConnections(userId);
    return Promise.all(
      connections.map(async (conn) => {
        const user = await this.getUser(conn.user.id);
        return user as User;
      })
    );
  }
  
  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = { 
      ...message, 
      id, 
      createdAt: new Date(),
      isRead: false 
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async getLastMessage(user1Id: number, user2Id: number): Promise<Message | null> {
    const messages = Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === user1Id && msg.receiverId === user2Id) || 
        (msg.senderId === user2Id && msg.receiverId === user1Id)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
    return messages.length > 0 ? messages[0] : null;
  }
  
  async getUnreadMessageCount(senderId: number, receiverId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(msg => 
        msg.senderId === senderId && 
        msg.receiverId === receiverId && 
        !msg.isRead
      )
      .length;
  }
  
  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === user1Id && msg.receiverId === user2Id) || 
        (msg.senderId === user2Id && msg.receiverId === user1Id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    const messages = Array.from(this.messages.entries())
      .filter(([_, msg]) => msg.senderId === senderId && msg.receiverId === receiverId);
      
    for (const [id, message] of messages) {
      this.messages.set(id, { ...message, isRead: true });
    }
  }
  
  // AI Image methods
  async createAiImage(aiImage: InsertAiImage): Promise<AiImage> {
    const id = this.aiImageId++;
    const newAiImage: AiImage = { ...aiImage, id, createdAt: new Date() };
    this.aiImages.set(id, newAiImage);
    return newAiImage;
  }
  
  async getAiImagesByUser(userId: number): Promise<AiImage[]> {
    return Array.from(this.aiImages.values())
      .filter(image => image.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  // Saved Posts methods
  async savePost(userId: number, postId: number): Promise<SavedPost> {
    const key = `${userId}_${postId}`;
    const savedPost: SavedPost = {
      id: this.savedPostId++,
      userId,
      postId,
      createdAt: new Date()
    };
    this.savedPosts.set(key, savedPost);
    return savedPost;
  }
  
  async unsavePost(userId: number, postId: number): Promise<void> {
    const key = `${userId}_${postId}`;
    this.savedPosts.delete(key);
  }
  
  async getSavedPosts(userId: number): Promise<PostWithDetails[]> {
    const savedPostsKeys = Array.from(this.savedPosts.entries())
      .filter(([_, savedPost]) => savedPost.userId === userId)
      .map(([_, savedPost]) => savedPost.postId);
    
    const posts: PostWithDetails[] = [];
    for (const postId of savedPostsKeys) {
      const postDetails = await this.getPostWithUserDetails(postId);
      if (postDetails) {
        posts.push(postDetails);
      }
    }
    
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async isPostSavedByUser(userId: number, postId: number): Promise<boolean> {
    const key = `${userId}_${postId}`;
    return this.savedPosts.has(key);
  }
  
  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const newNotification: Notification = { 
      ...notification, 
      id, 
      createdAt: new Date(),
      isRead: false 
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }
  
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async markNotificationAsRead(notificationId: number): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      this.notifications.set(notificationId, { ...notification, isRead: true });
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    const userNotificationIds = Array.from(this.notifications.entries())
      .filter(([_, notification]) => notification.userId === userId)
      .map(([id, _]) => id);
    
    for (const id of userNotificationIds) {
      const notification = this.notifications.get(id);
      if (notification) {
        this.notifications.set(id, { ...notification, isRead: true });
      }
    }
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .length;
  }
}

// Use DatabaseStorage instead of MemStorage
import { DatabaseStorage } from './database-storage';
export const storage = new DatabaseStorage();
