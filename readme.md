This project is part of a Hackaton. See more details here: https://github.com/midudev/hackaton-vercel-2024/issues/51

# Sentiment Media
Sentiment Media is an AI-powered application designed to analyze sentiments from Twitter posts. It leverages a cost-effective and fast AI model to categorize and score emotions present in social media content. The project is structured with a clear separation between the frontend and backend, with communication facilitated through an internal API.

Test it now!
https://ai.pausg.dev/

![image](https://github.com/user-attachments/assets/84c0e1a2-cfdc-451b-a8c1-2bde1b6b267b)
![image](https://github.com/user-attachments/assets/874116f2-c6f1-4b42-b4c3-1d022a133414)

## Project Structure
- **Frontend**: Contains HTML, CSS, and JavaScript files for the user interface. It uses native technologies without any frontend frameworks.
  - Located in the `frontend` directory.
  - Uses HTML templates, styled with CSS, and interactive elements managed by JavaScript.
  - Serves static files and main pages from `frontend/html/pages`.
- **Backend**: Built with Node.js and Express.js, handling API requests and interacting with the database.
  - Located in the `backend` directory.
  - Handles server-side logic, database interactions, and API endpoints.
  - Main entry point is `app.js`.

## Technologies Used
- **Node.js**: Server-side JavaScript runtime.
- **Express.js**: Web framework for handling routing and middleware.
- **MySQL**: Database for storing Twitter posts and sentiment analysis results.
- **Puppeteer**: Headless browser for scraping Twitter content.
- **Cheerio**: Fast manipulation of HTML.
- **OpenAI GPT-4o-mini**: AI model used for sentiment analysis.
- **Vercel AI SDK**: Facilitates interaction with the OpenAI model.

## Features
### Sentiment Analysis
- Utilizes the `GPT-4o-mini` model from OpenAI for analyzing sentiments.
- Categorizes emotions into joy, love, hope, pride, nostalgia, fear, sadness, disgust, anger, shame, guilt, and surprise.
- Scores each emotion on a scale from 0 to 10.
- Provides a short general summary.
- Detects the general emotion of the text, categorizing it into neutral (0), positive (1), or negative (2).
- Returns the analysis in a valid JSON format.

### Puppeteer (Twitter Integration)
- Fetches and processes content from Twitter posts.
- Utilizes a headless Puppeteer instance (instead of the Twitter API).
- Spawns a pool of Chromium instances to allow multiple runs in parallel using `puppeteer-cluster`.

### Database
- MySQL database used for storing posts and sentiment analysis results.
- Connection managed using `mysql2` with connection pooling for efficiency.
- Correct implementation to prevent MySQL Injection.

## Caching System
- A custom-defined MySQL event runs every hour to determine if a record must be flagged as stale (no one checked a specific post in a day or more).
- Cached data is stored indefinitely, ensuring data availability without frequent re-fetches. A flag indicates if data is up-to-date or stale.
- Two-layer cache to optimize performance and reduce AI costs:
  - **Twitter Post Layer**: Caches fetched Twitter posts.
  - **AI Analysis Layer**: Caches the results of AI sentiment analysis.
- **How it works**:
  - When analyzing a Twitter post for the first time, the post content is retrieved from Twitter and saved to the database. Then, the AI runs the sentiment analysis.
  - When querying the same Twitter post, if the content in the database is flagged as up-to-date, the app uses it. Otherwise, it retrieves the post info from Twitter and compares the fresh data with the stale data saved in the database. If the data is equal, it uses the saved sentiment analysis. Otherwise, a new sentiment analysis is executed with the new Twitter post content.

### API Endpoints
- `/api/twitter/post`: Fetches a specific Twitter post's content and sentiment analysis. Example `/api/twitter/post?url=https://x.com/midudev/status/1787465376130859511`
![image](https://github.com/user-attachments/assets/51ee18f8-a554-4995-894f-4194d5ba9e3d)

- `/api/twitter/posts`: Retrieves cached posts with pagination support. Example `http://localhost:3000/api/twitter/posts?page=2&limit=1`
![image](https://github.com/user-attachments/assets/3244537c-2f95-4ae4-86c2-5dc0c01caae1)

## No Authentication Required
- The application does not require user authentication for accessing the API.
- Fair usage is expected!

## Installation
1. Clone the repository:

2. Install dependencies:
  ```
  npm install
  ```

3. Set up environment variables in a `.env` file:
  ```
  PRODUCTION=<boolean>
  PORT=<your-host-port>
  DB_HOST=<your-database-host>
  DB_USER=<your-database-user>
  DB_PASSWORD=<your-database-password>
  DB_DATABASE=<your-database-name>
  DB_PORT=<your-database-port>
  OPENAI_API_KEY=<your-openai-api-key>
  ```

4. Run database migrations:
  ```
  mysql -u <username> -p <database_name> < db-migration.sql
  ```

5. Start the application:
  ```
  npm start
  ```
