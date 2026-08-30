import { Module } from '@nestjs/common';
import { FlagsService } from './flags.service';
import { FlagsController } from './flags.controller';
import { EnvironmentsController } from './environments.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [FlagsService],
  controllers: [FlagsController, EnvironmentsController],
})
export class FlagsModule {}
