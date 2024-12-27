import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty, IsNumber, IsString,
} from 'class-validator';

export class NewCandidateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin@gmail.com' })
    email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    recruiterName: string;

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
  @ApiProperty({ example: '2024-01-01' })
    submissionDate: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'https://example.com' })
    link: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    jobTitle: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    clientName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    contactChannel: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyễn Văn An' })
    groupChat: string;
}
