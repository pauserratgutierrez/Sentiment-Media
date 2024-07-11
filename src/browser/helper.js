import puppeteer from 'puppeteer';

let browser;

export const initializeBrowser = async () => {
  if (!browser) {
    console.log('Launching a new browser instance...');
    browser = await puppeteer.launch({ headless: true });
    console.log('Browser instance launched!');
  }

  return browser;
};

export const closeBrowser = async () => {
  if (browser) {
    console.log('Closing the browser instance...');
    await browser.close();
    browser = null;
  }
};
