import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class UserContextDto {
  @ApiPropertyOptional({ example: 'user-123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: { city: 'Harare', internal: false } })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}

export class EvaluateDto {
  @ApiProperty({ example: 'new-checkout' })
  @IsString()
  flagKey: string;

  @ApiProperty({ example: 'PROD' })
  @IsString()
  environmentKey: string;

  @ApiProperty({ type: UserContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserContextDto)
  context?: UserContextDto;
}
