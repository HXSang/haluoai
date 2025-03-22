import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { RawVideoType } from "./dto/raw-video-type";
import { PrismaService } from "@n-database/prisma/prisma.service";

interface VideoListResponse {
    code: number;
    message: string;
    data: {
        batchVideos: {
            batchID: string;
            batchType: number;
            assets: RawVideoType[];
        }[];
        nextCursor: {
            id: string;
            cursor: string;
        };
    };
}

interface VideoListParams {
    type: string;
    currentID: string | number;
    limit: number;
    filterType: number;
    scene: string;
}

@Injectable()
export class HailuoApiService {
    private readonly logger = new Logger(HailuoApiService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly httpService: HttpService
    ) {}

    async getVideosListDirect() {
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDYwNjgxOTcsInVzZXIiOnsiaWQiOiIzMjk0MDIzMzA2MTU4ODk5MjciLCJuYW1lIjoiQ29sb3JNRSBab29tIiwiYXZhdGFyIjoiaHR0cHM6Ly9jZG4uaGFpbHVvYWkudmlkZW8vbW9zcy9wcm9kLzIwMjQtMTItMjgtMjEvdXNlci91c2VyX2F2YXRhci8xNzM1MzkxNzgwMzIwMTY2NTQxLWF2YXRhcl8zMjk0MDIzMzA2MTU4ODk5MjciLCJkZXZpY2VJRCI6IjM1NTQxNDU4MDg3NTM4Njg4MCIsImlzQW5vbnltb3VzIjpmYWxzZX19.nH3omQOvU0rcVtV84v8pHAc2NBScYIC-BzjC9cdcil4";

        // Prepare request parameters
        const requestParams = {
            type: 'next',
            currentID: '0',
            limit: 30,
            filterType: 1,
            scene: 'create',
            biz_id: 0,
            app_id: 3001,
            device_platform: 'web',
            version_code: 22202,
            lang: 'en',
            uuid: 'cbdbccd1-b3ba-47b9-8d3f-185fd78b7b6d',
            device_id: '355414580875386880',
            os_name: 'Mac',
            browser_name: 'chrome',
            device_memory: 8,
            cpu_core_num: 8,
            browser_language: 'en-US',
            browser_platform: 'MacIntel',
            screen_width: 2240,
            screen_height: 1260,
            unix: Date.now()
        };

        // Set up headers exactly as in curl
        const headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'baggage': 'sentry-environment=production,sentry-release=prod-web-en-0.4.208,sentry-public_key=991fa515996610025d098e66d5e52b25,sentry-trace_id=537ec5ca8360428285c97d2f9ba42edf,sentry-sample_rate=0.1,sentry-sampled=false',
            'content-type': 'application/json',
            'dnt': '1',
            'priority': 'u=1, i',
            'referer': 'https://hailuoai.video/create',
            'sec-ch-ua': '"Not:A-Brand";v="24", "Chromium";v="134"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'sentry-trace': '537ec5ca8360428285c97d2f9ba42edf-942436975b567c97-0',
            'token': token,
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'yy': '2f8a55f7fa0e74828048aab63d240172'
        };

