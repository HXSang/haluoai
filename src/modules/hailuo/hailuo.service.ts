import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Account, JobQueue } from '@prisma/client';
import { PrismaService } from '@n-database/prisma/prisma.service';
import { downloadImage } from '@n-utils/helper';

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
      const preferencesFile = path.join(profilePath, 'Preferences');
      const leveldbLockFile = path.join(profilePath, 'lockfile');

      console.log('lockFile: ', lockFile);
      console.log('singletonFile: ', singletonFile);

      // Note: We no longer kill Chrome processes as that is managed by JobQueueProcessor
      // JobQueueProcessor's accountRunningStatus prevents multiple jobs from accessing the same account

      // Remove lock files with proper error handling
      const filesToRemove = [lockFile, singletonFile, leveldbLockFile];
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

      // Fix Preferences file if it's corrupt
      try {
        if (fs.existsSync(preferencesFile)) {
          const preferences = fs.readFileSync(preferencesFile, 'utf8');
          if (preferences.includes('Shut down cleanly')) {
            // Replace corrupt preferences with fixed version
            const fixedPreferences = preferences.replace(/"exit_type":"Shut down cleanly"/g, '"exit_type":"Normal"');
            fs.writeFileSync(preferencesFile, fixedPreferences);
            console.log('Fixed corrupt Preferences file');
            this.logger.log('Fixed corrupt Preferences file');
          }
        }
      } catch (preferencesError) {
        this.logger.error('Error fixing Preferences file:', preferencesError);
        console.log('Error fixing Preferences file:', preferencesError);
      }

      // Set proper permissions on profile directory
      fs.chmodSync(profilePath, 0o755);
    } catch (error) {
      this.logger.error('Error managing Chrome profile:', error);
      console.log('Error managing Chrome profile:', error);
      throw new Error(`Failed to manage Chrome profile: ${error.message}`);
    }
  }

  private async initializeBrowser(account: Account, options: { headless?: boolean } = {}, action?: string) {
    const currentDate = new Date().toISOString().split('T')[0];
    const userDataDir = path.join(process.cwd(), `browser-data-${account.id}`);
    let browser;
    
    // Unlock the profile if it's locked
    await this.unlockChromeProfile(userDataDir);

    const headless = options.headless ?? process.env.APP_URL?.includes('localhost') ? false : true;

    try {
      browser = await puppeteer.launch({
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
          // Add network reliability arguments
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-sync',
          '--disable-translate',
          '--metrics-recording-only',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--ignore-certificate-errors-spki-list',
          // Increase timeouts for better reliability
          '--dns-prefetch-disable',
          '--no-proxy-server',
          // Optimize for stability rather than performance
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
        defaultViewport: null,
        devtools: true,
        userDataDir,
        // Reduce timeout for browser launch from 120000 to 45000
        timeout: 45000,
        // Reduce protocol timeout from 180000 to 45000
        protocolTimeout: 45000,
      });
    } catch (error) {
      this.logger.error(`Browser launch failed: ${error.message}`);
      // Try cleaning up the profile directory completely as a last resort
      try {
        console.log('Attempting to clean up profile directory completely...');
        const { execSync } = require('child_process');
        // Remove the entire profile directory
        execSync(`rm -rf "${userDataDir}"`);
        console.log(`Removed entire profile directory at ${userDataDir}`);
        this.logger.log(`Removed entire profile directory at ${userDataDir}`);
        
        // Recreate the directory
        fs.mkdirSync(userDataDir, { recursive: true });
        console.log(`Recreated profile directory at ${userDataDir}`);
        this.logger.log(`Recreated profile directory at ${userDataDir}`);
        
        // Try launching again with the clean profile
        browser = await puppeteer.launch({
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
            // Add network reliability arguments
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-sync',
            '--disable-translate',
            '--metrics-recording-only',
            '--no-first-run',
            '--safebrowsing-disable-auto-update',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            // Increase timeouts for better reliability
            '--dns-prefetch-disable',
            '--no-proxy-server',
            // Optimize for stability rather than performance
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
          ],
          defaultViewport: null,
          devtools: true,
          userDataDir,
          // Add protocol timeout to fix 'Runtime.callFunctionOn timed out' issue
          protocolTimeout: 180000,
        });
        console.log('Browser launched successfully after cleanup');
        this.logger.log('Browser launched successfully after cleanup');
      } catch (cleanupError) {
        this.logger.error(`Browser launch failed even after cleanup: ${cleanupError.message}`);
        throw new Error(`Failed to launch browser: ${error.message}. Cleanup also failed: ${cleanupError.message}`);
      }
    }

    const page = await browser.newPage();

    // Set default timeouts
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(45000);

    // Check if browserProfile exists, use that instead of just cookies
    if (account.browserProfile) {
      try {
        // Parse browser profile
        const browserProfile: BrowserProfile = JSON.parse(account.browserProfile);

        // Set browser fingerprint
        await page.setUserAgent(browserProfile.browserFingerprint.userAgent);

        // Navigate to create page first to set up the page context with retry logic
        console.log('initializeBrowser: Navigating to create page with retry logic...');
        let retryCount = 0;
        const maxRetries = 3;
        let navigationSuccessful = false;

        while (retryCount < maxRetries && !navigationSuccessful) {
          try {
            console.log(`initializeBrowser: Navigation attempt ${retryCount + 1}/${maxRetries}`);
            await page.goto('https://hailuoai.video/create', {
              waitUntil: ['domcontentloaded', 'networkidle0'],
              timeout: 45000,
            });
            navigationSuccessful = true;
            console.log(`initializeBrowser: Navigation succeeded on attempt ${retryCount + 1}`);
          } catch (error) {
            retryCount++;
            console.log(`initializeBrowser: Navigation attempt ${retryCount} failed:`, error.message);
            
            if (retryCount === maxRetries) {
              throw new Error(`Failed to load page after ${maxRetries} attempts: ${error.message}`);
            }
            
            // Reduce wait time between retries from 5000 * retryCount to 3000 * retryCount
            const waitTime = 3000 * retryCount;
            console.log(`initializeBrowser: Waiting ${waitTime}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }

        // Set cookies
        try {
          if (browserProfile.cookies && browserProfile.cookies.length > 0) {
            await page.setCookie(...browserProfile.cookies);
            this.logger.log(`Set ${browserProfile.cookies.length} cookies from browser profile`);
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
            timeout: 45000,
          });
          break;
        } catch (error) {
          retryCount++;
          console.log(`Navigation attempt ${retryCount} failed:`, error.message);

          if (retryCount === maxRetries) {
            throw new Error(`Failed to load page after ${maxRetries} attempts`);
          }
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      // Khôi phục browserProfile sau khi điều hướng nếu có
      if (browserProfile) {
        await this.restoreBrowserProfile(page, browserProfile);
      }

      // Kiểm tra xem đã đăng nhập hay chưa
      console.log('Checking if already logged in...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait a bit for page to settle
      
      const isAlreadyLoggedIn = await page.evaluate(() => {
        const avatarImg = document.querySelector('img[alt="hailuo video avatar png"]');
        return !!avatarImg;
      });
      
      console.log(`Already logged in: ${isAlreadyLoggedIn}`);
      
      // Nếu đã đăng nhập rồi, lấy browser profile và trả về
      if (isAlreadyLoggedIn) {
        console.log('User is already logged in, collecting browser profile without re-login');
        
        // Refresh the page to ensure we have the latest state
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Get a complete browser profile
        const browserProfileResult = await this.getBrowserCookie(account);
        
        // Close browser before returning
        if (browser) {
          await browser.close().catch(() => {});
        }
        
        return {
          success: true,
          browserProfile: browserProfileResult.browserProfile,
          message: 'Already logged in, browser profile saved',
        };
      }

      // Wait for content to be truly ready
      try {
        await page.waitForSelector('#video-user-component', { timeout: 4000 });
      } catch (e) {
        console.log('Initial selector not found, refreshing page...');
        await page.reload({ waitUntil: ['domcontentloaded', 'networkidle0'] });
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Tiếp tục quy trình đăng nhập bình thường nếu chưa đăng nhập
      console.log('User is not logged in, proceeding with Google login flow...');

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
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Handle email input
        const emailInput = await popup.waitForSelector('input[type="email"]', {
          visible: true,
          timeout: 4000,
        });
        await emailInput.click({ clickCount: 3 });
        await emailInput.type(account.email, { delay: 100 });
        await emailInput.press('Enter');
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Handle password input
        const passwordInput = await popup.waitForSelector(
          'input[type="password"]',
          { visible: true, timeout: 4000 },
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
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Refresh the page to ensure we have the latest state
      await page.reload({ waitUntil: 'networkidle0' });
      await new Promise((resolve) => setTimeout(resolve, 2000));

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
      const { browser: initializedBrowser, page: initializedPage, browserProfile } = await this.initializeBrowser(account, undefined, 'getVideosList');

      console.log('initializedBrowser getVideosList');

      browser = initializedBrowser;
      page = initializedPage;

      // Wrap all browser operations in a try/catch to ensure proper cleanup
      try {
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

        // Navigate to create page with retry logic
        console.log('Navigating to hailuoai.video/create with retry logic...');
        let retryCount = 0;
        const maxRetries = 3;
        let navigationSuccessful = false;

        while (retryCount < maxRetries && !navigationSuccessful) {
          try {
            console.log(`Navigation attempt ${retryCount + 1}/${maxRetries}`);
            await page.goto('https://hailuoai.video/create', {
              waitUntil: ['domcontentloaded', 'networkidle0'],
              timeout: 45000,
            });
            navigationSuccessful = true;
            console.log(`Navigation succeeded on attempt ${retryCount + 1}`);
          } catch (error) {
            retryCount++;
            console.log(`Navigation attempt ${retryCount} failed:`, error.message);
            
            if (retryCount === maxRetries) {
              // On final attempt failure, mark cookie as inactive and throw
              throw new Error(`Failed to load page after ${maxRetries} attempts: ${error.message}`);
            }
            
            // Reduce wait time between retries from 5000 * retryCount to 3000 * retryCount
            const waitTime = 3000 * retryCount;
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }

        // Khôi phục browserProfile sau khi điều hướng nếu có
        if (browserProfile) {
          await this.restoreBrowserProfile(page, browserProfile);
        }

        await new Promise((resolve) => setTimeout(resolve, 6000));

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
          
          // Close browser properly before updating account status
          if (browser) {
            await browser.close().catch(e => {
              console.error('Error closing browser after login error:', e);
            });
            browser = null; // Set to null so we don't try to close it again in finally block
          }
          
          throw new Error('User is not logged in - please login first');
        }

        console.log('User is logged in, proceeding with video list fetch');

        // Wait for API response with reduced timeout from 30000 to 20000
        const apiResponse: any = await Promise.race([
          apiResponsePromise,
          new Promise((_, reject) => setTimeout(() => {
            reject(new Error('API timeout'));
          }, 20000))
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
                message: asset?.message,
                modelId: asset.modelID,
                userId: asset.userID.toString(),
                createType: asset.createType,
                promptImgUrl: asset.promptImgURL,
                extra: asset.extra,
                accountId: account.id,
                createTime: String(asset.createTime || new Date().getTime()),
              };
              videoResults.push(videoResult);
            }
          }
        }

        // Close browser properly before returning
        if (browser) {
          await browser.close().catch(e => {
            console.error('Error closing browser after successful fetch:', e);
          });
          browser = null; // Set to null so we don't try to close it again in finally block
        }

        return {
          success: true,
          data: videoResults,
          message: 'Videos list captured successfully'
        };
      } catch (innerError) {
        // Handle errors during browser operations
        console.error('Inner operation error:', innerError.message);
        
        // Take a screenshot if possible
        if (page && !page.isClosed()) {
          try {
            const screenshotPath = `getvideos-inner-error-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath });
            console.log(`Error screenshot saved to ${screenshotPath}`);
            this.logger.log(`Error screenshot saved to ${screenshotPath}`);
          } catch (screenshotError) {
            console.error('Failed to take error screenshot:', screenshotError);
          }
        }
        
        // Close browser gracefully
        if (browser) {
          await browser.close().catch(e => {
            console.error('Error closing browser after inner error:', e);
          });
          browser = null; // Set to null so we don't try to close it again in finally block
        }
        
        // Re-throw the error
        throw innerError;
      }
    } catch (error) {
      this.logger.error('Error getting videos list:', error);
      
      // No need to take screenshot here as it's handled in the inner try/catch
      
      throw new Error(`Failed to get videos list: ${error.message}`);
    } finally {
      // Final cleanup - only if browser wasn't already closed
      if (browser) {
        try {
          await browser.close();
          console.log('Browser closed in finally block');
        } catch (closeError) {
          console.error('Error closing browser in finally block:', closeError);
          this.logger.error('Error closing browser in finally block:', closeError);
        }
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
      const { browser: initializedBrowser, page: initializedPage, browserProfile } = await this.initializeBrowser(account, undefined, 'processJob');
      browser = initializedBrowser;
      page = initializedPage;

      // Wrap all browser operations in a try/catch to ensure proper cleanup
      try {
        // Navigate to create page
        console.log('[ProcessJob] Navigating to create page...');
        let retryCount = 0;
        const maxRetries = 3;
        let navigationSuccessful = false;

        while (retryCount < maxRetries && !navigationSuccessful) {
          try {
            console.log(`[ProcessJob] Navigation attempt ${retryCount + 1}/${maxRetries}`);
            await page.goto('https://hailuoai.video/create', {
              waitUntil: ['domcontentloaded', 'networkidle0'],
              timeout: 45000,
            });
            navigationSuccessful = true;
            console.log(`[ProcessJob] Navigation succeeded on attempt ${retryCount + 1}`);
          } catch (error) {
            retryCount++;
            console.log(`[ProcessJob] Navigation attempt ${retryCount} failed:`, error.message);
            
            if (retryCount === maxRetries) {
              console.log('[ProcessJob] Maximum navigation retries reached');
              throw new Error(`Failed to load page after ${maxRetries} attempts: ${error.message}`);
            }
            
            // Reduce wait time between retries from 5000 * retryCount to 3000 * retryCount
            const waitTime = 3000 * retryCount;
            console.log(`[ProcessJob] Waiting ${waitTime}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }

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
        const tempFilePath = await downloadImage(imageUrl); 
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
        console.log('[ProcessJob] Waiting 8s for upload to process...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        console.log('[ProcessJob] Upload processing completed');

        // Check if upload was successful by looking for the uploaded image element
        console.log('[ProcessJob] Validating upload success...');
        try {
          await page.waitForSelector('img[alt="uploaded image"]', { timeout: 4000 });
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
        await new Promise(resolve => setTimeout(resolve, 5000));
        
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
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('[ProcessJob] Generation started');

        // Close browser properly before returning
        if (browser) {
          await browser.close().catch(e => {
            console.error('[ProcessJob] Error closing browser after successful job:', e);
          });
          browser = null; // Set to null so we don't try to close it again in finally block
        }

        return {
          success: true,
          message: 'Image uploaded and video creation initiated',
          actualGenerateTimes
        };
      } catch (innerError) {
        // Handle errors during browser operations
        console.error('[ProcessJob] Inner operation error:', innerError.message);
        
        // Take a screenshot if possible
        if (page && !page.isClosed()) {
          try {
            const screenshotPath = `processjob-error-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath });
            console.log(`[ProcessJob] Error screenshot saved to ${screenshotPath}`);
          } catch (screenshotError) {
            console.error('[ProcessJob] Failed to take error screenshot:', screenshotError);
          }
        }
        
        // Close browser gracefully
        if (browser) {
          await browser.close().catch(e => {
            console.error('[ProcessJob] Error closing browser after inner error:', e);
          });
          browser = null; // Set to null so we don't try to close it again in finally block
        }
        
        // Re-throw the error
        throw innerError;
      }
    } catch (error) {
      console.error('[ProcessJob] Error:', error.message);
      
      // No need to take screenshot here as it's handled in the inner try/catch if possible
      
      throw new Error(`Failed to upload image and create video: ${error.message}`);
    } finally {
      // Final cleanup - only if browser wasn't already closed
      if (browser) {
        try {
          await browser.close();
          console.log('[ProcessJob] Browser closed in finally block');
        } catch (e) {
          console.error('[ProcessJob] Error closing browser in finally block:', e);
          this.logger.error('[ProcessJob] Error closing browser in finally block:', e);
        }
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
      const userDataDir = path.join(process.cwd(), `browser-data-${account.id}`);
      
      // Launch browser with userDataDir to maintain profile
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
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-sync',
          '--disable-translate',
          '--metrics-recording-only',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--ignore-certificate-errors-spki-list',
          '--dns-prefetch-disable',
          '--no-proxy-server',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
        defaultViewport: null,
        devtools: true,
        userDataDir,
      });
      
      // Open a new page
      page = await browser.newPage();
      
      // Set default timeouts
      page.setDefaultNavigationTimeout(45000);
      page.setDefaultTimeout(45000);
      
      // Navigate to create page to ensure profile is loaded
      await page.goto('https://hailuoai.video/create', {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 45000,
      });

      // Wait for page to settle
      await new Promise(resolve => setTimeout(resolve, 2000));

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
          databases: [],
          data: {}
        },
        serviceWorkers: [],
        cacheStorage: {},
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
        message: 'Successfully retrieved browser profile'
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
          // Add network reliability arguments
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-sync',
          '--disable-translate',
          '--metrics-recording-only',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--ignore-certificate-errors-spki-list',
          // Increase timeouts for better reliability
          '--dns-prefetch-disable',
          '--no-proxy-server',
          // Optimize for stability rather than performance
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
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
      page.setDefaultNavigationTimeout(45000);
      page.setDefaultTimeout(45000);
      
      // Navigate to create page first to set up the page context
      await page.goto('https://hailuoai.video/create', {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 45000,
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
      await new Promise(resolve => setTimeout(resolve, 6000));
      
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

  // remove old profile
  async removeOldProfile(accountId: number) {
    // get all folder start with browser-data-${accountId}-
    const userDataDir = path.join(process.cwd(), `browser-data-${accountId}-`);
    const folders = fs.readdirSync(userDataDir);
    
    // find found created 1 day ago
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const foldersToRemove = folders.filter(folder => {
      const folderDate = new Date(folder.split('-')[2]);
      return folderDate < oneDayAgo;
    });
    console.log('Folders to remove: ', foldersToRemove);

    // remove all folders
    foldersToRemove.forEach(folder => {
      const folderPath = path.join(userDataDir, folder);
      fs.rmdirSync(folderPath, { recursive: true });
    });
  }

  async clearBrowserData(accountId: number) {
    try {
      const userDataDir = path.join(process.cwd(), `browser-data-${accountId}`);
      this.logger.log(`Attempting to clear browser data for account ${accountId} at ${userDataDir}`);
      
      if (!fs.existsSync(userDataDir)) {
        this.logger.log(`No browser data directory found at ${userDataDir}`);
        return {
          success: true,
          message: 'No browser data directory found to clear'
        };
      }
      
      // Note: We no longer kill Chrome processes as that is managed by JobQueueProcessor
      // JobQueueProcessor's accountRunningStatus prevents multiple jobs from accessing the same account
      
      // Remove the entire profile directory
      const { execSync } = require('child_process');
      execSync(`rm -rf "${userDataDir}"`);
      this.logger.log(`Removed browser data directory at ${userDataDir}`);
      
      return {
        success: true,
        message: `Successfully cleared browser data for account ${accountId}`
      };
    } catch (error) {
      this.logger.error(`Failed to clear browser data: ${error.message}`);
      return {
        success: false,
        message: `Failed to clear browser data: ${error.message}`
      };
    }
  }
}
