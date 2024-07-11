import { CONFIG } from './config.js';
import { x } from './src/socials/x/getPost.js';
import { initializeBrowser, closeBrowser } from './src/browser/helper.js';

const browser = await initializeBrowser();
global.BROWSER = browser;

const xInstance = new x();

const username = 'midudev';
const id = '1810661432213610556';
const postContent = await xInstance.getPostSingleContent(username, id);
console.log(postContent);

// const username = 'elonmusk';
// const postContents = await xInstance.getPostContents(username, 0, 20);
// console.log(postContents);

await closeBrowser();
