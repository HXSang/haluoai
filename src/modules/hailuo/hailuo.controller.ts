import { Controller, Get, Param } from '@nestjs/common';
import { HailuoService } from './hailuo.service';

@Controller('hailuo')
export class HailuoController {
  constructor(private readonly hailuoService: HailuoService) {}

  @Get('videos')
  async getVideosList(@Param('accountId') accountId: string) {
  }
}
