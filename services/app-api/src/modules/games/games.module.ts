import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { HallOfFameController } from './hall-of-fame.controller';
import { HallOfFameService } from './hall-of-fame.service';
import { GamesController } from './games.controller';
import { GameAssetsController } from './game-assets.controller';
import { CustomRoomsController } from './custom-rooms.controller';
import { GamesService } from './games.service';
import { GamesGateway } from './games.gateway';
import { CustomRoomsService } from './custom-rooms.service';
import { QuestionProviderService } from './question-provider.service';
import { MockLiveAdapter } from './live-integration/mock-live.adapter';
import { TikTokLiveAdapter } from './live-integration/tiktok-live.adapter';
import { LiveIntegrationService } from './live-integration/live-integration.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [HallOfFameController, GamesController, GameAssetsController, CustomRoomsController],
  providers: [
    HallOfFameService,
    GamesService,
    GamesGateway,
    CustomRoomsService,
    QuestionProviderService,
    MockLiveAdapter,
    TikTokLiveAdapter,
    LiveIntegrationService,
  ],
  exports: [
    GamesService,
    GamesGateway,
    CustomRoomsService,
    QuestionProviderService,
    LiveIntegrationService,
  ],
})
export class GamesModule {}
