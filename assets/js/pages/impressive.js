// impressive.js - render trang "Thông tin ấn tượng"
// 2 khối chính:
//  1) Thống kê (vua phá lưới, vua kiến tạo, hàng công/thủ tốt nhất) - random
//     1 giải mỗi lần load trang, người dùng đổi giải qua ô <select>.
//  2) Tin tức ấn tượng, có phân trang.

let newsImpressivePager = null;
let ALL_LEAGUES_I = [];
let ALL_STANDINGS_I = {};
let ALL_TOPSCORERS_I = {};

function renderImpressiveNews(items) {
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

function renderImpressiveNewsPage() {
  renderImpressiveNews(newsImpressivePager.currentItems);
  renderPagination(document.getElementById("news-pagination"), newsImpressivePager, renderImpressiveNewsPage);
}

function statCardHtml({ label, name, sub, value, logo }) {
  return `
    <div class="stat-card">
      <div class="stat-label">${escapeHtml(label)}</div>
      ${logo ? `<img class="stat-logo" src="${logo}" alt="">` : ""}
      <div class="stat-name">${escapeHtml(name)}</div>
      <div class="stat-sub">${escapeHtml(sub)}</div>
      <div class="stat-value">${escapeHtml(String(value))}</div>
    </div>`;
}

function renderImpressiveStats({ topScorer, topAssist, bestAttack, bestDefense }) {
  const wrap = document.getElementById("impressive-stats");
  const cards = [];

  if (topScorer) {
    cards.push(
      statCardHtml({ label: "Vua phá lưới", name: topScorer.player, sub: topScorer.team, value: `${topScorer.goals} bàn` })
    );
  }
  if (topAssist) {
    cards.push(
      statCardHtml({ label: "Vua kiến tạo", name: topAssist.player, sub: topAssist.team, value: `${topAssist.assists} kiến tạo` })
    );
  }
  if (bestAttack) {
    cards.push(
      statCardHtml({
        label: "Hàng công tốt nhất",
        name: bestAttack.team,
        sub: "Tổng số bàn thắng ghi được",
        value: `${bestAttack.goalsFor} bàn`,
        logo: bestAttack.logo,
      })
    );
  }
  if (bestDefense) {
    cards.push(
      statCardHtml({
        label: "Hàng thủ chắc chắn nhất",
        name: bestDefense.team,
        sub: "Tổng số bàn thua ít nhất",
        value: `${bestDefense.goalsAgainst} bàn thua`,
        logo: bestDefense.logo,
      })
    );
  }

  wrap.innerHTML = cards.join("") || `<p style="color:#888;">Chưa có dữ liệu thống kê.</p>`;
}

// tìm đội ghi nhiều bàn nhất / thủng lưới ít nhất trong 1 giải, dựa vào BXH
function bestAttackDefenseFromLocal(standingsRows) {
  if (!standingsRows || !standingsRows.length) return { bestAttack: null, bestDefense: null };
  const bestAttackRow = [...standingsRows].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const bestDefenseRow = [...standingsRows].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
  return {
    bestAttack: { team: bestAttackRow.team, goalsFor: bestAttackRow.goalsFor, logo: bestAttackRow.logo },
    bestDefense: { team: bestDefenseRow.team, goalsAgainst: bestDefenseRow.goalsAgainst, logo: bestDefenseRow.logo },
  };
}

function showImpressiveStatsForLeague(leagueId) {
  const rows = ALL_TOPSCORERS_I[leagueId];
  if (!rows || !rows.length) {
    renderImpressiveStats({});
    return;
  }

  const byGoals = [...rows].sort((a, b) => b.goals - a.goals)[0];
  const byAssists = [...rows].sort((a, b) => (b.assists || 0) - (a.assists || 0))[0];
  const local = bestAttackDefenseFromLocal(ALL_STANDINGS_I[leagueId]);
  const league = ALL_LEAGUES_I.find((l) => l.id === leagueId);

  renderImpressiveStats({
    topScorer: byGoals && { player: byGoals.player, team: byGoals.team, goals: byGoals.goals },
    topAssist: byAssists && { player: byAssists.player, team: byAssists.team, assists: byAssists.assists },
    bestAttack: local.bestAttack,
    bestDefense: local.bestDefense,
  });

  const titleEl = document.getElementById("impressive-league-name");
  if (titleEl) titleEl.textContent = league ? ` - ${league.name}` : "";

  const select = document.getElementById("impressive-league-select");
  if (select && select.value !== leagueId) select.value = leagueId;
}

// đổ list giải (chỉ những giải có đủ data) vào <select> + bắt sự kiện đổi giải
function setupImpressiveLeagueSelect(leaguesWithData, initialLeagueId) {
  const select = document.getElementById("impressive-league-select");
  if (!select) return;

  select.innerHTML = leaguesWithData
    .map((l) => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.name)}</option>`)
    .join("");
  select.value = initialLeagueId;

  select.addEventListener("change", () => showImpressiveStatsForLeague(select.value));
}

document.addEventListener("DOMContentLoaded", async () => {
  const [news, leagues, standingsData, topScorersData] = await Promise.all([
    loadData("../data/news-impressive.json"),
    loadData("../data/leagues.json"),
    loadData("../data/standings.json"),
    loadData("../data/topscorers.json"),
  ]);

  ALL_LEAGUES_I = leagues || [];
  ALL_STANDINGS_I = standingsData || {};
  ALL_TOPSCORERS_I = topScorersData || {};

  // giải nào thiếu BXH hoặc thiếu vua phá lưới thì bỏ qua, khỏi cho chọn
  const leaguesWithData = ALL_LEAGUES_I.filter(
    (l) => ALL_STANDINGS_I[l.id] && ALL_STANDINGS_I[l.id].length && ALL_TOPSCORERS_I[l.id] && ALL_TOPSCORERS_I[l.id].length
  );

  const randomLeague = pickRandom(leaguesWithData);
  if (randomLeague) {
    setupImpressiveLeagueSelect(leaguesWithData, randomLeague.id);
    showImpressiveStatsForLeague(randomLeague.id);
  } else {
    renderImpressiveStats({});
  }

  if (news) {
    newsImpressivePager = createPager(news, 6);
    renderImpressiveNewsPage();
  }
});
