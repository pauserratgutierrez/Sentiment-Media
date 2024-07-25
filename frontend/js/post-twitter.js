export function updatePage(element, data) {
  const postContent = element.querySelector('.post-content');
  const postUrl = element.querySelector('.post-url');
  const username = element.querySelector('.username');
  const checkCount = element.querySelector('.check_count');
  const cacheFlag = element.querySelector('.cache_flag');
  const generalEmotion = element.querySelector('.general_emotion');
  const generalSummary = element.querySelector('.general_summary');

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
    const elementTag = element.querySelector(`.${emotion} .result`);
    // score is from 0 to 10. Display it as a percentage
    const percentage = Math.round((score / 10) * 100);
    if (elementTag) elementTag.textContent = `${percentage}%`;
  });
}

// Helper function to get emoji based on emotion score
function getEmotionEmoji(emotion) {
  const emojis = { '1': '👍', '2': '👎', '0': '😐' };
  return emojis[String(emotion)] || '😐';
}
