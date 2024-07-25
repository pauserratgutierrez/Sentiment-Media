import { loadComponentById } from './components.js';
import { initializeForm } from './analysis-form.js';
import { initializePostList, initializePagination } from './post-list.js';

document.addEventListener('DOMContentLoaded', () => {
  loadComponentById('header', '../html/templates/header.html');
  loadComponentById('footer', '../html/templates/footer.html');
  
  loadComponentById('post-analized', '../html/templates/post-analized.html', initializeForm);

  // Initialize the post list and pagination
  initializePostList(1); // Start with the first page
  initializePagination();
});
