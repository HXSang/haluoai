import { PaginationDto } from "@n-dtos";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";
import { IsString } from "class-validator";

export class FilterVideoResultDto extends PaginationDto {
  @ApiProperty({ description: 'Search by video url', example: 'https://www.example.com/video.mp4' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Search by account id', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  accountId?: number;           

  @ApiProperty({ description: 'Search by job queue id', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  jobQueueId?: number;  

  @ApiProperty({ description: 'Search by video id', example: '1234567890' })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiProperty({ description: 'Search by video url', example: 'https://www.example.com/video.mp4' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  // user id
  @ApiProperty({ description: 'Search by user id', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  userId?: number;  

  // is marked
  @ApiProperty({ description: 'Search by is marked', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isMarked?: boolean;  
}
