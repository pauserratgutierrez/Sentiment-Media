import { CONFIG } from './config.js';
import { x } from './utils/socials/x/getData.js';
import { initializeBrowser, closeBrowser } from './utils/browser/helper.js';

// Keep the browser instance open for the entire execution
async function main() {
  console.log('Initializing Sentiment Media...');
  let browser;
  
  try {
    browser = await initializeBrowser();
    global.BROWSER = browser;
    
    const xInstance = new x();

    const username = 'elonmusk';
    const id = '1811850123917529365';
    const postContent = await xInstance.getPostSingleContent(username, id);
    console.log(postContent);

    const username2 = 'johnkrausphotos';
    const id2 = '1811972528136503551';
    const postContent2 = await xInstance.getPostSingleContent(username2, id2);
    console.log(postContent2);

    const username3 = 'MrBeast';
    const id3 = '1812155099373867268';
    const postContent3 = await xInstance.getPostSingleContent(username3, id3);
    console.log(postContent3);

    const username4 = 'InformaCosmos';
    const id4 = '1811914408236580987';
    const postContent4 = await xInstance.getPostSingleContent(username4, id4);
    console.log(postContent4);
    
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
