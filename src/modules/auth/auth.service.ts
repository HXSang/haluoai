import { UserRepository } from '@n-modules/user/user.repository';
import { Injectable } from '@nestjs/common';
import { COMMON_CONSTANT, Errors } from '@n-constants';
import * as bcrypt from 'bcryptjs';
import { AuthType } from '@prisma/client';
import { BaseException } from '@n-exceptions';
import { JwtPayloadModel } from '@n-models';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { QRCodeJwtPayloadModel } from '@n-models/qr-code-jwt-payload.model';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { RefreshTokenService } from './refresh-token.service';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { LoginGoogleDto } from './dtos/login-google.dto';
import { MailService } from './mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly UserRepository: UserRepository,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async register(registrationData: RegisterDto) {
    await bcrypt.hash(
      registrationData.password,
      COMMON_CONSTANT.SALT_ROUND,
    );
  }

  async login({
    authType, email, password, googleId,
  }: LoginDto) {
    // User authentication
    const user = await this.getAuthenticatedUser(email, authType, password, googleId);

    if (user.deletedAt) {
      throw new BaseException(Errors.AUTH.USER_ARCHIVED);
    }

    // Generate token
    const { accessToken, refreshToken } = await this.generateToken({
      id: user.id,
      email: user.email,
      authType: user.authType,
    });

    // Update last sign in
    await this.UserRepository.updateLastSignIn(user.id, new Date());

    return {
      accessToken,
      refreshToken,
      expiresIn: Number(this.configService.get('app.accessTokenExpTime')),
      user,
    };
  }

  async loginGoogle(loginGoogleDto: LoginGoogleDto) {
    let user = await this.UserRepository.findByEmailWithAuthType(loginGoogleDto.email, AuthType.GOOGLE);

    if (user?.deletedAt) {
      throw new BaseException(Errors.AUTH.USER_ARCHIVED);
    }

    if (!user) {
      await this.UserRepository.create({
        email: loginGoogleDto.email,
        name: loginGoogleDto.name,
        avatar: loginGoogleDto.avatar,
        authType: AuthType.GOOGLE,
        googleId: loginGoogleDto.googleId,
      });

      user = await this.UserRepository.findByEmailWithAuthType(loginGoogleDto.email, AuthType.GOOGLE);
    }

    const { accessToken, refreshToken } = await this.generateToken({
      id: user.id,
      email: user.email,
      authType: user.authType,
    });

    // Update last sign in
    await this.UserRepository.updateLastSignIn(user.id, new Date());

    return {
      accessToken,
      refreshToken,
      expiresIn: Number(this.configService.get('app.accessTokenExpTime')),
      user,
    };
  }

  public async logOut(refreshTokenId: number) {
    return this.refreshTokenService.deleteById(refreshTokenId);
  }

  public async refresh(refreshToken: string | null) {
    // Verify refreshToken
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get('app.refreshTokenSecret'),
    });

    delete payload.iat;
    delete payload.exp;

    // Check refreshToken in white list
    const foundedRefreshToken = await this.refreshTokenService.findByValue(
      refreshToken,
    );

    if (!foundedRefreshToken) {
      throw new BaseException(Errors.AUTH.INVALID_REFRESH_TOKEN);
    }

    const user = await this.UserRepository.findByEmailWithAuthType(payload.email, payload.authType);

    const accessToken = await this.jwtService.signAsync({
      id: user.id,
      email: user.email,
      authType: user.authType,
      refreshTokenId: foundedRefreshToken.id,
    });

    return {
      accessToken,
      user,
    };
  }

  public async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.UserRepository.findByEmailWithAuthType(email, AuthType.EMAIL);
    if (!user) throw new BaseException(Errors.AUTH.WRONG_EMAIL);

    const { qrCodeToken } = await this.generateQRCodeToken({ userId: user.id });

    await this.mailService.sendMailForgotPassword({
      email: user.email,
      name: user.name,
      link: `${COMMON_CONSTANT.ADMIN_CLIENT_URL}/auth/reset-password?token=${qrCodeToken}`,
    });

    return true;
  }

  public async resetPassword(userId: number, password: string) {
    const hashedPassword = await bcrypt.hash(password, COMMON_CONSTANT.SALT_ROUND);

    const dataUser: any = {
      password: hashedPassword,
    };

    await this.UserRepository.update(userId, dataUser);
  }

  private async getAuthenticatedUser(
    email: string,
    authType: AuthType,
    password?: string,
    googleId?: string,
  ) {
    const user = await this.UserRepository.findByEmailWithAuthType(email, authType);
    if (!user) throw new BaseException(Errors.AUTH.WRONG_CREDENTIALS);

    if (authType === AuthType.EMAIL) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) throw new BaseException(Errors.AUTH.WRONG_CREDENTIALS);
    }
    if (authType === AuthType.GOOGLE) {
      if (googleId !== user.googleId) throw new BaseException(Errors.AUTH.WRONG_CREDENTIALS);
    }

    user.password = undefined;
    user.googleId = undefined;

    return user;
  }

  private async generateToken(
    payload: JwtPayloadModel,
  ) {
    // Generate refreshToken
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('app.refreshTokenSecret'),
      expiresIn: `${this.configService.get('app.refreshTokenExpTime')}`,
    });

    const newRefreshToken = await this.refreshTokenService.create({
      value: refreshToken,
      userId: payload.id,
    });

    // Generate accessToken with payload have refreshTokenId
    const accessToken = await this.jwtService.signAsync({
      ...payload,
      refreshTokenId: newRefreshToken.id,
    }, {
      secret: this.configService.get('app.accessTokenSecret'),
      expiresIn: `${this.configService.get('app.accessTokenExpTime')}`,
    });

    return {
      refreshToken,
      accessToken,
    };
  }

  private async generateQRCodeToken(
    payload: QRCodeJwtPayloadModel,
  ) {
    const qrCodeToken = await this.jwtService.signAsync({
      ...payload,
    }, {
      secret: this.configService.get('app.qrCodeTokenSecret'),
      expiresIn: `${this.configService.get('app.qrCodeTokenExpTime')}`,
    });

    return {
      qrCodeToken,
    };
  }
}
