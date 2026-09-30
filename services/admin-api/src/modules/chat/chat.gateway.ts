import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService, SendMessageDto } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized for Realtime E2EE Community Chat');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query?.userId as string;
    if (userId) {
      client.join(`user_${userId}`);
      this.logger.log(`Chat client ${client.id} joined personal room user_${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Chat client disconnected: ${client.id}`);
  }

  /**
   * User registers their active user socket room
   */
  @SubscribeMessage('register_user')
  handleRegisterUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data.userId) {
      client.join(`user_${data.userId}`);
      return { status: 'registered', userId: data.userId };
    }
    return { status: 'error', message: 'Missing userId' };
  }

  /**
   * User joins a conversation room to receive realtime messages and typing indicators
   */
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId?: string },
  ) {
    const room = `conv_${data.conversationId}`;
    client.join(room);
    if (data.userId) {
      client.join(`user_${data.userId}`);
    }
    return { status: 'joined', room };
  }

  /**
   * User leaves conversation room (unsubscribes to save server connections/bandwidth)
   */
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conv_${data.conversationId}`;
    client.leave(room);
    return { status: 'left', room };
  }

  /**
   * Send realtime message via WebSocket
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; message: SendMessageDto },
  ) {
    try {
      const message = await this.chatService.sendMessage(data.userId, data.message);
      const room = `conv_${data.message.conversationId}`;

      // Broadcast to all participants in this conversation
      this.server.to(room).emit('new_message', message);

      return { status: 'sent', message };
    } catch (err: any) {
      this.logger.error(`Error sending message over websocket: ${err?.message}`);
      return { status: 'error', message: err?.message || 'Failed to send message' };
    }
  }

  /**
   * Ephemeral typing indicator
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      userId: string;
      displayName?: string;
      isTyping: boolean;
    },
  ) {
    const room = `conv_${data.conversationId}`;
    client.to(room).emit('user_typing', {
      userId: data.userId,
      displayName: data.displayName,
      isTyping: data.isTyping,
    });
  }

  /**
   * Read receipts
   */
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string; messageId?: string },
  ) {
    const result = await this.chatService.markAsRead(data.userId, data.conversationId, data.messageId);
    const room = `conv_${data.conversationId}`;
    this.server.to(room).emit('message_read', {
      conversationId: data.conversationId,
      readBy: data.userId,
      readAt: result.readAt,
    });
    return result;
  }
}
