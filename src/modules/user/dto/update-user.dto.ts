import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional } from 'class-validator';
import { IsBoolean } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @IsBoolean()
    @ApiProperty({ description: 'Soft delete' })
    isActive?: boolean;
}
