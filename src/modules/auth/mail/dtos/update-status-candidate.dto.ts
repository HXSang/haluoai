import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsNumber, IsOptional, IsString,
} from 'class-validator';

export class UpdateStatusCandidateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin@gmail.com' })
    email: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 123 })
    candidateId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    candidateName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    recruiterName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    jobTitle: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    previousStatus: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    newStatus: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '2024-01-01' })
    dateOfUpdate: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'https://kiteshr.com/candidate/123' })
    link: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    clientName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    reasonRejected?: string;
}
