import puppeteer from 'puppeteer';

let browserPool = [];

export const initializeBrowserPool = async () => {
  for (let i = 0; i < CONFIG.BROWSER.POOL_SIZE; i++) {
    const browser = await puppeteer.launch({
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
    browserPool.push(browser);
  }
  console.log(`Initialized browser pool with ${CONFIG.BROWSER.POOL_SIZE} instances`);
};

export const getPageFromPool = async () => {
  const browser = browserPool[Math.floor(Math.random() * CONFIG.BROWSER.POOL_SIZE)];
  const page = await browser.newPage();
  await page.setDefaultTimeout(10000);
  return page;
};

export const closeBrowserPool = async () => {
  for (const browser of browserPool) {
    await browser.close();
  }
  browserPool = [];
};

// Handle app termination
const handleAppTermination = async () => {
  await closeBrowserPool();
  process.exit(0);
};

process.on('SIGINT', handleAppTermination);
process.on('SIGTERM', handleAppTermination);