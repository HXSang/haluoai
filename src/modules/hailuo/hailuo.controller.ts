import { Controller, Get, Param, Query } from '@nestjs/common';
import { HailuoService } from './hailuo.service';
import { HailuoApiService } from './hailuo.api.service';
import { FilterVideoDto } from './dto/filter-video.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('hailuo')
@ApiTags('hailuo')
export class HailuoController {
  constructor(
    private readonly hailuoService: HailuoService, 
    private readonly hailuoApiService: HailuoApiService
  ) {}

  @Get('videos/:accountId')
  async getVideosList(@Query() filterVideoDto: FilterVideoDto) {
    return await this.hailuoApiService.getVideosList(+filterVideoDto.accountId, {
      type: filterVideoDto.type,
      currentID: filterVideoDto.currentID,
      limit: filterVideoDto.limit,
    });
  }

  @Get('videos-direct')
  async getVideosListDirect() {
    return await this.hailuoApiService.getVideosListDirect();
  }

  @Get('videos-curl')
  async getVideosListWithExactCurl() {
    return await this.hailuoApiService.getVideosListWithExactCurl();
  }

  @Get('videos-axios')
  async getVideosListExactAxios() {
    return await this.hailuoApiService.getVideosListExactAxios();
  }

  @Get('download-image')
  async downloadImage(@Query('imageUrl') imageUrl: string) {
    return await this.hailuoApiService.downloadImage(imageUrl);
  }
}
