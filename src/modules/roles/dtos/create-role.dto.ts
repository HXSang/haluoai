import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
    name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
    description?: string;

  @ApiProperty({
    example: [1, 2],
    required: true,
  })
  @IsNumber({}, { each: true })
    permissionIds: number[];
}
