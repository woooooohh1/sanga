(function () {
  "use strict";

  /*
   * =========================================================
   * 관리자 페이지 데모 데이터 저장 방식
   * =========================================================
   * 현재는 백엔드/DB가 없으므로 localStorage를 사용합니다.
   *
   * 실제 운영 시 반드시 아래 부분을 API 방식으로 교체하세요.
   *
   * 권장 API:
   * GET    /api/admin/courses
   * POST   /api/admin/courses
   * PUT    /api/admin/courses/:id
   * DELETE /api/admin/courses/:id
   *
   * GET    /api/admin/notices
   * POST   /api/admin/notices
   * PUT    /api/admin/notices/:id
   * DELETE /api/admin/notices/:id
   *
   * GET    /api/admin/jobs
   * POST   /api/admin/jobs
   * ...
   *
   * 인증:
   * - 관리자 로그인 세션/JWT 필수
   * - 관리자 API는 서버에서 권한 검증 필수
   * =========================================================
   */

  const DB_KEY = "sanga_admin_demo_v2";
  const COURSE_DETAIL_CONTENT_VERSION = 2;

  const seed = {
    courses: [
      {
        id: 1,
        type: "unemployed",
        category: "컴퓨터활용",
        title: "컴퓨터활용능력 2급 취득(필기+실기)-II",
        status: "모집중",
        period: "09.07 ~ 10.16",
        time: "09:00 ~ 13:00",
        tuition: "480,000원",
        support: "자비부담 216,000원",
        description: "엑셀 기초부터 함수·데이터 관리·차트, 필기 핵심이론과 실기 기출 유형까지 한 번에 준비합니다.",
        tags: "컴활2급,엑셀,필기실기,국비지원"
      },
      {
        id: 2,
        type: "unemployed",
        category: "회계·ERP",
        title: "회계기초부터 전산회계 1급 및 전산세무 2급",
        status: "모집중",
        period: "상시 안내",
        time: "09:30 ~ 16:00",
        tuition: "1,495,680원",
        support: "국민내일배움카드",
        description: "회계원리와 분개부터 전표·결산·부가세·원천징수까지 배우며 전산회계 1급과 전산세무 2급을 준비합니다.",
        tags: "전산회계1급,전산세무2급,회계실무,국비지원"
      },
      {
        id: 3,
        type: "unemployed",
        category: "ITQ",
        title: "컴퓨터 기초부터 ITQ(한글·엑셀·파워포인트) 취득",
        status: "마감",
        period: "상세 일정 문의",
        time: "09:30 ~ 15:00",
        tuition: "900,000원",
        support: "과정별 상이",
        description: "컴퓨터 기초와 파일관리부터 한글·엑셀·파워포인트 활용, ITQ 시험 유형까지 차근차근 익힙니다.",
        tags: "ITQ,한글,엑셀,파워포인트"
      },
      {
        id: 4,
        type: "worker",
        category: "컴퓨터활용",
        title: "컴퓨터활용능력 2급 취득(필기+실기)-II",
        status: "모집중",
        period: "09.07 ~ 10.16",
        time: "19:00 ~ 21:00",
        tuition: "480,000원",
        support: "재직자 국비지원",
        description: "퇴근 후 야간 시간에 컴활 2급 필기 핵심이론과 엑셀 실기 유형을 집중적으로 준비합니다.",
        tags: "야간,컴활2급,엑셀,재직자"
      },
      {
        id: 5,
        type: "worker",
        category: "ITQ",
        title: "ITQ 파워포인트(2021버전) 취득",
        status: "모집중",
        period: "09.19 ~ 10.10",
        time: "19:00 ~ 21:00",
        tuition: "192,000원",
        support: "자비부담 86,400원",
        description: "도형·표·차트 편집과 슬라이드 구성 능력을 익히며 ITQ 파워포인트 시험까지 준비합니다.",
        tags: "ITQ,파워포인트,PPT실무,야간"
      },
      {
        id: 6,
        type: "general",
        category: "OA",
        title: "일반인 맞춤 OA 과정",
        status: "상시접수",
        period: "개별 상담",
        time: "시간 협의",
        tuition: "과정별 상이",
        support: "일반과정",
        description: "현재 수준과 필요한 업무를 확인한 뒤 한글·엑셀·파워포인트 중 필요한 기능을 골라 배우는 맞춤형 OA 과정입니다.",
        tags: "OA,엑셀,한글,파워포인트"
      }
    ],
    notices: [
      { id: 1, title: "2026년 하반기 국민내일배움카드 과정 상담 안내", status: "게시", date: "2026-08-28", views: 128, content: "과정 상담 안내입니다." },
      { id: 2, title: "9월 일반과정 수강생 모집", status: "게시", date: "2026-08-24", views: 97, content: "9월 과정 모집 안내입니다." }
    ],
    jobs: [
      { id: 1, category: "사무·회계", title: "사무·회계 실무자 채용정보 안내", company: "인천지역 기업", status: "게시", date: "2026-08-29" }
    ],
    history: [
      { id: 1, year: "1987", tag: "BEGIN", title: "상아컴퓨터학원 개원", description: "지역 컴퓨터 교육의 첫걸음을 시작했습니다." },
      { id: 2, year: "2011", tag: "PUBLIC TRAINING", title: "직업훈련 교육 확대", description: "국비지원 교육과정을 확대했습니다." }
    ],
    inquiries: [
      { id: 1, name: "홍길동", phone: "010-1234-5678", course: "실업자 내일배움카드", status: "대기", createdAt: "2026-08-31 14:10", message: "컴활 과정 상담 받고 싶습니다.", consultationNote: "" }
    ]
  };

  // v10.7: pagination UI를 충분히 확인할 수 있도록 데모 데이터를 보강합니다.
  const extraCourseTitles = [
    ["unemployed", "컴퓨터활용", "컴퓨터활용능력 1급 실기 집중반", "모집중", "09.14 ~ 10.30"],
    ["unemployed", "회계·ERP", "전산회계 1급 자격증 대비반", "모집중", "09.21 ~ 11.06"],
    ["worker", "OA", "엑셀 실무 함수와 데이터 분석", "상시접수", "매월 개강"],
    ["worker", "컴퓨터활용", "퇴근 후 컴퓨터활용능력 1급", "모집중", "10.05 ~ 11.27"],
    ["general", "디자인", "초보자를 위한 포토샵 기초", "상시접수", "개별 상담"],
    ["general", "OA", "직장인을 위한 엑셀 문서 자동화", "모집중", "10.12 ~ 11.02"],
    ["unemployed", "디자인", "GTQ 포토샵 1급 자격증 대비", "모집중", "10.06 ~ 11.17"],
    ["worker", "ITQ", "ITQ 엑셀·한글 자격증 야간반", "모집중", "10.13 ~ 11.24"],
    ["general", "컴퓨터기초", "스마트한 문서작성 기초 과정", "상시접수", "개별 상담"],
    ["unemployed", "사무자동화", "사무행정 실무 종합과정", "모집중", "11.02 ~ 12.18"]
  ];
  extraCourseTitles.forEach((item, index) => {
    seed.courses.push({
      id: 7 + index, type: item[0], category: item[1], title: item[2], status: item[3],
      period: item[4], time: index % 2 ? "19:00 ~ 21:00" : "09:30 ~ 13:30",
      tuition: "과정별 상이", support: "상담 후 안내",
      description: `${item[2]} 과정의 데모 설명입니다.`, tags: `${item[1]},자격증,실무`, published: true
    });
  });

  const demoNames = ["김민지", "이서준", "박지우", "최유진", "정하늘", "윤서연", "한도윤", "오지민", "강민준", "신예린", "임재현", "조수빈", "백현우", "송지안"];
  const demoCourses = ["컴퓨터활용능력 2급", "전산회계 1급", "엑셀 실무", "ITQ 자격증", "포토샵 기초", "사무행정 실무"];
  demoNames.forEach((name, index) => {
    seed.inquiries.push({
      id: index + 2,
      name,
      phone: `010-${String(2100 + index * 37).slice(-4)}-${String(4300 + index * 53).slice(-4)}`,
      course: demoCourses[index % demoCourses.length],
      status: ["대기", "상담중", "완료"][index % 3],
      createdAt: `2026-09-${String(1 + (index % 9)).padStart(2, "0")} ${String(9 + (index % 8)).padStart(2, "0")}:${index % 2 ? "30" : "10"}`,
      message: `${demoCourses[index % demoCourses.length]} 과정 일정과 지원 여부를 상담받고 싶습니다.`,
      consultationNote: index % 4 === 1 ? "전화 상담 완료. 다음 개강일 안내 및 준비서류 문자 발송 예정." : (index % 4 === 2 ? "수강 가능 시간 확인 후 재연락 요청." : "")
    });
  });

  for (let id = 3; id <= 12; id += 1) {
    seed.notices.push({ id, title: `9월 교육과정 운영 안내 ${id - 2}`, status: id % 4 === 0 ? "임시저장" : "게시", date: `2026-09-${String(id).padStart(2, "0")}`, views: 40 + id * 13, content: "데모 공지사항입니다." });
  }
  for (let id = 2; id <= 11; id += 1) {
    seed.jobs.push({ id, category: id % 2 ? "사무·회계" : "OA·전산", title: `인천지역 사무직 채용정보 ${id}`, company: `협력기업 ${id}`, status: "게시", date: `2026-09-${String(id + 3).padStart(2, "0")}` });
  }
  for (let id = 3; id <= 12; id += 1) {
    seed.history.push({ id, year: String(2012 + id), tag: id % 2 ? "TRAINING" : "GROWTH", title: `교육 운영 주요 연혁 ${id - 2}`, description: "데모 연혁 데이터입니다." });
  }

  const courseDetailDefaults = () => window.SANGA_COURSE_DETAILS || {};

  function enrichCourseRecord(course) {
    const fallback = courseDetailDefaults()?.[Number(course?.id)] || {};
    const merged = { ...fallback, ...course };
    const arrayKeys = ["heroPoints", "outcomes", "curriculum", "targets", "benefits", "faqs"];
    const fallbackVersion = Number(fallback.contentVersion || 0);
    const savedVersion = Number(course?.detailContentVersion || 0);
    const useLatestDefaultDetail = course?.detailCustomized !== true && fallbackVersion > savedVersion;

    arrayKeys.forEach((key) => {
      if (useLatestDefaultDetail && Array.isArray(fallback[key])) {
        merged[key] = JSON.parse(JSON.stringify(fallback[key]));
      } else if (!Array.isArray(course?.[key])) {
        merged[key] = Array.isArray(fallback[key]) ? JSON.parse(JSON.stringify(fallback[key])) : [];
      }
    });

    if (useLatestDefaultDetail) {
      ["lead", "eyebrow", "badge"].forEach((key) => {
        if (fallback[key]) merged[key] = fallback[key];
      });
      merged.detailContentVersion = fallbackVersion || COURSE_DETAIL_CONTENT_VERSION;
    }

    if (typeof merged.published !== "boolean") merged.published = true;
    if (!merged.lead) merged.lead = merged.description || "";
    if (!merged.eyebrow) merged.eyebrow = `${courseTypeLabel(merged.type)} · ${merged.category || "교육과정"}`;
    if (!merged.badge) merged.badge = merged.category || "과정 안내";
    return merged;
  }

  function migrateCourseDetails(targetDB) {
    if (!targetDB?.courses) return targetDB;
    targetDB.courses = targetDB.courses.map(enrichCourseRecord);
    return targetDB;
  }

  const loadDB = () => {
    try {
      const saved = localStorage.getItem(DB_KEY);
      if (!saved) return structuredClone(seed);
      const parsed = JSON.parse(saved);
      const base = structuredClone(seed);
      const data = {
        ...base,
        ...parsed,
        courses: Array.isArray(parsed.courses) ? parsed.courses : base.courses,
        notices: Array.isArray(parsed.notices) ? parsed.notices : base.notices,
        jobs: Array.isArray(parsed.jobs) ? parsed.jobs : base.jobs,
        history: Array.isArray(parsed.history) ? parsed.history : base.history,
        inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : base.inquiries
      };
      data.inquiries = data.inquiries.map(i => ({
        ...i,
        status: i.status || "대기",
        message: i.message || "",
        consultationNote: i.consultationNote || ""
      }));
      return data;
    } catch {
      return JSON.parse(JSON.stringify(seed));
    }
  };

  const saveDB = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));
  let db = migrateCourseDetails(loadDB());

  if (!localStorage.getItem(DB_KEY) || window.SANGA_COURSE_DETAILS) saveDB(db);

  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => [...root.querySelectorAll(s)];

  function toast(message) {
    const el = qs("#adminToast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
  }

  function showAdminMessage(title, message, onClose) {
    let modal = qs("#adminMessageModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "adminMessageModal";
      modal.className = "admin-message-modal";
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML = `
        <div class="admin-message-card" role="alertdialog" aria-modal="true" aria-labelledby="adminMessageTitle" aria-describedby="adminMessageText">
          <div class="admin-message-icon" aria-hidden="true">!</div>
          <div class="admin-message-copy">
            <h3 id="adminMessageTitle"></h3>
            <p id="adminMessageText"></p>
          </div>
          <button type="button" class="admin-message-confirm">확인</button>
        </div>`;
      document.body.appendChild(modal);
    }
    qs("#adminMessageTitle", modal).textContent = title || "입력값을 확인해주세요";
    qs("#adminMessageText", modal).textContent = message || "입력 형식을 다시 확인해주세요.";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    const confirm = qs(".admin-message-confirm", modal);
    const close = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.removeEventListener("keydown", onKey);
      if (typeof onClose === "function") setTimeout(onClose, 0);
    };
    const onKey = (event) => { if (event.key === "Escape" || event.key === "Enter") close(); };
    confirm.onclick = close;
    modal.onclick = (event) => { if (event.target === modal) close(); };
    document.addEventListener("keydown", onKey);
    setTimeout(() => confirm.focus(), 0);
  }

  function decorateResponsiveTables(root = document) {
    qsa(".admin-table:not(.dashboard-table)", root).forEach(table => {
      const labels = qsa("thead th", table).map(th => th.textContent.trim());
      qsa("tbody tr", table).forEach(row => {
        qsa("td", row).forEach((cell, index) => {
          if (cell.hasAttribute("colspan")) return;
          cell.dataset.label = labels[index] || "항목";
        });
      });
    });
  }

  function nextId(list) {
    return list.length ? Math.max(...list.map((x) => Number(x.id) || 0)) + 1 : 1;
  }

  function initSidebar() {
    const btn = qs("#adminMobileToggle");
    const sidebar = qs("#adminSidebar");
    btn?.addEventListener("click", () => sidebar?.classList.toggle("open"));
  }

  const pageState = Object.create(null);

  function getPageSlice(key, list, pageSize) {
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const page = Math.min(Math.max(1, pageState[key] || 1), totalPages);
    pageState[key] = page;
    return { page, totalPages, items: list.slice((page - 1) * pageSize, page * pageSize) };
  }

  function renderPagination(key, listLength, pageSize, body, rerender) {
    if (!body) return;
    let host = body.closest(".table-wrap")?.nextElementSibling;
    if (!host || !host.classList.contains("pagination")) {
      host = document.createElement("nav");
      host.className = "pagination";
      host.setAttribute("aria-label", "페이지 이동");
      body.closest(".table-wrap")?.insertAdjacentElement("afterend", host);
    }

    const totalPages = Math.max(1, Math.ceil(listLength / pageSize));
    const current = Math.min(Math.max(1, pageState[key] || 1), totalPages);
    pageState[key] = current;

    if (listLength <= pageSize) {
      host.innerHTML = "";
      host.hidden = true;
      return;
    }

    host.hidden = false;
    const start = Math.max(1, Math.min(current - 2, totalPages - 4));
    const end = Math.min(totalPages, Math.max(5, current + 2));
    let numbers = "";
    for (let page = start; page <= end; page += 1) {
      numbers += `<button type="button" data-page="${page}" class="${page === current ? "active" : ""}" aria-current="${page === current ? "page" : "false"}">${page}</button>`;
    }
    host.innerHTML = `
      <button type="button" data-page="${current - 1}" ${current === 1 ? "disabled" : ""} aria-label="이전 페이지">‹</button>
      ${numbers}
      <button type="button" data-page="${current + 1}" ${current === totalPages ? "disabled" : ""} aria-label="다음 페이지">›</button>
      <span class="pagination-summary">총 ${listLength}건 · ${current}/${totalPages} 페이지</span>
    `;
    qsa("button[data-page]", host).forEach(button => {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        pageState[key] = Number(button.dataset.page);
        rerender();
      });
    });
  }

  function inquiryStatusBadge(status) {
    const map = {
      "대기": "badge-wait",
      "상담중": "badge-progress",
      "완료": "badge-complete",
      "취소": "badge-cancel"
    };
    return `<span class="badge ${map[status] || "badge-closed"}">${escapeHtml(status || "대기")}</span>`;
  }

  function resetPage(key) { pageState[key] = 1; }

  function updateDashboardStats() {
    const map = {
      courseCount: db.courses.length,
      noticeCount: db.notices.length,
      jobCount: db.jobs.length,
      inquiryCount: db.inquiries.filter(x => x.status === "대기").length
    };

    Object.entries(map).forEach(([id, value]) => {
      const el = qs(`#${id}`);
      if (el) el.textContent = value;
    });
  }

  function renderDashboardRecent() {
    const courseBody = qs("#recentCourses");
    const inquiryBody = qs("#recentInquiries");

    if (courseBody) {
      const coursePage = getPageSlice("dashboardCourses", db.courses, 5);
      courseBody.innerHTML = coursePage.items.map(c => `
        <tr>
          <td>${escapeHtml(c.title)}</td>
          <td>${escapeHtml(c.category)}</td>
          <td><span class="badge ${c.status === "모집중" ? "badge-open" : "badge-closed"}">${escapeHtml(c.status)}</span></td>
        </tr>
      `).join("") || `<tr><td colspan="3">등록된 과정이 없습니다.</td></tr>`;
      renderPagination("dashboardCourses", db.courses.length, 5, courseBody, renderDashboardRecent);
    }

    if (inquiryBody) {
      const inquiryPage = getPageSlice("dashboardInquiries", db.inquiries, 5);
      inquiryBody.innerHTML = inquiryPage.items.map(i => `
        <tr>
          <td>${escapeHtml(i.name)}</td>
          <td>${escapeHtml(i.course)}</td>
          <td>${inquiryStatusBadge(i.status)}</td>
        </tr>
      `).join("") || `<tr><td colspan="3">상담 내역이 없습니다.</td></tr>`;
      renderPagination("dashboardInquiries", db.inquiries.length, 5, inquiryBody, renderDashboardRecent);
    }
  }

  function renderCourses() {
    const body = qs("#courseTableBody");
    if (!body) return;

    const keyword = (qs("#courseSearch")?.value || "").trim().toLowerCase();
    const type = qs("#courseTypeFilter")?.value || "";
    const status = qs("#courseStatusFilter")?.value || "";
    const publish = qs("#coursePublishFilter")?.value || "";

    const list = db.courses.filter(c => {
      const matchType = !type || c.type === type;
      const matchStatus = !status || c.status === status;
      const matchPublish = !publish || (publish === "published" ? c.published !== false : c.published === false);
      const matchKeyword = !keyword || `${c.title} ${c.category} ${c.description || ""} ${c.period || ""}`.toLowerCase().includes(keyword);
      return matchType && matchStatus && matchPublish && matchKeyword;
    });

    const page = getPageSlice("courses", list, 8);

    body.innerHTML = page.items.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${courseTypeLabel(c.type)}</td>
        <td>${escapeHtml(c.category)}</td>
        <td><strong>${escapeHtml(c.title)}</strong></td>
        <td><span class="badge ${c.status === "모집중" ? "badge-open" : c.status === "마감" ? "badge-closed" : "badge-active"}">${escapeHtml(c.status)}</span></td>
        <td><span class="badge ${c.published === false ? "badge-draft" : "badge-open"}">${c.published === false ? "비공개" : "공개"}</span></td>
        <td>${escapeHtml(c.period)}</td>
        <td>
          <div class="row-actions course-row-actions">
            <button class="btn btn-outline" type="button" data-edit-course="${c.id}">상세편집</button>
            <a class="btn btn-green" href="../course-detail.html?id=${c.id}&preview=1" target="_blank" rel="noopener">미리보기</a>
            <button class="btn btn-danger" type="button" data-delete-course="${c.id}">삭제</button>
          </div>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="8"><div class="empty-state">등록된 과정이 없습니다.</div></td></tr>`;

    decorateResponsiveTables();
    renderPagination("courses", list.length, 8, body, renderCourses);

    qsa("[data-edit-course]").forEach(btn => btn.addEventListener("click", () => openCourseModal(Number(btn.dataset.editCourse))));
    qsa("[data-delete-course]").forEach(btn => btn.addEventListener("click", () => deleteCourse(Number(btn.dataset.deleteCourse))));
  }

  const repeaterConfig = {
    heroPoints: { container: "#heroPointsEditor" },
    outcomes: { container: "#outcomesEditor" },
    curriculum: { container: "#curriculumEditor" },
    targets: { container: "#targetsEditor" },
    benefits: { container: "#benefitsEditor" },
    faqs: { container: "#faqsEditor" }
  };

  function repeaterTemplate(kind, value = null) {
    if (kind === "heroPoints" || kind === "targets") {
      const label = kind === "heroPoints" ? "핵심 포인트" : "추천 대상";
      const placeholder = kind === "heroPoints" ? "예: 필기 + 실기 동시 대비" : "예: 사무직 취업을 준비하는 분";
      return `<div class="repeater-item repeater-simple" data-repeater-item="${kind}">
        <div class="form-field repeater-grow"><label>${label}</label><input data-field="value" value="${escapeHtml(value || "")}" placeholder="${placeholder}"></div>
        <button class="repeater-remove" type="button" data-remove-repeater aria-label="삭제">삭제</button>
      </div>`;
    }

    if (kind === "outcomes") {
      const [num = "", title = "", text = ""] = value || [];
      return `<div class="repeater-item" data-repeater-item="outcomes">
        <div class="repeater-item-head"><strong>핵심 역량</strong><button class="repeater-remove" type="button" data-remove-repeater>삭제</button></div>
        <div class="form-grid repeater-fields">
          <div class="form-field"><label>번호</label><input data-field="num" value="${escapeHtml(num)}" placeholder="01"></div>
          <div class="form-field"><label>역량 제목</label><input data-field="title" value="${escapeHtml(title)}" placeholder="예: 엑셀 실무 기본기"></div>
          <div class="form-field full"><label>설명</label><textarea data-field="text" rows="3" placeholder="학습 후 할 수 있게 되는 내용을 설명하세요.">${escapeHtml(text)}</textarea></div>
        </div>
      </div>`;
    }

    if (kind === "curriculum") {
      const [step = "", title = "", items = []] = value || [];
      return `<div class="repeater-item" data-repeater-item="curriculum">
        <div class="repeater-item-head"><strong>커리큘럼 단계</strong><button class="repeater-remove" type="button" data-remove-repeater>삭제</button></div>
        <div class="form-grid repeater-fields">
          <div class="form-field"><label>단계명</label><input data-field="step" value="${escapeHtml(step)}" placeholder="예: STEP 1"></div>
          <div class="form-field"><label>단계 제목</label><input data-field="title" value="${escapeHtml(title)}" placeholder="예: 엑셀 핵심 기능"></div>
          <div class="form-field full"><label>세부 학습내용</label><textarea data-field="items" rows="5" placeholder="한 줄에 하나씩 입력하세요.&#10;예) 기본 함수&#10;정렬·필터&#10;차트 만들기">${escapeHtml((items || []).join("\n"))}</textarea><div class="form-help">한 줄에 하나씩 입력하면 상세페이지에서 목록으로 표시됩니다.</div></div>
        </div>
      </div>`;
    }

    if (kind === "benefits") {
      const [title = "", text = ""] = value || [];
      return `<div class="repeater-item" data-repeater-item="benefits">
        <div class="repeater-item-head"><strong>수강 혜택</strong><button class="repeater-remove" type="button" data-remove-repeater>삭제</button></div>
        <div class="form-grid repeater-fields">
          <div class="form-field full"><label>혜택 제목</label><input data-field="title" value="${escapeHtml(title)}" placeholder="예: 국비지원 상담"></div>
          <div class="form-field full"><label>설명</label><textarea data-field="text" rows="3" placeholder="혜택 내용을 설명하세요.">${escapeHtml(text)}</textarea></div>
        </div>
      </div>`;
    }

    if (kind === "faqs") {
      const [question = "", answer = ""] = value || [];
      return `<div class="repeater-item" data-repeater-item="faqs">
        <div class="repeater-item-head"><strong>FAQ</strong><button class="repeater-remove" type="button" data-remove-repeater>삭제</button></div>
        <div class="form-grid repeater-fields">
          <div class="form-field full"><label>질문</label><input data-field="question" value="${escapeHtml(question)}" placeholder="예: 초보자도 수강할 수 있나요?"></div>
          <div class="form-field full"><label>답변</label><textarea data-field="answer" rows="4" placeholder="답변 내용을 입력하세요.">${escapeHtml(answer)}</textarea></div>
        </div>
      </div>`;
    }
    return "";
  }

  function renderCourseRepeaters(course = {}) {
    Object.entries(repeaterConfig).forEach(([kind, config]) => {
      const container = qs(config.container);
      if (!container) return;
      const values = Array.isArray(course[kind]) ? course[kind] : [];
      container.innerHTML = values.map(value => repeaterTemplate(kind, value)).join("");
    });
  }

  function addRepeaterItem(kind, value = null) {
    const config = repeaterConfig[kind];
    const container = config ? qs(config.container) : null;
    if (!container) return;
    container.insertAdjacentHTML("beforeend", repeaterTemplate(kind, value));
    const latest = container.lastElementChild;
    latest?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    latest?.querySelector("input,textarea")?.focus({ preventScroll: true });
  }

  function collectCourseRepeaters() {
    const simple = (kind) => qsa(`[data-repeater-item="${kind}"]`).map(item => item.querySelector('[data-field="value"]')?.value.trim() || "").filter(Boolean);
    const outcomes = qsa('[data-repeater-item="outcomes"]').map((item, index) => {
      const num = item.querySelector('[data-field="num"]')?.value.trim() || String(index + 1).padStart(2, "0");
      const title = item.querySelector('[data-field="title"]')?.value.trim() || "";
      const text = item.querySelector('[data-field="text"]')?.value.trim() || "";
      return [num, title, text];
    }).filter(([, title, text]) => title || text);
    const curriculum = qsa('[data-repeater-item="curriculum"]').map((item, index) => {
      const step = item.querySelector('[data-field="step"]')?.value.trim() || `STEP ${index + 1}`;
      const title = item.querySelector('[data-field="title"]')?.value.trim() || "";
      const items = (item.querySelector('[data-field="items"]')?.value || "").split(/\r?\n/).map(v => v.trim()).filter(Boolean);
      return [step, title, items];
    }).filter(([, title, items]) => title || items.length);
    const benefits = qsa('[data-repeater-item="benefits"]').map(item => [
      item.querySelector('[data-field="title"]')?.value.trim() || "",
      item.querySelector('[data-field="text"]')?.value.trim() || ""
    ]).filter(([title, text]) => title || text);
    const faqs = qsa('[data-repeater-item="faqs"]').map(item => [
      item.querySelector('[data-field="question"]')?.value.trim() || "",
      item.querySelector('[data-field="answer"]')?.value.trim() || ""
    ]).filter(([question, answer]) => question || answer);
    return { heroPoints: simple("heroPoints"), outcomes, curriculum, targets: simple("targets"), benefits, faqs };
  }

  function parseLegacyCoursePeriod(period) {
    const text = String(period || "").trim();
    const match = text.match(/^(\d{1,2})[.\-/](\d{1,2})\s*[~～-]\s*(\d{1,2})[.\-/](\d{1,2})$/);
    if (!match) return { startDate: "", endDate: "" };
    const now = new Date();
    const startYear = now.getFullYear();
    const sm = Number(match[1]);
    const sd = Number(match[2]);
    const em = Number(match[3]);
    const ed = Number(match[4]);
    const endYear = em < sm ? startYear + 1 : startYear;
    const pad = (value) => String(value).padStart(2, "0");
    return {
      startDate: `${startYear}-${pad(sm)}-${pad(sd)}`,
      endDate: `${endYear}-${pad(em)}-${pad(ed)}`
    };
  }

  function formatCoursePeriod(startDate, endDate, fallback = "") {
    const compact = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "";
      const [year, month, day] = value.split("-");
      return `${year}.${month}.${day}`;
    };
    const start = compact(startDate);
    const end = compact(endDate);
    if (start && end) return `${start} ~ ${end}`;
    if (start) return `${start} ~`;
    if (end) return `~ ${end}`;
    return fallback || "";
  }

  function formatDateLabel(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "날짜 선택";
    const [year, month, day] = value.split("-");
    return `${year}. ${month}. ${day}.`;
  }

  function dateFromIso(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isoFromDate(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function positionModernCalendar(root) {
    const trigger = root.querySelector('[data-date-trigger]');
    const calendar = root.querySelector('[data-calendar]');
    if (!trigger || !calendar || calendar.hidden) return;
    if (window.matchMedia('(max-width: 700px)').matches) {
      calendar.style.left = '';
      calendar.style.top = '';
      calendar.style.right = '';
      calendar.style.bottom = '';
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(318, window.innerWidth - 32);
    const estimatedHeight = 390;
    let left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
    let top = rect.bottom + 8;
    if (top + estimatedHeight > window.innerHeight - 16) {
      top = Math.max(16, rect.top - estimatedHeight - 8);
    }
    calendar.style.width = `${width}px`;
    calendar.style.left = `${left}px`;
    calendar.style.top = `${top}px`;
    calendar.style.right = 'auto';
    calendar.style.bottom = 'auto';
  }

  function parseDateInput(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    let y, m, d;
    if (/^\d{8}$/.test(raw)) {
      y = Number(raw.slice(0, 4));
      m = Number(raw.slice(4, 6));
      d = Number(raw.slice(6, 8));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      [y, m, d] = raw.split("-").map(Number);
    } else {
      return null;
    }
    if (y < 1900 || y > 2500 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  function renderModernCalendar(root, viewDate) {
    const hidden = root.querySelector('[data-date-value]');
    const calendar = root.querySelector('[data-calendar]');
    if (!hidden || !calendar) return;
    const selected = dateFromIso(hidden.value);
    const today = new Date();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = first.getDay();
    const days = last.getDate();
    const prevLast = new Date(year, month, 0).getDate();
    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
    const cells = [];
    for (let i = startDay - 1; i >= 0; i -= 1) {
      const date = new Date(year, month - 1, prevLast - i);
      cells.push({ date, muted: true });
    }
    for (let day = 1; day <= days; day += 1) cells.push({ date: new Date(year, month, day), muted: false });
    let nextDay = 1;
    while (cells.length < 42) cells.push({ date: new Date(year, month + 1, nextDay++), muted: true });

    calendar.dataset.year = year;
    calendar.dataset.month = month;
    const yearOptions = Array.from({ length: 601 }, (_, i) => 1900 + i)
      .map(value => `<option value="${value}"${value === year ? " selected" : ""}>${value}년</option>`).join("");
    const monthOptions = Array.from({ length: 12 }, (_, i) => `<option value="${i}"${i === month ? " selected" : ""}>${i + 1}월</option>`).join("");
    calendar.innerHTML = `
      <div class="modern-calendar-head">
        <button type="button" class="calendar-nav" data-cal-prev aria-label="이전 달">‹</button>
        <div class="calendar-jump" aria-label="연도와 월 선택">
          <select class="calendar-year-control" data-cal-year aria-label="연도">${yearOptions}</select>
          <select class="calendar-month-control" data-cal-month aria-label="월">${monthOptions}</select>
        </div>
        <button type="button" class="calendar-nav" data-cal-next aria-label="다음 달">›</button>
      </div>
      <div class="calendar-weekdays">${weekDays.map((day, index) => `<span class="${index === 0 ? "is-sunday" : index === 6 ? "is-saturday" : ""}">${day}</span>`).join("")}</div>
      <div class="calendar-days">
        ${cells.map(({ date, muted }) => {
          const iso = isoFromDate(date);
          const isSelected = selected && iso === isoFromDate(selected);
          const isToday = iso === isoFromDate(today);
          const dow = date.getDay();
          const weekendClass = dow === 0 ? " is-sunday" : dow === 6 ? " is-saturday" : "";
          return `<button type="button" class="calendar-day${weekendClass}${muted ? " is-muted" : ""}${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}" data-cal-date="${iso}" aria-label="${date.getFullYear()}년 ${date.getMonth()+1}월 ${date.getDate()}일">${date.getDate()}</button>`;
        }).join("")}
      </div>
      <div class="modern-calendar-foot">
        <button type="button" class="calendar-text-btn" data-cal-clear>지우기</button>
        <button type="button" class="calendar-today-btn" data-cal-today>오늘</button>
      </div>`;
  }

  function syncDatePicker(root) {
    const hidden = root.querySelector('[data-date-value]');
    const input = root.querySelector('[data-date-input]');
    if (hidden && input && document.activeElement !== input) input.value = hidden.value || "";
    root.classList.toggle("has-value", Boolean(hidden?.value));
    root.classList.remove("has-date-error");
  }

  function closeAllDatePickers(except = null) {
    qsa('[data-date-picker]').forEach(root => {
      if (root === except) return;
      const calendar = root.querySelector('[data-calendar]');
      const trigger = root.querySelector('[data-date-trigger]');
      if (calendar) calendar.hidden = true;
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      root.classList.remove("is-open");
    });
  }

  function initCourseDatePickers() {
    qsa('[data-date-picker]').forEach(root => {
      if (root.dataset.ready === "1") return;
      root.dataset.ready = "1";
      const hidden = root.querySelector('[data-date-value]');
      const input = root.querySelector('[data-date-input]');
      const trigger = root.querySelector('[data-date-trigger]');
      const calendar = root.querySelector('[data-calendar]');
      if (!hidden || !input || !trigger || !calendar) return;

      const openCalendar = () => {
        closeAllDatePickers(root);
        const selected = dateFromIso(hidden.value) || dateFromIso(parseDateInput(input.value)) || new Date();
        renderModernCalendar(root, new Date(selected.getFullYear(), selected.getMonth(), 1));
        calendar.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        root.classList.add("is-open");
        positionModernCalendar(root);
      };

      trigger.addEventListener("click", () => {
        if (calendar.hidden) openCalendar();
        else {
          calendar.hidden = true;
          trigger.setAttribute("aria-expanded", "false");
          root.classList.remove("is-open");
        }
      });

      const commitTypedDate = (showMessage = true) => {
        const parsed = parseDateInput(input.value);
        if (parsed === null) {
          root.classList.add("has-date-error");
          if (showMessage && root.dataset.messageOpen !== "1") {
            root.dataset.messageOpen = "1";
            showAdminMessage(
              "날짜 형식을 확인해주세요",
              "날짜는 20250901처럼 8자리 숫자로 입력해주세요. 입력 후 2025-09-01 형식으로 자동 변환됩니다.",
              () => {
                root.dataset.messageOpen = "0";
                input.focus();
                input.select();
              }
            );
          }
          return false;
        }
        root.classList.remove("has-date-error");
        hidden.value = parsed || "";
        input.value = parsed || "";
        hidden.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      };
      input.addEventListener("input", () => {
        const raw = input.value.trim();
        if (/^\d{8}$/.test(raw)) {
          const parsed = parseDateInput(raw);
          if (parsed) {
            root.classList.remove("has-date-error");
            hidden.value = parsed;
            input.value = parsed;
            hidden.dispatchEvent(new Event("change", { bubbles: true }));
            if (!calendar.hidden) {
              const date = dateFromIso(parsed);
              renderModernCalendar(root, new Date(date.getFullYear(), date.getMonth(), 1));
              positionModernCalendar(root);
            }
          }
        } else {
          root.classList.remove("has-date-error");
        }
      });
      input.addEventListener("change", () => commitTypedDate(true));
      input.addEventListener("blur", () => {
        if (!input.value.trim() || /^\d{4}-\d{2}-\d{2}$/.test(input.value.trim())) return;
        commitTypedDate(true);
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          if (commitTypedDate(true)) input.blur();
        }
        if (event.key === "ArrowDown" && event.altKey) {
          event.preventDefault();
          openCalendar();
        }
      });

      calendar.addEventListener("change", (event) => {
        const yearInput = event.target.closest('[data-cal-year]');
        const monthSelect = event.target.closest('[data-cal-month]');
        if (!yearInput && !monthSelect) return;
        let year = Number((calendar.querySelector('[data-cal-year]') || {}).value || calendar.dataset.year);
        let month = Number((calendar.querySelector('[data-cal-month]') || {}).value ?? calendar.dataset.month);
        year = Math.max(1900, Math.min(2500, year || new Date().getFullYear()));
        month = Math.max(0, Math.min(11, month));
        renderModernCalendar(root, new Date(year, month, 1));
        positionModernCalendar(root);
      });

      calendar.addEventListener("click", (event) => {
        const prev = event.target.closest('[data-cal-prev]');
        const next = event.target.closest('[data-cal-next]');
        const dateButton = event.target.closest('[data-cal-date]');
        const todayButton = event.target.closest('[data-cal-today]');
        const clearButton = event.target.closest('[data-cal-clear]');
        const year = Number(calendar.dataset.year || new Date().getFullYear());
        const month = Number(calendar.dataset.month || new Date().getMonth());
        if (prev || next) {
          renderModernCalendar(root, new Date(year, month + (next ? 1 : -1), 1));
          return;
        }
        if (todayButton) hidden.value = isoFromDate(new Date());
        if (clearButton) hidden.value = "";
        if (dateButton) hidden.value = dateButton.dataset.calDate || "";
        if (dateButton || todayButton || clearButton) {
          input.value = hidden.value;
          syncDatePicker(root);
          calendar.hidden = true;
          trigger.setAttribute("aria-expanded", "false");
          root.classList.remove("is-open");
          hidden.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });

      syncDatePicker(root);
    });

    if (!document.documentElement.dataset.datePickerGlobalBound) {
      document.documentElement.dataset.datePickerGlobalBound = "1";
      document.addEventListener("click", (event) => {
        if (!event.target.closest('[data-date-picker]')) closeAllDatePickers();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeAllDatePickers();
      });
      window.addEventListener("resize", () => {
        qsa('[data-date-picker].is-open').forEach(positionModernCalendar);
      });
      document.addEventListener("scroll", () => {
        qsa('[data-date-picker].is-open').forEach(positionModernCalendar);
      }, true);
    }
  }

  function hydrateCourseDates(course, form) {
    initCourseDatePickers();
    let startDate = course.startDate || "";
    let endDate = course.endDate || "";
    if (!startDate && !endDate && course.period) {
      const legacy = parseLegacyCoursePeriod(course.period);
      startDate = legacy.startDate;
      endDate = legacy.endDate;
    }
    const startInput = form.elements.namedItem("startDate");
    const endInput = form.elements.namedItem("endDate");
    const periodInput = form.elements.namedItem("period");
    if (startInput) startInput.value = startDate;
    if (endInput) endInput.value = endDate;
    if (periodInput) periodInput.value = course.period || "";
    qsa('[data-date-picker]', form).forEach(syncDatePicker);
  }

  function openCourseModal(id = null) {
    const modal = qs("#courseModal");
    const form = qs("#courseForm");
    if (!modal || !form) return;

    form.reset();
    qs("#courseId").value = "";
    qs("#courseModalTitle").textContent = id ? "과정 상세 편집" : "새 과정 만들기";

    let course = { published: true, heroPoints: [], outcomes: [], curriculum: [], targets: [], benefits: [], faqs: [] };
    if (id) {
      const found = db.courses.find(x => Number(x.id) === id);
      if (!found) return;
      course = enrichCourseRecord(found);
    }

    Object.entries(course).forEach(([key, value]) => {
      if (Array.isArray(value)) return;
      const field = form.elements.namedItem(key);
      if (field) field.value = key === "published" ? String(value !== false) : (value ?? "");
    });
    hydrateCourseDates(course, form);

    renderCourseRepeaters(course);
    const preview = qs("#coursePreviewBtn");
    if (preview) {
      preview.disabled = !id;
      preview.dataset.courseId = id || "";
      preview.title = id ? "현재 저장된 상세페이지를 새 창에서 확인합니다." : "과정을 먼저 저장하면 미리볼 수 있습니다.";
    }
    modal.classList.add("open");
  }

  function closeCourseModal() {
    closeAllDatePickers();
    qs("#courseModal")?.classList.remove("open");
  }

  function saveCourse(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    let id = Number(data.id || 0);
    const isEdit = Boolean(id);
    const repeaters = collectCourseRepeaters();
    const existingCourse = isEdit ? db.courses.find(x => Number(x.id) === id) : null;
    const payload = {
      ...data,
      ...repeaters,
      period: formatCoursePeriod(data.startDate, data.endDate, data.period || existingCourse?.period || ""),
      id: id || nextId(db.courses),
      published: data.published !== "false",
      lead: data.lead?.trim() || data.description?.trim() || "",
      detailCustomized: true,
      detailContentVersion: COURSE_DETAIL_CONTENT_VERSION
    };
    id = payload.id;

    if (isEdit) {
      const index = db.courses.findIndex(x => Number(x.id) === id);
      if (index >= 0) db.courses[index] = enrichCourseRecord({ ...db.courses[index], ...payload, id });
    } else {
      db.courses.unshift(enrichCourseRecord(payload));
    }

    /*
     * [DB/API 연동 지점]
     * 신규: POST /api/admin/courses
     * 수정: PUT  /api/admin/courses/:id
     * 상세 반복항목도 같은 payload 안에 JSON 배열로 저장합니다.
     */
    saveDB(db);
    renderCourses();
    updateDashboardStats();
    closeCourseModal();
    toast(isEdit ? "과정 상세내용을 저장했습니다." : "새 과정과 상세페이지를 만들었습니다.");
  }

  function deleteCourse(id) {
    if (!confirm("이 과정을 삭제할까요?")) return;

    /*
     * [DB/API 연동 지점]
     * DELETE /api/admin/courses/:id
     */
    db.courses = db.courses.filter(x => Number(x.id) !== id);
    saveDB(db);
    renderCourses();
    updateDashboardStats();
    toast("과정을 삭제했습니다.");
  }

  function renderSimpleTable(config) {
    const body = qs(config.body);
    if (!body) return;
    const list = Array.isArray(config.list) ? config.list : db[config.key];
    const page = getPageSlice(config.key, list, 8);

    body.innerHTML = page.items.map(item => config.row(item)).join("") ||
      `<tr><td colspan="${config.colspan}"><div class="empty-state">등록된 데이터가 없습니다.</div></td></tr>`;
    decorateResponsiveTables();
    renderPagination(config.key, list.length, 8, body, config.rerender || (() => {}));
  }

  function bindGenericCrud({
    key, addBtn, modal, form, modalTitle, idField, render, fillFields,
    apiName
  }) {
    const modalEl = qs(modal);
    const formEl = qs(form);

    qs(addBtn)?.addEventListener("click", () => {
      formEl.reset();
      qs(idField).value = "";
      qs(modalTitle).textContent = "새 항목 등록";
      modalEl.classList.add("open");
    });

    qsa(`[data-close="${modal.replace("#","")}"]`).forEach(btn => {
      btn.addEventListener("click", () => modalEl.classList.remove("open"));
    });

    formEl?.addEventListener("submit", e => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(formEl).entries());
      const id = Number(payload.id || 0);

      if (id) {
        const idx = db[key].findIndex(x => Number(x.id) === id);
        if (idx >= 0) db[key][idx] = { ...db[key][idx], ...payload, id };
      } else {
        db[key].unshift({ ...payload, id: nextId(db[key]) });
      }

      /*
       * [DB/API 연동 지점]
       * POST/PUT /api/admin/{apiName}
       */
      saveDB(db);
      render();
      modalEl.classList.remove("open");
      toast("저장했습니다.");
    });

    document.addEventListener("click", e => {
      const edit = e.target.closest(`[data-edit-${key}]`);
      if (edit) {
        const id = Number(edit.dataset[`edit${capitalize(key)}`]);
        const item = db[key].find(x => Number(x.id) === id);
        if (!item) return;
        formEl.reset();
        fillFields(item, formEl);
        qs(modalTitle).textContent = "항목 수정";
        modalEl.classList.add("open");
      }

      const del = e.target.closest(`[data-delete-${key}]`);
      if (del) {
        const id = Number(del.dataset[`delete${capitalize(key)}`]);
        if (!confirm("삭제할까요?")) return;
        db[key] = db[key].filter(x => Number(x.id) !== id);
        /*
         * [DB/API 연동 지점]
         * DELETE /api/admin/{apiName}/:id
         */
        saveDB(db);
        render();
        toast("삭제했습니다.");
      }
    });
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function fillForm(item, form) {
    Object.entries(item).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (field) field.value = value ?? "";
    });
  }

  function renderNotices() {
    const keyword = (qs("#noticeSearch")?.value || "").trim().toLowerCase();
    const status = qs("#noticeStatusFilter")?.value || "";
    const list = db.notices.filter(n => {
      const matchStatus = !status || n.status === status;
      const matchKeyword = !keyword || `${n.title || ""} ${n.content || ""}`.toLowerCase().includes(keyword);
      return matchStatus && matchKeyword;
    });
    renderSimpleTable({
      body: "#noticeTableBody", key: "notices", list, rerender: renderNotices, colspan: 6,
      row: n => `
        <tr>
          <td>${n.id}</td>
          <td><strong>${escapeHtml(n.title)}</strong></td>
          <td><span class="badge ${n.status === "게시" ? "badge-open" : "badge-draft"}">${escapeHtml(n.status)}</span></td>
          <td>${escapeHtml(n.date)}</td>
          <td>${Number(n.views || 0)}</td>
          <td><div class="row-actions">
            <button class="btn btn-outline" type="button" data-edit-notices="${n.id}">수정</button>
            <button class="btn btn-danger" type="button" data-delete-notices="${n.id}">삭제</button>
          </div></td>
        </tr>`
    });
  }

  function renderJobs() {
    const keyword = (qs("#jobSearch")?.value || "").trim().toLowerCase();
    const category = (qs("#jobCategoryFilter")?.value || "").trim().toLowerCase();
    const status = qs("#jobStatusFilter")?.value || "";
    const list = db.jobs.filter(j => {
      const matchStatus = !status || (j.status || "게시") === status;
      const matchCategory = !category || (j.category || "").toLowerCase().includes(category);
      const matchKeyword = !keyword || `${j.title || ""} ${j.company || ""}`.toLowerCase().includes(keyword);
      return matchStatus && matchCategory && matchKeyword;
    });
    renderSimpleTable({
      body: "#jobTableBody", key: "jobs", list, rerender: renderJobs, colspan: 6,
      row: j => `
        <tr>
          <td>${j.id}</td><td>${escapeHtml(j.category)}</td>
          <td><strong>${escapeHtml(j.title)}</strong></td>
          <td>${escapeHtml(j.company)}</td>
          <td>${escapeHtml(j.date)}</td>
          <td><div class="row-actions">
            <button class="btn btn-outline" type="button" data-edit-jobs="${j.id}">수정</button>
            <button class="btn btn-danger" type="button" data-delete-jobs="${j.id}">삭제</button>
          </div></td>
        </tr>`
    });
  }

  function renderHistory() {
    const keyword = (qs("#historySearch")?.value || "").trim().toLowerCase();
    const year = (qs("#historyYearFilter")?.value || "").trim().toLowerCase();
    const list = db.history.filter(h => {
      const matchYear = !year || String(h.year || "").toLowerCase().includes(year);
      const matchKeyword = !keyword || `${h.tag || ""} ${h.title || ""} ${h.description || ""}`.toLowerCase().includes(keyword);
      return matchYear && matchKeyword;
    });
    renderSimpleTable({
      body: "#historyTableBody", key: "history", list, rerender: renderHistory, colspan: 5,
      row: h => `
        <tr>
          <td>${h.id}</td><td><strong>${escapeHtml(h.year)}</strong></td>
          <td>${escapeHtml(h.tag)}</td><td>${escapeHtml(h.title)}</td>
          <td><div class="row-actions">
            <button class="btn btn-outline" type="button" data-edit-history="${h.id}">수정</button>
            <button class="btn btn-danger" type="button" data-delete-history="${h.id}">삭제</button>
          </div></td>
        </tr>`
    });
  }

  function inquiryNotePreview(note) {
    const text = String(note || "").trim();
    if (!text) return `<span class="note-empty">아직 상담 기록이 없습니다.</span>`;
    const compact = text.replace(/\s+/g, " ");
    const preview = compact.length > 54 ? `${compact.slice(0, 54)}…` : compact;
    return `<span class="note-preview-text">${escapeHtml(preview)}</span>`;
  }

  function setSelectStatusClass(select, status) {
    if (!select) return;
    select.classList.remove("status-select-wait", "status-select-progress", "status-select-complete", "status-select-cancel");
    const map = {
      "대기": "status-select-wait",
      "상담중": "status-select-progress",
      "완료": "status-select-complete",
      "취소": "status-select-cancel"
    };
    select.classList.add(map[status] || "status-select-wait");
  }

  function openConsultationModal(id) {
    const item = db.inquiries.find(x => Number(x.id) === Number(id));
    const modal = qs("#consultationModal");
    if (!item || !modal) return;

    qs("#consultationInquiryId").value = item.id;
    qs("#consultationModalTitle").textContent = `${item.name || "신청자"} 상담 상세`;
    const createdAtText = String(item.createdAt || "-").trim();
    const createdAtParts = createdAtText.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?/);
    const createdAtMarkup = createdAtParts
      ? `<span class="consult-date">${escapeHtml(createdAtParts[1])}</span><span class="consult-time">${escapeHtml(createdAtParts[2])}</span>`
      : escapeHtml(createdAtText);
    qs("#consultationSummary").innerHTML = `
      <div class="consult-info-cell"><span>신청자</span><strong>${escapeHtml(item.name || "-")}</strong></div>
      <div class="consult-info-cell"><span>연락처</span><strong>${escapeHtml(item.phone || "-")}</strong></div>
      <div class="consult-info-cell"><span>관심과정</span><strong>${escapeHtml(item.course || "-")}</strong></div>
      <div class="consult-info-cell"><span>신청일시</span><strong class="consult-datetime">${createdAtMarkup}</strong></div>
    `;
    qs("#consultationMessage").textContent = item.message || "작성된 문의내용이 없습니다.";
    qs("#consultationNoteField").value = item.consultationNote || "";
    qsa('input[name="consultationStatus"]').forEach(radio => {
      radio.checked = radio.value === (item.status || "대기");
    });
    qs("#consultationStatusBadge").innerHTML = inquiryStatusBadge(item.status || "대기");
    updateConsultationNoteCount();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    setTimeout(() => qs("#consultationNoteField")?.focus(), 30);
  }

  function closeConsultationModal() {
    const modal = qs("#consultationModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function updateConsultationNoteCount() {
    const field = qs("#consultationNoteField");
    const count = qs("#consultationNoteCount");
    if (field && count) count.textContent = `${field.value.length} / 2000`;
  }

  function renderInquiries() {
    const body = qs("#inquiryTableBody");
    if (!body) return;

    const keyword = (qs("#inquirySearch")?.value || "").trim().toLowerCase();
    const statusFilter = qs("#inquiryStatusFilter")?.value || "";
    const list = db.inquiries.filter(i => {
      const matchStatus = !statusFilter || i.status === statusFilter;
      const matchKeyword = !keyword || `${i.name || ""} ${i.phone || ""} ${i.course || ""} ${i.message || ""} ${i.consultationNote || ""}`.toLowerCase().includes(keyword);
      return matchStatus && matchKeyword;
    });
    const page = getPageSlice("inquiries", list, 8);

    body.innerHTML = page.items.map(i => `
      <tr>
        <td>${i.id}</td>
        <td><strong>${escapeHtml(i.name)}</strong><br><small>${escapeHtml(i.phone)}</small></td>
        <td>${escapeHtml(i.course)}</td>
        <td><div class="inquiry-message-preview">${escapeHtml(i.message || "작성된 문의내용이 없습니다.")}</div></td>
        <td>
          <div class="consultation-note-summary">
            ${inquiryNotePreview(i.consultationNote)}
            <button class="btn btn-outline btn-consultation-open" type="button" data-open-consultation="${i.id}">
              <span>상담 기록</span><span aria-hidden="true">→</span>
            </button>
          </div>
        </td>
        <td>${escapeHtml(i.createdAt || "")}</td>
        <td class="inquiry-current-status">
          <div class="inquiry-current-status-inner">${inquiryStatusBadge(i.status)}</div>
        </td>
        <td class="inquiry-status-change">
          <div class="inquiry-status-change-inner">
            <select class="status-select" data-inquiry-status="${i.id}" aria-label="${escapeHtml(i.name)} 상담 상태 변경">
              <option ${i.status === "대기" ? "selected" : ""}>대기</option>
              <option ${i.status === "상담중" ? "selected" : ""}>상담중</option>
              <option ${i.status === "완료" ? "selected" : ""}>완료</option>
              <option ${i.status === "취소" ? "selected" : ""}>취소</option>
            </select>
          </div>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="8"><div class="empty-state">검색 조건에 맞는 상담신청이 없습니다.</div></td></tr>`;

    decorateResponsiveTables();
    renderPagination("inquiries", list.length, 8, body, renderInquiries);

    qsa("[data-open-consultation]").forEach(button => {
      button.addEventListener("click", () => openConsultationModal(Number(button.dataset.openConsultation)));
    });

    qsa("[data-inquiry-status]").forEach(select => {
      setSelectStatusClass(select, select.value);
      select.addEventListener("change", () => {
        const item = db.inquiries.find(x => Number(x.id) === Number(select.dataset.inquiryStatus));
        if (!item) return;
        item.status = select.value;
        saveDB(db);
        setSelectStatusClass(select, select.value);
        updateDashboardStats();
        renderInquiries();
        renderDashboardRecent();
        toast("상담 상태를 변경했습니다.");
      });
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function courseTypeLabel(type) {
    return {
      unemployed: "실업자",
      worker: "재직자",
      general: "일반과정"
    }[type] || type;
  }

  initSidebar();
  updateDashboardStats();
  renderDashboardRecent();
  renderCourses();
  renderNotices();
  renderJobs();
  renderHistory();
  renderInquiries();
  decorateResponsiveTables();

  qs("#consultationModalClose")?.addEventListener("click", closeConsultationModal);
  qs("#consultationCancelBtn")?.addEventListener("click", closeConsultationModal);
  qs("#consultationNoteField")?.addEventListener("input", updateConsultationNoteCount);
  qs("#consultationModal")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeConsultationModal();
  });
  qsa('input[name="consultationStatus"]').forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.checked) qs("#consultationStatusBadge").innerHTML = inquiryStatusBadge(radio.value);
    });
  });
  qs("#consultationForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = Number(qs("#consultationInquiryId")?.value || 0);
    const item = db.inquiries.find(x => Number(x.id) === id);
    if (!item) return;
    const checked = qs('input[name="consultationStatus"]:checked');
    item.status = checked?.value || item.status || "대기";
    item.consultationNote = (qs("#consultationNoteField")?.value || "").trim();
    saveDB(db);
    updateDashboardStats();
    renderInquiries();
    renderDashboardRecent();
    closeConsultationModal();
    toast("상담 기록을 저장했습니다.");
  });

  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeConsultationModal(); });

  const bindFilter = (selector, eventName, key, render) => {
    qs(selector)?.addEventListener(eventName, () => { resetPage(key); render(); });
  };
  bindFilter("#courseSearch", "input", "courses", renderCourses);
  bindFilter("#courseTypeFilter", "change", "courses", renderCourses);
  bindFilter("#courseStatusFilter", "change", "courses", renderCourses);
  bindFilter("#coursePublishFilter", "change", "courses", renderCourses);
  bindFilter("#noticeSearch", "input", "notices", renderNotices);
  bindFilter("#noticeStatusFilter", "change", "notices", renderNotices);
  bindFilter("#jobSearch", "input", "jobs", renderJobs);
  bindFilter("#jobCategoryFilter", "input", "jobs", renderJobs);
  bindFilter("#jobStatusFilter", "change", "jobs", renderJobs);
  bindFilter("#historySearch", "input", "history", renderHistory);
  bindFilter("#historyYearFilter", "input", "history", renderHistory);
  bindFilter("#inquirySearch", "input", "inquiries", renderInquiries);
  bindFilter("#inquiryStatusFilter", "change", "inquiries", renderInquiries);

  qsa("[data-reset-filters]").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.resetFilters;
      const panel = button.closest(".form-panel");
      qsa("input[type=search], select", panel).forEach(control => { control.value = ""; });
      resetPage(key);
      ({ courses: renderCourses, notices: renderNotices, jobs: renderJobs, history: renderHistory, inquiries: renderInquiries })[key]?.();
    });
  });

  qs("#addCourseBtn")?.addEventListener("click", () => openCourseModal());
  qs("#courseModalClose")?.addEventListener("click", closeCourseModal);
  qs("#courseForm")?.addEventListener("submit", e => {
    e.preventDefault();
    saveCourse(e.currentTarget);
  });

  qs("#courseModalClose2")?.addEventListener("click", closeCourseModal);
  qs("#coursePreviewBtn")?.addEventListener("click", (e) => {
    const id = Number(e.currentTarget.dataset.courseId || 0);
    if (id) window.open(`../course-detail.html?id=${id}&preview=1`, "_blank", "noopener");
  });
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add-repeater]");
    if (add) addRepeaterItem(add.dataset.addRepeater);
    const remove = e.target.closest("[data-remove-repeater]");
    if (remove) remove.closest("[data-repeater-item]")?.remove();
  });

  bindGenericCrud({
    key: "notices",
    addBtn: "#addNoticeBtn",
    modal: "#noticeModal",
    form: "#noticeForm",
    modalTitle: "#noticeModalTitle",
    idField: "#noticeId",
    render: renderNotices,
    fillFields: fillForm,
    apiName: "notices"
  });

  bindGenericCrud({
    key: "jobs",
    addBtn: "#addJobBtn",
    modal: "#jobModal",
    form: "#jobForm",
    modalTitle: "#jobModalTitle",
    idField: "#jobId",
    render: renderJobs,
    fillFields: fillForm,
    apiName: "jobs"
  });

  bindGenericCrud({
    key: "history",
    addBtn: "#addHistoryBtn",
    modal: "#historyModal",
    form: "#historyForm",
    modalTitle: "#historyModalTitle",
    idField: "#historyId",
    render: renderHistory,
    fillFields: fillForm,
    apiName: "history"
  });

  qsa("[data-reset-demo]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("관리자 데모 데이터를 초기화할까요?")) return;
      db = JSON.parse(JSON.stringify(seed));
      saveDB(db);
      location.reload();
    });
  });
})();


