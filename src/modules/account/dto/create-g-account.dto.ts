import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class CreateGAccountDto {
  @IsEmail()
  @ApiProperty({
    description: 'The email of the account',
    example: 'zoom@colorme.vn',
  })
  email: string;

  @IsNumber()
  @ApiProperty({
    description: 'The account ID',
    example: 1,
  })
  accountId: number;
}
