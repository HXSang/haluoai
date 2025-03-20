import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Account, JobQueue } from '@prisma/client';
import { PrismaService } from '@n-database/prisma/prisma.service';

interface BrowserProfile {
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  indexedDB: {
    databases: string[];
    data: Record<string, any>;
  };
  serviceWorkers: {
    scope: string;
    active: boolean;
  }[];
  cacheStorage: Record<string, string[]>;
  webRTC: boolean;
  browserFingerprint: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    timezone: string;
  };
}

@Injectable()
export class HailuoService {
  private readonly logger = new Logger(HailuoService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async unlockChromeProfile(profilePath: string) {
    try {
      console.log('unlockChromeProfile, handle profile path: ', profilePath);
      // Ensure profile directory exists
      if (!fs.existsSync(profilePath)) {
        fs.mkdirSync(profilePath, { recursive: true });
        this.logger.log('Created profile directory');
      }

      const lockFile = path.join(profilePath, 'SingletonLock');
      const singletonFile = path.join(profilePath, 'SingletonCookie');

      console.log('lockFile: ', lockFile);
      console.log('singletonFile: ', singletonFile);

      // Remove lock files with proper error handling
      const filesToRemove = [lockFile, singletonFile];
      for (const file of filesToRemove) {
        try {
          if (fs.existsSync(file)) {
            fs.chmodSync(file, 0o666); // Ensure we have write permissions
            fs.unlinkSync(file);
            console.log(`Removed ${path.basename(file)}`);
            this.logger.log(`Removed ${path.basename(file)}`);
          }
        } catch (error) {
          if (error.code === 'EACCES') {
            // Handle permission denied error
            this.logger.warn(`Permission denied removing ${path.basename(file)}. Trying with sudo...`);
            try {
              require('child_process').execSync(`sudo rm -f "${file}"`);
              console.log(`Removed ${path.basename(file)} with sudo`);
              this.logger.log(`Removed ${path.basename(file)} with sudo`);
            } catch (sudoError) {
              this.logger.error(`Failed to remove ${path.basename(file)} even with sudo:`, sudoError);
              console.log(`Failed to remove ${path.basename(file)} even with sudo:`, sudoError);  
            }
          } else {
            this.logger.error(`Error removing ${path.basename(file)}:`, error);
            console.log(`Error removing ${path.basename(file)}:`, error);
          }
        }
      }

      // Set proper permissions on profile directory
      fs.chmodSync(profilePath, 0o755);
    } catch (error) {
      this.logger.error('Error managing Chrome profile:', error);
      console.log('Error managing Chrome profile:', error);
      throw new Error(`Failed to manage Chrome profile: ${error.message}`);
    }
  }

  private async initializeBrowser(account: Account, options: { headless?: boolean } = {}) {
    const userDataDir = path.join(process.cwd(), `browser-data-${account.id}`);
    
    // Unlock the profile if it's locked
    // await this.unlockChromeProfile(userDataDir);

    const headless = options.headless ?? process.env.APP_URL?.includes('localhost') ? false : true;

    const browser = await puppeteer.launch({
      headless: headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1280,800',
        '--start-maximized',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--lang=en-US,en',
      ],
      defaultViewport: null,
      devtools: true,
      userDataDir,
    });

    const page = await browser.newPage();

    // Set default timeouts
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    // Check if browserProfile exists, use that instead of just cookies
    if (account.browserProfile) {
      try {
        // Parse browser profile
        const browserProfile: BrowserProfile = JSON.parse(account.browserProfile);

        // Set user agent from browserProfile if available
        if (browserProfile.browserFingerprint?.userAgent) {
          await page.setUserAgent(browserProfile.browserFingerprint.userAgent);
        } else {
          // Set default user agent
          await page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          );
        }

        // Navigate to a page to set up browser context
        await page.goto('about:blank');

        // Set cookies from browserProfile
        if (browserProfile.cookies && browserProfile.cookies.length > 0) {
          await page.setCookie(...browserProfile.cookies);
          this.logger.log(`Set ${browserProfile.cookies.length} cookies from browser profile`);
        }

        // Will restore localStorage and sessionStorage after navigating to the actual page
        return { browser, page, browserProfile };
      } catch (error) {
        this.logger.error('Error initializing browser with profile:', error);
        // Continue with basic initialization if profile fails
      }
    } else if (account.cookie?.trim()) {
      // Legacy cookie method as fallback
      try {
        // Validate that cookie is not empty or just whitespace
        const cookieStr = account.cookie.trim();
        if (!cookieStr) {
          this.logger.warn('Empty cookie string found');
          return { browser, page };
        }

        // Try to parse cookies
        let cookies;
        try {
          cookies = JSON.parse(cookieStr);
        } catch (parseError) {
          this.logger.error('Failed to parse cookies:', parseError);
          return { browser, page };
        }

        // Validate cookies array
        if (!Array.isArray(cookies) || cookies.length === 0) {
          this.logger.warn('Invalid cookie format or empty cookie array');
          return { browser, page };
        }

        // Set valid cookies
        await page.setCookie(...cookies);
        this.logger.log(`Successfully set ${cookies.length} cookies`);
      } catch (error) {
        this.logger.error('Error setting cookies:', error);
        // Continue without cookies rather than failing
        return { browser, page };
      }
    }

