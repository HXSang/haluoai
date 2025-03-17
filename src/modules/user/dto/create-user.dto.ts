import { IsString } from "class-validator";

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({ description: 'The email of the user' })
    email: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ description: 'The password of the user' })
    password: string;
}
