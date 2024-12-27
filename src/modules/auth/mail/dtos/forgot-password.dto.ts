import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString,
} from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin@gmail.com' })
    email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'https://example.com' })
    link: string;
}
