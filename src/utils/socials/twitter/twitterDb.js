import { getConnection, query } from '../../db/dbConn.js';

// Retrieve 1 specific post from the database
export const getPostInfoFromDb = async (platformId, username, id) => {
  const connection = await getConnection();
  try {
    const resp = await query(
      `SELECT sp.*, spi.image_url, asa.*
      FROM social_posts sp
      LEFT JOIN social_posts_images spi ON sp.id = spi.post_id
      LEFT JOIN ai_sentiment_analysis asa ON sp.id = asa.post_id
      WHERE sp.platform_id = ? AND sp.username = ? AND sp.post_id = ?`,
      [platformId, username, id]
    );

    // Update check_count
    if (resp.length > 0) await query(`UPDATE social_posts SET check_count = check_count + 1 WHERE id = ?`, [resp[0].id]);

    return resp;
  } catch (err) {
    console.error(`Error getting post info from DB: ${err}`);
    return [];
  } finally {
    connection.release();
  }
};

// Retrieve multiple posts from the database
export const getPostsFromDb = async (platformId, limit, offset) => {
  if (limit > 25) limit = 25;
  
  const connection = await getConnection();
  try {
    // Select from social_posts where platform_id = platformId, cache_flag = 1, order by last_checked_at desc, limit = limit, offset = offset
    const posts = await query(
      `SELECT sp.*, spi.image_url, asa.*
      FROM social_posts sp
      LEFT JOIN social_posts_images spi ON sp.id = spi.post_id
      LEFT JOIN ai_sentiment_analysis asa ON sp.id = asa.post_id
      WHERE sp.platform_id = ? AND sp.cache_flag = 1
      ORDER BY sp.last_checked_at DESC
      LIMIT ? OFFSET ?`,
      [platformId, limit, offset.toString()], // Offset must be a string to work properly in mysql2/promises!
      connection
    );
    return posts;
  } catch (err) {
    console.error(`Error getting posts from DB: ${err}`);
    return [];
  } finally {
    connection.release();
  }
};

export const isDataDifferent = (oldData, newData) => {
  return oldData.text !== newData.text || JSON.stringify(oldData.photos) !== JSON.stringify(newData.photos);
};

export const updateDbWithNewData = async (postId, newData) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    await query('UPDATE social_posts SET content = ? WHERE id = ?', [newData.text, postId], connection);

    await query('DELETE FROM social_posts_images WHERE post_id = ?', [postId], connection);

    for (const photo of newData.photos) {
      await query('INSERT INTO social_posts_images (post_id, image_url) VALUES (?, ?)', [postId, photo], connection);
    };

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error(`Error updating DB with new data: ${err}`);
  } finally {
    connection.release();
  }
};

export const updateCacheFlag = async (postId, flag) => {
  try {
    await query('UPDATE social_posts SET cache_flag = ?, last_checked_at = NOW() WHERE id = ?', [flag, postId]);
  } catch (err) {
    console.error(`Error updating cache flag: ${err}`);
  }
};

export const saveNewPostToDb = async (platformId, username, id, content) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const result = await query(
      `INSERT INTO social_posts (platform_id, username, post_id, post_url, content) VALUES (?, ?, ?, ?, ?)`,
      [platformId, username, id, `https://x.com/${username}/status/${id}`, content.text],
      connection
    );
    const postId = result.insertId;

    for (const photo of content.photos) {
      await query('INSERT INTO social_posts_images (post_id, image_url) VALUES (?, ?)', [postId, photo], connection);
    }
    
    await connection.commit();
    return postId;
  } catch (err) {
    await connection.rollback();
    console.error(`Error saving new post to DB: ${err}`);
  } finally {
    connection.release();
  }
};

export const saveSentimentAnalysisToDb = async (postId, sentimentAnalysis) => {
  const { general_summary } = sentimentAnalysis;
  const { joy, love, hope, pride, nostalgia, fear, sadness, disgust, anger, shame, guilt, surprise } = sentimentAnalysis.emotion_tags;

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    // Delete any existing sentiment analysis for this post
    await query(`DELETE FROM ai_sentiment_analysis WHERE post_id = ?`, [postId], connection);

    // Insert new sentiment analysis
    await query(
      `INSERT INTO ai_sentiment_analysis (post_id, general_summary, joy, love, hope, pride, nostalgia, fear, sadness, disgust, anger, shame, guilt, surprise) VALUES (? ,? ,? ,? ,? ,? ,? ,? ,? ,? ,? ,? ,? ,?)`,
      [postId, general_summary, joy, love, hope, pride, nostalgia, fear, sadness, disgust, anger, shame, guilt, surprise],
      connection
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error(`Error saving sentiment analysis to DB: ${err}`);
  } finally {
    connection.release();
  }
};
