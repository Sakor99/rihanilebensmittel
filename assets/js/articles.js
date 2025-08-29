// assets/js/articles.js

let allArticles = []; // store loaded articles

// Function to render products (with optional category filter)
function renderArticles(filterCategory = "all") {
  const container = document.getElementById('articles-container');
  container.innerHTML = ""; // clear current items

  const filtered = filterCategory === "all"
    ? allArticles
    : allArticles.filter(article => article.category === filterCategory);

  filtered.forEach(article => {
    const articleEl = document.createElement('article');
    articleEl.classList.add('col-6', 'col-12-xsmall', 'work-item');

    // If image missing, use fallback
    const imgSrc = article.image && article.image.trim() !== ""
      ? article.image
      : "images/thumbs/no-image.jpg";

    articleEl.innerHTML = `
      <a href="${imgSrc}" class="image fit thumb">
        <img src="${imgSrc}" alt="${article.title}" />
      </a>
      <h3>${article.title}</h3>
      <p>${article.description}</p>
      <p><strong>${article.price}</strong></p>
    `;

    container.appendChild(articleEl);
  });
}

// Load JSON and show all products initially
fetch('articles.json')
  .then(response => response.json())
  .then(articles => {
    allArticles = articles;
    renderArticles(); // show all
  })
  .catch(error => console.error('Error loading articles:', error));

// Handle filter buttons
document.addEventListener("click", e => {
  if (e.target && e.target.dataset.filter) {
    renderArticles(e.target.dataset.filter);
  }
});
