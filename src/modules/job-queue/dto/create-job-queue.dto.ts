import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { QueueStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobQueueDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The image url of the job queue', default: '' })   
  imageUrl: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The prompt of the job queue', default: '' })   
  prompt: string = '';

  @IsNotEmpty()
  @IsEnum(QueueStatus)
  @ApiProperty({ description: 'The status of the job queue', enum: QueueStatus, default: QueueStatus.PENDING })   
  status: QueueStatus = QueueStatus.PENDING;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: 'The generate times of the job queue', default: 0 })   
  generateTimes: number = 0;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'The account id of the job queue', required: false, nullable: true })     
  accountId?: number | null;
}
