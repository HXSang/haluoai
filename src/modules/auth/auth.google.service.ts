import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { collectAcceptKeys, randomString } from '@n-utils';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AuthService } from '@n-modules/auth/auth.service';

@Injectable()
export class AuthGoogleService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly oauth2Client: OAuth2Client,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {
    this.oauth2Client = new OAuth2Client(
      this.configService.get('app.googleClientId'),
      this.configService.get('app.googleClientSecret'),
      this.configService.get('app.appUrl') + '/api/auth/google/redirect',
    )
  }

  async renewAccessToken(refreshToken: string) {
    console.log('Renewing access token');
    // Set the refresh token first
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Use refreshToken() method instead of getToken()
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials;
  }

  async exchangeCodeForTokens(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      // Set the credentials on the OAuth2 client
      this.oauth2Client.setCredentials(tokens);

      // get user info
      const userInfo = await this.getUserInfo(tokens.access_token);

      const signInData = {
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.id,
        avatar: userInfo.picture,
      };

      const loginData = await this.authService.loginGoogle(signInData);

      const frontendUrl = this.configService.get('app.frontendUrl');

      return {
        redirectUrl:
          frontendUrl +
          '/sign-in?' +
          Object.entries(
            collectAcceptKeys(loginData, ['accessToken', 'refreshToken', 'expiresIn']),
          )
            .map(([key, value]) => `${key}=${value}`)
            .join('&'),
      };
    } catch (error) {
      console.log('exchangeCodeForTokens error:', error);
      throw new Error('Failed to exchange code for tokens');
    }
  }

  async getUserInfo(accessToken: string) {
    const response = await this.httpService.axiosRef.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`,
    );
    return response.data;
  }

  generateAuthUrl() {
    const state = randomString(32);

    const authorizationUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile'], // Basic profile scopes for login
      state: state,
      prompt: 'consent',
      apiKey: this.configService.get('app.googleApiKey'),
    });

    return authorizationUrl;
  }
}
