import { IsOptional, IsString } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class OrderSortDto {
  //order by
  @ApiPropertyOptional({ type: String, required: false, description: 'Order by' })
  @IsOptional()
  @IsString()
  order_by?: string;    

  //sort by
  @ApiPropertyOptional({ type: String, required: false, description: 'Sort by' })
  @IsOptional()
  @IsString()
  sort?: string;    
}
