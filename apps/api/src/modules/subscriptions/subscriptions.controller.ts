import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SubscriptionTier } from '@prisma/client';

@ApiTags('Subscriptions & Monetization')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subService: SubscriptionsService) {}

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
  @Post('upgrade')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade user account plan (Demo checkout)' })
  upgradePlan(
    @CurrentUser('id') userId: string,
    @Body('tier') tier: SubscriptionTier,
  ) {
    return this.subService.upgradePlan(userId, tier);
  }
}
