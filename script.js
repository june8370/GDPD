// ==================================================
// J.U.N.E.
// Official Website Script
// ==================================================

// ---------------- Navigation Handling ----------------
const views = {
  home: document.getElementById("home"),
  news: document.getElementById("news")
};

const links = {
  home: document.getElementById("link-home"),
  news: document.getElementById("link-news")
};

function showView(view) {
  for (const key in views) {
    if (views[key]) views[key].style.display = key === view ? "" : "none";
    if (links[key]) links[key].setAttribute("aria-current", key === view ? "true" : "false");
  }
}

function handleHash() {
  const hash = location.hash.replace("#", "") || "home";
  showView(hash in views ? hash : "home");
}

window.addEventListener("hashchange", handleHash);
handleHash();

// ---------------- Live Military News Feed ----------------
const NEWS_API_KEY = "9706b53ba74c4755bbdc9e5d1da8828c"; // ⚠️ Replace with your NewsAPI key
const NEWS_QUERY = "military OR defence OR war OR armed forces OR army OR navy OR air force";
const NEWS_LANGUAGE = "en";
const NEWS_PAGE_SIZE = 10; // number of news articles to load

// Fetch and display the latest military news
async function fetchLiveMilitaryNews() {
  const container = document.getElementById("news-list");
  container.innerHTML = `<p class="loading">Loading latest intelligence reports...</p>`;
  
  try {
    const url = `https://newsapi.org/v2/everything?` +
      `q=${encodeURIComponent(NEWS_QUERY)}` +
      `&language=${NEWS_LANGUAGE}` +
      `&sortBy=publishedAt` +
      `&pageSize=${NEWS_PAGE_SIZE}` +
      `&apiKey=${NEWS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "ok" && data.articles && data.articles.length > 0) {
      renderNews(data.articles.map(a => ({
        title: a.title,
        summary: a.description || "No summary available.",
        source: a.source.name || "Unknown Source",
        date: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "",
        url: a.url
      })));
    } else {
      container.innerHTML = `<p class="error">No military reports found at this moment.</p>`;
      console.warn("News API response:", data);
    }
  } catch (err) {
    console.error("Error fetching news:", err);
    container.innerHTML = `<p class="error">Unable to retrieve latest reports. Please check your connection or API key.</p>`;
  }
}

// Render the fetched news articles
function renderNews(newsList) {
  const container = document.getElementById("news-list");
  container.innerHTML = "";
  
  newsList.forEach(item => {
    const card = document.createElement("article");
    card.className = "news-item";
    card.innerHTML = `
      <div class="meta">Military · ${escapeHtml(item.date)}</div>
      <h3><a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h3>
      <p>${escapeHtml(item.summary)}</p>
      <div class="meta">Source: ${escapeHtml(item.source)}</div>
    `;
    container.appendChild(card);
  });
}

// Escape potentially unsafe HTML
function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

// ---------------- Auto Refresh Mechanism ----------------
// Fetch once immediately, then refresh every 10 minutes
fetchLiveMilitaryNews();
setInterval(fetchLiveMilitaryNews, 10 * 60 * 1000);

// ---------------- Console Banner ----------------
console.log("%cJ.U.N.E. Intelligence Division Online", "color: #004080; font-weight: bold;");
console.log("%cMonitoring global military developments...", "color: gray;");
