import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { ApiTags } from '@nestjs/swagger';

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
  getAllAccounts() {
    return this.accountService.getAllAccounts();
  }
}
