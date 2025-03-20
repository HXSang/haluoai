import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
} from 'class-validator';

export class ArchivedRoleDto {
  @IsBoolean()
  @ApiProperty({ example: true })
    isArchived: boolean;
}
