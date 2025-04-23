import { eq, and, desc, or, like, sql, gte, lte } from 'drizzle-orm';
import { db } from './db';
import { 
  users, 
  posts, 
  comments, 
  likes, 
  connections, 
  messages, 
  aiImages,
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
} from '@shared/schema';
import { ConnectionWithUser, UserWithStats, PostWithDetails, ChatInfo } from '@shared/types';
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async updateUserProfile(userId: number, profileData: ProfileSetup): Promise<User> {
    const result = await db.update(users)
      .set({
        username: profileData.username,
        bio: profileData.bio || null,
        profileImage: profileData.profileImage || null
      })
      .where(eq(users.id, userId))
      .returning();
      
    if (!result[0]) {
      throw new Error('User not found');
    }
    
    return result[0];
  }
  
  async searchUsers(query: string): Promise<User[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return db.select()
      .from(users)
      .where(
        or(
          like(sql`LOWER(${users.username})`, searchQuery),
          like(sql`LOWER(${users.fullName})`, searchQuery)
        )
      );
  }
  
  // Post methods
  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values(post).returning();
    return result[0];
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    const result = await db.select().from(posts).where(eq(posts.id, id));
    return result[0];
  }
  
  async deletePost(id: number): Promise<void> {
    // Delete related comments and likes first
    await db.delete(comments).where(eq(comments.postId, id));
    await db.delete(likes).where(eq(likes.postId, id));
    
    // Then delete the post
    await db.delete(posts).where(eq(posts.id, id));
  }
  
  async getUserPosts(userId: number): Promise<Post[]> {
    return db.select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }
  
  async getFeedPosts(userIds: number[]): Promise<Post[]> {
    if (userIds.length === 0) return [];
    
    return db.select()
      .from(posts)
      .where(sql`${posts.userId} IN (${userIds.join(',')})`)
      .orderBy(desc(posts.createdAt));
  }
  
  async getPostLikeCount(postId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(likes)
      .where(eq(likes.postId, postId));
      
    return result[0]?.count || 0;
  }
  
  async getPostCommentCount(postId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.postId, postId));
      
    return result[0]?.count || 0;
  }
  
  async hasUserLikedPost(userId: number, postId: number): Promise<boolean> {
    const result = await db.select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );
      
    return result.length > 0;
  }
  
  // Comment methods
  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }
  
  async getCommentById(id: number): Promise<Comment | undefined> {
    const result = await db.select().from(comments).where(eq(comments.id, id));
    return result[0];
  }
  
  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }
  
  async getPostComments(postId: number): Promise<Comment[]> {
    return db.select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
  }
  
  // Like methods
  async createLike(like: InsertLike): Promise<Like> {
    const result = await db.insert(likes).values(like).returning();
    return result[0];
  }
  
  async deleteLike(userId: number, postId: number): Promise<void> {
    await db.delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );
  }
  
  // Connection methods
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const result = await db.insert(connections).values(connection).returning();
    return result[0];
  }
  
  async getConnection(followerId: number, followingId: number): Promise<Connection | undefined> {
    const result = await db.select()
      .from(connections)
      .where(
        and(
          eq(connections.followerId, followerId),
          eq(connections.followingId, followingId)
        )
      );
      
    return result[0];
  }
  
  async updateConnectionStatus(followerId: number, followingId: number, status: 'pending' | 'accepted' | 'rejected'): Promise<Connection> {
    const result = await db.update(connections)
      .set({ status })
      .where(
        and(
          eq(connections.followerId, followerId),
          eq(connections.followingId, followingId)
        )
      )
      .returning();
      
    if (!result[0]) {
      throw new Error('Connection not found');
    }
    
    return result[0];
  }
  
  async deleteConnection(followerId: number, followingId: number): Promise<void> {
    await db.delete(connections)
      .where(
        and(
          eq(connections.followerId, followerId),
          eq(connections.followingId, followingId)
        )
      );
  }
  
  async getUserConnections(userId: number): Promise<ConnectionWithUser[]> {
    const results = await db.select({
      connection: connections,
      user: users
    })
    .from(connections)
    .where(
      and(
        eq(connections.followerId, userId),
        eq(connections.status, 'accepted')
      )
    )
    .innerJoin(users, eq(connections.followingId, users.id));
    
    return results.map(({ connection, user }) => ({
      ...connection,
      user: {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage,
        fullName: user.fullName
      }
    }));
  }
  
  async getPendingConnectionRequests(userId: number): Promise<ConnectionWithUser[]> {
    const results = await db.select({
      connection: connections,
      user: users
    })
    .from(connections)
    .where(
      and(
        eq(connections.followingId, userId),
        eq(connections.status, 'pending')
      )
    )
    .innerJoin(users, eq(connections.followerId, users.id));
    
    return results.map(({ connection, user }) => ({
      ...connection,
      user: {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage,
        fullName: user.fullName
      }
    }));
  }
  
  async getAcceptedConnections(userId: number): Promise<ConnectionWithUser[]> {
    const results = await db.select({
      connection: connections,
      user: users
    })
    .from(connections)
    .where(
      and(
        eq(connections.followerId, userId),
        eq(connections.status, 'accepted')
      )
    )
    .innerJoin(users, eq(connections.followingId, users.id));
    
    return results.map(({ connection, user }) => ({
      ...connection,
      user: {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage,
        fullName: user.fullName
      }
    }));
  }
  
  async getFollowerCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(connections)
      .where(
        and(
          eq(connections.followingId, userId),
          eq(connections.status, 'accepted')
        )
      );
      
    return result[0]?.count || 0;
  }
  
  async getFollowingCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(connections)
      .where(
        and(
          eq(connections.followerId, userId),
          eq(connections.status, 'accepted')
        )
      );
      
    return result[0]?.count || 0;
  }
  
  async canUsersChat(user1Id: number, user2Id: number): Promise<boolean> {
    // Check if there's a mutual connection
    const result = await db.select()
      .from(connections)
      .where(
        or(
          and(
            eq(connections.followerId, user1Id),
            eq(connections.followingId, user2Id),
            eq(connections.status, 'accepted')
          ),
          and(
            eq(connections.followerId, user2Id),
            eq(connections.followingId, user1Id),
            eq(connections.status, 'accepted')
          )
        )
      );
      
    return result.length > 0;
  }
  
  async getConnectedUsers(userId: number): Promise<User[]> {
    const results = await db.select({
      user: users
    })
    .from(connections)
    .where(
      and(
        eq(connections.followerId, userId),
        eq(connections.status, 'accepted')
      )
    )
    .innerJoin(users, eq(connections.followingId, users.id));
    
    return results.map(({ user }) => user);
  }
  
  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values({
      ...message,
      isRead: false
    }).returning();
    
    return result[0];
  }
  
  async getLastMessage(user1Id: number, user2Id: number): Promise<Message | null> {
    const result = await db.select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(1);
      
    return result[0] || null;
  }
  
  async getUnreadMessageCount(senderId: number, receiverId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId),
          eq(messages.isRead, false)
        )
      );
      
    return result[0]?.count || 0;
  }
  
  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(messages.createdAt);
  }
  
  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId),
          eq(messages.isRead, false)
        )
      );
  }
  
  // AI Image methods
  async createAiImage(aiImage: InsertAiImage): Promise<AiImage> {
    const result = await db.insert(aiImages).values(aiImage).returning();
    return result[0];
  }
}