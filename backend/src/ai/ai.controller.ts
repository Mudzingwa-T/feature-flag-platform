import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AiService } from './ai.service';
import { GenerateRuleDto } from './dto/generate-rule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('rule-proposals')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Propose a structured rollout rule from natural language (ADMIN, propose-only)' })
  propose(@Body() dto: GenerateRuleDto) {
    return this.ai.propose(dto);
  }
}
