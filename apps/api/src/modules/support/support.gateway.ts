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
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SupportService } from './support.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class SupportGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SupportGateway.name);

  constructor(private readonly supportService: SupportService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized for Realtime Support & Notifications');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * User or Admin joins a specific conversation room
   */
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId?: string },
  ) {
    const room = `conv_${data.conversationId}`;
    client.join(room);
    this.logger.log(`Socket ${client.id} joined room ${room}`);
    return { status: 'joined', room };
  }

  /**
   * Admin joins global admin room for real-time ticket triage
   */
  @SubscribeMessage('join_admin_support')
  handleJoinAdminSupport(@ConnectedSocket() client: Socket) {
    client.join('admin_support_inbox');
    this.logger.log(`Admin socket ${client.id} joined admin_support_inbox`);
    return { status: 'joined_admin_support' };
  }

  /**
   * Realtime user message dispatch
   */
  @SubscribeMessage('send_user_message')
  async handleUserMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string; content: string },
  ) {
    try {
      const msg = await this.supportService.userSendMessage(
        data.userId,
        data.conversationId,
        data.content,
      );

      // Broadcast to room (both user and admin listening)
      this.server.to(`conv_${data.conversationId}`).emit('new_message', msg);

      // Notify admin inbox that conversation has a new message
      this.server.to('admin_support_inbox').emit('conversation_updated', {
        conversationId: data.conversationId,
        lastMessage: msg,
        timestamp: new Date().toISOString(),
      });

      return { status: 'sent', message: msg };
    } catch (err: any) {
      this.logger.error(`Error sending message: ${err.message}`);
      return { status: 'error', error: err.message };
    }
  }

  /**
   * Realtime admin reply dispatch
   */
  @SubscribeMessage('send_admin_reply')
  async handleAdminReply(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      adminId: string;
      content: string;
      status?: any;
    },
  ) {
    try {
      const msg = await this.supportService.adminSendMessage(
        data.adminId,
        data.conversationId,
        data.content,
        data.status,
      );

      // Broadcast to room
      this.server.to(`conv_${data.conversationId}`).emit('new_message', msg);

      // Notify admin inbox
      this.server.to('admin_support_inbox').emit('conversation_updated', {
        conversationId: data.conversationId,
        lastMessage: msg,
        status: data.status,
        timestamp: new Date().toISOString(),
      });

      return { status: 'sent', message: msg };
    } catch (err: any) {
      this.logger.error(`Error sending admin reply: ${err.message}`);
      return { status: 'error', error: err.message };
    }
  }

  /**
   * Helper to broadcast a message to the conversation room and notify admin inbox
   */
  broadcastNewMessage(conversationId: string, message: any) {
    if (this.server) {
      this.server.to(`conv_${conversationId}`).emit('new_message', message);
      this.server.to('admin_support_inbox').emit('conversation_updated', {
        conversationId,
        lastMessage: message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Helper to broadcast a notification to all connected users
   */
  broadcastNotification(notification: any) {
    if (this.server) {
      this.server.emit('notification:new', notification);
    }
  }
}
