import { updatePage } from './post-twitter.js';
import { initializePostList } from './post-list.js';

export function initializeForm() {
  const form = document.getElementById('sentiment-form');
  const postContentContainer = document.getElementById('post-analized'); // Updated to use the container element

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = form.querySelector('input[name="url"]').value;
    const endpoint = `/api/twitter/post?url=${encodeURIComponent(url)}`;

    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      updatePage(postContentContainer, data); // Pass the container element

      // Reinitialize the post list to update recent analysis
      initializePostList(1); // Reset to first page to show the latest data
    } catch (error) {
      console.error('Fetch error:', error);
      postContentContainer.querySelector('.post-content').textContent = 'Error retrieving post content. Please try again.';
    }
  });
}
