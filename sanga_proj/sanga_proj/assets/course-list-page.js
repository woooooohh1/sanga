(function () {
  "use strict";

  const DB_KEY = "sanga_admin_demo_v1";
  const pageType = {
    "unemployed.html": "unemployed",
    "worker.html": "worker",
    "general.html": "general"
  }[(location.pathname.split("/").pop() || "").toLowerCase()];

  if (!pageType) return;

  const listEl = document.querySelector("#courseList");
  if (!listEl) return;

  let db;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return; // 저장된 관리자 데이터가 없으면 HTML 기본 목록을 그대로 사용합니다.
    db = JSON.parse(raw);
  } catch {
    return;
  }

  const courses = Array.isArray(db?.courses)
    ? db.courses.filter((course) => course.type === pageType && course.published !== false && course.published !== "false")
    : [];

  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[ch]));

  const statusClass = (status) => status === "마감" ? "closed" : status === "상시접수" ? "always" : "open";
  const tagsOf = (course) => Array.isArray(course.tags)
    ? course.tags
    : String(course.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);

  const metaIcon = (kind) => ({
    period: '<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path></svg>',
    time: '<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',
    support: '<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="5"></circle><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9"></path></svg>'
  }[kind]);

  const cards = courses.map((course) => `
    <article class="card course-card motion-card" data-course-card data-category="${esc(course.category)}" data-reveal="scale">
      <div class="course-top">
        <div class="course-topline">
          <span class="chip">${esc(course.category || "과정")}</span>
          <span class="status ${statusClass(course.status)}">${esc(course.status || "상시접수")}</span>
        </div>
        <h3>${esc(course.title || "과정명 미입력")}</h3>
        <p>${esc(course.description || course.lead || "과정 상세내용을 확인해 주세요.")}</p>
      </div>
      <dl class="course-meta">
        <span>${metaIcon("period")}<span class="meta-label">교육기간</span><b>${esc(course.period || "상담 문의")}</b></span>
        <span>${metaIcon("time")}<span class="meta-label">교육시간</span><b>${esc(course.time || "상담 문의")}</b></span>
        <span>${metaIcon("support")}<span class="meta-label">지원구분</span><b>${esc(course.support || "상담 문의")}</b></span>
      </dl>
      <div class="course-tags">${tagsOf(course).map((tag) => `<span>#${esc(tag.replace(/^#/, ""))}</span>`).join("")}</div>
      <footer class="course-footer">
        <div class="course-price"><small>수강료</small><strong>${esc(course.tuition || "상담 문의")}</strong></div>
        <button class="btn btn-outline" type="button" data-course-detail data-course-id="${Number(course.id)}">과정 상세</button>
      </footer>
    </article>
  `).join("");

  listEl.innerHTML = `${cards}<div id="courseEmpty" class="card content-card" ${courses.length ? "hidden" : ""} style="grid-column:1/-1">등록된 과정이 없습니다.</div>`;

  const categories = [...new Set(courses.map((course) => String(course.category || "").trim()).filter(Boolean))];
  const categoryFilter = document.querySelector("#categoryFilter");
  if (categoryFilter) {
    categoryFilter.innerHTML = '<option value="">전체 분야</option>' + categories.map((category) => `<option value="${esc(category)}">${esc(category)}</option>`).join("");
  }

  const metrics = document.querySelectorAll(".course-summary-card .metric");
  if (metrics[0]) metrics[0].textContent = String(courses.length);
  if (metrics[1]) metrics[1].textContent = String(categories.length);
})();
