import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { ApiTags } from '@nestjs/swagger';
import { FilterAccountDto } from './dto/filter-account.dto';

@Controller('account')  
@ApiTags('Account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('login-google')
  loginGoogle(@Body() createAccountDto: CreateAccountDto) {
    return this.accountService.loginHailuoaiByGoogle(createAccountDto);
  }

  // get all
  @Get()
  getAllAccounts(@Query() filterAccountDto: FilterAccountDto) {
    return this.accountService.paginate(filterAccountDto);
  }

  @Get(':accountId/videos')
  syncAccountVideos(@Param('accountId') accountId: string) {
    return this.accountService.syncAccountVideos(Number(accountId));
  }
}
