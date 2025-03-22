import { Controller, Get, Param, Query } from '@nestjs/common';
import { HailuoService } from './hailuo.service';
import { HailuoApiService } from './hailuo.api.service';
import { FilterVideoDto } from './dto/filter-video.dto';

@Controller('hailuo')
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
}
