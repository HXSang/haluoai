import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VideoResultService } from './video-result.service';
import { CreateVideoResultDto } from './dto/create-video-result.dto';
import { UpdateVideoResultDto } from './dto/update-video-result.dto';

@Controller('video-result')
export class VideoResultController {
  constructor(private readonly videoResultService: VideoResultService) {}

  @Post()
  create(@Body() createVideoResultDto: CreateVideoResultDto) {
    return this.videoResultService.create(createVideoResultDto);
  }

  @Get()
  findAll() {
    return this.videoResultService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.videoResultService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVideoResultDto: UpdateVideoResultDto) {
    return this.videoResultService.update(+id, updateVideoResultDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videoResultService.remove(+id);
  }
}
