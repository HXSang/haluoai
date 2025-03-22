import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { RawVideoType } from "./dto/raw-video-type";
import { PrismaService } from "@n-database/prisma/prisma.service";
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execPromise = promisify(exec);

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

    async getVideosListExactAxios() {
        try {
            const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDYwNjkwNDMsInVzZXIiOnsiaWQiOiIzMjk0MDIzMzA2MTU4ODk5MjciLCJuYW1lIjoiQ29sb3JNRSBab29tIiwiYXZhdGFyIjoiaHR0cHM6Ly9jZG4uaGFpbHVvYWkudmlkZW8vbW9zcy9wcm9kLzIwMjQtMTItMjgtMjEvdXNlci91c2VyX2F2YXRhci8xNzM1MzkxNzgwMzIwMTY2NTQxLWF2YXRhcl8zMjk0MDIzMzA2MTU4ODk5MjciLCJkZXZpY2VJRCI6IjM1NTQxNDU4MDg3NTM4Njg4MCIsImlzQW5vbnltb3VzIjpmYWxzZX19.YltYNPYmmIPTNwrgSnpeMM862u_ohTKk4R7-JJhM3Jg";
            const cookie = 'sensorsdata2015jssdkchannel=%7B%22prop%22%3A%7B%22_sa_channel_landing_url%22%3A%22%22%7D%7D; _fbp=fb.1.1741593581359.564321143878378942; _ga=GA1.1.1118897138.1741593581; _tt_enable_cookie=1; _ttp=01JNZH2659T5R54P7SZQNVCX1X_.tt.1; g_state={"i_p":1741600785250,"i_l":1}; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22MNxPm5wkpPqd%22%2C%22first_id%22%3A%221957f1116f81ffb-056f87c2c1b402-1b525636-2822400-1957f1116f9217e%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTk1N2YxMTE2ZjgxZmZiLTA1NmY4N2MyYzFiNDAyLTFiNTI1NjM2LTI4MjI0MDAtMTk1N2YxMTE2ZjkyMTdlIiwiJGlkZW50aXR5X2xvZ2luX2lkIjoiTU54UG01d2twUHFkIn0%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%22MNxPm5wkpPqd%22%7D%2C%22%24device_id%22%3A%221957f1116f81ffb-056f87c2c1b402-1b525636-2822400-1957f1116f9217e%22%7D; _gcl_aw=GCL.1742607638.Cj0KCQjwm7q-BhDRARIsACD6-fXaepRkmiMZN_59SIpL9qigejzmJXBjGHKGeSuj7UfrVgcS6pTdrAgaAgpmEALw_wcB; _gcl_gs=2.1.k1$i1742607636$u241181339; _ga_5PMRNYL7P0=GS1.1.1742612194.18.1.1742613040.60.0.0';
            
            // Cấu hình URL với tất cả các query parameters
            const url = 'https://hailuoai.video/v3/api/multimodal/video/my/batchCursor';
            const params = {
                type: 'next',
                currentID: '0',
                limit: '30',
                filterType: '1',
                scene: 'create',
                biz_id: '0',
                app_id: '3001',
                device_platform: 'web',
                version_code: '22202',
                lang: 'en',
                uuid: 'cbdbccd1-b3ba-47b9-8d3f-185fd78b7b6d',
                device_id: '355414580875386880',
                os_name: 'Mac',
                browser_name: 'chrome',
                device_memory: '8',
                cpu_core_num: '8',
                browser_language: 'en-US',
                browser_platform: 'MacIntel',
                screen_width: '2240',
                screen_height: '1260',
                unix: String(Date.now())
            };

            // Cấu hình headers chính xác như trong lệnh cURL
            const headers = {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'baggage': 'sentry-environment=production,sentry-release=prod-web-en-0.4.208,sentry-public_key=991fa515996610025d098e66d5e52b25,sentry-trace_id=f6fe328d2528411d967b4e4e0fbdfad9,sentry-sample_rate=0.1,sentry-sampled=false',
                'content-type': 'application/json',
                'cookie': cookie,
                'dnt': '1',
                'priority': 'u=1, i',
                'referer': 'https://hailuoai.video/create',
                'sec-ch-ua': '"Not:A-Brand";v="24", "Chromium";v="134"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'sentry-trace': 'f6fe328d2528411d967b4e4e0fbdfad9-a6ec6ecdf0210e31-0',
                'token': token,
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                'yy': 'a12638ba22a8f5955b8024dc48a2323d'
            };

            // Thực hiện request HTTP
            const response = await axios.get(url, {
                params: params,
                headers: headers
            });

            // Xử lý dữ liệu phản hồi
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
                message: 'Danh sách video đã được lấy thành công bằng Axios',
                rawResponse: response.data
            };
        } catch (error) {
            this.logger.error(`Không thể lấy danh sách video: ${error.message}`, error.stack);
            return {
                success: false,
                data: [],
                message: `Không thể lấy danh sách video: ${error.message}`,
                error: error.response ? error.response.data : error
            };
        }
    }

    async getVideosListWithExactCurl() {
        try {
            const curlCommand = `curl 'https://hailuoai.video/v3/api/multimodal/video/my/batchCursor?type=next&currentID=0&limit=30&filterType=1&scene=create&biz_id=0&app_id=3001&device_platform=web&version_code=22202&lang=en&uuid=cbdbccd1-b3ba-47b9-8d3f-185fd78b7b6d&device_id=355414580875386880&os_name=Mac&browser_name=chrome&device_memory=8&cpu_core_num=8&browser_language=en-US&browser_platform=MacIntel&screen_width=2240&screen_height=1260&unix=${Date.now()}' \\
              -H 'accept: application/json, text/plain, */*' \\
              -H 'accept-language: en-US,en;q=0.9' \\
              -H 'baggage: sentry-environment=production,sentry-release=prod-web-en-0.4.208,sentry-public_key=991fa515996610025d098e66d5e52b25,sentry-trace_id=f6fe328d2528411d967b4e4e0fbdfad9,sentry-sample_rate=0.1,sentry-sampled=false' \\
              -H 'content-type: application/json' \\
              -b 'sensorsdata2015jssdkchannel=%7B%22prop%22%3A%7B%22_sa_channel_landing_url%22%3A%22%22%7D%7D; _fbp=fb.1.1741593581359.564321143878378942; _ga=GA1.1.1118897138.1741593581; _tt_enable_cookie=1; _ttp=01JNZH2659T5R54P7SZQNVCX1X_.tt.1; g_state={"i_p":1741600785250,"i_l":1}; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22MNxPm5wkpPqd%22%2C%22first_id%22%3A%221957f1116f81ffb-056f87c2c1b402-1b525636-2822400-1957f1116f9217e%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTk1N2YxMTE2ZjgxZmZiLTA1NmY4N2MyYzFiNDAyLTFiNTI1NjM2LTI4MjI0MDAtMTk1N2YxMTE2ZjkyMTdlIiwiJGlkZW50aXR5X2xvZ2luX2lkIjoiTU54UG01d2twUHFkIn0%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%22MNxPm5wkpPqd%22%7D%2C%22%24device_id%22%3A%221957f1116f81ffb-056f87c2c1b402-1b525636-2822400-1957f1116f9217e%22%7D; _gcl_aw=GCL.1742607638.Cj0KCQjwm7q-BhDRARIsACD6-fXaepRkmiMZN_59SIpL9qigejzmJXBjGHKGeSuj7UfrVgcS6pTdrAgaAgpmEALw_wcB; _gcl_gs=2.1.k1$i1742607636$u241181339; _ga_5PMRNYL7P0=GS1.1.1742612194.18.1.1742613040.60.0.0' \\
              -H 'dnt: 1' \\
              -H 'priority: u=1, i' \\
              -H 'referer: https://hailuoai.video/create' \\
              -H 'sec-ch-ua: "Not:A-Brand";v="24", "Chromium";v="134"' \\
              -H 'sec-ch-ua-mobile: ?0' \\
              -H 'sec-ch-ua-platform: "macOS"' \\
              -H 'sec-fetch-dest: empty' \\
              -H 'sec-fetch-mode: cors' \\
              -H 'sec-fetch-site: same-origin' \\
              -H 'sentry-trace: f6fe328d2528411d967b4e4e0fbdfad9-a6ec6ecdf0210e31-0' \\
              -H 'token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDYwNjkwNDMsInVzZXIiOnsiaWQiOiIzMjk0MDIzMzA2MTU4ODk5MjciLCJuYW1lIjoiQ29sb3JNRSBab29tIiwiYXZhdGFyIjoiaHR0cHM6Ly9jZG4uaGFpbHVvYWkudmlkZW8vbW9zcy9wcm9kLzIwMjQtMTItMjgtMjEvdXNlci91c2VyX2F2YXRhci8xNzM1MzkxNzgwMzIwMTY2NTQxLWF2YXRhcl8zMjk0MDIzMzA2MTU4ODk5MjciLCJkZXZpY2VJRCI6IjM1NTQxNDU4MDg3NTM4Njg4MCIsImlzQW5vbnltb3VzIjpmYWxzZX19.YltYNPYmmIPTNwrgSnpeMM862u_ohTKk4R7-JJhM3Jg' \\
              -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36' \\
              -H 'yy: a12638ba22a8f5955b8024dc48a2323d'`;

            // Execute the curl command
            const { stdout, stderr } = await execPromise(curlCommand);
            
            if (stderr) {
                this.logger.error(`cURL command error: ${stderr}`);
            }
            
            // Parse the JSON response
            const response = JSON.parse(stdout);
            
            // Process the response data
            const videos = [];
            if (response?.data?.batchVideos) {
                for (const batch of response.data.batchVideos) {
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
                nextCursor: response?.data?.nextCursor || null,
                message: 'Videos list fetched successfully using direct cURL',
                rawResponse: response
            };
        } catch (error) {
            this.logger.error(`Failed to fetch videos with cURL: ${error.message}`, error.stack);
            return {
                success: false,
                data: [],
                message: `Failed to fetch videos with cURL: ${error.message}`,
                error: error
            };
        }
    }

    async getVideosListDirect() {
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDYwNjkwNDMsInVzZXIiOnsiaWQiOiIzMjk0MDIzMzA2MTU4ODk5MjciLCJuYW1lIjoiQ29sb3JNRSBab29tIiwiYXZhdGFyIjoiaHR0cHM6Ly9jZG4uaGFpbHVvYWkudmlkZW8vbW9zcy9wcm9kLzIwMjQtMTItMjgtMjEvdXNlci91c2VyX2F2YXRhci8xNzM1MzkxNzgwMzIwMTY2NTQxLWF2YXRhcl8zMjk0MDIzMzA2MTU4ODk5MjciLCJkZXZpY2VJRCI6IjM1NTQxNDU4MDg3NTM4Njg4MCIsImlzQW5vbnltb3VzIjpmYWxzZX19.YltYNPYmmIPTNwrgSnpeMM862u_ohTKk4R7-JJhM3Jg";

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
            'baggage': 'sentry-environment=production,sentry-release=prod-web-en-0.4.208,sentry-public_key=991fa515996610025d098e66d5e52b25,sentry-trace_id=f6fe328d2528411d967b4e4e0fbdfad9,sentry-sample_rate=0.1,sentry-sampled=false',
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
            'sentry-trace': 'f6fe328d2528411d967b4e4e0fbdfad9-a6ec6ecdf0210e31-0',
            'token': token,
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'yy': 'a12638ba22a8f5955b8024dc48a2323d'
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