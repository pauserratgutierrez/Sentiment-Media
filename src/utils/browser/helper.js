import puppeteer from 'puppeteer';

let browser;

export const initializeBrowser = async () => {
  if (!browser) {
    try {
      console.log('Launching a new browser instance...');
      browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: [`--window-size=1920,1080`]
      });
      console.log('Browser instance launched!');
    } catch (err) {
      console.error(`Error launching the browser instance: ${err}`);
    }
  }

  return browser;
};

export const closeBrowser = async () => {
  if (browser) {
    try {
      console.log('Closing the browser instance...');
      await browser.close();
      browser = null;
    } catch (err) {
      console.error(`Error closing the browser instance: ${err}`);
    }
  }
};
