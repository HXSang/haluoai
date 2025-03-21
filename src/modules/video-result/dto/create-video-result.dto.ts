import { IsString } from "class-validator";

import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";

export class CreateVideoResultDto {
    @ApiProperty({ description: 'Search by user id', example: 1 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    userId?: number;    

    // note
    @ApiProperty({ description: 'Note', example: 'This is a note' })
    @IsOptional()
    @IsString()
    note?: string;
}
