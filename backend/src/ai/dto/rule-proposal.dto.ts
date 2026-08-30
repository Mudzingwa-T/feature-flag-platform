import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Strategy } from '@prisma/client';

export class ProposalConstraintsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeCities?: string[];

  @IsOptional()
  @IsBoolean()
  excludeInternal?: boolean;
}

/**
 * The strict shape the AI output MUST satisfy before we ever show it as a
 * "proposal". This is the deterministic gate: model output is validated against
 * these rules and never persisted directly. A human reviews and saves it via the
 * normal flags API.
 */
export class RuleProposalDto {
  @IsBoolean()
  enabled: boolean;

  @IsEnum(Strategy)
  strategy: Strategy;

  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProposalConstraintsDto)
  constraints?: ProposalConstraintsDto;
}
