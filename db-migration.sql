------------
-- MySQL DB Migration File
-- Creates the entire DB schema for the app
------------

-- Cache Workflow:
-- 1. When fetching a social media post, check the 'cache_flag' field:
--   - If 'cache_flag' is true  -> Use cached data from DB
--   - If 'cache_flag' is false -> Data is stale, fetch again
--     - Compare new data with existing data in DB
--       - If same      -> Use cached data from DB
--       - If different -> Save new data to DB, re-run sentiment analysis AI, save to tables ('cache_flag' should be set to true in the application logic)

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
  check_count INT DEFAULT 1, -- number of times the post has been checked (1 by default because it's being checked now)
  cache_flag BOOLEAN DEFAULT TRUE, -- True means the data is fresh. If false, the data needs to be verified again
  last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- When the data was last veridied (for cache)
  FOREIGN KEY (platform_id) REFERENCES social_platforms(id) ON DELETE CASCADE,
  UNIQUE (platform_id, username, post_id)
);

-- Cache System: Automatically update the cache_flag to false if the post hasn't been checked in the last 24 hours and the cache_flag was true (data is stale)
CREATE EVENT IF NOT EXISTS update_cache_flag
ON SCHEDULE EVERY 1 HOUR
DO
  UPDATE social_posts
  SET cache_flag = FALSE
  WHERE last_checked_at < DATE_SUB(NOW(), INTERVAL 1 DAY)
  AND cache_flag = TRUE
  LIMIT 2000;
-- Automatically update the check_count and last_checked_at columns when a row is selected
CREATE TRIGGER IF NOT EXISTS update_check_count_and_last_checked_at_on_select
AFTER SELECT ON social_posts
FOR EACH ROW
BEGIN
  UPDATE social_posts
  SET check_count = check_count + 1, last_checked_at = NOW()
  WHERE id = NEW.id;
END;

-- Table for storing images associated with social media posts
CREATE TABLE IF NOT EXISTS social_posts_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
);

-- CREATE TABLE IF NOT EXISTS social_posts_videos (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   post_id INT NOT NULL,
--   video_url VARCHAR(255) NOT NULL,
--   FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
-- );

CREATE TABLE IF NOT EXISTS ai_sentiment_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  -- Add more columns for more detailed sentiment analysis
  sentiment_summary TEXT NOT NULL,
  sentiment_score FLOAT NOT NULL,
  sentiment_label VARCHAR(255) NOT NULL,
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
);

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;