import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { storage } from "./storage";
import { setupWebSocketServer } from "./services/webSocketService";
import { authenticateUser, requireAuth } from "./middlewares/auth";
import session from "express-session";
import { pool } from "./db";
import pgSession from "connect-pg-simple";

// Controllers
import * as authController from "./controllers/authController";
import * as userController from "./controllers/userController";
import * as postController from "./controllers/postController";
import * as chatController from "./controllers/chatController";
import * as aiController from "./controllers/aiController";
import * as notificationController from "./controllers/notificationController";

const PgStore = pgSession(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  setupWebSocketServer(wss);
  
  // Setup session middleware
  const sessionMiddleware = session({
    secret: 'pixie-app-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new PgStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    })
  });
  
  app.use(sessionMiddleware);
  
  // Apply authentication middleware for all routes
  app.use(authenticateUser);
  
  // Auth routes
  app.post('/api/auth/signup', authController.signup);
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/logout', authController.logout);
  app.get('/api/auth/me', requireAuth, authController.getCurrentUser);
  
  // User routes
  app.post('/api/users/profile-setup', requireAuth, userController.setupProfile);
  app.get('/api/users/profile/:username', requireAuth, userController.getUserProfile);
  app.get('/api/users/search', requireAuth, userController.searchUsers);
  
  // Connection routes
  app.post('/api/connections/request/:userId', requireAuth, userController.requestConnection);
  app.post('/api/connections/accept/:userId', requireAuth, userController.acceptConnection);
  app.delete('/api/connections/request/:userId', requireAuth, userController.cancelConnectionRequest);
  app.delete('/api/connections/:userId', requireAuth, userController.removeConnection);
  app.get('/api/connections', requireAuth, userController.getConnections);
  app.get('/api/connections/pending', requireAuth, userController.getPendingConnections);
  app.get('/api/connections/status/:userId', requireAuth, userController.getConnectionStatus);
  app.get('/api/connections/stories', requireAuth, userController.getStoriesUsers);
  
  // Post routes
  app.post('/api/posts', requireAuth, postController.createPost);
  app.get('/api/posts/saved', requireAuth, postController.getSavedPosts);
  app.get('/api/posts/:id', requireAuth, postController.getPost);
  app.delete('/api/posts/:id', requireAuth, postController.deletePost);
  app.post('/api/posts/:id/like', requireAuth, postController.likePost);
  app.delete('/api/posts/:id/like', requireAuth, postController.unlikePost);
  app.post('/api/posts/:id/comment', requireAuth, postController.addComment);
  app.delete('/api/posts/:id/comment/:commentId', requireAuth, postController.deleteComment);
  app.post('/api/posts/:id/save', requireAuth, postController.savePost);
  app.delete('/api/posts/:id/save', requireAuth, postController.unsavePost);
  app.get('/api/feed', requireAuth, postController.getFeed);
  
  // Chat routes
  app.get('/api/chat/connections', requireAuth, chatController.getChatConnections);
  app.get('/api/chat/messages/:userId', requireAuth, chatController.getMessageHistory);
  app.post('/api/chat/messages/:userId', requireAuth, chatController.sendMessage);
  app.get('/api/chat/unread', requireAuth, chatController.getUnreadCounts);
  app.post('/api/chat/read/:userId', requireAuth, chatController.markAsRead);
  
  // AI routes
  app.post('/api/ai/generate', requireAuth, aiController.generateImage);
  app.post('/api/ai/edit', requireAuth, aiController.editImage);
  app.post('/api/ai/style', requireAuth, aiController.applyStyle);
  
  // Notification routes
  app.get('/api/notifications', requireAuth, notificationController.getNotifications);
  app.post('/api/notifications/read/:notificationId', requireAuth, notificationController.markNotificationAsRead);
  app.post('/api/notifications/read/all', requireAuth, notificationController.markAllNotificationsAsRead);
  app.get('/api/notifications/unread/count', requireAuth, notificationController.getUnreadNotificationCount);

  return httpServer;
}
