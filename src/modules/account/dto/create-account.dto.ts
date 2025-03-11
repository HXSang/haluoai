import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class CreateAccountDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The email of the account',
    example: 'zoom@colorme.vn',
  })
  email: string;
}