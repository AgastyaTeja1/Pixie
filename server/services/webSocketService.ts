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
        
        // Handle different message types
        switch (data.type) {
          case 'online':
            // User is online
            userId = data.payload.userId;
            if (userId) {
              userConnections.set(userId, ws);
              
              // Notify other users that this user is online
              broadcastUserStatus(userId, 'online');
            }
            break;
            
          case 'offline':
            // User is offline
            if (userId) {
              userConnections.delete(userId);
              
              // Notify other users that this user is offline
              broadcastUserStatus(userId, 'offline');
            }
            break;
            
          case 'message':
            // User sent a message
            const { senderId, receiverId, content } = data.payload;
            
            // Save message to database
            if (senderId && receiverId && content) {
              await storage.createMessage({
                senderId,
                receiverId,
                content
              });
              
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
  }
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
