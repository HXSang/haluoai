import { PaginationDto } from "@n-dtos";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";
import { IsString } from "class-validator";

export class FilterVideoResultDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by video url' })  
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Search by account id' })  
  @IsOptional()
  @IsNumber()
  accountId?: number;           


  @ApiPropertyOptional({ description: 'Search by job queue id' })  
  @IsOptional()
  @IsNumber()
  jobQueueId?: number;  
}
