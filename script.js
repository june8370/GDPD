// -------- Simple navigation handling --------
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

function handleHash() {
  const hash = location.hash.replace("#", "") || "home";
  showView(hash in views ? hash : "home");
}
window.addEventListener("hashchange", handleHash);
handleHash();

// -------- Static sample news feed --------
const sampleNews = [
  {
    category: "Military",
    title: "Australia warns China's military build-up demands a response",
    summary:
      "Australia's defence minister says China's rapid expansion requires regional deterrence and strategic investment.",
    source: "Reuters",
    date: "2025-11-03"
  },
  {
    category: "Military",
    title: "U.S. announces nuclear submarine tech sharing with South Korea",
    summary:
      "The agreement will allow South Korea to develop nuclear-powered submarines, reshaping regional security dynamics.",
    source: "AP News",
    date: "2025-10-29"
  },
  {
    category: "Military",
    title: "Ukraine expands innovative drone coordination tactics",
    summary:
      "Ukrainian forces adopt real-time drone coordination systems, increasing field efficiency and adaptability.",
    source: "The Guardian",
    date: "2025-11-03"
  },
  {
    category: "Research",
    title: "Global climate policy research gains traction",
    summary:
      "Scientists highlight international efforts to mitigate climate impact through new research and policy collaboration.",
    source: "Nature",
    date: "2025-11-03"
  },
  {
    category: "Research",
    title: "Activity rhythms linked to Alzheimer’s protection",
    summary:
      "Studies suggest circadian regulation and physical activity may reduce cognitive decline risk.",
    source: "ScienceDaily",
    date: "2025-11-01"
  }
];

// Render articles into news page
function renderNews(list) {
  const container = document.getElementById("news-list");
  container.innerHTML = "";
  list.forEach(item => {
    const card = document.createElement("article");
    card.className = "news-item";
    card.innerHTML = `
      <div class="meta">${item.category} · ${item.date}</div>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <div class="meta">Source: ${item.source}</div>
      <a class="source-link" href="#" onclick="return false">Read original</a>
    `;
    container.appendChild(card);
  });
}

renderNews(sampleNews);
