export function initializePostList() {
  document.addEventListener('DOMContentLoaded', () => {
    fetchPosts();
  });
};

function fetchPosts(page = 1, limit = 25) {
  fetch(`http://localhost:3000/api/twitter/posts?page=${page}&limit=${limit}`)
    .then(response => response.json())
    .then(data => {
      const { pagination, data: { postList } } = data;
      console.log(pagination, postList);
      populatePosts(postList);
      console.log('Posts fetched successfully!');
    })
    .catch(error => console.error(error));
};
