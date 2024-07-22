------------
-- MySQL DB Migration File
-- Creates the entire DB schema for the app
------------

-- Cache Workflow:
-- 1. When fetching a social media post, check the 'cache_flag' field:
--   1.1. If 'cache_flag' is true  -> Use cached data from DB
--   1.2. If 'cache_flag' is false -> Data is stale, fetch again and compare new fetched data with existing data in DB
--     1.2.1. If same      -> Use cached data from DB (Twitter post and sentiment analysis from AI which is saved in DB)
--     1.2.2. If different -> Save new twitter post fetched data to DB, re-run sentiment analysis AI, save AI data to tables ('cache_flag' should be set to true in the application logic)

CREATE DATABASE IF NOT EXISTS sentiment_media;
USE sentiment_media;

-- Disable foreign key checks (Permit creation of tables with foreign keys before the referenced table is created)
SET FOREIGN_KEY_CHECKS = 0;

-- Table for storing social media platforms
CREATE TABLE IF NOT EXISTS social_platforms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);
INSERT INTO social_platforms (name) VALUES ('twitter');

-- Table for storing social media posts
CREATE TABLE IF NOT EXISTS social_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  platform_id INT NOT NULL,
  username VARCHAR(255) NOT NULL,
  post_id VARCHAR(255) NOT NULL,
  post_url VARCHAR(255) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  content TEXT,
  check_count INT DEFAULT 1, -- number of times the post has been checked (1 by default because it's being checked now). Should be handled in the application logic
  cache_flag BOOLEAN DEFAULT TRUE, -- True means the data is fresh. If false, the data needs to be verified again
  last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- When the data was last verified (for cache)
  FOREIGN KEY (platform_id) REFERENCES social_platforms(id) ON DELETE CASCADE,
  UNIQUE (platform_id, username, post_id)
);

-- Enable events
SET GLOBAL event_scheduler = ON;

-- Cache System: Automatically update the cache_flag to false if the post hasn't been checked in the last 24 hours and the cache_flag was true (data is stale)
CREATE EVENT IF NOT EXISTS update_cache_flag
ON SCHEDULE EVERY 1 HOUR
DO
  UPDATE social_posts
  SET cache_flag = FALSE
  WHERE last_checked_at < DATE_SUB(NOW(), INTERVAL 1 DAY)
  AND cache_flag = TRUE;

-- Table for storing images associated with social media posts
CREATE TABLE IF NOT EXISTS social_posts_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
);

-- Table for storing AI sentiment analysis results
CREATE TABLE IF NOT EXISTS ai_sentiment_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  general_summary TEXT NOT NULL,
  general_emotion INT DEFAULT 0, -- 0 -> Neutral, 1 -> Positive, 2 -> Negative
  joy FLOAT DEFAULT 0,
  love FLOAT DEFAULT 0,
  hope FLOAT DEFAULT 0,
  pride FLOAT DEFAULT 0,
  nostalgia FLOAT DEFAULT 0,
  fear FLOAT DEFAULT 0,
  sadness FLOAT DEFAULT 0,
  disgust FLOAT DEFAULT 0,
  anger FLOAT DEFAULT 0,
  shame FLOAT DEFAULT 0,
  guilt FLOAT DEFAULT 0,
  surprise FLOAT DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
);

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;