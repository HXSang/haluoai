import {
  Body, Post, Controller, UseInterceptors,
  Get,
  Req,
  Query,
  Res,
} from '@nestjs/common';

import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClearCookieInterceptor, CookieInterceptor } from '@n-interceptors';
import { Request } from 'express';
import { AuthToken } from '@n-decorators';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GetQRCodeUserDto } from '@n-dtos/get-qr-code-use.dto';
import { BaseException } from '@n-exceptions';
import { Errors } from '@n-constants';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthService } from './auth.service';
import { AuthGoogleService } from './auth.google.service';
import { Response } from 'express';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authGoogleService: AuthGoogleService,
  ) { }

  @Post('login')
  @UseInterceptors(CookieInterceptor)
  async logIn(@Body() loginData: LoginDto) {
    return this.authService.login(loginData);
  }

  @Get('refresh-token')
  async refresh(@Req() request: Request) {
    const { refreshToken } = request.cookies;
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @AuthToken()
  @UseInterceptors(ClearCookieInterceptor)
  async logOut(@Req() request) {
    return this.authService.logOut(request?.user?.refreshTokenId);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  async resetPassword(
  @Query('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    let data: GetQRCodeUserDto;

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('app.qrCodeTokenSecret'),
      });
      data = payload;
    } catch (err) {
      throw new BaseException(Errors.AUTH.INVALID_TOKEN);
    }

    return this.authService.resetPassword(data.userId, resetPasswordDto.password);
  }

  @Get('google/sign-in')
  @ApiOperation({ summary: 'Get Google OAuth URL, remember config google oauth' })
  getGoogleAuthUrlLogin() {
    return {
      url: this.authGoogleService.generateAuthUrl()
    };
  }

  @Get('google/redirect')
  @ApiOperation({ summary: 'Handle Google OAuth redirect to generate access token then redirect to frontend, remember config frontend url in .env' })
  async handleOAuth(@Query('code') code: string, @Res() response: Response) {
    const { redirectUrl } = await this.authGoogleService.exchangeCodeForTokens(code);
    return response.redirect(redirectUrl);
  }
}
