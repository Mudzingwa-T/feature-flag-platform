import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Strategy } from '@prisma/client';
import { ConstraintsDto } from './constraints.dto';

export class CreateFlagDto {
  @ApiProperty({ example: 'new-checkout', description: 'kebab-case identifier, unique per environment' })
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{1,63}$/, { message: 'key must be kebab-case (a-z, 0-9, dashes)' })
  key: string;

  @ApiProperty({ example: 'PROD' })
  @IsString()
  environmentKey: string;

  @ApiPropertyOptional({ example: 'Redesigned checkout flow' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: Strategy, default: Strategy.BOOLEAN })
  @IsOptional()
  @IsEnum(Strategy)
  strategy?: Strategy;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @ApiPropertyOptional({ type: ConstraintsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConstraintsDto)
  constraints?: ConstraintsDto;
}