    // Set default user agent if not set earlier
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    );

    return { browser, page };
  }

  // login with google
  async loginWithGoogle(account: Account) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://hailuoai.com/');
  }
  async handleGoogleLogin(account: Account) {
    let browser;
    let page;
    let popup;

    try {
      const { browser: initializedBrowser, page: initializedPage, browserProfile } = await this.initializeBrowser(account);
      browser = initializedBrowser;
      page = initializedPage;

      // Navigate to site with retry logic
      console.log('Navigating to hailuoai.video...');
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          console.log('retryCount: ', retryCount);
          await page.goto('https://hailuoai.video/', {
            waitUntil: ['domcontentloaded', 'networkidle0'],
            timeout: 60000,
          });
          break;
        } catch (error) {
          retryCount++;
          console.log(`Navigation attempt ${retryCount} failed:`, error.message);

          if (retryCount === maxRetries) {
            throw new Error(`Failed to load page after ${maxRetries} attempts`);
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      // Khôi phục browserProfile sau khi điều hướng nếu có
      if (browserProfile) {
        await this.restoreBrowserProfile(page, browserProfile);
      }

      // Wait for content to be truly ready
      try {
        await page.waitForSelector('#video-user-component', { timeout: 10000 });
      } catch (e) {
        console.log('Initial selector not found, refreshing page...');
        await page.reload({ waitUntil: ['domcontentloaded', 'networkidle0'] });
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      // Click Sign In
      await page.waitForSelector('#video-user-component');
      await page.evaluate(() => {
        const container = document.querySelector('#video-user-component');
        const signInDiv = Array.from(container.querySelectorAll('div')).find(
          (el) => el.textContent?.trim() === 'Sign In',
        );
        if (signInDiv) (signInDiv as HTMLElement).click();
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Set up popup listener
      const popupPromise = new Promise((resolve) =>
        page.once('popup', resolve),
      );

      // Create login check promise
      const waitForLogin = new Promise<boolean>((resolve, reject) => {
        let checkCount = 0;
        const maxChecks = 100; // 30 seconds timeout
        let timeoutId: NodeJS.Timeout;

        const checkLogin = async () => {
          if (checkCount >= maxChecks) {
            console.log(`Login check timed out after ${maxChecks} attempts`);
            clearTimeout(timeoutId);
            resolve(false);
            return;
          }

          try {
            console.log(`Checking login status... Attempt ${checkCount + 1}/${maxChecks}`);
            const isLoggedIn = await page.evaluate(() => {
              const avatarImg = document.querySelector('img[alt="hailuo video avatar png"]');
              return !!avatarImg;
            });

            if (isLoggedIn) {
              console.log('Login successful! Avatar found.');
              clearTimeout(timeoutId);
              resolve(true);
              return;
            }

            console.log('Avatar not found yet, continuing to check...');
            checkCount++;
            timeoutId = setTimeout(checkLogin, 1000);
          } catch (e) {
            console.log(`Error checking login status (Attempt ${checkCount + 1}/${maxChecks}):`, e.message);
            checkCount++;
            timeoutId = setTimeout(checkLogin, 1000);
          }
        };

        checkLogin();

        // Global timeout as safety net
        setTimeout(() => {
          console.log('Global timeout reached - stopping login check');
          clearTimeout(timeoutId);
          resolve(false);
        }, 32000); // Slightly longer than the check cycle
      });

      // Click Google login button
      await page.evaluate(() => {
        const googleButton = Array.from(
          document.querySelectorAll('div.font-medium'),
        ).find((button) =>
          button.textContent?.includes('Continue with Google'),
        );
        if (googleButton) (googleButton as HTMLElement).click();
      });

      // Handle popup login
      popup = (await popupPromise) as puppeteer.Page;

      try {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Handle email input
        const emailInput = await popup.waitForSelector('input[type="email"]', {
          visible: true,
          timeout: 10000,
        });
        await emailInput.click({ clickCount: 3 });
        await emailInput.type(account.email, { delay: 100 });
        await emailInput.press('Enter');
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Handle password input
        const passwordInput = await popup.waitForSelector(
          'input[type="password"]',
          { visible: true, timeout: 10000 },
        );
        await passwordInput.click({ clickCount: 3 });
        await passwordInput.type(account.password, { delay: 100 });
        await passwordInput.press('Enter');
        await new Promise((resolve) => setTimeout(resolve, 60000));
      } catch (popupError) {
        console.error('Error during popup handling:', popupError);
        // Take screenshot of main page if popup fails
        try {
          await page.screenshot({ path: 'main-page-error.png' });
        } catch (e) {
          console.error('Failed to take main page screenshot');
        }
        throw popupError;
      }

      // Wait for login to complete
      const loginSuccess = await waitForLogin;
      if (!loginSuccess) {
        // Take screenshot before throwing timeout error
        try {
          await page.screenshot({ path: 'login-timeout-error.png' });
        } catch (e) {
          console.error('Failed to take timeout screenshot');
        }
        throw new Error('Login timeout - could not detect successful login');
      }

      // Additional wait to ensure all states are updated
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Refresh the page to ensure we have the latest state
      await page.reload({ waitUntil: 'networkidle0' });
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Now collect full browser profile
      console.log('Collecting browser profile...');
      const cookies = await page.cookies();
      console.log(`Found ${cookies.length} cookies`);

      if (cookies.length === 0) {
        // Take screenshot if no cookies found
        try {
          await page.screenshot({ path: 'no-cookies-error.png' });
        } catch (e) {
          console.error('Failed to take no-cookies screenshot');
        }
        throw new Error('No cookies found after login');
      }

      // Get a complete browser profile
      const browserProfileResult = await this.getBrowserCookie(account);

      // Close browser before saving to database
      if (popup && !popup.isClosed()) {
        await popup.close().catch(() => {});
      }
      if (browser) {
        await browser.close().catch(() => {});
      }

      return {
        success: true,
        browserProfile: browserProfileResult.browserProfile,
        message: 'Login successful and browser profile saved',
      };
    } catch (error) {
      // Log error before cleanup
      this.logger.error(`Login error for ${account.email}:`, error);

      // Try to take screenshot if page is still available
      if (page && !page.isClosed()) {
        try {
          const screenshotPath = `error-${Date.now()}.png`;
          await page.screenshot({ path: screenshotPath });
        this.logger.log(`Error screenshot saved to ${screenshotPath}`);
        } catch (e) {
          // Ignore screenshot errors
        }
      }

      // Clean up before throwing
      try {
        if (popup && !popup.isClosed()) {
          await popup.close().catch(() => {});
        }
        if (browser) {
          await browser.close().catch(() => {});
        }
      } catch (e) {
        this.logger.error('Error during cleanup:', e);
      }

      // Re-throw with clear message
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Phương thức tiện ích để khôi phục localStorage và sessionStorage
  private async restoreBrowserProfile(page: puppeteer.Page, browserProfile: BrowserProfile) {
    // Khôi phục localStorage
    try {
      if (browserProfile.localStorage) {
        await page.evaluate((data) => {
          Object.entries(data).forEach(([key, value]) => {
            window.localStorage.setItem(key, value as string);
          });
        }, browserProfile.localStorage);
        this.logger.log(`Restored ${Object.keys(browserProfile.localStorage).length} localStorage items`);
      }
    } catch (localStorageError) {
      this.logger.error(`Failed to restore localStorage: ${localStorageError.message}`);
    }

    // Khôi phục sessionStorage
    try {
      if (browserProfile.sessionStorage) {
        await page.evaluate((data) => {
          Object.entries(data).forEach(([key, value]) => {
            window.sessionStorage.setItem(key, value as string);
          });
        }, browserProfile.sessionStorage);
        this.logger.log(`Restored ${Object.keys(browserProfile.sessionStorage).length} sessionStorage items`);
      }
    } catch (sessionStorageError) {
      this.logger.error(`Failed to restore sessionStorage: ${sessionStorageError.message}`);
    }
  }

  async getVideosList(account: Account) {
    let browser;
    let page;
    let videoResults = [];
    
    try {
      const { browser: initializedBrowser, page: initializedPage, browserProfile } = await this.initializeBrowser(account);

      console.log('initializedBrowser getVideosList');

      browser = initializedBrowser;
      page = initializedPage;

      // Enable request interception
      await page.setRequestInterception(true);

      // Listen for network requests
      page.on('request', request => {
        request.continue();
      });

      // Create a promise to store API response
      const apiResponsePromise = new Promise((resolve) => {
        page.on('response', async response => {
          const url = response.url();
          if (url.includes('/v3/api/multimodal/video/my/batchCursor')) {
            try {
              const responseData = await response.json();
              resolve(responseData);
            } catch (error) {
              console.error('Error parsing response:', error);
              resolve(null);
            }
          }
        });
      });

      // Navigate to create page
      await page.goto('https://hailuoai.video/create', {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 60000,
      });

      // Khôi phục browserProfile sau khi điều hướng nếu có
      if (browserProfile) {
        await this.restoreBrowserProfile(page, browserProfile);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check if user is logged in by looking for avatar
      console.log('Checking login status...');
      const isLoggedIn = await page.evaluate(() => {
        const avatarImg = document.querySelector('img[alt="hailuo video avatar png"]');
        return !!avatarImg;
      });

      if (!isLoggedIn) {
        console.log('User is not logged in');
        
        // Take a screenshot when login error is detected
        try {
          const screenshotPath = `login-error-${Date.now()}.png`;
          await page.screenshot({ path: screenshotPath });
          console.log(`Login error screenshot saved to ${screenshotPath}`);
          this.logger.log(`Login error screenshot saved to ${screenshotPath}`);
        } catch (screenshotError) {
          console.error('Failed to take login error screenshot:', screenshotError);
          this.logger.error('Failed to take login error screenshot:', screenshotError);
        }
        
        // Update account cookie status
        await this.prisma.account.update({
          where: { id: account.id },
          data: { isCookieActive: false },
        });
        
        throw new Error('User is not logged in - please login first');
      }

      console.log('User is logged in, proceeding with video list fetch');

      // Wait for API response
      const apiResponse: any = await Promise.race([
        apiResponsePromise,
        new Promise((_, reject) => setTimeout(() => {
          this.prisma.account.update({
            where: { id: account.id },
            data: { isCookieActive: false },
          });
          reject(new Error('API timeout'));
        }, 30000))
      ]);

      if (apiResponse && apiResponse.data && apiResponse.data.batchVideos) {
        for (const batch of apiResponse.data.batchVideos) {
          for (const asset of batch.assets) {
            const videoResult = {
              batchId: batch.batchID,
              batchType: batch.batchType,
              videoId: asset.id,
              description: asset.desc,
              coverUrl: asset.coverURL,
              videoUrl: asset.videoURL,
              downloadUrl: asset.downloadURL,
              status: asset.status,
              width: asset.width,
              height: asset.height,
              hasVoice: asset.hasVoice,
              modelId: asset.modelID,
              userId: asset.userID.toString(),
              createType: asset.createType,
              promptImgUrl: asset.promptImgURL,
              extra: asset.extra,
              accountId: account.id
            };
            videoResults.push(videoResult);
          }
        }
      }

      return {
        success: true,
        data: videoResults,
        message: 'Videos list captured successfully'
      };

    } catch (error) {
      this.logger.error('Error getting videos list:', error);
      
      // Take a screenshot for any error if page is available
      if (page && !page.isClosed()) {
        try {
          const screenshotPath = `getvideos-error-${Date.now()}.png`;
          await page.screenshot({ path: screenshotPath });
          console.log(`Error screenshot saved to ${screenshotPath}`);
          this.logger.log(`Error screenshot saved to ${screenshotPath}`);
        } catch (screenshotError) {
          console.error('Failed to take error screenshot:', screenshotError);
        }
      }
      
      throw new Error(`Failed to get videos list: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }


  async processJob(account: Account, job: JobQueue) {
    const { imageUrl, prompt, generateTimes = 1 } = job;
    let browser;
    let page;

    try {
      console.log(`[ProcessJob] Starting for account ${account.email}`);
      
      // First check how many videos are currently being generated
      console.log('[ProcessJob] Checking current video generation count...');
      const videosListResponse = await this.getVideosList(account);
      const generatingVideos = videosListResponse.data.filter(video => !video.videoUrl);
      console.log(`[ProcessJob] Found ${generatingVideos.length} videos currently being generated`);
      
      if (generatingVideos.length >= 5) {
        console.log(`[ProcessJob] Generation limit reached: ${generatingVideos.length} videos in progress`);
        throw new Error('Maximum concurrent video generation limit (5) reached. Please try again later.');
      }

      console.log('[ProcessJob] Initializing browser...');
      const { browser: initializedBrowser, page: initializedPage, browserProfile } = await this.initializeBrowser(account);
      browser = initializedBrowser;
      page = initializedPage;

      // Navigate to create page
      console.log('[ProcessJob] Navigating to create page...');
      await page.goto('https://hailuoai.video/create', {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 60000,
      });

      // Khôi phục browserProfile sau khi điều hướng nếu có
      if (browserProfile) {
        await this.restoreBrowserProfile(page, browserProfile);
      }

      // Wait for the upload element to be present
      console.log('[ProcessJob] Checking upload element selector...');
      await page.waitForSelector('input[type="file"]');
      console.log('[ProcessJob] Upload element found');

      // Download the image from URL and save it temporarily
      console.log('[ProcessJob] Downloading image...');
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const tempFilePath = path.join(process.cwd(), 'temp-image.jpg');
      fs.writeFileSync(tempFilePath, Buffer.from(buffer));
      console.log('[ProcessJob] Image downloaded');

      // Upload the file
      console.log('[ProcessJob] Uploading file...');
      const inputElement = await page.$('input[type="file"]');
      await inputElement.evaluate((el) => {
        el.style.display = 'block';
        el.style.visibility = 'visible';
      });
      await inputElement.uploadFile(tempFilePath);
      console.log('[ProcessJob] File uploaded');

      // Wait for upload to complete
      console.log('[ProcessJob] Waiting 15s for upload to process...');
      await new Promise(resolve => setTimeout(resolve, 8000));
      console.log('[ProcessJob] Upload processing completed');

      // Check if upload was successful by looking for the uploaded image element
      console.log('[ProcessJob] Validating upload success...');
      try {
        await page.waitForSelector('img[alt="uploaded image"]', { timeout: 5000 });
        console.log('[ProcessJob] Upload validation successful');
      } catch (error) {
        console.error('[ProcessJob] Upload validation failed');
        throw new Error('Image upload failed - uploaded image not found');
      }

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
      console.log('[ProcessJob] Temp file cleaned');

      // Wait for upload to complete and input to be ready
      console.log('[ProcessJob] Checking prompt input...');
      const promptInput = await page.waitForSelector('#video-create-textarea');
      console.log('[ProcessJob] Prompt input found:', !!promptInput);

      // Clear existing input and type the prompt
      console.log('[ProcessJob] Setting prompt...');
      await page.evaluate(() => {
        const input = document.querySelector('#video-create-textarea') as HTMLTextAreaElement;
        if (input) input.value = '';
      });
      await page.type('#video-create-textarea', prompt);
      console.log('[ProcessJob] Prompt set');

      // Set generate times
      console.log('[ProcessJob] Setting generate times...');
      const generateInput = await page.waitForSelector('.ant-input-number input.ant-input-number-input');
      await generateInput.click({ clickCount: 3 });
      await generateInput.type(generateTimes.toString());
      
      // Wait a bit for the system to adjust the value
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get the actual value after system adjustment
      const actualGenerateTimes = await page.evaluate(() => {
        const input = document.querySelector('.ant-input-number input.ant-input-number-input') as HTMLInputElement;
        return input ? parseInt(input.value) : 1;
      });
      console.log('[ProcessJob] Actual generate times allowed:', actualGenerateTimes);

      // Wait for create button and click it
      console.log('[ProcessJob] Finding create button...');
      const createButton = await page.waitForSelector('.pink-gradient-btn');
      console.log('[ProcessJob] Create button found:', !!createButton);
      await page.click('.pink-gradient-btn');
      console.log('[ProcessJob] Create button clicked');

      // Wait for some indication of success
      console.log('[ProcessJob] Waiting for generation to start...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('[ProcessJob] Generation started');

      return {
        success: true,
        message: 'Image uploaded and video creation initiated',
        actualGenerateTimes
      };

    } catch (error) {
      console.error('[ProcessJob] Error:', error.message);
      throw new Error(`Failed to upload image and create video: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }


  // hailuoService
  async getBrowserCookie(account: Account) {
    let browser;
    let page;

    try {
      this.logger.log(`Getting browser cookies for account ${account.email}`);
      
      // Initialize browser with the account's profile
      const { browser: initializedBrowser, page: initializedPage } = await this.initializeBrowser(account);
      browser = initializedBrowser;
      page = initializedPage;

      // Navigate to main site to ensure cookies are loaded
      await page.goto('https://hailuoai.video/', {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 60000,
      });

      // Wait a bit to make sure all cookies are set
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get all cookies
      const cookies = await page.cookies();
      this.logger.log(`Retrieved ${cookies.length} cookies for account ${account.email}`);

      // Format cookies
      const formattedCookies = cookies.map((cookie) => ({
        ...cookie,
        domain: cookie.domain || '.hailuoai.video',
        path: cookie.path || '/',
      }));

      // Get localStorage data
      const localStorage = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          data[key] = window.localStorage.getItem(key);
        }
        return data;
      });
      this.logger.log(`Retrieved localStorage with ${Object.keys(localStorage).length} items`);

      // Get sessionStorage data
      const sessionStorage = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          data[key] = window.sessionStorage.getItem(key);
        }
        return data;
      });
      this.logger.log(`Retrieved sessionStorage with ${Object.keys(sessionStorage).length} items`);

      // Get IndexedDB data
      const indexedDBData = await page.evaluate(async () => {
        const databases = await window.indexedDB.databases();
        const data = {};
        
        for (const db of databases) {
          if (db.name) {
            data[db.name] = {
              version: db.version
            };
          }
        }
        return data;
      });
      this.logger.log(`Retrieved IndexedDB data for ${Object.keys(indexedDBData).length} databases`);

      // Get Service Workers info
      const serviceWorkers = await page.evaluate(async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.map(reg => ({
          scope: reg.scope,
          active: reg.active ? true : false
        }));
      });
      this.logger.log(`Retrieved ${serviceWorkers.length} service workers`);

      // Get Cache Storage data
      const cacheStorage = await page.evaluate(async () => {
        const cacheNames = await caches.keys();
        const cacheContents = {};
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          cacheContents[name] = keys.map(key => key.url);
        }
        return cacheContents;
      });
      this.logger.log(`Retrieved cache storage for ${Object.keys(cacheStorage).length} caches`);

      // Get browser fingerprint
      const browserFingerprint = await page.evaluate(() => ({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        webRTC: !!window.RTCPeerConnection
      }));

      // Create complete browser profile
      const browserProfile: BrowserProfile = {
        cookies: formattedCookies,
        localStorage,
        sessionStorage,
        indexedDB: {
          databases: Object.keys(indexedDBData),
          data: indexedDBData
        },
        serviceWorkers,
        cacheStorage,
        webRTC: browserFingerprint.webRTC,
        browserFingerprint: {
          userAgent: browserFingerprint.userAgent,
          platform: browserFingerprint.platform,
          language: browserFingerprint.language,
          screenResolution: browserFingerprint.screenResolution,
          timezone: browserFingerprint.timezone
        }
      };

      return {
        success: true,
        browserProfile: JSON.stringify(browserProfile),
        message: 'Successfully retrieved complete browser profile'
      };
    } catch (error) {
      this.logger.error(`Error getting browser profile for ${account.email}:`, error);
      return {
        success: false,
        browserProfile: null,
        message: `Failed to get browser profile: ${error.message}`
      };
    } finally {
      if (browser) {
        await browser.close().catch((e) => {
          this.logger.error('Error closing browser:', e);
        });
      }
    }
  } 
  
  /**
   * Test login functionality using only cookies without browser cache
   * @param account Account with cookies to test
   * @returns Object with login status and screenshot path
   */
  async testLoginWithCookiesOnly(account: Account) {
    let browser;
    let page;
    
    try {
      this.logger.log(`Testing login with browser profile for account ${account.email}`);
      
      if (!account.browserProfile) {
        throw new Error('No browser profile available for this account');
      }

      // Parse browser profile
      const browserProfile: BrowserProfile = JSON.parse(account.browserProfile);
      
      // Launch browser with userDataDir to maintain profile
      const userDataDir = path.join(process.cwd(), `browser-data-${account.id}`);
      browser = await puppeteer.launch({
        headless: process.env.APP_URL?.includes('localhost') ? false : true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--window-size=1280,800',
          '--start-maximized',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--lang=en-US,en',
        ],
        defaultViewport: null,
        devtools: true,
        userDataDir, // Use the same profile directory
      });
      
      // Open a new page
      page = await browser.newPage();
      
      // Set browser fingerprint
      await page.setUserAgent(browserProfile.browserFingerprint.userAgent);
      
      // Set default timeouts
      page.setDefaultNavigationTimeout(60000);
      page.setDefaultTimeout(60000);
      
      // Navigate to create page first to set up the page context
      await page.goto('https://hailuoai.video/create', {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 60000,
      });

      // Set cookies
      try {
        if (browserProfile.cookies && browserProfile.cookies.length > 0) {
          await page.setCookie(...browserProfile.cookies);
          this.logger.log(`Set ${browserProfile.cookies.length} cookies for testing`);
        }
      } catch (cookieError) {
        this.logger.error(`Failed to set cookies: ${cookieError.message}`);
      }

      // Restore localStorage
      try {
        if (browserProfile.localStorage) {
          await page.evaluate((data) => {
            Object.entries(data).forEach(([key, value]) => {
              window.localStorage.setItem(key, value as string);
            });
          }, browserProfile.localStorage);
          this.logger.log(`Restored ${Object.keys(browserProfile.localStorage).length} localStorage items`);
        }
      } catch (localStorageError) {
        this.logger.error(`Failed to restore localStorage: ${localStorageError.message}`);
      }

      // Restore sessionStorage
      try {
        if (browserProfile.sessionStorage) {
          await page.evaluate((data) => {
            Object.entries(data).forEach(([key, value]) => {
              window.sessionStorage.setItem(key, value as string);
            });
          }, browserProfile.sessionStorage);
          this.logger.log(`Restored ${Object.keys(browserProfile.sessionStorage).length} sessionStorage items`);
        }
      } catch (sessionStorageError) {
        this.logger.error(`Failed to restore sessionStorage: ${sessionStorageError.message}`);
      }

      // Restore IndexedDB data
      try {
        if (browserProfile.indexedDB && browserProfile.indexedDB.databases.length > 0) {
          await page.evaluate((data) => {
            // Note: IndexedDB data restoration is limited due to browser security
            // We can only detect if databases exist
            console.log('IndexedDB databases:', data.databases);
          }, browserProfile.indexedDB);
          this.logger.log(`Detected ${browserProfile.indexedDB.databases.length} IndexedDB databases`);
        }
      } catch (indexedDBError) {
        this.logger.error(`Failed to restore IndexedDB: ${indexedDBError.message}`);
      }

      // Restore Service Workers
      try {
        if (browserProfile.serviceWorkers && browserProfile.serviceWorkers.length > 0) {
          await page.evaluate((workers) => {
            // Note: Service Workers can't be directly restored
            // We can only detect if they were previously registered
            console.log('Service Workers:', workers);
          }, browserProfile.serviceWorkers);
          this.logger.log(`Detected ${browserProfile.serviceWorkers.length} Service Workers`);
        }
      } catch (serviceWorkerError) {
        this.logger.error(`Failed to restore Service Workers: ${serviceWorkerError.message}`);
      }

      // Restore Cache Storage
      try {
        if (browserProfile.cacheStorage && Object.keys(browserProfile.cacheStorage).length > 0) {
          await page.evaluate((cacheData) => {
            // Note: Cache Storage can't be directly restored
            // We can only detect if caches existed
            console.log('Cache Storage:', cacheData);
          }, browserProfile.cacheStorage);
          this.logger.log(`Detected ${Object.keys(browserProfile.cacheStorage).length} Cache Storage entries`);
        }
      } catch (cacheStorageError) {
        this.logger.error(`Failed to restore Cache Storage: ${cacheStorageError.message}`);
      }
      
      // Take screenshot of initial state
      const initialScreenshotPath = `cookie-test-initial-${Date.now()}.png`;
      await page.screenshot({ path: initialScreenshotPath });
      this.logger.log(`Initial state screenshot saved to ${initialScreenshotPath}`);
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if user is logged in by looking for avatar
      const isLoggedIn = await page.evaluate(() => {
        const avatarImg = document.querySelector('img[alt="hailuo video avatar png"]');
        return !!avatarImg;
      });
      
      // Take screenshot after login check
      const finalScreenshotPath = `cookie-test-result-${Date.now()}.png`;
      await page.screenshot({ path: finalScreenshotPath });
      this.logger.log(`Final state screenshot saved to ${finalScreenshotPath}`);
      
      // Get page HTML for further analysis if needed
      const pageContent = await page.content();
      
      return {
        success: true,
        isLoggedIn,
        message: isLoggedIn ? 'Successfully logged in with browser profile' : 'Failed to log in with browser profile',
        initialScreenshotPath,
        finalScreenshotPath,
        htmlLength: pageContent.length
      };
    } catch (error) {
      this.logger.error(`Error testing login with browser profile for ${account.email}:`, error);
      
      // Take screenshot if possible
      if (page && !page.isClosed()) {
        try {
          const errorScreenshotPath = `cookie-test-error-${Date.now()}.png`;
          await page.screenshot({ path: errorScreenshotPath });
          this.logger.log(`Error screenshot saved to ${errorScreenshotPath}`);
          
          return {
            success: false,
            isLoggedIn: false,
            message: `Error testing login: ${error.message}`,
            errorScreenshotPath
          };
        } catch (screenshotError) {
          // Ignore screenshot errors
        }
      }
      
      return {
        success: false,
        isLoggedIn: false,
        message: `Error testing login: ${error.message}`
      };
    } finally {
      if (browser) {
        await browser.close().catch(e => {
          this.logger.error('Error closing browser:', e);
        });
      }
    }
  }
}
