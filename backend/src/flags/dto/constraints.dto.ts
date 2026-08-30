import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class ConstraintsDto {
  @ApiPropertyOptional({ type: [String], example: ['Harare'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeCities?: string[];

  @ApiPropertyOptional({ example: true, description: 'Exclude users whose context marks them internal' })
  @IsOptional()
  @IsBoolean()
  excludeInternal?: boolean;
}
