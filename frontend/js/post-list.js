import { loadComponent } from './components.js';
import { updatePage } from './post-twitter.js';

let currentPage = 1;
const limit = 4; // Hardcoded limit

export function initializePostList(page) {
  fetch(`/api/twitter/posts?page=${page}&limit=${limit}`)
    .then(response => response.json())
    .then(data => {
      const postList = document.getElementById('post-list');
      postList.innerHTML = ''; // Clear existing posts

      if (data.data && data.data.postList.length > 0) {
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
        const totalPosts = data.pagination.total_count;
        const totalPages = Math.ceil(totalPosts / limit);
        document.getElementById('limit-posts').textContent = limit;
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
}
