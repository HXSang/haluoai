import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
export class FilterVideoDto {
    @IsNotEmpty()
    @Transform(({ value }) => +value)   
    @ApiProperty()
    accountId: number;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    type?: string;

    @IsOptional()
    @IsNumber()
    @ApiProperty({ required: false })
    currentID?: string | number;

    @IsOptional()
    @IsNumber()
    @ApiProperty({ required: false })
    limit?: number;
}   