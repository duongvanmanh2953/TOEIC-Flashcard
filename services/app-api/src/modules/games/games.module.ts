import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GameAssetsController } from './game-assets.controller';
import { CustomRoomsController } from './custom-rooms.controller';
import { GamesService } from './games.service';
import { GamesGateway } from './games.gateway';
import { CustomRoomsService } from './custom-rooms.service';
import { QuestionProviderService } from './question-provider.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GamesController, GameAssetsController, CustomRoomsController],
  providers: [GamesService, GamesGateway, CustomRoomsService, QuestionProviderService],
  exports: [GamesService, GamesGateway, CustomRoomsService, QuestionProviderService],
})
export class GamesModule {}
