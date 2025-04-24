import { WebSocketServer, WebSocket } from 'ws';
import { storage } from '../storage';

// Map of user IDs to WebSocket connections
const userConnections = new Map<number, WebSocket>();

export function setupWebSocketServer(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    let userId: number | null = null;
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('WebSocket message received:', data.type);
        
        // Handle different message types
        switch (data.type) {
          case 'online':
            // User is online
            userId = data.payload.userId;
            if (userId) {
              userConnections.set(userId, ws);
              console.log(`User ${userId} is online. Total online users: ${userConnections.size}`);
              
              // Notify other users that this user is online
              broadcastUserStatus(userId, 'online');
            }
            break;
            
          case 'offline':
            // User is offline
            if (userId) {
              userConnections.delete(userId);
              console.log(`User ${userId} is offline. Total online users: ${userConnections.size}`);
              
              // Notify other users that this user is offline
              broadcastUserStatus(userId, 'offline');
            }
            break;
            
          case 'message':
            // User sent a message
            const { senderId, receiverId, content } = data.payload;
            console.log(`Message from ${senderId} to ${receiverId}: ${content.substring(0, 20)}...`);
            
            // Save message to database
            if (senderId && receiverId && content) {
              // Save attachment if it exists
              let messageData = {
                senderId,
                receiverId,
                content
              };
              
              // Handle attachments if they exist
              if (data.payload.attachment) {
                messageData['attachment'] = data.payload.attachment;
                messageData['attachmentType'] = data.payload.attachmentType;
              }
              
              await storage.createMessage(messageData);
              
              // Forward message to receiver if they're online
              forwardMessageToUser(receiverId, data);
            }
            break;
            
          case 'typing':
            // User is typing
            const { senderId: typingSenderId, receiverId: typingReceiverId } = data.payload;
            
            // Forward typing status to receiver if they're online
            if (typingSenderId && typingReceiverId) {
              forwardMessageToUser(typingReceiverId, data);
            }
            break;
            
          case 'read':
            // User read messages
            const { userId: readUserId, senderId: readSenderId } = data.payload;
            
            // Mark messages as read in database
            if (readUserId && readSenderId) {
              await storage.markMessagesAsRead(readSenderId, readUserId);
              
              // Notify sender that messages were read
              forwardMessageToUser(readSenderId, data);
            }
            break;
            
          case 'share_post':
            // User is sharing a post with a connection
            const { fromUserId, toUserId, postId } = data.payload;
            console.log(`User ${fromUserId} is sharing post ${postId} with user ${toUserId}`);
            
            // Create notification for shared post
            if (fromUserId && toUserId && postId) {
              await storage.createNotification({
                type: 'post_share',
                userId: toUserId,
                fromUserId: fromUserId,
                entityId: postId
              });
              
              // Forward notification to recipient
              notifyUser(toUserId, {
                type: 'notification',
                payload: {
                  type: 'post_share',
                  fromUserId,
                  entityId: postId
                }
              });
            }
            break;
            
          case 'connection_request':
            // User is requesting a connection
            const { fromUserId: requesterId, toUserId: requesteeId } = data.payload;
            console.log(`User ${requesterId} is requesting connection with user ${requesteeId}`);
            
            // Notify the recipient of the connection request
            notifyUser(requesteeId, {
              type: 'notification',
              payload: {
                type: 'connection_request',
                fromUserId: requesterId
              }
            });
            break;
            
          case 'connection_update':
            // Connection status update (accept, reject)
            const { fromUserId: updaterId, toUserId: updatedUserId, status } = data.payload;
            console.log(`Connection update from ${updaterId} to ${updatedUserId}: ${status}`);
            
            // Notify the user of the connection update
            notifyUser(updatedUserId, {
              type: 'connection_status',
              payload: {
                fromUserId: updaterId,
                status: status
              }
            });
            break;
            
          default:
            console.warn('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        userConnections.delete(userId);
        console.log(`WebSocket closed for user ${userId}. Total online users: ${userConnections.size}`);
        
        // Notify other users that this user is offline
        broadcastUserStatus(userId, 'offline');
      }
    });
    
    // Send currently online users to the new connection
    const onlineUsers = Array.from(userConnections.keys());
    ws.send(JSON.stringify({
      type: 'online-users',
      payload: { users: onlineUsers }
    }));
  });
}

// Forward a message to a specific user
function forwardMessageToUser(userId: number, message: any) {
  const userWs = userConnections.get(userId);
  if (userWs && userWs.readyState === WebSocket.OPEN) {
    userWs.send(JSON.stringify(message));
    return true;
  }
  return false;
}

// Notify a user about any event
export function notifyUser(userId: number, notification: any) {
  return forwardMessageToUser(userId, notification);
}

// Broadcast a notification to all connected users
export function broadcastNotification(notification: any) {
  userConnections.forEach((ws, userId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(notification));
    }
  });
}

// Broadcast user online/offline status to relevant users
async function broadcastUserStatus(userId: number, status: 'online' | 'offline') {
  try {
    // Get user's connections
    const connections = await storage.getAcceptedConnections(userId);
    
    // Notify each connected user about the status change
    connections.forEach(connection => {
      const connectionWs = userConnections.get(connection.userId);
      if (connectionWs && connectionWs.readyState === WebSocket.OPEN) {
        connectionWs.send(JSON.stringify({
          type: status,
          payload: {
            userId: userId
          }
        }));
      }
    });
  } catch (error) {
    console.error('Error broadcasting user status:', error);
  }
}

// Check if a user is online
export function isUserOnline(userId: number): boolean {
  const userWs = userConnections.get(userId);
  return !!userWs && userWs.readyState === WebSocket.OPEN;
}

// Get all online users
export function getOnlineUsers(): number[] {
  return Array.from(userConnections.keys());
}
