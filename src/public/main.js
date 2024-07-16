document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const postUrl = form.querySelector('input').value;
    const response = await fetch(`api/getPostContents?postUrl=${postUrl}`);
    const data = await response.json();
    console.log(data);

    const responseDiv = document.querySelector('#response');
    responseDiv.innerHTML = ''; // Clear any previous content

    const tweetBox = document.createElement('div');
    tweetBox.className = 'tweet-box';

    const tweetContent = document.createElement('div');
    tweetContent.className = 'tweet-content';
    tweetContent.innerHTML = data.data.postContent.text || 'No content available';
    tweetBox.appendChild(tweetContent);

    if (data.data.postContent.photos && data.data.postContent.photos.length > 0) {
      const tweetPhotos = document.createElement('div');
      tweetPhotos.className = 'tweet-photos';
      data.data.postContent.photos.forEach(photoUrl => {
        const img = document.createElement('img');
        img.src = photoUrl;
        tweetPhotos.appendChild(img);
      });
      tweetBox.appendChild(tweetPhotos);
    }

    if (data.data.postContent.sentimentAnalysis) {
      const sentimentAnalysis = document.createElement('div');
      sentimentAnalysis.className = 'sentiment-analysis';

      const summary = document.createElement('div');
      summary.className = 'sentiment-summary';
      summary.textContent = `General Summary: ${data.data.postContent.sentimentAnalysis.general_summary}`;
      sentimentAnalysis.appendChild(summary);

      const emotions = ['joy', 'love', 'hope', 'pride', 'nostalgia', 'fear', 'sadness', 'disgust', 'anger', 'shame', 'guilt', 'surprise'];
      emotions.forEach(emotion => {
        const emotionDiv = document.createElement('div');
        emotionDiv.textContent = `${emotion.charAt(0).toUpperCase() + emotion.slice(1)}: ${data.data.postContent.sentimentAnalysis[emotion]}`;
        sentimentAnalysis.appendChild(emotionDiv);
      });

      tweetBox.appendChild(sentimentAnalysis);
    }

    responseDiv.appendChild(tweetBox);
  });
});
