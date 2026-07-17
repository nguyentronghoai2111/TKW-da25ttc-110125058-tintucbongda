// matches.js - render trang "Các trận đấu vừa qua"
// Gộp trận đấu + cầu thủ tiêu biểu của tất cả giải, có ô lọc theo tên
// giải/đội/cầu thủ và phân trang cho danh sách trận đấu.

let ALL_MATCHES_RAW = [];
let matchesFilterQuery = "";
let matchesMPager = null;
let TEAM_LOGO_MAP_M = {};

function renderMatchCards(matches) {
  const wrap = document.getElementById("match-list");
  if (!matches || !matches.length) {
    wrap.innerHTML = `<p style="color:#888;">Không tìm thấy trận đấu phù hợp.</p>`;
    return;
  }
  wrap.innerHTML = matches
    .map(
      (m) => `
    <div class="match-card">
      <div class="competition-title">${escapeHtml(m.competition)}</div>
      <div class="match-details">
        <div class="team-side home">
          <span class="team-name">${escapeHtml(m.home.name)}</span>
          ${teamLogoHtml(TEAM_LOGO_MAP_M, m.home.name, m.home.badge)}
        </div>
        <div class="score-side">
          <div class="score">${escapeHtml(m.score)}</div>
          <div class="status">${escapeHtml(m.status)}</div>
        </div>
        <div class="team-side away">
          ${teamLogoHtml(TEAM_LOGO_MAP_M, m.away.name, m.away.badge)}
          <span class="team-name">${escapeHtml(m.away.name)}</span>
        </div>
      </div>
    </div>`
    )
    .join("");
}

function renderMatchesMPage() {
  renderMatchCards(matchesMPager.currentItems);
  renderPagination(document.getElementById("match-pagination"), matchesMPager, renderMatchesMPage);
}

function renderFeaturedPlayers(players) {
  const wrap = document.getElementById("player-list");
  if (!players || !players.length) {
    wrap.innerHTML = `<p style="color:#888;">Không tìm thấy cầu thủ phù hợp.</p>`;
    return;
  }
  wrap.innerHTML = players
    .map(
      (p) => `
    <div class="player-row">
      <div class="player-number">${p.number ?? "-"}</div>
      <div>
        <div class="player-name">${escapeHtml(p.name)}</div>
        <div class="player-nation">${escapeHtml(p.team ? `${p.team} - ${p.nation}` : p.nation)}</div>
      </div>
    </div>`
    )
    .join("");
}

function applyMatchesFilter() {
  const q = normalizeSearchText(matchesFilterQuery);
  const filtered = !q
    ? ALL_MATCHES_RAW
    : ALL_MATCHES_RAW.filter((m) =>
        normalizeSearchText(`${m.competition} ${m.home.name} ${m.away.name}`).includes(q)
      );
  matchesMPager.setItems(filtered);
  renderMatchesMPage();
}

function setupFilter(players) {
  const input = document.getElementById("filter-input");
  if (!input) return;
  input.addEventListener("input", () => {
    matchesFilterQuery = input.value;
    applyMatchesFilter();

    const q = normalizeSearchText(input.value);
    const filteredPlayers = !q
      ? players
      : players.filter((p) => normalizeSearchText(`${p.name} ${p.team || ""} ${p.nation || ""}`).includes(q));
    renderFeaturedPlayers(filteredPlayers);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const [matchesRecent, players, standingsData] = await Promise.all([
    loadData("../data/matches-recent.json"),
    loadData("../data/players-featured.json"),
    loadData("../data/standings.json"),
  ]);

  TEAM_LOGO_MAP_M = buildTeamLogoMap(standingsData || {});

  // mới nhất lên đầu (dựa vào ngày ghi trong "status")
  ALL_MATCHES_RAW = sortMatchesNewestFirst(
    (matchesRecent || []).map((m) => ({
      leagueId: m.leagueId,
      competition: m.competition,
      home: { name: m.home.name, badge: m.home.badge },
      away: { name: m.away.name, badge: m.away.badge },
      score: m.score,
      status: m.status,
    }))
  );

  matchesMPager = createPager(ALL_MATCHES_RAW, 12);
  renderMatchesMPage();

  if (players) renderFeaturedPlayers(players);

  setupFilter(players || []);
});
