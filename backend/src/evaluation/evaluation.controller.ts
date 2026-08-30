import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvaluationService } from './evaluation.service';
import { EvaluateDto } from './dto/evaluate.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('evaluation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('evaluate')
export class EvaluationController {
  constructor(private readonly evaluation: EvaluationService) {}

  @Post()
  @ApiOperation({ summary: 'Evaluate a flag for a supplied user context' })
  evaluate(@Body() dto: EvaluateDto) {
    return this.evaluation.evaluate(dto.flagKey, dto.environmentKey, dto.context ?? {});
  }
}
