import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ListeningLabController } from './listening-lab.controller';
import { ListeningLabService } from './listening-lab.service';

@Module({
  imports: [PrismaModule],
  controllers: [ListeningLabController],
  providers: [ListeningLabService],
  exports: [ListeningLabService],
})
export class ListeningLabModule {}
