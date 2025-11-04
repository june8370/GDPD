// ==================================================
// J.U.N.E. — Joint Unified National Elite
// Global Intelligence Feed
// ==================================================

// ----- NAVIGATION -----
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
    views[key].style.display = key === view ? "" : "none";
    links[key].setAttribute("aria-current", key === view ? "true" : "false");
  }
}
window.addEventListener("hashchange", () => showView(location.hash.replace("#", "") || "home"));
showView(location.hash.replace("#", "") || "home");

// ----- GLOBAL DEFENCE NEWS -----
const API_KEY = "9706b53ba74c4755bbdc9e5d1da8828c"; // ← Replace with your actual NewsAPI key
const NEWS_LIST = document.getElementById("news-list");

async function fetchDefenceNews() {
  NEWS_LIST.innerHTML = `<p class="loading">Gathering global intelligence reports...</p>`;
  const NEWS_QUERY = "defence OR defense OR military OR research OR global OR security OR technology";

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      NEWS_QUERY
    )}&language=en&pageSize=12&sortBy=publishedAt&apiKey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "ok" && data.articles.length > 0) {
      renderNews(data.articles);
    } else {
      NEWS_LIST.innerHTML = `<p class="error">No global defence reports available right now.</p>`;
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    NEWS_LIST.innerHTML = `<p class="error">Unable to retrieve intelligence reports. Please check your API key or connection.</p>`;
  }
}

function renderNews(articles) {
  NEWS_LIST.innerHTML = "";
  for (const a of articles) {
    const card = document.createElement("article");
    card.className = "news-item";
    card.innerHTML = `
      <h3><a href="${a.url}" target="_blank" rel="noopener noreferrer">${a.title}</a></h3>
      <p>${a.description || "No summary available."}</p>
      <div class="meta">
        <span>${a.source.name || "Unknown Source"}</span> — 
        <span>${new Date(a.publishedAt).toLocaleString()}</span>
      </div>
    `;
    NEWS_LIST.appendChild(card);
  }
}

// ----- AUTO-UPDATE -----
fetchDefenceNews();
setInterval(fetchDefenceNews, 10 * 60 * 1000); // every 10 minutes
