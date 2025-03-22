import { PaginationDto } from "@n-dtos";
import { IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { Transform } from "class-transformer";
export class FilterJobQueueDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search by image url' })    
  search?: string;    

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @ApiPropertyOptional({ description: 'Search by account id' })
  accountId?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @ApiPropertyOptional({ description: 'Search by user id' })
  userId?: number;  
} 
