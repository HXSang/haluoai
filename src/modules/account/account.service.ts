import { Injectable, Logger } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountRepository } from './account.repository';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Account } from '@prisma/client';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  private readonly cookiesPath = path.join(process.cwd(), 'cookies.json');

  constructor(private readonly accountRepository: AccountRepository) {}

  async loginHailuoaiByGoogle(createAccountDto: CreateAccountDto) {
    const account = await this.accountRepository.findFirst({
      where: {
        email: createAccountDto.email,
      },
    });
    if (!account) {
      throw new Error('Account not found');
    }
    
    const { success, cookies } = await this.handleGoogleLogin(account);
    if (success) {
      await this.accountRepository.update(account.id, {
        cookie: cookies,
      });
    }
  }

  async handleGoogleLogin(account: Account) {
    try {
      const browser = await puppeteer.launch({
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--window-size=1280,800',
          '--start-maximized',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--lang=en-US,en'
        ],
        defaultViewport: null,
        devtools: true
      });

      const page = await browser.newPage();
      
      // Set a more realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
      
      // Override the navigator.webdriver property and add security bypasses
      await page.evaluateOnNewDocument(() => {
        // Override navigator.webdriver
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });

        // Add chrome object to window
        const win = window as any;
        win.chrome = {
          runtime: {}
        };

        // Override permissions API
        const originalQuery = window.navigator.permissions.query;
        (window.navigator.permissions as any).query = (parameters: any) => 
          parameters.name === 'notifications' 
            ? Promise.resolve({ state: Notification.permission }) as any
            : originalQuery.call(window.navigator.permissions, parameters);
      });

      // Set cookies if they exist, otherwise set some default cookies
      if (account.cookie) {
        const cookies = JSON.parse(account.cookie);
        await page.setCookie(...cookies);
      } else {
        await page.setCookie(
          {
            name: 'default_session',
            value: 'session_value',
            domain: '.hailuoai.video',
            path: '/',
          },
          {
            name: 'user_preferences',
            value: 'default_prefs',
            domain: '.hailuoai.video',
            path: '/',
          }
        );
      }

      // Navigate to hailuoai website
      console.log('Navigating to hailuoai.video...');
      await page.goto('https://hailuoai.video/', { waitUntil: 'networkidle0' });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      // Wait for video-user-component to be loaded and click Sign In
      console.log('Looking for Sign In button...');
      await page.waitForSelector('#video-user-component');
      await page.evaluate(() => {
        const container = document.querySelector('#video-user-component');
        const signInDiv = Array.from(container.querySelectorAll('div')).find(
          el => el.textContent && el.textContent.trim() === 'Sign In'
        );
        if (signInDiv) {
          signInDiv.click();
        } else {
          throw new Error('Sign In button not found');
        }
      });
      console.log('Clicked Sign In button');

      // Wait for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Wait for popup before clicking Google button
      console.log('Setting up popup listener...');
      const popupPromise = new Promise(resolve => page.once('popup', resolve));
      
      // Click the Continue with Google button
      console.log('Looking for Google login button...');
      await page.evaluate(() => {
        const googleButton = Array.from(document.querySelectorAll('div.font-medium')).find(
          button => button.textContent && button.textContent.includes('Continue with Google')
        );
        if (googleButton) {
          (googleButton as HTMLElement).click();
        } else {
          throw new Error('Continue with Google button not found');
        }
      });
      console.log('Clicked Google login button');

      // Wait for and get the popup window
      console.log('Waiting for popup...');
      const popup = await popupPromise as puppeteer.Page;
      
      
      // Function to check if popup is loaded properly
      const verifyPopupLoaded = async () => {
        const url = await popup.url();
        console.log('Checking popup URL:', url);
        
        if (!url.includes('accounts.google.com')) {
          console.error('Popup URL is not Google login page:', url);
          return false;
        }

        // Check if the page has basic Google sign-in elements
        const pageContent = await popup.content();
        const hasGoogleElements = pageContent.includes('google') && 
                                (pageContent.includes('signin') || pageContent.includes('sign in'));
        
        console.log('Popup contains Google elements:', hasGoogleElements);
        return hasGoogleElements;
      };

      // Add delay before starting Google auth
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Wait for and fill email input
      try {
        console.log('Starting email input step...');

        // Try to find the email input
        console.log('Looking for email input...');
        const emailInput = await popup.waitForSelector('input[type="email"]', { 
          visible: true, 
          timeout: 10000 
        });
        
        if (!emailInput) {
          console.error('Email input not found after waiting');
          throw new Error('Email input not found');
        }
        console.log('Found email input');

        // Clear the input first
        await emailInput.click({ clickCount: 3 });
        await emailInput.press('Backspace');
        console.log('Cleared email input');
        
        // Type email
        await emailInput.type(account.email, { delay: 100 });
        console.log('Typed email:', account.email);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Press Enter instead of clicking Next
        await emailInput.press('Enter');
        console.log('Pressed Enter after email input');
        
        // Wait to ensure the enter was processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('Error during email step:', error);
        console.error('Current URL when error occurred:', await popup.url());
        await popup.screenshot({ path: 'email-step-error.png' });
        throw new Error(`Failed to enter email: ${error.message}`);
      }

      // Wait and handle password step
      let allCookies;
      try {
        console.log('Starting password input step...');
        
        // Wait for password field with increased timeout
        console.log('Looking for password input...');
        const passwordInput = await popup.waitForSelector('input[type="password"]', { 
          visible: true, 
          timeout: 15000 
        });

        if (!passwordInput) {
          console.error('Password input not found after waiting');
          throw new Error('Password input not found');
        }
        console.log('Found password input');

        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Clear any existing input
        await passwordInput.click({ clickCount: 3 });
        await passwordInput.press('Backspace');
        console.log('Cleared password input');
        
        // Type password
        await passwordInput.type(account.password, { delay: 100 });
        console.log('Typed password');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Press Enter instead of clicking Next
        await passwordInput.press('Enter');
        console.log('Pressed Enter after password input');
        
        // Wait a short moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Get cookies immediately after password submission
        console.log('Getting cookies right after password submission...');
        const immediatePopupCookies = await popup.cookies();
        const immediatePageCookies = await page.cookies();
        const immediateGoogleCookies = await popup.cookies('https://accounts.google.com');
        const immediateHailuoaiCookies = await page.cookies('https://hailuoai.video');
        
        // Combine all unique cookies
        allCookies = [...new Map([
          ...immediatePopupCookies,
          ...immediatePageCookies,
          ...immediateGoogleCookies,
          ...immediateHailuoaiCookies
        ].map(cookie => [cookie.name + cookie.domain, cookie])).values()];

        console.log('Total immediate cookies collected:', allCookies.length);
        console.log('Domains found:', [...new Set(allCookies.map(c => c.domain))]);

        // Save cookies to account immediately
        try {
          await this.accountRepository.update(account.id, {
            cookie: JSON.stringify(allCookies),
            lastLoginAt: new Date(),
          });
          console.log('Cookies saved successfully to account');
        } catch (error) {
          console.error('Failed to save cookies to account:', error);
          throw new Error('Failed to save authentication cookies');
        }

      } catch (error) {
        console.error('Error during password step:', error);
        console.error('Current URL when error occurred:', await popup.url());
        await popup.screenshot({ path: 'password-step-error.png' });
        throw new Error(`Failed to enter password: ${error.message}`);
      }

      // Handle consent if needed
      try {
        const consentButton = await popup.$('button[type="submit"]');
        if (consentButton) {
          await consentButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (e) {
        // Consent might not be needed, continue
        console.log('No consent button found, continuing...');
      }

      // Close browser
      await browser.close();

      return {
        success: true,
        cookies: JSON.stringify(allCookies),
        message: 'Login successful and cookies saved'
      };
    } catch (error) {
      console.error('Error during Google login:', error);
      throw error;
    }
  }

  async getAllAccounts() {
    return await this.accountRepository.findMany();
  }
}


