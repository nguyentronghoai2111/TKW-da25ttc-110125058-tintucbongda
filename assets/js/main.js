// main.js
// Mấy hàm dùng chung cho cả trang (loadData, phân trang, modal tin tức, logo
// đội bóng...). Không đụng tới API ngoài gì cả, dữ liệu là JSON tĩnh trong
// /data (hoặc bản nhúng sẵn ở data.js phòng khi fetch() bị chặn).

// map tên file json -> key tương ứng trong window.LOCAL_DATA (xem data.js)
const LOCAL_DATA_FILE_MAP = {
  "leagues.json": "leagues",
  "matches-latest.json": "matchesLatest",
  "matches-recent.json": "matchesRecent",
  "matches-upcoming.json": "matchesUpcoming",
  "news-home.json": "newsHome",
  "news-impressive.json": "newsImpressive",
  "players-featured.json": "playersFeatured",
  "standings.json": "standings",
  "standings-national.json": "standingsNational",
  "topscorers.json": "topscorers",
  "videos.json": "videos",
};

// path kiểu "data/leagues.json" hay "../data/leagues.json" đều được.
// Ưu tiên đọc từ LOCAL_DATA trước (không sợ lỗi CORS), fetch() chỉ là
// phương án dự phòng.
async function loadData(path) {
  const fileName = String(path).split("/").pop();
  const key = LOCAL_DATA_FILE_MAP[fileName];
  if (key && window.LOCAL_DATA && window.LOCAL_DATA[key] !== undefined) {
    // clone ra chứ không trả thẳng object gốc, lỡ chỗ khác sửa vào thì hỏng data chung
    return JSON.parse(JSON.stringify(window.LOCAL_DATA[key]));
  }
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Không tải được ${path}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// escape text trước khi nhét vào innerHTML, tránh lỗi khi title/desc có ký tự lạ
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function pickRandom(arr) {
  if (!arr || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// xáo mảng kiểu Fisher-Yates, không đụng vào mảng gốc
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// bỏ dấu + lowercase để search không bị phân biệt hoa thường/có dấu
// "Đội Bóng Đá" -> "doi bong da"
function normalizeSearchText(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

/* ---------- Phân trang cho các danh sách dài (tin tức, trận đấu...) ---------- */

// pager đơn giản, chỉ cần truyền mảng data + số item/trang
function createPager(items, pageSize) {
  return {
    items: items || [],
    pageSize,
    page: 1,
    get totalPages() {
      return Math.max(1, Math.ceil(this.items.length / this.pageSize));
    },
    get currentItems() {
      const start = (this.page - 1) * this.pageSize;
      return this.items.slice(start, start + this.pageSize);
    },
    setItems(items) {
      this.items = items || [];
      this.page = 1;
    },
    goTo(page) {
      this.page = Math.min(Math.max(1, page), this.totalPages);
    },
  };
}

// vẽ thanh "‹ Trước / 1 2 3 / Sau ›", onChange chạy lại khi bấm đổi trang
function renderPagination(container, pager, onChange) {
  if (!container) return;
  const total = pager.totalPages;
  if (total <= 1) {
    container.innerHTML = "";
    return;
  }

  const maxButtons = 5;
  let start = Math.max(1, pager.page - Math.floor(maxButtons / 2));
  let end = Math.min(total, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);

  const pageBtn = (p, label = p, disabled = false, active = false) => `
    <button type="button" class="page-btn${active ? " active" : ""}" data-page="${p}" ${disabled ? "disabled" : ""}>${label}</button>`;

  let html = "";
  html += pageBtn(pager.page - 1, "‹ Trước", pager.page <= 1);
  if (start > 1) {
    html += pageBtn(1);
    if (start > 2) html += `<span class="page-ellipsis">…</span>`;
  }
  for (let p = start; p <= end; p++) {
    html += pageBtn(p, p, false, p === pager.page);
  }
  if (end < total) {
    if (end < total - 1) html += `<span class="page-ellipsis">…</span>`;
    html += pageBtn(total);
  }
  html += pageBtn(pager.page + 1, "Sau ›", pager.page >= total);

  container.innerHTML = html;
  container.querySelectorAll(".page-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = Number(btn.dataset.page);
      if (!p || p === pager.page) return;
      pager.goTo(p);
      onChange();
      container.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
}

/* ---------- Modal xem chi tiết tin tức (dùng chung cho trang chủ + trang ấn tượng) ---------- */

function ensureNewsModal() {
  if (document.getElementById("news-modal")) return;
  const modal = document.createElement("div");
  modal.id = "news-modal";
  modal.className = "news-modal";
  modal.innerHTML = `
    <div class="news-modal-overlay" data-close="1"></div>
    <div class="news-modal-content">
      <button type="button" class="news-modal-close" data-close="1" aria-label="Đóng">&times;</button>
      <div class="news-modal-image"><img id="news-modal-img" src="" alt=""></div>
      <div class="news-modal-body">
        <div class="news-modal-category" id="news-modal-category"></div>
        <h2 class="news-modal-title" id="news-modal-title"></h2>
        <div class="news-modal-time" id="news-modal-time"></div>
        <p class="news-modal-desc" id="news-modal-desc"></p>
      </div>
    </div>`;
  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target.dataset && e.target.dataset.close) closeNewsModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNewsModal();
  });
}

function openNewsModal(item) {
  if (!item) return;
  ensureNewsModal();
  const modal = document.getElementById("news-modal");
  document.getElementById("news-modal-img").src = item.image || "";
  document.getElementById("news-modal-img").alt = item.title || "";
  document.getElementById("news-modal-category").textContent = item.category || "";
  document.getElementById("news-modal-title").textContent = item.title || "";
  document.getElementById("news-modal-time").textContent = item.time || "";
  document.getElementById("news-modal-desc").textContent = item.desc || "";
  modal.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeNewsModal() {
  const modal = document.getElementById("news-modal");
  if (modal) modal.classList.remove("open");
  document.body.classList.remove("modal-open");
}

// gắn click cho từng .news-card trong container, items phải đúng thứ tự
// với những gì vừa render ra (card thứ mấy ứng với item thứ đó)
function attachNewsCardClicks(gridEl, items) {
  if (!gridEl) return;
  const cards = gridEl.querySelectorAll(".news-card");
  cards.forEach((card, idx) => {
    card.addEventListener("click", () => openNewsModal(items[idx]));
  });
}

/* ---------- Logo đội bóng ----------
 * Tra theo tên đội trong standings.json, không có thì fallback ra badge chữ
 * (kiểu "MU", "MC"...). Riêng đội tuyển quốc gia (World Cup, ASEAN Cup...)
 * thì không nằm trong BXH CLB nên dùng luôn quốc kỳ từ flagcdn.com cho tiện.
 */

const NATIONAL_TEAM_FLAGS = {
  "Mexico": "https://flagcdn.com/w80/mx.png",
  "Nam Phi": "https://flagcdn.com/w80/za.png",
  "Hàn Quốc": "https://flagcdn.com/w80/kr.png",
  "Séc": "https://flagcdn.com/w80/cz.png",
  "Canada": "https://flagcdn.com/w80/ca.png",
  "Bosnia và Herzegovina": "https://flagcdn.com/w80/ba.png",
  "Thụy Sĩ": "https://flagcdn.com/w80/ch.png",
  "Qatar": "https://flagcdn.com/w80/qa.png",
  "Brazil": "https://flagcdn.com/w80/br.png",
  "Nhật Bản": "https://flagcdn.com/w80/jp.png",
  "Đức": "https://flagcdn.com/w80/de.png",
  "Paraguay": "https://flagcdn.com/w80/py.png",
  "Hà Lan": "https://flagcdn.com/w80/nl.png",
  "Morocco": "https://flagcdn.com/w80/ma.png",
  "Na Uy": "https://flagcdn.com/w80/no.png",
  "Bờ Biển Ngà": "https://flagcdn.com/w80/ci.png",
  "Pháp": "https://flagcdn.com/w80/fr.png",
  "Thụy Điển": "https://flagcdn.com/w80/se.png",
  "Ecuador": "https://flagcdn.com/w80/ec.png",
  "Anh": "https://flagcdn.com/w80/gb-eng.png",
  "CHDC Congo": "https://flagcdn.com/w80/cd.png",
  "Bỉ": "https://flagcdn.com/w80/be.png",
  "Senegal": "https://flagcdn.com/w80/sn.png",
  "Mỹ": "https://flagcdn.com/w80/us.png",
  "Tây Ban Nha": "https://flagcdn.com/w80/es.png",
  "Áo": "https://flagcdn.com/w80/at.png",
  "Bồ Đào Nha": "https://flagcdn.com/w80/pt.png",
  "Croatia": "https://flagcdn.com/w80/hr.png",
  "Algeria": "https://flagcdn.com/w80/dz.png",
  "Ai Cập": "https://flagcdn.com/w80/eg.png",
  "Australia": "https://flagcdn.com/w80/au.png",
  "Argentina": "https://flagcdn.com/w80/ar.png",
  "Cape Verde": "https://flagcdn.com/w80/cv.png",
  "Colombia": "https://flagcdn.com/w80/co.png",
  "Ghana": "https://flagcdn.com/w80/gh.png",
  "Việt Nam": "https://flagcdn.com/w80/vn.png",
  "Myanmar": "https://flagcdn.com/w80/mm.png",
  "Singapore": "https://flagcdn.com/w80/sg.png",
  "Campuchia": "https://flagcdn.com/w80/kh.png",
  "Ý": "https://flagcdn.com/w80/it.png",
  "Ba Lan": "https://flagcdn.com/w80/pl.png",
  "Serbia": "https://flagcdn.com/w80/rs.png",
  "Gruzia": "https://flagcdn.com/w80/ge.png",
  "Gabon": "https://flagcdn.com/w80/ga.png",
  "Guinea": "https://flagcdn.com/w80/gn.png",
};

function buildTeamLogoMap(standingsData) {
  const map = {};
  // set cờ trước, BXH CLB đè lên sau nếu trùng tên (thực tế gần như
  // không bao giờ trùng giữa tên ĐTQG với tên CLB nên khỏi lo)
  Object.entries(NATIONAL_TEAM_FLAGS).forEach(([team, url]) => {
    map[normalizeSearchText(team)] = url;
  });
  Object.values(standingsData || {}).forEach((rows) => {
    (rows || []).forEach((r) => {
      if (r && r.team && r.logo) {
        map[normalizeSearchText(r.team)] = r.logo;
      }
    });
  });
  return map;
}

function teamLogoHtml(map, teamName, fallbackBadge) {
  const key = normalizeSearchText(teamName);
  const url = map && map[key];
  if (url) {
    return `<img class="team-logo-badge" src="${url}" alt="" loading="lazy">`;
  }
  const label = String(fallbackBadge || teamName || "?").trim().slice(0, 3).toUpperCase();
  return `<span class="team-logo-badge is-fallback">${escapeHtml(label)}</span>`;
}

/* ---------- Sắp xếp trận đấu mới nhất lên đầu ----------
 * status kiểu "KT · 11/6/2026" thì lấy ngày ra so sánh, còn mấy trận chỉ
 * ghi "Mùa giải 2025-26" (không có ngày cụ thể) thì rớt xuống cuối luôn.
 */

function matchTimestamp(status) {
  const m = String(status || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return 0;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  return new Date(year, month - 1, day).getTime();
}

function sortMatchesNewestFirst(matches) {
  return [...(matches || [])].sort((a, b) => matchTimestamp(b.status) - matchTimestamp(a.status));
}
