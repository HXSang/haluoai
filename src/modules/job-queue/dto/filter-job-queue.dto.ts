import { PaginationDto } from "@n-dtos";
import { IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class FilterJobQueueDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search by image url' })    
  search?: string;    
} 
