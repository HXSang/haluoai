import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsOptional, IsString,
} from 'class-validator';

export class LoginGoogleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin@gmail.com' })
    email: string;

  @IsNotEmpty({ message: 'Google ID is required for GOOGLE authentication' })
  @IsString()
  @ApiProperty({ example: 'google-12345', required: false })
    googleId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Admin' })
    name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'https://avatar.com' })
    avatar?: string;
}
