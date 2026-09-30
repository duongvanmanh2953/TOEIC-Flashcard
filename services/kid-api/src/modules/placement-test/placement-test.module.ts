import { Module } from '@nestjs/common';
import { PlacementTestService } from './placement-test.service';
import { PlacementTestController } from './placement-test.controller';

@Module({
  controllers: [PlacementTestController],
  providers: [PlacementTestService],
  exports: [PlacementTestService],
})
export class PlacementTestModule {}
