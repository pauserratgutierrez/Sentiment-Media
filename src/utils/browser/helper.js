import puppeteer from 'puppeteer';

let browser;

export const initializeBrowser = async () => {
  if (!browser) {
    try {
      console.log('Launching a new browser instance...');
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          `--window-size=1920,1080`
        ],
        timeout: 10000
      });
      console.log('Browser instance launched!');
    } catch (err) {
      console.error(`Error launching the browser instance: ${err}`);
      throw err;
    }
  }

  return browser;
};

export const getPage = async () => {
  try {
    const browserInstance = await initializeBrowser();
    const page = await browserInstance.newPage();
    await page.setDefaultTimeout(10000);
    return page;
  } catch (err) {
    console.error(`Error creating a new page: ${err}`);
    throw err;
  }
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

// Handle app termination
const handleAppTermination = async () => {
  await closeBrowser();
  process.exit(0);
};

process.on('SIGINT', handleAppTermination);
process.on('SIGTERM', handleAppTermination);