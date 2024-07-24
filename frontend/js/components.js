export function loadComponent(elementId, templateUrl, callback) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  fetch(templateUrl)
    .then(response => response.text())
    .then(data => {
      element.innerHTML = data;
      if (callback) callback();
    })
    .catch(error => {
      console.error(`Error loading component from ${templateUrl}:`, error);
    });
};
