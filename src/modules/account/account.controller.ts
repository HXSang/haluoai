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
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { ApiTags } from '@nestjs/swagger';
import { FilterAccountDto } from './dto/filter-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateGAccountDto } from './dto/create-g-account.dto';

@Controller('account')
@ApiTags('Account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // create account
  @Post()
  createAccount(@Body() createAccountDto:  CreateAccountDto) {
    return this.accountService.create(createAccountDto);
  }

  @Post('login-google')
  loginGoogle(@Body() createGAccountDto: CreateGAccountDto) {
    return this.accountService.loginHailuoaiByGoogle(createGAccountDto);
  }

  // update account
  @Patch(':accountId')
  updateAccount(
    @Param('accountId') accountId: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountService.update(Number(accountId), updateAccountDto);
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
