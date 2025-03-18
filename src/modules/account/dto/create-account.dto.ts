import { IsBoolean, IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class CreateAccountDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The email of the account',
    example: 'zoom@colorme.vn',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The password of the account',
    example: '1234567890',
  })
  password: string;
  

  // categories
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The categories of the account',
    example: 'Frame, Background, Character, Style',
  })
  categories: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    description: 'The is active of the account',
    example: true,
  })
  isActive: boolean;
}
