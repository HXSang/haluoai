import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { PAGINATE_DEFAULT_LIMIT, PAGINATE_DEFAULT_PAGE } from '@n-constants/paginate.constant';

export class PaginationDto {
  @ApiPropertyOptional({
    description: "Page number",
    example: 1
  })
  @IsString()
  @IsOptional()
  page?: number = PAGINATE_DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: "Limit number",
    example: 10
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = PAGINATE_DEFAULT_LIMIT;
}
