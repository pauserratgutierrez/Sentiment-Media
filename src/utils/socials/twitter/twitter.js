import { getPostInfoFromDb, saveNewPostToDb, updateDbWithNewData, updateCacheFlag, saveSentimentAnalysisToDb } from './twitterDb.js';
import { runAISentimentAnalysis } from '../../ai/vercelAI.js';

export class x {
  constructor() {
    const { TWEET_POST, TWEET_TEXT, TWEET_PHOTO } = CONFIG.HTML_ELEMENTS.X;
    this.selectors = { TWEET_POST, TWEET_TEXT, TWEET_PHOTO };
    this.platformId = 1; // 1 is the ID for 'twitter' in the DB
  }

  async getPostSingleContent(postUrl) {
    // https://x.com/ceciarmy/status/1812483540421910626
    const urlPattern = /^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\/([^\/]+)\/status\/(\d+)(\/)?$/;
    const match = postUrl.match(urlPattern);

    if (!match) {
      console.error(`Invalid URL: ${postUrl}`);
      return null;
    }

    const username = match[4];
    const id = match[5];
    
    console.log(`Getting post content for X -> ${postUrl}...\nExtracting username: ${username}, id: ${id}`);

    try {
      const postInfoDb = await getPostInfoFromDb(this.platformId, username, id);
      if (postInfoDb.length > 0) { // If the post is already in the Database (Information could be stale or fresh)
        // Get relevant data from the DB
        const postText = postInfoDb[0];
        const postImages = postInfoDb.map(row => row.image_url).filter(url => url !== null);
        const sentimentAnalysis = {
          general_summary: postInfoDb[0].general_summary,
          joy: postInfoDb[0].joy,
          love: postInfoDb[0].love,
          hope: postInfoDb[0].hope,
          pride: postInfoDb[0].pride,
          nostalgia: postInfoDb[0].nostalgia,
          fear: postInfoDb[0].fear,
          sadness: postInfoDb[0].sadness,
          disgust: postInfoDb[0].disgust,
          anger: postInfoDb[0].anger,
          shame: postInfoDb[0].shame,
          guilt: postInfoDb[0].guilt,
          surprise: postInfoDb[0].surprise
        };

        if (postText.cache_flag) { // db column cache_flag = true if post data is fresh (data is checked and verified, not stale)
          console.log(`Using cached data from DB for post...`);
          return { text: postText.content, photos: postImages, sentimentAnalysis };
        } else { // If the post data is stale (data needs to be verified again)
          console.log(`Post data is stale, fetching new data from twitter...`);
          const newData = await this.fetchAndProcessPostSingleContent(username, id);
          if (this.isDataDifferent(postText, newData)) { // If the new data is different from the cached data in the DB
            console.log(`New feched data is different from cached data from DB, updating DB (and re-running sentiment analysis...)`);
            await updateDbWithNewData(postText.id, newData);
            // Re-Run sentiment analysis AI and save to tables (Delete previous sentiment!)
          } else { // If the new feched data is the same as the cached data in the DB
            console.log(`New fetched data is the same as cached data from DB, using cached data.`);
            await updateCacheFlag(postText.id, true);
            return { text: postText.content, photos: postImages, sentimentAnalysis };
          }
        }
      } else { // If the post is not in the Database
        console.log(`Post not in DB, fetching new data from twitter...`);
        const newData = await this.fetchAndProcessPostSingleContent(username, id);

        if (!newData) {
          console.log(`Post data could not be fetched from twitter. Cannot save to DB.`);
          return null;
        }

        // Save new post data to social_posts table (get the post ID from the saved data)
        const postId = await saveNewPostToDb(this.platformId, username, id, newData);
        // Run sentiment analysis AI
        const sentimentAnalysis = await runAISentimentAnalysis(newData.text);
        if (sentimentAnalysis) {
          await saveSentimentAnalysisToDb(postId, sentimentAnalysis);
        } else {
          console.log(`Error running sentiment analysis for post.`);
        }

        return { text: newData.text, photos: newData.photos, sentimentAnalysis };
      }
    } catch (err) {
      console.error(`Error processing post: ${err}`);
    }
  }

  async fetchAndProcessPostSingleContent(username, id) {
    const url = `https://x.com/${username}/status/${id}`;
    const page = await BROWSER.newPage();

    try {
      await page.goto(url, { timeout: 10000, waitUntil: 'networkidle2' });

      try {
        await page.waitForSelector(this.selectors.TWEET_POST, { timeout: 4000 });
      } catch (err) { // Tweet post not found
        console.error(`Error waiting for tweet post: ${err}`);
        return null;
      }

      const postContent = await this.extractPostContent(page, url);
      return postContent;
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

  // Run sentiment analysis AI

  // Save sentiment analysis results to ai_sentiment_analysis table

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
