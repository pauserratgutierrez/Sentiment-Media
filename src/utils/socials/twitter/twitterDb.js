import { getConnection, query } from '../../db/dbConn.js';

// Retrieve post content from the database
export const getPostInfoFromDb = async (platformId, username, id) => {
  const connection = await getConnection();

  try {
    const resp = await query(
      `SELECT sp.*, spi.image_url
      FROM social_posts sp
      LEFT JOIN social_posts_images spi ON sp.id = spi.post_id
      WHERE sp.platform_id = ? AND sp.username = ? AND sp.post_id = ?`,
      [platformId, username, id]
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
};

export const isDataDifferent = (oldData, newData) => {
  return oldData.text !== newData.text || JSON.stringify(oldData.photos) !== JSON.stringify(newData.photos);
};

export const updateDbWithNewData = async (postId, newData) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    await query(
      `UPDATE social_posts SET content = ? WHERE id = ?`,
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
};

export const updateCacheFlag = async (postId, flag) => {
  try {
    await query(
      `UPDATE social_posts SET cache_flag = ?, last_checked_at = NOW() WHERE id = ?`,
      [flag, postId]
    );
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
};