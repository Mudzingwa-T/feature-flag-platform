import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateRuleDto {
  @ApiProperty({
    example: 'enable this for 20% of users in Harare except internal staff',
    description: 'Natural-language description of the desired rollout',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  prompt: string;

  @ApiPropertyOptional({ example: 'new-checkout' })
  @IsOptional()
  @IsString()
  flagKey?: string;

  @ApiPropertyOptional({ example: 'PROD' })
  @IsOptional()
  @IsString()
  environmentKey?: string;
}
