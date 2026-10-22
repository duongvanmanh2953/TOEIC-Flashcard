import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Idempotent } from '../../common/decorators/idempotent.decorator';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import { RabbitMQService, QUEUES } from '../../common/rabbitmq/rabbitmq.service';
import { SubscriptionTier, PaymentMethod } from '@prisma/client';

import { UsageService } from './usage.service';

@ApiTags('Subscriptions & Monetization')
@UseInterceptors(IdempotencyInterceptor)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subService: SubscriptionsService,
    private readonly usageService: UsageService,
    private readonly rabbitMQ: RabbitMQService,
  ) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription pricing plans' })
  getPlans() {
    return this.subService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user active entitlements and daily AI quota usage' })
  getUserEntitlements(@CurrentUser('id') userId: string) {
    return this.subService.getUserEntitlements(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-quotas')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user daily quota status across all learning features' })
  getMyQuotas(@CurrentUser('id') userId: string) {
    return this.usageService.getAllQuotas(userId);
  }

  @Public()
  @Get('guest-quotas')
  @ApiOperation({ summary: 'Get default guest access limits' })
  getGuestQuotas() {
    return this.usageService.getAllQuotas(null);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upgrade')
  @Idempotent({ ttlSeconds: 180, lockUser: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Direct upgrade / Create payment order (Idempotent)' })
  upgradePlan(
    @CurrentUser('id') userId: string,
    @Body('tier') tier: SubscriptionTier,
    @Body('paymentMethod') paymentMethod?: PaymentMethod,
    @Body('billingCycle') billingCycle?: 'monthly' | 'yearly',
  ) {
    return this.subService.createPaymentOrder(
      userId,
      tier,
      paymentMethod || PaymentMethod.VIETQR,
      billingCycle || 'monthly',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-payment')
  @Idempotent({ ttlSeconds: 180, lockUser: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment order with VietQR code and bank transfer memo (Idempotent)' })
  createPayment(
    @CurrentUser('id') userId: string,
    @Body('tier') tier: SubscriptionTier,
    @Body('paymentMethod') paymentMethod?: PaymentMethod,
    @Body('billingCycle') billingCycle?: 'monthly' | 'yearly',
  ) {
    return this.subService.createPaymentOrder(
      userId,
      tier,
      paymentMethod || PaymentMethod.VIETQR,
      billingCycle || 'monthly',
    );
  }

  @Public()
  @Get('gateway-status')
  @ApiOperation({ summary: 'Get payment gateway status (enabled/disabled for MOIT compliance)' })
  getGatewayStatus() {
    return this.subService.getPaymentGatewayStatus();
  }

  @Public()
  @Get('payments/:orderCode/status')
  @ApiOperation({ summary: 'Check payment order status (Pending / Paid / Expired)' })
  getPaymentStatus(@Param('orderCode', ParseIntPipe) orderCode: number) {
    return this.subService.getPaymentStatus(orderCode);
  }

  @Public()
  @Post('webhook/vietqr')
  @ApiOperation({ summary: 'Webhook endpoint for VietQR / SePay / Casso / Bank sync' })
  handleVietQRWebhook(
    @Body() payload: any,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.subService.handleVietQRWebhook(payload, authHeader);
  }

  @Public()
  @Post('webhook/sepay')
  @ApiOperation({ summary: 'Webhook endpoint alias for SePay bank transfer notification' })
  handleSepayWebhook(
    @Body() payload: any,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.subService.handleVietQRWebhook(payload, authHeader);
  }

  @Public()
  @Post('webhook/payos')
  @ApiOperation({ summary: 'Webhook endpoint for PayOS payment gateway' })
  handlePayOSWebhook(@Body() payload: any) {
    return this.subService.handlePayOSWebhook(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Post('simulate-payment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate instant payment confirmation for testing & sandbox' })
  simulatePayment(
    @CurrentUser('id') userId: string,
    @Body('orderCode', ParseIntPipe) orderCode: number,
  ) {
    return this.subService.simulatePaymentSuccess(orderCode, userId);
  }
}
