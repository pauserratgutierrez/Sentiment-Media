export const CONFIG = {
  SERVER: {
    PORT: 3000
  },
  BROWSER: {
    POOL_SIZE: 10
  },
  HTML_ELEMENTS: {
    X: {
      TWEET_POST: 'article[data-testid="tweet"]', // Contains all the tweet elements
      TWEET_TEXT: 'div[data-testid="tweetText"]', // Contains plain text and emojis (in the alt of img tags)
      TWEET_PHOTO: 'div[data-testid="tweetPhoto"]', // Contains the photo (in the src of img tags)
      TWEET_VIDEO: 'div[data-testid="videoComponent"]', // Contains the video (in the src of video tags)
    }
  }
};

global.CONFIG = CONFIG;
