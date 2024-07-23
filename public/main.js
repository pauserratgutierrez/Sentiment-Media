// public/main.js
document.addEventListener('DOMContentLoaded', () => {
  loadComponent('header', '/templates/header.html');
  loadComponent('footer', '/templates/footer.html');
  loadComponent('analysis', '/templates/analysis.html', initializeForm);

  function initializeForm() {
    const form = document.getElementById('sentiment-form');
    if (!form) {
      console.error('Form not found!');
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const url = form.querySelector('input[name="url"]').value;
      const apiUrl = `/api/twitter/post?url=${encodeURIComponent(url)}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        updatePage(data);
      } catch (error) {
        console.error('Fetch error:', error);
        const postContent = document.getElementById('post-content');
        postContent.textContent = 'Error retrieving post content. Please try again.';
      }
    });

    const postContent = document.getElementById('post-content');
    const postUrl = document.getElementById('post-url');
    const username = document.getElementById('username');
    const checkCount = document.getElementById('check_count');
    const cacheFlag = document.getElementById('cache_flag');
    const generalEmotion = document.getElementById('general_emotion');
    const generalSummary = document.getElementById('general_summary');
    const emotionTags = {
      joy: document.getElementById('joy').querySelector('.result'),
      love: document.getElementById('love').querySelector('.result'),
      hope: document.getElementById('hope').querySelector('.result'),
      pride: document.getElementById('pride').querySelector('.result'),
      nostalgia: document.getElementById('nostalgia').querySelector('.result'),
      fear: document.getElementById('fear').querySelector('.result'),
      sadness: document.getElementById('sadness').querySelector('.result'),
      disgust: document.getElementById('disgust').querySelector('.result'),
      anger: document.getElementById('anger').querySelector('.result'),
      shame: document.getElementById('shame').querySelector('.result'),
      guilt: document.getElementById('guilt').querySelector('.result'),
      surprise: document.getElementById('surprise').querySelector('.result')
    };

    function updatePage(data) {
      if (!data || !data.post || !data.post.content || !data.post.sentimentAnalysis) {
        postContent.textContent = 'Invalid data received from the server.';
        return;
      }

      postContent.textContent = data.post.content.text;
      postUrl.href = data.post.url;
      postUrl.target = '_blank';
      username.textContent = `@${data.post.username}`;
      checkCount.textContent = `🔎 ${data.post.metadata.check_count}`;
      cacheFlag.textContent = data.post.metadata.cache_flag ? '⚡️ Cached' : '⚡️ Live';

      const sentimentAnalysis = data.post.sentimentAnalysis;
      generalEmotion.textContent = getEmotionEmoji(sentimentAnalysis.general_emotion);
      generalSummary.textContent = sentimentAnalysis.general_summary;

      for (const [emotion, element] of Object.entries(emotionTags)) {
        element.textContent = `${sentimentAnalysis.emotion_tags[emotion]}/10`;
      }
    }

    function getEmotionEmoji(emotion) {
      console.log(emotion);
      switch (String(emotion)) {
        case '1':
          console.log('positive');
          return '👍'; // positive
        case '2':
          console.log('negative');
          return '👎'; // negative
        case '0':
        default:
          console.log('neutral');
          return '😐'; // neutral
      }
    }
  }

  function loadComponent(elementId, url, callback) {
    fetch(url)
      .then(response => response.text())
      .then(html => {
        document.getElementById(elementId).innerHTML = html;
        if (callback) callback(); // Initialize form after loading the component
      })
      .catch(error => {
        console.error(`Error loading component from ${url}:`, error);
      });
  }
});
