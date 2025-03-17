import { PaginationDto } from "@n-dtos";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";
import { IsString } from "class-validator";

export class FilterVideoResultDto extends PaginationDto {
  @ApiProperty({ description: 'Search by video url', example: 'https://www.example.com/video.mp4' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Search by account id', example: 1 })
  @IsOptional()
  @IsNumber()
  accountId?: number;           

  @ApiProperty({ description: 'Search by job queue id', example: 1 })
  @IsOptional()
  @IsNumber()
  jobQueueId?: number;  
}
