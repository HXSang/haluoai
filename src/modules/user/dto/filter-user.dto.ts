import { PaginationDto } from "@n-dtos";
import { IsOptional } from "class-validator";

import { IsString } from "class-validator";

export class FilterUserDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;
}
