import { Cluster } from 'puppeteer-cluster';

let cluster;
let initializing = false;

export const initializeCluster = async () => {
  if (!cluster && !initializing) {
    initializing = true;
    console.log('Initializing Puppeteer cluster...');
    cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 2, // Lower concurrency for stability
      puppeteerOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          // '--single-process',
          '--no-zygote',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-default-apps',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-hang-monitor',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-sync',
          '--disable-translate',
          '--metrics-recording-only',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          '--enable-automation',
          '--password-store=basic',
          '--use-mock-keychain',
          '--no-sandbox',
          '--disable-software-rasterizer',
          '--window-size=1920,1080'
        ],
        timeout: 10000
      }
    });

    cluster.task(async ({ page, data: { url, selector } }) => {
      try {
        await page.goto(url, { timeout: 6000, waitUntil: 'networkidle2' });
        await page.waitForSelector(selector, { timeout: 3000 });
        return await page.content();
      } catch (error) {
        console.error(`Error in cluster task for URL ${url}:`, error);
        throw error;
      } finally {
        if (page) {
          try {
            await page.close();
          } catch (closeError) {
            console.error('Error closing page:', closeError);
          }
        }
      }
    });

    console.log('Puppeteer cluster initialized!');
    initializing = false;
  } else if (initializing) {
    console.log('Cluster is already being initialized, waiting...');
    while (initializing) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for initialization to complete
    }
  }

  return cluster;
};

export const fetchPageContent = async (url, selector) => {
  if (!cluster) {
    await initializeCluster();
  }
  try {
    return await cluster.execute({ url, selector }); // Returns the page content
  } catch (error) {
    console.error(`Error fetching page content for URL ${url}:`, error);
    throw error;
  }
};

export const closeCluster = async () => {
  if (cluster) {
    console.log('Closing Puppeteer cluster...');
    await cluster.idle();
    await cluster.close();
    cluster = null;
    console.log('Puppeteer cluster closed!');
  }
};

// Handle app termination
const handleAppTermination = async () => {
  await closeCluster();
  process.exit(0);
};

process.on('SIGINT', handleAppTermination);
process.on('SIGTERM', handleAppTermination);
