import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Account } from '@prisma/client';
import { AccountService } from '@n-modules/account/account.service';

@Injectable()
export class HailuoService {
  private readonly logger = new Logger(HailuoService.name);
  private readonly cookiesPath = path.join(process.cwd(), 'cookies.json');

  private async initializeBrowser(account: Account, options: { headless?: boolean } = {}) {
    const browser = await puppeteer.launch({
      headless: options.headless ?? false,
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
      userDataDir: path.join(process.cwd(), `browser-data-${account.id}`),
    });

    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    );

    // Set default timeouts
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    // Set cookies if they exist
    if (account.cookie) {
      try {
        const cookies = JSON.parse(account.cookie);
        await page.setCookie(...cookies);
      } catch (error) {
        this.logger.error('Error setting cookies:', error);
      }
    }

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
      const { browser: initializedBrowser, page: initializedPage } = await this.initializeBrowser(account);
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
        const maxChecks = 30; // 30 seconds timeout

        const checkLogin = async () => {
          try {
            const isLoggedIn = await page.evaluate(() => {
              const signOutButton = Array.from(
                document.querySelectorAll('div'),
              ).find((el) => el.textContent?.includes('Sign Out'));
              return !!signOutButton;
            });

            if (isLoggedIn) {
              resolve(true);
              return;
            }

            checkCount++;
            if (checkCount >= maxChecks) {
              resolve(false);
              return;
            }

            setTimeout(checkLogin, 1000);
          } catch (e) {
            console.log('Checking login status...');
            setTimeout(checkLogin, 1000);
          }
        };

        checkLogin();
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

      // Now collect cookies
      console.log('Collecting cookies...');
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

      // Format cookies
      const formattedCookies = cookies.map((cookie) => ({
        ...cookie,
        domain: cookie.domain || '.hailuoai.video',
        path: cookie.path || '/',
      }));

      const cookieString = JSON.stringify(formattedCookies);

      // Close browser before saving to database
      if (popup && !popup.isClosed()) {
        await popup.close().catch(() => {});
      }
      if (browser) {
        await browser.close().catch(() => {});
      }

      return {
        success: true,
        cookies: cookieString,
        message: 'Login successful and cookies saved',
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

  async getVideosList(account: Account) {
    let browser;
    let page;
    let videoResults = [];
    
    try {
      const { browser: initializedBrowser, page: initializedPage } = await this.initializeBrowser(account);
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

      // Wait for API response
      const apiResponse: any = await Promise.race([
        apiResponsePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), 30000))
      ]);

      if (apiResponse && apiResponse.data && apiResponse.data.batchVideos) {
        for (const batch of apiResponse.data.batchVideos) {
          for (const asset of batch.assets) {
            const videoResult = {
              batchId: batch.batchID,
              batchCreateTime: batch.batchCreateTime,
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
      throw new Error(`Failed to get videos list: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }


  async uploadImageToVideo(account: Account, imageUrl: string, prompt: string) {
    let browser;
    let page;

    try {
      const { browser: initializedBrowser, page: initializedPage } = await this.initializeBrowser(account);
      browser = initializedBrowser;
      page = initializedPage;

      // Navigate to create page
      await page.goto('https://hailuoai.video/create', {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 60000,
      });

      // Wait for the upload element to be present
      await page.waitForSelector('.ant-upload.ant-upload-select');

      // Set up file input handling
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('.ant-upload.ant-upload-select')
      ]);

      // Download the image from URL and save it temporarily
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const tempFilePath = path.join(process.cwd(), 'temp-image.jpg');
      fs.writeFileSync(tempFilePath, Buffer.from(buffer));

      // Upload the file
      await fileChooser.accept([tempFilePath]);

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      // Wait for upload to complete and input to be ready
      await page.waitForSelector('#video-create-input');

      // Clear existing input and type the prompt
      await page.evaluate(() => {
        const input = document.querySelector('#video-create-input') as HTMLTextAreaElement;
        if (input) input.value = '';
      });
      await page.type('#video-create-input', prompt);

      // Wait for create button and click it
      await page.waitForSelector('.pink-gradient-btn');
      await page.click('.pink-gradient-btn');

      // Wait for some indication of success (you might need to adjust this based on the actual UI)
      await new Promise(resolve => setTimeout(resolve, 5000));

      return {
        success: true,
        message: 'Image uploaded and video creation initiated'
      };

    } catch (error) {
      this.logger.error('Error uploading image and creating video:', error);
      throw new Error(`Failed to upload image and create video: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}
