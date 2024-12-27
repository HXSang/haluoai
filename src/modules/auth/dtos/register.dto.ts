import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString, IsOptional,
} from 'class-validator';
import { AuthType } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin@gmail.com' })
    email: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Admin' })
    name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'https://avatar.com' })
    avatar?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '0123456789' })
    phone?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '123456' })
    password?: string;

  @ApiProperty({ enum: AuthType })
  @IsString()
    authType: AuthType;
}
