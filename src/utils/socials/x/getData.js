export class x {
  constructor() {
    const { TWEET_POST, TWEET_TEXT, TWEET_PHOTO, TWEET_VIDEO } = CONFIG.HTML_ELEMENTS.X;
    this.selectors = { TWEET_POST, TWEET_TEXT, TWEET_PHOTO, TWEET_VIDEO };
  }

  async getPostSingleContent(username, id) {
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
    console.log(`Extracting post content...`);

    const { TWEET_POST, TWEET_TEXT, TWEET_PHOTO, TWEET_VIDEO } = this.selectors;

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
      const videos = null;

      return { tweetPostContent: { text, photos, videos } };
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
