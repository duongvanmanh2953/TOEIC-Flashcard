import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PlacementTestModule } from './modules/placement-test/placement-test.module';
import { AIModule } from './modules/ai/ai.module';
import { CommunityModule } from './modules/community/community.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    VocabularyModule,
    ReviewsModule,
    DashboardModule,
    PlacementTestModule,
    AIModule,
    CommunityModule,
    QuizzesModule,
    SubscriptionsModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
