import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { VideoResultService } from './video-result.service';
import { CreateVideoResultDto } from './dto/create-video-result.dto';
import { UpdateVideoResultDto } from './dto/update-video-result.dto';
import { FilterVideoResultDto } from './dto/filter-video-result.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthClaims, GetUser } from '@n-decorators';
import { User } from '@prisma/client';

@Controller('video')
@ApiTags('Video')
export class VideoResultController {
  constructor(private readonly videoResultService: VideoResultService) {}

  @Post()
  create(@Body() createVideoResultDto: CreateVideoResultDto) {
    return this.videoResultService.create(createVideoResultDto);
  }

  @Get()
  findAll(@Query() filterVideoResultDto: FilterVideoResultDto) {
    return this.videoResultService.findAll(filterVideoResultDto);
  }


  @Get("/all-images")
  findAllImages(@Query() filterVideoResultDto: FilterVideoResultDto) {
    return this.videoResultService.findAllImages(filterVideoResultDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.videoResultService.findOne(+id);  
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVideoResultDto: UpdateVideoResultDto) {
    return this.videoResultService.update(+id, updateVideoResultDto);
  }

  @Post(':id/toggle-mark') 
  @AuthClaims()
  toggleMark(@Param('id') id: string, @GetUser() user: User) {
    return this.videoResultService.toggleMark(+id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videoResultService.remove(+id);
  }
}
