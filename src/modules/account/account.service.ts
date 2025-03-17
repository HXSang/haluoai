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
@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly videoResultService: VideoResultService,
    private readonly hailouService: HailuoService,
    private readonly prisma: PrismaService
  ) {}

  async findAll() {
    return await this.accountRepository.findMany();
  } 

  async findActiveAccounts() {
    return await this.accountRepository.findMany({
      where: {
        isActive: true,
        cookie: {
          not: ""
        },  
      },
    });
  }

  async loginHailuoaiByGoogle(createAccountDto: CreateAccountDto) {
    const account = await this.accountRepository.findFirst({
      where: {
        email: createAccountDto.email,
      },
    });
    if (!account) {
      throw new Error('Account not found');
    }
    
    try {
      const cookies = await this.hailouService.handleGoogleLogin(account);

      // save cookies to database
      await this.accountRepository.update(account.id, {
        cookie: cookies,
        lastLoginAt: new Date(),
      });

      return cookies;
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
          return await this.videoResultService.create(video);
        })
      );

      return {
        success: true,
        data: createdVideos,
        message: 'Videos synced successfully'
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
        cookie: {
          not: null,
        },
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
}


