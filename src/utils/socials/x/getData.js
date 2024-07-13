import { getConnection, query } from '../../db/dbConn.js';

// The "update_cache_flag" event in the DB runs every hour. Updates the "cache_flag" to "false" for posts tat have not been checked in the last 24h and have a "cache_flag" of "true"

export class x {
  constructor() {
    const { TWEET_POST, TWEET_TEXT, TWEET_PHOTO } = CONFIG.HTML_ELEMENTS.X;
    this.selectors = { TWEET_POST, TWEET_TEXT, TWEET_PHOTO };
    this.platformId = 1; // 1 is the ID for 'twitter' in the DB
  }

  async getPostSingleContent(username, id) {
    console.log(`\nGetting post content for X -> ${username} - ${id}...`);

    try {
      const postInfoDb = await this.getPostInfoFromDb(username, id);
      if (postInfoDb.length > 0) { // If the post is already in the Database (Information could be stale or fresh)
        // Get relevant data from the DB
        const postText = postInfoDb[0];
        const postImages = postInfoDb.map(row => row.image_url).filter(url => url !== null);

        if (postText.cache_flag) { // db column cache_flag = true if post data is fresh (data is checked and verified, not stale)
          console.log(`Using cached data from DB for post...`);
          return { text: postText.content, photos: postImages || [] };
        } else { // If the post data is stale (data needs to be verified again)
          console.log(`Post data is stale, fetching new data from twitter...`);
          const newData = await this.fetchAndProcessPostSingleContent(username, id);
          if (this.isDataDifferent(postText, newData)) { // If the new data is different from the cached data in the DB
            console.log(`New feched data is different from cached data from DB, updating DB (and re-running sentiment analysis...)`);
            await this.updateDbWithNewData(postText.id, newData);
            // Run sentiment analysis AI and save to tables
            await this.updateCacheFlag(postText.id, true);
          } else { // If the new feched data is the same as the cached data in the DB
            console.log(`New fetched data is the same as cached data from DB, using cached data.`);
            await this.updateCacheFlag(postText.id, true);
          }
          return newData;
        }
      } else { // If the post is not in the Database
        console.log(`Post not in DB, fetching new data from twitter...`);
        const newData = await this.fetchAndProcessPostSingleContent(username, id);
        await this.saveNewPostToDb(username, id, newData);
        // Run sentiment analysis AI and save to tables
        return newData;
      }
    } catch (err) {
      console.error(`Error processing post: ${err}`);
    }
  }

  async fetchAndProcessPostSingleContent(username, id) {
    const url = `https://x.com/${username}/status/${id}`;
    const page = await BROWSER.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector(this.selectors.TWEET_POST);
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

  // Retrieve post content from the database
  async getPostInfoFromDb(username, id) {
    const connection = await getConnection();

    try {
      const resp = await query(
        `SELECT sp.*, spi.image_url
        FROM social_posts sp
        LEFT JOIN social_posts_images spi ON sp.id = spi.post_id
        WHERE sp.platform_id = ? AND sp.username = ? AND sp.post_id = ?`,
        [this.platformId, username, id]
      );

      // Update check_count
      if (resp.length > 0) {
        await query(
          `UPDATE social_posts
          SET check_count = check_count + 1
          WHERE id = ?`,
          [resp[0].id]
        );
      }

      // Info from social_posts -> resp[0]
      // Images from social_posts_images are joined, use -> resp.map(row => row.image_url)
      return resp;
    } catch (err) {
      console.error(`Error getting post info from DB: ${err}`);
    } finally {
      connection.release();
    }
  }

  async isDataDifferent(oldData, newData) {
    return oldData.text !== newData.text || JSON.stringify(oldData.photos) !== JSON.stringify(newData.photos)
  }

  async updateDbWithNewData(postId, newData) {
    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      await query(
        `UPDATE social_posts SET content = ?, cache_flag = true last_checked_at = NOW() WHERE id = ?`,
        [newData.text, postId],
        connection
      );

      await query(
        'DELETE FROM social_posts_images WHERE post_id = ?',
        [postId],
        connection
      );

      for (const photo of newData.photos) {
        await query(
          `INSERT INTO social_posts_images (post_id, image_url) VALUES (?, ?)`,
          [postId, photo],
          connection
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      console.error(`Error updating DB with new data: ${err}`);
    } finally {
      connection.release();
    }
  }

  async updateCacheFlag(postId, flag) {
    try {
      await query(
        `UPDATE social_posts SET cache_flag = ? last_checked_at = NOW() WHERE id = ?`,
        [flag, postId]
      );
    } catch (err) {
      console.error(`Error updating cache flag: ${err}`);
    }
  }

  async saveNewPostToDb(username, id, content) {
    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      const result = await query(
        `INSERT INTO social_posts (platform_id, username, post_id, post_url, content) VALUES (?, ?, ?, ?, ?)`,
        [this.platformId, username, id, `https://x.com/${username}/status/${id}`, content.text],
        connection
      );
      const postId = result.insertId;

      for (const photo of content.photos) {
        await query(
          `INSERT INTO social_posts_images (post_id, image_url) VALUES (?, ?)`,
          [postId, photo],
          connection
        );
      }
      
      await connection.commit();
      return postId;
    } catch (err) {
      await connection.rollback();
      console.error(`Error saving new post to DB: ${err}`);
    } finally {
      connection.release();
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