        try {
            // Make the HTTP request
            const response = await firstValueFrom(
                this.httpService.get<VideoListResponse>(
                    'https://hailuoai.video/v3/api/multimodal/video/my/batchCursor',
                    {
                        params: requestParams,
                        headers: headers
                    }
                )
            );

            // Process the response data
            const videos = [];
            if (response.data?.data?.batchVideos) {
                for (const batch of response.data.data.batchVideos) {
                    for (const asset of batch.assets) {
                        const videoResult = {
                            batchId: batch.batchID,
                            batchType: batch.batchType,
                            videoId: asset.id,
                            description: asset.desc,
                            coverUrl: asset.coverURL,
                            videoUrl: asset.videoURL,
                            status: asset.status,
                            width: asset.width,
                            height: asset.height,
                            hasVoice: asset.hasVoice,
                            message: asset.message,
                            modelId: asset.modelID,
                            userId: asset.userID.toString(),
                            createType: asset.createType,
                            promptImgUrl: asset.promptImgURL,
                            extra: asset.extra,
                            createTime: String(asset.createTime),
                        };
                        videos.push(videoResult);
                    }
                }
            }

            return {
                success: true,
                data: videos,
                nextCursor: response.data?.data?.nextCursor || null,
                message: 'Videos list fetched successfully'
            };
        } catch (error) {
            this.logger.error(`Failed to fetch videos: ${error.message}`, error.stack);
            return {
                success: false,
                data: [],
                message: `Failed to fetch videos: ${error.message}`,
                error: error
            };
        }
    }

    async getVideosList(accountId: number, params: Partial<VideoListParams> = {}) {
        // Get account to retrieve cookie
        const account = await this.prisma.account.findUnique({
            where: {
                id: accountId
            }
        });
        if (!account || !account.cookie || !account.isCookieActive) {
            throw new NotFoundException(`Account with ID ${accountId} not found or has inactive/missing cookie`);
        }

        // Extract token from cookie if it exists
        const cookieObj = this.parseCookieString(account.cookie);
        const token = cookieObj.token;
        
        if (!token) {
            throw new NotFoundException(`No token found in account cookie`);
        }

        // Prepare request parameters
        const requestParams = {
            type: params.type || 'next',
            currentID: params.currentID || '0',
            limit: params.limit || 30,
            filterType: params.filterType || 1,
            scene: params.scene || 'create',
            biz_id: 0,
            app_id: 3001,
            device_platform: 'web',
            version_code: 22202,
            lang: 'en',
            uuid: 'cbdbccd1-b3ba-47b9-8d3f-185fd78b7b6d',
            device_id: '355414580875386880',
            os_name: 'Mac',
            browser_name: 'chrome',
            device_memory: 8,
            cpu_core_num: 8,
            browser_language: 'en-US',
            browser_platform: 'MacIntel',
            screen_width: 2240,
            screen_height: 1260,
            unix: Date.now()
        };

        // Set up headers
        const headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'token': token,
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'cookie': account.cookie
        };

        try {
            // Make the HTTP request
            const response = await firstValueFrom(
                this.httpService.get<VideoListResponse>(
                    'https://hailuoai.video/v3/api/multimodal/video/my/batchCursor',
                    {
                        params: requestParams,
                        headers: headers
                    }
                )
            );

            // Process the response data
            const videos = [];
            if (response.data?.data?.batchVideos) {
                for (const batch of response.data.data.batchVideos) {
                    for (const asset of batch.assets) {
                        const videoResult = {
                            batchId: batch.batchID,
                            batchType: batch.batchType,
                            videoId: asset.id,
                            description: asset.desc,
                            coverUrl: asset.coverURL,
                            videoUrl: asset.videoURL,
                            status: asset.status,
                            width: asset.width,
                            height: asset.height,
                            hasVoice: asset.hasVoice,
                            message: asset.message,
                            modelId: asset.modelID,
                            userId: asset.userID.toString(),
                            createType: asset.createType,
                            promptImgUrl: asset.promptImgURL,
                            extra: asset.extra,
                            accountId: accountId,
                            createTime: String(asset.createTime),
                        };
                        videos.push(videoResult);
                    }
                }
            }

            return {
                success: true,
                data: videos,
                nextCursor: response.data?.data?.nextCursor || null,
                message: 'Videos list fetched successfully'
            };
        } catch (error) {
            this.logger.error(`Failed to fetch videos: ${error.message}`, error.stack);
            return {
                success: false,
                data: [],
                message: `Failed to fetch videos: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * Parse a cookie string and return an object with all cookies
     */
    private parseCookieString(cookieString: string): Record<string, string> {
        if (!cookieString) return {};
        
        const cookieObj = {};
        const cookies = cookieString.split(';');
        
        for (const cookie of cookies) {
            const parts = cookie.trim().split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                cookieObj[key] = value;
            }
        }
        
        return cookieObj;
    }
}