import {
  IsNumber, Min, IsOptional, Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { COMMON_CONSTANT } from '@n-constants';

export class PaginationParamsDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @ApiProperty({ required: false, example: 1 })
    page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  @ApiProperty({ required: false, example: 10 })
    pageSize?: number;

  constructor() {
    this.page = COMMON_CONSTANT.DEFAULT_PAGE;
    this.pageSize = COMMON_CONSTANT.DEFAULT_PAGE_SIZE;
  }
}

export type PaginationParams = {
  page?: number;
  pageSize?: number;
};
