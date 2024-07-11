import { initializeBrowser } from '../browser/helper.js';

export const getPostContentsX = async (username, postNum = 5) => {
  const url = `https://x.com/${username}`;

  try {
    const browser = global.BROWSER || await initializeBrowser();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the tweet text to load
    await page.waitForSelector(CONFIG.HTML_ELEMENTS.X.POST_TEXT);

    // Get the tweet texts
    const postContents = await page.$$eval(CONFIG.HTML_ELEMENTS.X.POST_TEXT, (els, postNum) => {
      return els.slice(0, postNum).map(el => el.textContent);
    }, postNum);

    await page.close();
    return postContents;
  } catch (err) {
    console.error(`Error getting post contents for X -> ${username}: ${err}`);
    return null;
  }
};
