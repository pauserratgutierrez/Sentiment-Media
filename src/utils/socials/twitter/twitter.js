import { getPostInfoFromDb, isDataDifferent, saveNewPostToDb, updateDbWithNewData, updateCacheFlag, saveSentimentAnalysisToDb } from './twitterDb.js';
import { runAISentimentAnalysis } from '../../ai/vercelAI.js';
import { getPage } from '../../browser/helper.js';

export class x {
  constructor() {
    const { TWEET_POST, TWEET_TEXT, TWEET_PHOTO } = CONFIG.HTML_ELEMENTS.X;
    this.selectors = { TWEET_POST, TWEET_TEXT, TWEET_PHOTO };
    this.platformId = 1; // 1 is the ID for 'twitter' in the DB
  }

  // https://x.com/ceciarmy/status/1812483540421910626
  async getPostSingleContent(postUrl) {
    const { username, id } = this.extractUrlInfo(postUrl);
    if (!username || !id) return null;

    console.log(`Getting post content for X -> ${postUrl}...\nExtracting username: ${username}, id: ${id}`);

    try {
      const postInfoDb = await getPostInfoFromDb(this.platformId, username, id);
      if (postInfoDb.length > 0) { // If the post is already in the Database (Information could be stale or fresh)
        return await this.handleExistingPost(postInfoDb, username, id);
      } else { // If the post is not in the Database
        return await this.handleNewPost(username, id);
      }
    } catch (err) {
      console.error(`Error processing post: ${err}`);
    }
  }

  // Get the username and id from the Twitter post URL
  extractUrlInfo(postUrl) {
    const urlPattern = /^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\/([^\/]+)\/status\/(\d+)(\/)?$/;
    const match = postUrl.match(urlPattern);
    if (!match) {
      console.error(`Invalid URL: ${postUrl}`);
      return {};
    }

    return { username: match[4], id: match[5] };
  }

  async handleExistingPost(postInfoDb, username, id) {
    const postText = postInfoDb[0];
    const postImages = postInfoDb.map(row => row.image_url).filter(url => url !== null);
    const sentimentAnalysis = this.extractSentimentAnalysis(postInfoDb[0]);

    if (postText.cache_flag) {
      console.log(`Using cached data from DB for post...`);
      return { text: postText.content, photos: postImages, sentimentAnalysis };
    } else {
      console.log(`Post data is stale, fetching new data from twitter...`);
      const newData = await this.fetchAndProcessPostSingleContent(username, id);
      if (!newData) return null;
      return await this.updatePostIfNecessary(postText, newData, postImages, sentimentAnalysis);
    }
  }

  async handleNewPost(username, id) {
    console.log(`Post not in DB, fetching new data from Twitter...`);
    const newData = await this.fetchAndProcessPostSingleContent(username, id);
    if (!newData) return null;

    const postId = await saveNewPostToDb(this.platformId, username, id, newData);
    const sentimentAnalysis = await runAISentimentAnalysis(newData.text);
    if (sentimentAnalysis) {
      await saveSentimentAnalysisToDb(postId, sentimentAnalysis);
    } else {
      console.log(`Error running sentiment analysis for post.`);
    }

    return { text: newData.text, photos: newData.photos, sentimentAnalysis };
  }

  async updatePostIfNecessary(postText, newData, postImages, sentimentAnalysis) {
    if (isDataDifferent(postText.content, newData.text)) {
      console.log(`New fetched data is different from cached data, updating DB and re-running sentiment analysis...`);
      await updateDbWithNewData(postText.id, newData);
      sentimentAnalysis = await runAISentimentAnalysis(newData.text);
      if (sentimentAnalysis) {
        await saveSentimentAnalysisToDb(postText.id, sentimentAnalysis);
      } else {
        console.log(`Error running sentiment analysis for post.`);
      }
    } else {
      console.log(`New fetched data is the same as cached data, using cached data.`);
      await updateCacheFlag(postText.id, true);
    }

    return { text: newData.text, photos: postImages, sentimentAnalysis };
  }

  extractSentimentAnalysis(postInfo) {
    return {
      general_summary: postInfo.general_summary,
      joy: postInfo.joy,
      love: postInfo.love,
      hope: postInfo.hope,
      pride: postInfo.pride,
      nostalgia: postInfo.nostalgia,
      fear: postInfo.fear,
      sadness: postInfo.sadness,
      disgust: postInfo.disgust,
      anger: postInfo.anger,
      shame: postInfo.shame,
      guilt: postInfo.guilt,
      surprise: postInfo.surprise
    };
  }

  async fetchAndProcessPostSingleContent(username, id) {
    const url = `https://x.com/${username}/status/${id}`;
    const page = await getPage();
    try {
      await page.goto(url, { timeout: 10000, waitUntil: 'networkidle2' });
      await page.waitForSelector(this.selectors.TWEET_POST, { timeout: 4000 });
      return await this.extractPostContent(page, url);
    } catch (err) {
      console.error(`Error getting post content for X -> ${username} - ${id}: ${err}`);
      return null;
    } finally {
      if (page) await page.close();
    }
  }

