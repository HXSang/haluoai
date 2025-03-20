import { Injectable, Logger } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountRepository } from './account.repository';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Account } from '@prisma/client';
import { HailuoService } from '@n-modules/hailuo/hailuo.service';
import { PrismaService } from '@n-database/prisma/prisma.service';
import { FilterAccountDto } from './dto/filter-account.dto';
import { VideoResultService } from '@n-modules/video-result/video-result.service';
import { CreateGAccountDto } from './dto/create-g-account.dto';
import { VideoResultRepository } from '@n-modules/video-result/video-result.repository';
@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly videoResultService: VideoResultService,
    private readonly videoResultRepository: VideoResultRepository,
    private readonly hailouService: HailuoService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return await this.accountRepository.findMany();
  }

  async findActiveAccounts() {
    return await this.accountRepository.findMany({
      select: {
        id: true,
        email: true,
        isActive: true,
        isCookieActive: true,
      },
      where: {
        isActive: true,
        isCookieActive: true,
      },
    });
  }

  async loginHailuoaiByGoogle(createGAccountDto: CreateGAccountDto) {
    const account = await this.accountRepository.findFirst({
      where: {
        email: createGAccountDto.email,
      },
    });
    if (!account) {
      throw new Error('Account not found');
    }

    try {
      const result = await this.hailouService.handleGoogleLogin(account);

      // save browser profile to database
      await this.accountRepository.update(account.id, {
        browserProfile: result.browserProfile,
        lastLoginAt: new Date(),
        isCookieActive: true,
      });

      return result;
    } catch (error) {
      this.logger.error(`Login failed for account ${account.email}:`, error);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // get videos list of account
  async syncAccountVideos(accountId: number) {
    const account = await this.accountRepository.findUnique({
      where: {
        id: accountId,
      },
    });
    if (!account) {
      throw new Error('Account not found');
    }
    const videosResponse = await this.hailouService.getVideosList(account);

    if (videosResponse.success && videosResponse.data) {
      // Create video results in database
      const createdVideos = await Promise.all(
        videosResponse.data.map(async (video) => {
          // exist video result
          console.log('Checking if video exists: ', video.id, video.url);
          const existVideo = await this.videoResultRepository.findFirst({
            where: {
              videoId: video.videoId,
              videoUrl: video.videoUrl,
            },
          });
          if (existVideo) {
            // update video result
            return await this.videoResultService.update(existVideo.id, video);
          }
          return await this.videoResultService.create(video);
        }),
      );

      return {
        success: true,
        data: createdVideos,
        message: 'Videos synced successfully',
      };
    }

    return videosResponse;
  }

  async getAllAccounts() {
    return await this.accountRepository.findMany();
  }

  async paginate(filterAccountDto: FilterAccountDto) {
    const { page, limit } = filterAccountDto;
    return await this.accountRepository.paginate({
      page,
      limit,
    });
  }

  async findRandomActiveAccount() {
    const accounts = await this.accountRepository.findManyRandom(1, {
      where: {
        isActive: true,
        isCookieActive: true,
      },
    });
    return accounts[0];
  }

  async findOne(id: number) {
    return await this.accountRepository.findUnique({
      where: {
        id: id,
      },
    });
  }

  async create(createAccountDto: CreateAccountDto) {
    return await this.accountRepository.create(createAccountDto);
  }

  async update(id: number, updateAccountDto: UpdateAccountDto) {
    return await this.accountRepository.update(id, updateAccountDto);
  }

  async setCookieActive(id: number, isActive: boolean) {
    return await this.accountRepository.update(id, {
      isCookieActive: isActive,
    });
  }

  async getBrowserCookie(id: number) {
    const account = await this.accountRepository.findUnique({
      where: {
        id: id,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const cookie = await this.hailouService.getBrowserCookie(account);

    // save browser profile to database
    await this.accountRepository.update(account.id, {
      browserProfile: cookie.browserProfile,
      lastLoginAt: new Date(),
      isCookieActive: true,
    });

    return cookie;
  }

  // test cookie
  async testCookie(id: number) {
    const account = await this.accountRepository.findUnique({
      where: {
        id: id,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const cookie = await this.hailouService.testLoginWithCookiesOnly(account);

    return cookie;
  }
}
