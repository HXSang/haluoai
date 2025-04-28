import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { JobQueueService } from './job-queue.service';
import { CreateJobQueueDto } from './dto/create-job-queue.dto';
import { UpdateJobQueueDto } from './dto/update-job-queue.dto';
import { ApiTags } from '@nestjs/swagger';
import { FilterJobQueueDto } from './dto/filter-job-queue.dto';
import { AuthClaims, GetUser } from '@n-decorators';
import { User } from '@prisma/client';

@Controller('job-queue')
@ApiTags('job-queue')
export class JobQueueController {
  constructor(private readonly jobQueueService: JobQueueService) {}

  @Post()
  @AuthClaims()
  create(@Body() createJobQueueDto: CreateJobQueueDto, @GetUser() user: User) {
    return this.jobQueueService.create(createJobQueueDto, user);
  }

  @Get()
  findAll(@Query() filterJobQueueDto: FilterJobQueueDto) {
    return this.jobQueueService.findAll(filterJobQueueDto);
  }

  // get pending job
  @Get('/pending')
  getPendingJob() {
    return this.jobQueueService.findPendingJob();
  }
  // get pending job
  @Get('/account-pending')
  getPendingJobByAccount() {
    return this.jobQueueService.findPendingJobsGroupedByAccount();
  }

  @Post('/:id/request-pending')
  requestPendingJob(@Param('id') id: string) {
    return this.jobQueueService.markAsProcessing(+id);
  }


  @Post('/:id/process')
  process(@Param('id') id: string) {
    return this.jobQueueService.process(+id, undefined, true);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobQueueService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateJobQueueDto: UpdateJobQueueDto,
  ) {
    return this.jobQueueService.update(+id, updateJobQueueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobQueueService.remove(+id);
  }
}
