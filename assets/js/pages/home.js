// home.js - render trang chủ (index.html)
// Giải "nổi bật" ở khối BXH/Vua phá lưới đổi ngẫu nhiên mỗi lần load trang
// (không cố định Ngoại Hạng Anh cho đỡ nhàm). Khối kết quả trận đấu gộp
// hết các giải lại, có phân trang. Có ô search luôn cho tiện tra cứu.

let ALL_LEAGUES = [];
let ALL_STANDINGS = {};
let ALL_TOPSCORERS = {};
let ALL_MATCHES = [];
let TEAM_LOGO_MAP = {};
let featuredLeagueId = null;
let matchesPager = null;
let newsPager = null;

function leagueName(leagueId) {
  const l = ALL_LEAGUES.find((x) => x.id === leagueId);
  return l ? l.name : leagueId;
}

function renderNews(items) {
  const grid = document.getElementById("news-grid");
  grid.innerHTML = items
    .map(
      (item) => `
    <div class="news-card ${item.featured ? "featured" : ""}">
      <div class="card-thumb"><img src="${item.image}" alt="${escapeHtml(item.title)}"></div>
      <div class="card-body">
        <div class="card-category">${escapeHtml(item.category)}</div>
        <div class="card-title">${escapeHtml(item.title)}</div>
        <div class="card-desc">${escapeHtml(item.desc)}</div>
        <div class="card-time">${escapeHtml(item.time)}</div>
      </div>
    </div>`
    )
    .join("");
  attachNewsCardClicks(grid, items);
}

function renderNewsPage() {
  renderNews(newsPager.currentItems);
  renderPagination(document.getElementById("news-pagination"), newsPager, renderNewsPage);
}

function renderRecentMatches(matches) {
  const wrap = document.getElementById("recent-matches");
  if (!matches || !matches.length) {
    wrap.innerHTML = `<p style="color:#888;">Không tìm thấy trận đấu phù hợp.</p>`;
    return;
  }
  wrap.innerHTML = matches
    .map(
      (m) => `
    <div class="match-row">
      <span class="competition">${escapeHtml(m.competition)}</span>
      <div class="match-date">${escapeHtml(m.status || "")}</div>
      <div class="teams">
        <span class="team-home">
          <span>${escapeHtml(m.home.name)}</span>
          ${teamLogoHtml(TEAM_LOGO_MAP, m.home.name, m.home.badge)}
        </span>
        <span class="score">${escapeHtml(m.score)}</span>
        <span class="team-away">
          ${teamLogoHtml(TEAM_LOGO_MAP, m.away.name, m.away.badge)}
          <span>${escapeHtml(m.away.name)}</span>
        </span>
      </div>
    </div>`
    )
    .join("");
}

function renderMatchesPage() {
  renderRecentMatches(matchesPager.currentItems);
  renderPagination(document.getElementById("matches-pagination"), matchesPager, renderMatchesPage);
}

function renderStandings(teams) {
  const topFive = teams.slice(0, 5);
  const rest = teams.slice(5, 17);
  const bottomThree = teams.slice(17);

  const rowHtml = (t) => `
    <tr class="${t.relegation ? "relegation" : ""}">
      <td>${t.rank}</td>
      <td class="team-cell">${t.logo ? `<img src="${t.logo}" alt="">` : ""} <strong>${escapeHtml(t.team)}</strong></td>
      <td style="font-weight:bold;">${t.points}</td>
    </tr>`;

  document.getElementById("standings-top").innerHTML = topFive.map(rowHtml).join("");
  document.getElementById("standings-more").innerHTML = rest.map(rowHtml).join("");
  document.getElementById("standings-bottom").innerHTML = bottomThree.map(rowHtml).join("");
}

function renderNationalStandings(teams) {
  const topTen = teams.slice(0, 10);
  const rest = teams.slice(10);

  const rowHtml = (t) => `
    <tr>
      <td>${t.rank}</td>
      <td class="team-cell">${t.logo ? `<img src="${t.logo}" alt="">` : ""} <strong>${escapeHtml(t.team)}</strong></td>
      <td style="font-weight:bold;">${t.points}</td>
    </tr>`;

  document.getElementById("national-standings-top").innerHTML = topTen.map(rowHtml).join("");
  document.getElementById("national-standings-more").innerHTML = rest.map(rowHtml).join("");
}

