import express from 'express';
import { CONFIG } from './config.js';
import { x } from './utils/socials/twitter/twitter.js';
import { initializeBrowser, closeBrowser } from './utils/browser/helper.js';

// Server setup
const app = express();
const port = process.env.PORT || CONFIG.SERVER.PORT;

app.use(express.json());
app.use(express.static('src/public'));

const xInstance = new x();

// // Route: Home
// app.get('/', (req, res) => {
//   res.sendFile('index.html', { root: '' });
// });

// Route: Get Twitter post contents
app.get('/api/getPostContents', async (req, res) => {
  const { postUrl } = req.query;
  if (!postUrl) return res.status(400).send({ error: 'Missing required fields!', fields: ['postUrl'] });

  const postContent = await xInstance.getPostSingleContent(postUrl);
  if (!postContent) return res.status(400).send({ error: 'The post content could not be found' });

  console.log(`Returning post content for X -> ${postUrl}...`);
  return res.send({ twitter: { postUrl }, data: { postContent } });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  global.BROWSER = await initializeBrowser();
});

// Handle app termination
process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});
