import { updatePage } from './post-single-populate.js';

export function initializeForm() {
  const form = document.getElementById('sentiment-form');
  const postContent = document.getElementById('post-content');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = form.querySelector('input[name="url"]').value;
    const endpoint = `/api/twitter/post?url=${encodeURIComponent(url)}`;

    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      updatePage(data);
    } catch (error) {
      console.error('Fetch error:', error);
      postContent.textContent = 'Error retrieving post content. Please try again.';
    }
  });
};
