import {
  Body, Post, Controller, UseInterceptors,
  Get,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
import { LoginGoogleDto } from './dtos/login-google.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  @Post('login')
  @UseInterceptors(CookieInterceptor)
  async logIn(@Body() loginData: LoginDto) {
    return this.authService.login(loginData);
  }

  @Post('login-google')
  async loginGoogle(@Body() loginGoogleDto: LoginGoogleDto) {
    return this.authService.loginGoogle(loginGoogleDto);
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
}
