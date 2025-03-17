import { IsNotEmpty, IsString, IsEnum, IsNumber } from 'class-validator';
import { QueueStatus } from '@prisma/client';

export class CreateJobQueueDto {
  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @IsNotEmpty()
  @IsString()
  prompt: string;

  @IsNotEmpty()
  @IsEnum(QueueStatus)
  status: QueueStatus = QueueStatus.PENDING;

  @IsNotEmpty()
  @IsNumber()
  generateTimes: number;

  @IsNotEmpty()
  @IsNumber()
  accountId: number;
}