function renderTopScorers(players) {
  const top = players.slice(0, 5);
  const rest = players.slice(5);

  const rowHtml = (p) => `
    <tr>
      <td style="font-weight:500;">${escapeHtml(p.player)}</td>
      <td style="font-size:11px;color:#aaa;">${escapeHtml(p.team)}</td>
      <td style="font-weight:bold;color:#e74c3c;">${p.goals}</td>
    </tr>`;

  document.getElementById("topscorers-top").innerHTML = top.map(rowHtml).join("");
  document.getElementById("topscorers-more").innerHTML = rest.map(rowHtml).join("");
}

function toggleTable(moreId, btnId, collapsedLabel) {
  const moreRows = document.getElementById(moreId);
  const btn = document.getElementById(btnId);
  const isHidden = moreRows.style.display === "none" || moreRows.style.display === "";
  moreRows.style.display = isHidden ? "table-row-group" : "none";
  btn.textContent = isHidden ? "Thu gọn" : collapsedLabel;
}

// đổi giải "nổi bật" đang hiện ở khối BXH / Vua phá lưới
function showFeaturedLeague(leagueId) {
  featuredLeagueId = leagueId;

  const standings = ALL_STANDINGS[leagueId] || [];
  const topScorers = ALL_TOPSCORERS[leagueId] || [];
  const name = leagueName(leagueId);

  document.getElementById("standings-title").textContent = `BXH ${name}`;
  document.getElementById("topscorers-title").textContent = `Vua phá lưới ${name}`;

  if (standings.length) renderStandings(standings);
  else document.getElementById("standings-top").innerHTML = `<tr><td colspan="3" style="color:#888;">Giải đấu này chưa có bảng xếp hạng dạng vòng tròn.</td></tr>`;

  if (topScorers.length) renderTopScorers(topScorers);
  else document.getElementById("topscorers-top").innerHTML = `<tr><td colspan="3" style="color:#888;">Chưa có dữ liệu vua phá lưới.</td></tr>`;
}

/* ---------- Search giải đấu / đội bóng / cầu thủ ---------- */

function buildSearchResults(query) {
  const q = normalizeSearchText(query);
  if (!q) return { leagues: [], teams: [], players: [] };

  const leagueHits = ALL_LEAGUES.filter((l) => normalizeSearchText(l.name).includes(q) || normalizeSearchText(l.country).includes(q));

  const teamSet = new Map();
  Object.entries(ALL_STANDINGS).forEach(([leagueId, rows]) => {
    rows.forEach((r) => {
      if (normalizeSearchText(r.team).includes(q)) {
        teamSet.set(r.team + "|" + leagueId, { team: r.team, leagueId });
      }
    });
  });
  ALL_MATCHES.forEach((m) => {
    [m.home.name, m.away.name].forEach((teamName) => {
      if (normalizeSearchText(teamName).includes(q)) {
        teamSet.set(teamName + "|" + m.leagueId, { team: teamName, leagueId: m.leagueId });
      }
    });
  });

  const playerHits = [];
  Object.entries(ALL_TOPSCORERS).forEach(([leagueId, rows]) => {
    rows.forEach((p) => {
      if (normalizeSearchText(p.player).includes(q)) {
        playerHits.push({ ...p, leagueId });
      }
    });
  });

  return {
    leagues: leagueHits.slice(0, 5),
    teams: [...teamSet.values()].slice(0, 5),
    players: playerHits.slice(0, 5),
  };
}

function renderSearchResults(query) {
  const box = document.getElementById("search-results");
  if (!query || !query.trim()) {
    box.innerHTML = "";
    box.classList.remove("open");
    return;
  }

  const { leagues, teams, players } = buildSearchResults(query);
  if (!leagues.length && !teams.length && !players.length) {
    box.innerHTML = `<div class="search-empty">Không tìm thấy kết quả cho "${escapeHtml(query)}"</div>`;
    box.classList.add("open");
    return;
  }

  const groupHtml = (label, items) =>
    items.length
      ? `<div class="search-group-label">${escapeHtml(label)}</div>` + items.join("")
      : "";

  const leagueItems = leagues.map(
    (l) => `<button type="button" class="search-result-item" data-type="league" data-id="${escapeHtml(l.id)}">Bảng xếp hạng &amp; vua phá lưới ${escapeHtml(l.name)}</button>`
  );
  const teamItems = teams.map(
    (t) => `<button type="button" class="search-result-item" data-type="team" data-team="${escapeHtml(t.team)}" data-id="${escapeHtml(t.leagueId)}">${escapeHtml(t.team)} <span class="search-result-sub">${escapeHtml(leagueName(t.leagueId))}</span></button>`
  );
  const playerItems = players.map(
    (p) => `<button type="button" class="search-result-item" data-type="player" data-id="${escapeHtml(p.leagueId)}">${escapeHtml(p.player)} <span class="search-result-sub">${escapeHtml(p.team)} · ${p.goals} bàn</span></button>`
  );

  box.innerHTML =
    groupHtml("Giải đấu", leagueItems) +
    groupHtml("Đội bóng", teamItems) +
    groupHtml("Cầu thủ", playerItems);
  box.classList.add("open");
}

