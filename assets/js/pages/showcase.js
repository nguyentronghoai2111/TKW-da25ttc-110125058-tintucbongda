// showcase.js - render video + lịch thi đấu sắp tới cho trang
// "Trình diễn ấn tượng". Data lấy từ videos.json và matches-upcoming.json.

function renderVideos(videos) {
  const grid = document.getElementById("showcase-grid");
  grid.innerHTML = videos
    .map(
      (v) => `
    <article class="showcase-card" data-category="${v.category}">
      <a href="${v.url}" target="_blank" rel="noopener">
        <div class="video-thumbnail">
          <div class="play-btn"></div>
        </div>
      </a>
      <div class="card-info">
        <span class="card-tag">${escapeHtml(v.tag)}</span>
        <h3 class="card-title">${escapeHtml(v.title)}</h3>
        <div class="card-meta"><span>${escapeHtml(v.views)}</span><span>${escapeHtml(v.time)}</span></div>
      </div>
    </article>`
    )
    .join("");
}

function renderUpcomingFixtures(fixtures) {
  const wrap = document.getElementById("upcoming-fixtures");
  if (!fixtures || !fixtures.length) {
    wrap.innerHTML = `<p style="color:#888;">Chưa có lịch thi đấu sắp tới.</p>`;
    return;
  }
  wrap.innerHTML = fixtures
    .map(
      (f) => `
    <div class="upcoming-row">
      <span class="competition">${escapeHtml(f.competition)}</span>
      <div class="teams">
        <span class="team-home">${escapeHtml(f.home)}</span>
        <span class="kickoff">${escapeHtml(f.kickoff)}</span>
        <span class="team-away">${escapeHtml(f.away)}</span>
      </div>
    </div>`
    )
    .join("");
}

function setupFilters() {
  const buttons = document.querySelectorAll(".filter-buttons-vertical button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.dataset.filter;
      document.querySelectorAll(".showcase-card").forEach((card) => {
        const match = category === "all" || card.dataset.category === category;
        card.style.display = match ? "block" : "none";
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const [videos, upcoming] = await Promise.all([
    loadData("../data/videos.json"),
    loadData("../data/matches-upcoming.json"),
  ]);

  renderUpcomingFixtures(shuffleArray(upcoming || []));

  if (videos) renderVideos(videos);
  setupFilters();
});
