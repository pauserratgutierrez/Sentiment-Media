import express from 'express';
import { CONFIG } from './config.js';
import { x } from './utils/socials/twitter/twitter.js';
import { initializeCluster, closeCluster } from './utils/browser/helper.js';

// Server setup
const app = express();
const port = CONFIG.SERVER.PORT;
const host = CONFIG.SERVER.HOST ? '0.0.0.0' : 'localhost';

app.use(express.json());

app.use(express.static('frontend'));

const xInstance = new x();

app.get('/', (req, res) => {
  res.sendFile('analyse.html', { root: 'frontend/html/pages/' });
});

// Route: Get Twitter post contents
app.get('/api/twitter/post', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send({ error: 'Missing required fields!', fields: ['url'] });
  const postContent = await xInstance.getPostSingle(url);
  if (!postContent) return res.status(400).send({ error: 'The post content could not be found' });
  // console.log(`Returning post content for X -> ${url}...`);
  return res.send(postContent);
});

// Route: Get Twitter cached post contents
app.get('/api/twitter/posts', async (req, res) => {
  const { page, limit } = req.query;
  if (!page || !limit) return res.status(400).send({ error: 'Missing required fields!', fields: ['page', 'limit'] });
  const postList = await xInstance.getPosts(page, limit);
  if (!postList) return res.status(400).send({ error: 'The post list could not be found' });
  // console.log(`Returning post list for X...`);
  const { posts, total_count } = postList;
  return res.send({ pagination: { page: page, limit: limit, total_count }, data: { postList: posts } });
});

// For any other route, send 404 template html file 404.html from frontend/html/pages and also set status code to 404
app.use((req, res) => {
  res.status(404).sendFile('404.html', { root: 'frontend/html/pages/' });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

app.listen(port, host, async () => {
  console.log(`Server is running on http://${host}:${port}`);
  await initializeCluster();
});

// Handle app termination
process.on('SIGINT', async () => {
  await closeCluster();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeCluster();
  process.exit(0);
});
