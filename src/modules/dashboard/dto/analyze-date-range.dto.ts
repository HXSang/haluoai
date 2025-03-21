import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class AnalyzeDateRangeDto {
  @ApiProperty({
    description: 'Start date for the analysis (ISO format)',
    example: '2023-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the analysis (ISO format)',
    example: '2023-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
} 