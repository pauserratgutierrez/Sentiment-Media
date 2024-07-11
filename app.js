export { CONFIG } from './config.js';
import { getPostContentsX } from './src/socials/fetchPosts.js';
import { initializeBrowser, closeBrowser } from './src/browser/helper.js';

const browser = await initializeBrowser();
global.BROWSER = browser;

const username = 'elonmusk';
const postContents = await getPostContentsX(username, 2);
console.log(postContents);

await closeBrowser();
