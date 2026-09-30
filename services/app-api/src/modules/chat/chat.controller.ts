import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  ChatService,
  CreateConversationDto,
  SendMessageDto,
  RegisterEncryptionKeyDto,
} from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get or create a conversation between current user and target user
   */
  @Post('conversations')
  async getOrCreateConversation(
    @CurrentUser('id') currentUserId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.getOrCreateConversation(currentUserId, dto);
  }

  /**
   * List conversations for current user
   */
  @Get('conversations')
  async getUserConversations(
    @CurrentUser('id') currentUserId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.chatService.getUserConversations(currentUserId, page, limit);
  }

  /**
   * Get messages for conversation (cursor pagination)
   */
  @Get('conversations/:id/messages')
  async getConversationMessages(
    @CurrentUser('id') currentUserId: string,
    @Param('id') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit?: number,
  ) {
    return this.chatService.getConversationMessages(currentUserId, conversationId, cursor, limit);
  }

  /**
   * Send a message to conversation via REST fallback
   */
  @Post('conversations/:id/messages')
  async sendMessage(
    @CurrentUser('id') currentUserId: string,
    @Param('id') conversationId: string,
    @Body() dto: Omit<SendMessageDto, 'conversationId'>,
  ) {
    return this.chatService.sendMessage(currentUserId, {
      ...dto,
      conversationId,
    });
  }

  /**
   * Mark messages in conversation as read
   */
  @Patch('conversations/:id/read')
  async markAsRead(
    @CurrentUser('id') currentUserId: string,
    @Param('id') conversationId: string,
    @Body('messageId') messageId?: string,
  ) {
    return this.chatService.markAsRead(currentUserId, conversationId, messageId);
  }

  /**
   * Delete message: for current user or for everyone
   */
  @Delete('messages/:id')
  async deleteMessage(
    @CurrentUser('id') currentUserId: string,
    @Param('id') messageId: string,
    @Query('mode') mode: 'FOR_ME' | 'FOR_EVERYONE' = 'FOR_ME',
  ) {
    return this.chatService.deleteMessage(currentUserId, messageId, mode);
  }

  /**
   * E2EE: Register public key and encrypted private key blob
   */
  @Post('keys')
  async registerEncryptionKey(
    @CurrentUser('id') currentUserId: string,
    @Body() dto: RegisterEncryptionKeyDto,
  ) {
    return this.chatService.registerEncryptionKey(currentUserId, dto);
  }

  /**
   * E2EE: Get recipient's public key for encrypting messages
   */
  @Get('keys/user/:userId')
  async getUserPublicKey(@Param('userId') targetUserId: string) {
    return this.chatService.getUserPublicKey(targetUserId);
  }

  /**
   * E2EE: Get own encrypted private key blob to decrypt client-side with PIN
   */
  @Get('keys/me')
  async getMyEncryptedKey(@CurrentUser('id') currentUserId: string) {
    return this.chatService.getMyEncryptedKey(currentUserId);
  }

  /**
   * E2EE: Reset keys and wipe old messages after 5 failed PIN attempts
   */
  @Post('reset-e2ee')
  async resetUserE2EE(@CurrentUser('id') currentUserId: string) {
    return this.chatService.resetUserE2EE(currentUserId);
  }

  /**
   * Get chat settings (TTL days etc.)
   */
  @Public()
  @Get('config')
  async getChatConfig() {
    const ttlDays = await this.chatService.getChatTtlDays();
    return { ttlDays };
  }
}
