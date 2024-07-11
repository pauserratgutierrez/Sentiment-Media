import { CONFIG } from './config.js';
import { x } from './utils/socials/x/getData.js';
import { initializeBrowser, closeBrowser } from './utils/browser/helper.js';

async function main() {
  let browser;
  
  try {
    browser = await initializeBrowser();
    global.BROWSER = browser;
    
    const xInstance = new x();
    
    const username = 'elonmusk';
    const id = '1518677066325053441';
    const postContent = await xInstance.getPostSingleContent(username, id);
    console.log(postContent);
    
    // const username = 'elonmusk';
    // const postContents = await xInstance.getPostContents(username, 0, 20);
    // console.log(postContents);
  } catch (err) {
    console.error(`Error in main execution: ${err}`);
  } finally {
    await closeBrowser();
  }
}

await main();
