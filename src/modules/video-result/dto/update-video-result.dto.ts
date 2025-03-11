import { PartialType } from '@nestjs/swagger';
import { CreateVideoResultDto } from './create-video-result.dto';

export class UpdateVideoResultDto extends PartialType(CreateVideoResultDto) {}
