import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
} from 'class-validator';

export class FilterRoleDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'tester', required: false })
    search?: string;
}
