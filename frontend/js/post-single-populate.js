export function updatePage(data) {
  const postContent = document.getElementById('post-content');
  const postUrl = document.getElementById('post-url');
  const username = document.getElementById('username');
  const checkCount = document.getElementById('check_count');
  const cacheFlag = document.getElementById('cache_flag');
  const generalEmotion = document.getElementById('general_emotion');
  const generalSummary = document.getElementById('general_summary');

  if (!data || !data.post || !data.post.content || !data.post.sentimentAnalysis) return;

  postContent.textContent = data.post.content.text;
  postUrl.href = data.post.url;
  postUrl.target = '_blank';
  username.textContent = `@${data.post.username}`;
  checkCount.textContent = `🔎 ${data.post.metadata.check_count}`;
  cacheFlag.textContent = data.post.metadata.cache_flag ? '⚡️ Cached' : '⚡️ Live';

  const sentimentAnalysis = data.post.sentimentAnalysis;
  generalEmotion.textContent = getEmotionEmoji(sentimentAnalysis.general_emotion);
  generalSummary.textContent = sentimentAnalysis.general_summary;

  // Update emotion tags
  Object.entries(sentimentAnalysis.emotion_tags).forEach(([emotion, score]) => {
    const element = document.getElementById(emotion)?.querySelector('.result');
    // score is from 0 to 10. Display it as a percentage
    const percentage = Math.round((score / 10) * 100);
    if (element) element.textContent = `${percentage}%`;
  });
};

// Helper function to get emoji based on emotion score
function getEmotionEmoji(emotion) {
  const emojis = { '1': '👍', '2': '👎', '0': '😐' };
  return emojis[String(emotion)] || '😐';
};