  async extractPostContent(page, baseUrl) {
    console.log(`Extracting post content from ${baseUrl}...`);
    const { TWEET_POST, TWEET_TEXT, TWEET_PHOTO } = this.selectors;
    try {
      const text = await page.$eval(TWEET_POST, (el, tweetTextSelector, baseUrl) => {
        const tweetTextElement = el.querySelector(tweetTextSelector);
        if (!tweetTextElement) return null;
  
        // Extract text with links and replace img tags with their alt text (emojis)
        const extractTextWithLinks = node => {
          if (node.nodeType === Node.TEXT_NODE) return node.textContent;
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'A') {
              const absoluteUrl = new URL(node.getAttribute('href'), baseUrl).href;
              return `<a href="${absoluteUrl}">${node.textContent}</a>`;
            }
            if (node.tagName === 'IMG') {
              return node.alt; // Replace image with its alt text (emoji)
            }
            return Array.from(node.childNodes).map(extractTextWithLinks).join('');
          }
          return null;
        };
  
        return extractTextWithLinks(tweetTextElement);
      }, TWEET_TEXT, baseUrl);
  
      const photos = await page.$$eval(`${TWEET_POST} ${TWEET_PHOTO} img`, imgs => imgs.map(img => img.src));

      return { text, photos };
    } catch (err) {
      console.error(`Error extracting post content: ${err}`);
      return null;
    }
  }

  // async getPostContents(username, startIdx = 0, postsNum = 1) {
  //   const url = `https://x.com/${username}`;

  //   try {
  //     const page = await BROWSER.newPage();
  //     await page.goto(url, { waitUntil: 'networkidle2' });

  //     // // Wait for the tweet text to load
  //     await page.waitForSelector(CONFIG.HTML_ELEMENTS.X.TWEET_TEXT);

  //     // Scroll and wait for more posts to load until the desired number of posts is reached
  //     let postsLoaded = await page.$$eval(CONFIG.HTML_ELEMENTS.X.TWEET_TEXT, els => els.length);
  //     console.log(`Initial posts loaded: ${postsLoaded}`);
  //     let attempts = 0;

  //     while (postsLoaded < startIdx + postsNum && attempts < 10) {
  //       console.log(`Scrolling to load more posts... ${postsLoaded} / ${startIdx + postsNum}`);
  //       const newPostsLoaded = await scrollUntilNewPosts(page, postsLoaded);
  //       console.log(`Posts loaded after scroll: ${newPostsLoaded}`);
  
  //       if (newPostsLoaded === postsLoaded) {
  //         attempts++;
  //         console.log(`No new posts loaded, attempt ${attempts}.`);
  //         if (attempts >= 10) {
  //           console.log('Maximum attempts reached, breaking out of the loop.');
  //           break;
  //         }
  //       } else {
  //         attempts = 0; // Reset attempts if new posts are loaded
  //       }

  //       postsLoaded = newPostsLoaded;
  //     }

  //     // Get the tweet texts
  //     // Normal text can be extracted directly, but emojis are in the alt tag img tags.
  //     const postContents = await page.$$eval(
  //       CONFIG.HTML_ELEMENTS.X.TWEET_TEXT,
  //       (els, startIdx, postsNum) => {
  //         return els.slice(startIdx, startIdx + postsNum).map(el => {
  //           const htmlContent = el.innerHTML;
  //           const tempDiv = document.createElement('div');
  //           tempDiv.innerHTML = htmlContent;
  //           // Convert img tags to their alt text
  //           const images = tempDiv.querySelectorAll('img');
  //           images.forEach(img => {
  //             const altText = img.alt;
  //             const textNode = document.createTextNode(altText);
  //             img.parentNode.replaceChild(textNode, img);
  //           });
  //           return tempDiv.textContent;
  //         });
  //       },
  //       startIdx,
  //       postsNum
  //     );

  //     await page.close();
  //     return postContents;
  //   } catch (err) {
  //     console.error(`Error getting post contents for X -> ${username}: ${err}`);
  //     return null;
  //   }
  // }
};

// // Function to scroll until new elements are found
// export const scrollUntilNewPosts = async (page, initialCount) => {
//   return await page.evaluate(async (initialCount, CONFIG_HTML_ELEMENTS_X_TWEET_TEXT) => {
//     const distance = 800; // Increased scroll distance to handle longer tweets
//     const interval = 1000; // Time between scrolls in milliseconds

//     return new Promise((resolve) => {
//       let previousCount = initialCount;
//       const timer = setInterval(async () => {
//         window.scrollBy(0, distance);
//         await new Promise(r => setTimeout(r, 1000)); // Wait after scrolling for the new posts to load
//         const currentCount = document.querySelectorAll(CONFIG_HTML_ELEMENTS_X_TWEET_TEXT).length;
//         console.log(`Current count: ${currentCount}`);
//         if (currentCount > previousCount) {
//           previousCount = currentCount;
//           clearInterval(timer);
//           resolve(currentCount);
//         } else if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
//           console.log('Reached the bottom of the page.');
//           clearInterval(timer);
//           resolve(currentCount);
//         }
//       }, interval); // Scroll every interval milliseconds
//     });
//   }, initialCount, CONFIG.HTML_ELEMENTS.X.TWEET_TEXT);
// };
