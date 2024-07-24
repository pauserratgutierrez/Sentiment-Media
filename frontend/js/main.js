import { loadComponent } from './components.js';
import { initializeForm } from './form.js';
// import { initializePostList } from './post-list-populate.js';

document.addEventListener('DOMContentLoaded', () => {
  loadComponent('header', '../html/templates/header.html');
  loadComponent('footer', '../html/templates/footer.html');
  
  loadComponent('post-single', '../html/components/post-twitter.html', initializeForm);
  // loadComponent('post-list', '../html/components/post-single.html', initializePostList);
});
