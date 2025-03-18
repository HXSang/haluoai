import { IsBoolean, IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class CreateGAccountDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The email of the account',
    example: 'zoom@colorme.vn',
  })
  email: string;
}
