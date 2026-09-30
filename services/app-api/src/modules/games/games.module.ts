import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GameAssetsController } from './game-assets.controller';
import { GamesService } from './games.service';
import { GamesGateway } from './games.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GamesController, GameAssetsController],
  providers: [GamesService, GamesGateway],
  exports: [GamesService, GamesGateway],
})
export class GamesModule {}
