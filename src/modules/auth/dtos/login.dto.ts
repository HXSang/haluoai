import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString, ValidateIf,
} from 'class-validator';
import { AuthType } from '@prisma/client';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin@gmail.com' })
    email: string;

  // @ValidateIf((dto: LoginDto) => dto.authType === AuthType.EMAIL)
  @IsNotEmpty({ message: 'Password is required for EMAIL authentication' })
  @IsString()
  @ApiProperty({ example: 'color1234', required: false })
    password?: string;

  // @ValidateIf((dto: LoginDto) => dto.authType === AuthType.GOOGLE)
  // @IsNotEmpty({ message: 'Google ID is required for GOOGLE authentication' })
  // @IsString()
  // @ApiProperty({ example: 'google-12345', required: false })
  //   googleId?: string;

  // @ApiProperty({ enum: AuthType })
  // @IsString()
  //   authType: AuthType;
}
