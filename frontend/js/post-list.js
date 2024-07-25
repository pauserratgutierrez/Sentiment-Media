import { loadComponent } from './components.js';
import { updatePage } from './post-twitter.js';

let currentPage = 1;
let limit = 4; // Default limit

export function initializePostList(page) {
  const limitInput = document.getElementById('limit');
  limit = limitInput ? parseInt(limitInput.value) : limit; // Get the limit from the input field

  fetch(`/api/twitter/posts?page=${page}&limit=${limit}`)
    .then(response => response.json())
    .then(data => {
      const postList = document.getElementById('post-list');
      postList.innerHTML = ''; // Clear existing posts

      let postsShown = 0;

      if (data.data && data.data.postList.length > 0) {
        const totalPosts = data.pagination.total_count;

        // Update the max attribute of the limit input field
        limitInput.max = totalPosts;

        // Adjust the value attribute of the limit input field if necessary
        if (limit > totalPosts) {
          limit = totalPosts;
          limitInput.value = limit; // Update the input value to reflect the new limit
        }

        postsShown = data.data.postList.length; // Actual number of posts shown

        data.data.postList.forEach(postData => {
          const postDiv = document.createElement('div');
          postDiv.classList.add('post-analized-container');
          postList.appendChild(postDiv);
          
          // Load the post-analized.html template into each post container
          loadComponent(postDiv, '../html/templates/post-analized.html', () => {
            updatePage(postDiv, postData); // Pass the container element
          });
        });

        // Update pagination information
        const totalPages = Math.ceil(totalPosts / limit);
        document.getElementById('limit-posts').textContent = postsShown; // Actual number of posts being shown
        document.getElementById('total-posts').textContent = totalPosts;
        document.getElementById('current-page').textContent = page;
        document.getElementById('total-pages').textContent = totalPages;

        // Disable prev button if on first page
        document.getElementById('prev').disabled = (page === 1);
        // Disable next button if on last page
        document.getElementById('next').disabled = (page === totalPages);
      } else {
        postList.textContent = 'No posts available.';
      }
    })
    .catch(error => {
      console.error('Error fetching posts:', error);
      const postList = document.getElementById('post-list');
      postList.textContent = 'Error fetching posts.';
    });
}

export function initializePagination() {
  const prevButton = document.getElementById('prev');
  const nextButton = document.getElementById('next');
  const limitInput = document.getElementById('limit');

  // Add event listeners
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      initializePostList(currentPage);
    }
  });

  nextButton.addEventListener('click', () => {
    currentPage += 1;
    initializePostList(currentPage);
  });

  if (limitInput) {
    limitInput.addEventListener('change', () => {
      currentPage = 1; // Reset to first page
      initializePostList(currentPage);
    });
  }
}
