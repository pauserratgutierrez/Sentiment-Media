export const CONFIG = {
  SERVER: {
    PRODUCTION: process.env.PRODUCTION === 'true', // Read the PRODUCTION environment variable
    PORT: process.env.PORT || 3000
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