function setupSearch() {
  const input = document.getElementById("global-search");
  const box = document.getElementById("search-results");
  const clearBtn = document.getElementById("search-clear");
  if (!input) return;

  input.addEventListener("input", () => renderSearchResults(input.value));
  input.addEventListener("focus", () => renderSearchResults(input.value));

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) {
      box.classList.remove("open");
    }
  });

  box.addEventListener("click", (e) => {
    const btn = e.target.closest(".search-result-item");
    if (!btn) return;
    const { type, id, team } = btn.dataset;

    if (type === "league") {
      showFeaturedLeague(id);
      matchesPager.setItems(sortMatchesNewestFirst(ALL_MATCHES.filter((m) => m.leagueId === id)));
      renderMatchesPage();
    } else if (type === "team") {
      showFeaturedLeague(id);
      matchesPager.setItems(
        sortMatchesNewestFirst(ALL_MATCHES.filter((m) => m.home.name === team || m.away.name === team))
      );
      renderMatchesPage();
    } else if (type === "player") {
      showFeaturedLeague(id);
    }

    box.classList.remove("open");
    input.value = "";
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      box.innerHTML = "";
      box.classList.remove("open");
      const candidate = pickRandom(ALL_LEAGUES.filter((l) => ALL_STANDINGS[l.id] && ALL_STANDINGS[l.id].length));
      if (candidate) showFeaturedLeague(candidate.id);
      matchesPager.setItems(sortMatchesNewestFirst(ALL_MATCHES));
      renderMatchesPage();
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const [news, leagues, standingsData, topScorersData, matchesLocal, nationalStandings] = await Promise.all([
    loadData("data/news-home.json"),
    loadData("data/leagues.json"),
    loadData("data/standings.json"),
    loadData("data/topscorers.json"),
    loadData("data/matches-recent.json"),
    loadData("data/standings-national.json"),
  ]);

  ALL_LEAGUES = leagues || [];
  ALL_STANDINGS = standingsData || {};
  ALL_TOPSCORERS = topScorersData || {};
  ALL_MATCHES = matchesLocal || [];
  TEAM_LOGO_MAP = buildTeamLogoMap(ALL_STANDINGS);

  newsPager = createPager(news || [], 6);
  renderNewsPage();

  // gộp trận đấu mọi giải, mới nhất lên đầu, có phân trang
  matchesPager = createPager(sortMatchesNewestFirst(ALL_MATCHES), 10);
  renderMatchesPage();

  // chỉ random trong mấy giải có BXH dạng vòng tròn thôi (World Cup,
  // Champions League đá loại trực tiếp nên không có bảng xếp hạng kiểu này)
  const leaguesWithTable = ALL_LEAGUES.filter((l) => ALL_STANDINGS[l.id] && ALL_STANDINGS[l.id].length);
  const randomLeague = pickRandom(leaguesWithTable) || { id: "premier-league" };
  showFeaturedLeague(randomLeague.id);

  document.getElementById("btn-bxh").addEventListener("click", () =>
    toggleTable("standings-more", "btn-bxh", "Xem đầy đủ")
  );
  document.getElementById("btn-vpl").addEventListener("click", () =>
    toggleTable("topscorers-more", "btn-vpl", "Xem tất cả")
  );

  renderNationalStandings(nationalStandings || []);
  document.getElementById("btn-bxh-quoc-gia").addEventListener("click", () =>
    toggleTable("national-standings-more", "btn-bxh-quoc-gia", "Xem đầy đủ")
  );

  setupSearch();
});
