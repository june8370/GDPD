
(() => {
  "use strict";

  // GDPD NEWS API
  const NEWS_API =
    "https://gdpd-news-api.advaitchithira.workers.dev/news";

  const CACHE_KEY = "gdpd-news-cache-v4";
  const CACHE_TTL = 10 * 60 * 1000;
  const MAX_DISPLAY = 60;

  const $ = id => document.getElementById(id);

  const el = {
    feed: $("newsFeed"),
    status: $("statusText"),
    updated: $("lastUpdated"),
    count: $("resultCount"),
    search: $("searchInput"),
    category: $("categoryFilter"),
    source: $("sourceFilter"),
    refresh: $("refreshButton"),
    clear: $("clearFilters"),
    chips: [...document.querySelectorAll(".chip")],
    menu: $("primaryNav"),
    menuToggle: $("menuToggle")
  };

  const CATEGORY_NAMES = {
    defence: "Defence",
    security: "Security",
    world: "World affairs",
    technology: "Technology",
    policy: "Policy & diplomacy"
  };

  let stories = [];
  let loading = false;

  function cleanText(value) {
    const doc = new DOMParser().parseFromString(
      String(value || ""),
      "text/html"
    );
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function classify(story) {
    const text =
      `${story.title} ${story.description} ${story.source}`.toLowerCase();

    if (/\b(ai|artificial intelligence|satellite|cyber|drone|robotics|technology|space force|electronic warfare)\b/.test(text)) {
      return "technology";
    }

    if (/\b(diplomacy|summit|treaty|sanction|foreign minister|negotiat|nato|united nations|peace talks|policy|parliament)\b/.test(text)) {
      return "policy";
    }

    if (/\b(terror|cyberattack|intelligence|espionage|border security|hostage|surveillance|security threat)\b/.test(text)) {
      return "security";
    }

    if (/\b(defen[cs]e|military|army|navy|air force|armed forces|weapon|warship|troop|fighter jet|pentagon|combat|missile|warfare|soldier|battlefield)\b/.test(text)) {
      return "defence";
    }

    return "world";
  }

  function normalizeStory(item) {
    const title = cleanText(item.title);
    const link = safeUrl(item.link || item.url || item.guid);

    if (!title || !link) return null;

    const rawDate = item.pubDate || item.published || item.updated || "";

    return {
      title,
      link,
      description: cleanText(item.description || item.content || item.summary || "").slice(0, 700),
      pubDate: rawDate && !Number.isNaN(Date.parse(rawDate))
        ? new Date(rawDate).toISOString()
        : "",
      source: cleanText(item.source || "News source"),
      category: ""
    };
  }

  function uniqueStories(items) {
    const seen = new Set();

    return items
      .map(normalizeStory)
      .filter(Boolean)
      .filter(story => {
        const key = story.link.replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        story.category = classify(story);
        return true;
      })
      .sort((a, b) =>
        (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0)
      );
  }

  function readCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      return cache && Array.isArray(cache.items) ? cache : null;
    } catch {
      return null;
    }
  }

  function saveCache(items) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        savedAt: Date.now(),
        items
      }));
    } catch (error) {
      console.warn("GDPD: cache unavailable", error);
    }
  }

  function setStatus(message, timestamp = null) {
    if (el.status) el.status.textContent = message;

    if (el.updated) {
      el.updated.textContent = timestamp
        ? "Updated " + new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "";
    }
  }

  function updateSourceOptions() {
    if (!el.source) return;

    const previous = el.source.value;
    const sources = [...new Set(stories.map(s => s.source))].sort();

    el.source.replaceChildren(new Option("All sources", "all"));

    sources.forEach(source => {
      el.source.add(new Option(source, source));
    });

    if (sources.includes(previous)) el.source.value = previous;
  }

  function renderStories() {
    if (!el.feed) return;

    const query = el.search?.value.trim().toLowerCase() || "";
    const category = el.category?.value || "all";
    const source = el.source?.value || "all";

    const filtered = stories.filter(story => {
      const text =
        `${story.title} ${story.description} ${story.source}`.toLowerCase();

      return (!query || text.includes(query)) &&
        (category === "all" || story.category === category) &&
        (source === "all" || story.source === source);
    });

    el.feed.replaceChildren();

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";

      const heading = document.createElement("strong");
      heading.textContent = stories.length
        ? "No matching reports"
        : "News feed unavailable";

      const detail = document.createElement("p");
      detail.textContent = stories.length
        ? "Try another search or clear the filters."
        : "Check the news API URL and try refreshing.";

      empty.append(heading, detail);
      el.feed.append(empty);

      if (el.count) {
        el.count.textContent = stories.length
          ? "0 reports match your filters"
          : "No reports available";
      }
      return;
    }

    filtered.slice(0, MAX_DISPLAY).forEach((story, index) => {
      const card = document.createElement("article");
      card.className = "news-card";
      card.style.animationDelay = `${Math.min(index * 25, 250)}ms`;

      const meta = document.createElement("div");
      meta.className = "card-meta";

      const tag = document.createElement("span");
      tag.className = "category-tag";
      tag.textContent = CATEGORY_NAMES[story.category] || "World affairs";

      const date = document.createElement("time");
      date.className = "card-date";

      if (story.pubDate) {
        date.dateTime = story.pubDate;
        date.textContent = new Date(story.pubDate).toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      } else {
        date.textContent = "Date unavailable";
      }

      meta.append(tag, date);

      const title = document.createElement("h3");
      title.textContent = story.title;

      const description = document.createElement("p");
      description.textContent = story.description
        ? story.description.slice(0, 180) +
          (story.description.length > 180 ? "…" : "")
        : "Open the original publisher's report for details.";

      const bottom = document.createElement("div");
      bottom.className = "card-bottom";

      const sourceLabel = document.createElement("span");
      sourceLabel.className = "card-source";
      sourceLabel.textContent = story.source;

      const link = document.createElement("a");
      link.className = "card-link";
      link.href = story.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Read report ↗";

      bottom.append(sourceLabel, link);
      card.append(meta, title, description, bottom);
      el.feed.append(card);
    });

    if (el.count) {
      el.count.textContent =
        `Showing ${Math.min(filtered.length, MAX_DISPLAY)} of ${filtered.length} matching reports`;
    }
  }

  function syncChips() {
    el.chips.forEach(chip => {
      const active = chip.dataset.category === (el.category?.value || "all");
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
  }

  async function loadNews({ force = false } = {}) {
    if (loading) return;
    loading = true;

    if (el.refresh) {
      el.refresh.disabled = true;
      el.refresh.textContent = "Updating…";
    }

    const cache = readCache();

    if (!force && cache?.items?.length &&
        Date.now() - cache.savedAt < CACHE_TTL) {
      stories = uniqueStories(cache.items);
      updateSourceOptions();
      setStatus(`Showing saved reports · ${stories.length} stories`, cache.savedAt);
      renderStories();
      finishLoading();
      return;
    }

    if (cache?.items?.length && !stories.length) {
      stories = uniqueStories(cache.items);
      updateSourceOptions();
      renderStories();
    }

    setStatus("Connecting to GDPD news API…");

    try {
      if (NEWS_API.includes("YOUR-WORKER-NAME")) {
        throw new Error("Set NEWS_API to your actual deployed Cloudflare Worker URL.");
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);

      let response;
      try {
        response = await fetch(NEWS_API, {
          cache: "no-store",
          signal: controller.signal
        });
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        throw new Error(`News API returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.items)) {
        throw new Error("API response has no items array");
      }

      stories = uniqueStories(data.items);
      saveCache(stories);
      updateSourceOptions();

      setStatus(
        `Loaded ${stories.length} stories from ${data.successfulSources ?? "the available"} sources`,
        data.updatedAt || Date.now()
      );

      if (data.unavailableSources?.length) {
        console.warn("GDPD: unavailable feeds", data.unavailableSources);
      }
    } catch (error) {
      console.error("GDPD news API error:", error);

      if (cache?.items?.length) {
        stories = uniqueStories(cache.items);
        updateSourceOptions();
        setStatus("Live API unavailable · showing saved reports", cache.savedAt);
      } else {
        stories = [];
        setStatus("Unable to load news: " + error.message);
      }
    }

    renderStories();
    finishLoading();
  }

  function finishLoading() {
    loading = false;

    if (el.refresh) {
      el.refresh.disabled = false;
      el.refresh.innerHTML = '<span aria-hidden="true">↻</span> Refresh feed';
    }

    if (el.feed) el.feed.setAttribute("aria-busy", "false");
  }

  // Search and filters
  el.search?.addEventListener("input", renderStories);

  el.category?.addEventListener("change", () => {
    syncChips();
    renderStories();
  });

  el.source?.addEventListener("change", renderStories);

  el.refresh?.addEventListener("click", () => {
    loadNews({ force: true });
  });

  el.clear?.addEventListener("click", () => {
    if (el.search) el.search.value = "";
    if (el.category) el.category.value = "all";
    if (el.source) el.source.value = "all";
    syncChips();
    renderStories();
  });

  el.chips.forEach(chip => {
    chip.addEventListener("click", () => {
      if (!el.category) return;
      el.category.value = chip.dataset.category;
      syncChips();
      renderStories();
    });
  });

  // Mobile navigation
  if (el.menuToggle && el.menu) {
    el.menuToggle.addEventListener("click", () => {
      const open = el.menu.classList.toggle("open");
      el.menuToggle.setAttribute("aria-expanded", String(open));
    });
  }

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach(item => {
        item.classList.toggle("active", item === link);
      });

      el.menu?.classList.remove("open");
      el.menuToggle?.setAttribute("aria-expanded", "false");
    });
  });

  // Smooth in-page navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const selector = link.getAttribute("href");
      if (!selector || selector === "#") return;

      const target = document.querySelector(selector);
      if (!target) return;

      event.preventDefault();

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });

      history.replaceState(null, "", selector);
    });
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", event => {
    const activeTag = document.activeElement?.tagName || "";

    if (event.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(activeTag) &&
        !event.ctrlKey && !event.metaKey && !event.altKey &&
        el.search) {
      event.preventDefault();
      el.search.focus();
      $("news")?.scrollIntoView({ behavior: "smooth" });
    }

    if (event.key === "Escape" && el.menu?.classList.contains("open")) {
      el.menu.classList.remove("open");
      el.menuToggle?.setAttribute("aria-expanded", "false");
    }
  });

  const year = $("year");
  if (year) year.textContent = new Date().getFullYear();

  syncChips();
  loadNews();
})();
