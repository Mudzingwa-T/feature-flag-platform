import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { AuthModule } from './auth/auth.module';
import { FlagsModule } from './flags/flags.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { AuditModule } from './audit/audit.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CacheModule,
    AuthModule,
    FlagsModule,
    EvaluationModule,
    AuditModule,
    AiModule,
  ],
})
export class AppModule {}
