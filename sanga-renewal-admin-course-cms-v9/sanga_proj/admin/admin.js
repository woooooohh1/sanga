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

  const DB_KEY = "sanga_admin_demo_v1";

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
        description: "엑셀 실무와 컴퓨터활용능력 2급 필기/실기를 함께 준비합니다.",
        tags: "엑셀,자격증,국비지원"
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
        description: "회계원리, 전산회계, 전산세무, ERP 회계 실무 과정",
        tags: "회계,전산세무,ERP"
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
        description: "컴퓨터 기초부터 한글, 엑셀, 파워포인트 활용과 ITQ 자격증까지 준비합니다.",
        tags: "한글,엑셀,파워포인트,ITQ"
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
        description: "퇴근 후 야간 시간에 컴퓨터활용능력 2급 필기와 실기를 준비합니다.",
        tags: "야간,엑셀,국비지원"
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
        description: "업무용 발표자료 제작 능력과 ITQ 파워포인트 자격증을 함께 준비합니다.",
        tags: "ITQ,파워포인트,야간"
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
        description: "한글, 엑셀, 파워포인트를 현재 수준과 목표에 맞춰 배우는 개인 맞춤 과정입니다.",
        tags: "OA,개인수업,기초"
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
      { id: 1, name: "홍길동", phone: "010-1234-5678", course: "실업자 내일배움카드", status: "대기", createdAt: "2026-08-31 14:10", message: "컴활 과정 상담 받고 싶습니다." }
    ]
  };


  const courseDetailDefaults = () => window.SANGA_COURSE_DETAILS || {};

  function enrichCourseRecord(course) {
    const fallback = courseDetailDefaults()?.[Number(course?.id)] || {};
    const merged = { ...fallback, ...course };
    const arrayKeys = ["heroPoints", "outcomes", "curriculum", "targets", "benefits", "faqs"];
    arrayKeys.forEach((key) => {
      if (!Array.isArray(course?.[key])) merged[key] = Array.isArray(fallback[key]) ? JSON.parse(JSON.stringify(fallback[key])) : [];
    });
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
      return saved ? JSON.parse(saved) : structuredClone(seed);
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

  function nextId(list) {
    return list.length ? Math.max(...list.map((x) => Number(x.id) || 0)) + 1 : 1;
  }

  function initSidebar() {
    const btn = qs("#adminMobileToggle");
    const sidebar = qs("#adminSidebar");
    btn?.addEventListener("click", () => sidebar?.classList.toggle("open"));
  }

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
      courseBody.innerHTML = db.courses.slice(0, 5).map(c => `
        <tr>
          <td>${escapeHtml(c.title)}</td>
          <td>${escapeHtml(c.category)}</td>
          <td><span class="badge ${c.status === "모집중" ? "badge-open" : "badge-closed"}">${escapeHtml(c.status)}</span></td>
        </tr>
      `).join("") || `<tr><td colspan="3">등록된 과정이 없습니다.</td></tr>`;
    }

    if (inquiryBody) {
      inquiryBody.innerHTML = db.inquiries.slice(0, 5).map(i => `
        <tr>
          <td>${escapeHtml(i.name)}</td>
          <td>${escapeHtml(i.course)}</td>
          <td><span class="badge badge-draft">${escapeHtml(i.status)}</span></td>
        </tr>
      `).join("") || `<tr><td colspan="3">상담 내역이 없습니다.</td></tr>`;
    }
  }

  function renderCourses() {
    const body = qs("#courseTableBody");
    if (!body) return;

    const keyword = (qs("#courseSearch")?.value || "").toLowerCase();
    const type = qs("#courseTypeFilter")?.value || "";

    const list = db.courses.filter(c => {
      const matchType = !type || c.type === type;
      const matchKeyword = !keyword || `${c.title} ${c.category} ${c.description}`.toLowerCase().includes(keyword);
      return matchType && matchKeyword;
    });

    body.innerHTML = list.map(c => `
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
    qs("#courseModal")?.classList.remove("open");
  }

  function saveCourse(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    let id = Number(data.id || 0);
    const isEdit = Boolean(id);
    const repeaters = collectCourseRepeaters();
    const payload = {
      ...data,
      ...repeaters,
      id: id || nextId(db.courses),
      published: data.published !== "false",
      lead: data.lead?.trim() || data.description?.trim() || ""
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
    const list = db[config.key];

    body.innerHTML = list.map(item => config.row(item)).join("") ||
      `<tr><td colspan="${config.colspan}"><div class="empty-state">등록된 데이터가 없습니다.</div></td></tr>`;
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
    renderSimpleTable({
      body: "#noticeTableBody",
      key: "notices",
      colspan: 6,
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
    renderSimpleTable({
      body: "#jobTableBody",
      key: "jobs",
      colspan: 6,
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
    renderSimpleTable({
      body: "#historyTableBody",
      key: "history",
      colspan: 5,
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

  function renderInquiries() {
    const body = qs("#inquiryTableBody");
    if (!body) return;

    body.innerHTML = db.inquiries.map(i => `
      <tr>
        <td>${i.id}</td>
        <td><strong>${escapeHtml(i.name)}</strong><br><small>${escapeHtml(i.phone)}</small></td>
        <td>${escapeHtml(i.course)}</td>
        <td>${escapeHtml(i.message || "")}</td>
        <td>${escapeHtml(i.createdAt || "")}</td>
        <td>
          <select data-inquiry-status="${i.id}">
            <option ${i.status === "대기" ? "selected" : ""}>대기</option>
            <option ${i.status === "상담중" ? "selected" : ""}>상담중</option>
            <option ${i.status === "완료" ? "selected" : ""}>완료</option>
          </select>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="6"><div class="empty-state">상담신청이 없습니다.</div></td></tr>`;

    qsa("[data-inquiry-status]").forEach(select => {
      select.addEventListener("change", () => {
        const item = db.inquiries.find(x => Number(x.id) === Number(select.dataset.inquiryStatus));
        if (!item) return;
        item.status = select.value;

        /*
         * [DB/API 연동 지점]
         * PUT /api/admin/inquiries/:id/status
         */
        saveDB(db);
        updateDashboardStats();
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

  qs("#courseSearch")?.addEventListener("input", renderCourses);
  qs("#courseTypeFilter")?.addEventListener("change", renderCourses);
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