/* v11.1 true custom select enhancement ---------------------------------- */
(() => {
  let active = null;
  let uid = 0;

  function closeActive(focusTrigger = false) {
    if (!active) return;
    active.wrapper.classList.remove('is-open');
    active.menu.classList.remove('is-open');
    active.trigger.setAttribute('aria-expanded', 'false');
    if (focusTrigger) active.trigger.focus();
    active = null;
  }

  function placeMenu(record) {
    const rect = record.trigger.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const margin = 8;
    const width = Math.max(rect.width, 150);
    record.menu.style.width = `${Math.min(width, vw - margin * 2)}px`;
    record.menu.style.left = `${Math.max(margin, Math.min(rect.left, vw - width - margin))}px`;
    record.menu.style.top = `${rect.bottom + 6}px`;
    record.menu.style.bottom = 'auto';

    const menuRect = record.menu.getBoundingClientRect();
    if (menuRect.bottom > vh - margin && rect.top > vh - rect.bottom) {
      record.menu.style.top = 'auto';
      record.menu.style.bottom = `${vh - rect.top + 6}px`;
      record.menu.style.transformOrigin = 'bottom';
    } else {
      record.menu.style.transformOrigin = 'top';
    }
  }

  function sync(record) {
    const option = record.select.options[record.select.selectedIndex] || record.select.options[0];
    record.value.textContent = option ? option.textContent : '';
    [...record.menu.querySelectorAll('.custom-select-option')].forEach((btn, index) => {
      btn.setAttribute('aria-selected', String(index === record.select.selectedIndex));
    });
  }

  function open(record) {
    if (active && active !== record) closeActive();
    active = record;
    record.wrapper.classList.add('is-open');
    record.menu.classList.add('is-open');
    record.trigger.setAttribute('aria-expanded', 'true');
    placeMenu(record);
    const selected = record.menu.querySelector('[aria-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }

  function enhance(select) {
    if (!select || select.dataset.customSelectReady === '1' || select.multiple || select.size > 1) return;
    select.dataset.customSelectReady = '1';
    select.classList.add('custom-select-source');

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', select.getAttribute('aria-label') || '선택');
    const value = document.createElement('span');
    value.className = 'custom-select-value';
    trigger.appendChild(value);

    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    wrapper.appendChild(trigger);

    const menu = document.createElement('div');
    menu.className = 'custom-select-menu';
    menu.id = `custom-select-menu-${++uid}`;
    menu.setAttribute('role', 'listbox');
    trigger.setAttribute('aria-controls', menu.id);
    document.body.appendChild(menu);

    [...select.options].forEach((opt, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'custom-select-option';
      btn.setAttribute('role', 'option');
      btn.dataset.index = String(index);
      btn.textContent = opt.textContent;
      btn.disabled = opt.disabled;
      btn.addEventListener('click', () => {
        if (select.selectedIndex !== index) {
          select.selectedIndex = index;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        sync(record);
        closeActive(true);
      });
      menu.appendChild(btn);
    });

    const record = { select, wrapper, trigger, value, menu };
    sync(record);

    trigger.addEventListener('click', () => active === record ? closeActive() : open(record));
    trigger.addEventListener('keydown', (event) => {
      const count = select.options.length;
      if (event.key === 'Escape') { event.preventDefault(); closeActive(true); return; }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); active === record ? closeActive() : open(record); return; }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const dir = event.key === 'ArrowDown' ? 1 : -1;
        let next = Math.max(0, Math.min(count - 1, select.selectedIndex + dir));
        while (select.options[next]?.disabled && next >= 0 && next < count) next += dir;
        if (next >= 0 && next < count) {
          select.selectedIndex = next;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
          sync(record);
        }
      }
    });
    select.addEventListener('change', () => sync(record));
  }

  function enhanceAll(root = document) {
    root.querySelectorAll?.('select').forEach(enhance);
  }

  enhanceAll();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches('select')) enhance(node);
        enhanceAll(node);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('pointerdown', (event) => {
    if (!active) return;
    if (active.wrapper.contains(event.target) || active.menu.contains(event.target)) return;
    closeActive();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeActive(true); });
  window.addEventListener('resize', () => { if (active) placeMenu(active); });
  window.addEventListener('scroll', () => { if (active) placeMenu(active); }, true);
})();
