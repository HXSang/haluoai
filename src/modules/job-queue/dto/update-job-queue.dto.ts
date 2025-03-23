import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateJobQueueDto {
    @IsOptional()   
    @IsString()
    @ApiProperty({ description: 'The message of the job queue', required: false, nullable: true })     
    message?: string | null;

    @IsOptional()
    @IsString()
    @ApiProperty({ description: 'The note of the job queue', required: false, nullable: true })     
    note?: string | null;   
}
