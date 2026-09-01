(function () {
  "use strict";

  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id") || 1);
  const isPreview = params.get("preview") === "1";
  const base = window.SANGA_COURSE_DETAILS?.[id] || null;

  function loadAdminState() {
    try {
      const raw = localStorage.getItem("sanga_admin_demo_v1");
      if (!raw) return { exists: false, course: null };
      const db = JSON.parse(raw);
      return {
        exists: true,
        course: db?.courses?.find((item) => Number(item.id) === id) || null
      };
    } catch {
      return { exists: false, course: null };
    }
  }

  function showUnavailable(message) {
    document.title = "과정 안내 | 상아컴퓨터학원";
    const main = qs("main");
    if (main) main.innerHTML = `
      <section class="detail-section" style="min-height:62vh;display:grid;place-items:center">
        <div class="container" style="text-align:center;max-width:720px">
          <span class="chip">과정 안내</span>
          <h1 style="margin:20px 0 12px">${esc(message)}</h1>
          <p style="color:#667085;margin-bottom:26px">과정 목록에서 현재 모집 중인 교육과정을 확인해 주세요.</p>
          <a class="btn btn-primary" href="index.html">홈으로 이동</a>
        </div>
      </section>`;
    qs(".detail-anchor-wrap")?.remove();
    qs(".detail-bottom-cta")?.remove();
  }

  const adminState = loadAdminState();
  if (adminState.exists && !adminState.course) {
    showUnavailable("등록되지 않았거나 삭제된 과정입니다.");
    return;
  }

  const adminCourse = adminState.course;
  if (adminCourse && (adminCourse.published === false || adminCourse.published === "false") && !isPreview) {
    showUnavailable("현재 비공개 상태인 과정입니다.");
    return;
  }

  function mergeCourseData(defaultCourse, savedCourse) {
    if (!savedCourse) return defaultCourse;
    const merged = { ...(defaultCourse || {}), ...savedCourse };
    const defaultVersion = Number(defaultCourse?.contentVersion || 0);
    const savedVersion = Number(savedCourse?.detailContentVersion || 0);
    const useLatestDefaultDetail = savedCourse?.detailCustomized !== true && defaultVersion > savedVersion;

    if (useLatestDefaultDetail && defaultCourse) {
      ["lead", "eyebrow", "badge", "heroPoints", "outcomes", "curriculum", "targets", "benefits", "faqs"].forEach((key) => {
        if (defaultCourse[key] !== undefined) merged[key] = defaultCourse[key];
      });
    }
    return merged;
  }

  const course = mergeCourseData(base, adminCourse);
  if (!course) {
    showUnavailable("과정 정보를 찾을 수 없습니다.");
    return;
  }

  if (isPreview && adminCourse?.published === false) {
    const previewBar = document.createElement("div");
    previewBar.className = "admin-preview-bar";
    previewBar.textContent = "관리자 미리보기 · 현재 비공개 과정입니다.";
    document.body.prepend(previewBar);
    document.body.classList.add("has-admin-preview-bar");
  }

  const typeLabels = {
    unemployed: "실업자 내일배움카드",
    worker: "재직자 국비과정",
    general: "일반과정"
  };
  const backPages = {
    unemployed: "unemployed.html",
    worker: "worker.html",
    general: "general.html"
  };

  document.title = `${course.title} | 상아컴퓨터학원`;
  const desc = qs('meta[name="description"]');
  if (desc) desc.content = course.lead || course.description || course.title;

  qsa("[data-course-title]").forEach(el => el.textContent = course.title || "과정 상세");
  qsa("[data-course-category]").forEach(el => el.textContent = course.category || "과정");
  qsa("[data-course-status]").forEach(el => {
    el.textContent = course.status || "상시접수";
    el.className = `status ${course.status === "마감" ? "closed" : course.status === "상시접수" ? "always" : "open"}`;
  });
  qsa("[data-course-lead]").forEach(el => el.textContent = course.lead || course.description || "과정 상세 내용을 확인하세요.");
  qsa("[data-course-period]").forEach(el => el.textContent = course.period || "상담 문의");
  qsa("[data-course-time]").forEach(el => el.textContent = course.time || "상담 문의");
  qsa("[data-course-support]").forEach(el => el.textContent = course.support || "상담 문의");
  qsa("[data-course-tuition]").forEach(el => el.textContent = course.tuition || "상담 문의");
  qsa("[data-course-type]").forEach(el => el.textContent = typeLabels[course.type] || "교육과정");
  qsa("[data-course-badge]").forEach(el => el.textContent = course.badge || course.category || "과정 안내");
  qsa("[data-course-eyebrow]").forEach(el => el.textContent = course.eyebrow || `${typeLabels[course.type] || "교육과정"} · ${course.category || "과정"}`);

  const backLink = qs("[data-course-back]");
  if (backLink) {
    backLink.href = backPages[course.type] || "index.html";
    backLink.textContent = `${typeLabels[course.type] || "과정"} 목록`;
  }

  const heroPoints = qs("#detailHeroPoints");
  if (heroPoints) heroPoints.innerHTML = (course.heroPoints || []).map(point => `<span>${esc(point)}</span>`).join("");

  const outcomes = qs("#detailOutcomes");
  if (outcomes) outcomes.innerHTML = (course.outcomes || []).map(([num, title, text], index) => `
    <article class="detail-outcome-card">
      <span class="detail-number">${esc(num || String(index + 1).padStart(2, "0"))}</span>
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
    </article>`).join("");

  const curriculum = qs("#detailCurriculum");
  if (curriculum) curriculum.innerHTML = (course.curriculum || []).map(([step, title, items], index) => `
    <article class="curriculum-step ${index === 0 ? "is-open" : ""}">
      <button class="curriculum-step-head" type="button" aria-expanded="${index === 0 ? "true" : "false"}">
        <span class="curriculum-step-no">${esc(step || `STEP ${index + 1}`)}</span>
        <strong>${esc(title)}</strong>
        <span class="curriculum-toggle" aria-hidden="true">+</span>
      </button>
      <div class="curriculum-step-body">
        <ul>${(items || []).map(item => `<li>${esc(item)}</li>`).join("")}</ul>
      </div>
    </article>`).join("");

  qsa(".curriculum-step-head").forEach(btn => btn.addEventListener("click", () => {
    const card = btn.closest(".curriculum-step");
    const open = card.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  }));

  const targets = qs("#detailTargets");
  if (targets) targets.innerHTML = (course.targets || []).map((item, i) => `
    <li><span>${String(i + 1).padStart(2, "0")}</span><strong>${esc(item)}</strong></li>`).join("");

  const benefits = qs("#detailBenefits");
  if (benefits) benefits.innerHTML = (course.benefits || []).map(([title, text]) => `
    <article class="detail-benefit-card">
      <div class="detail-benefit-icon" aria-hidden="true">✓</div>
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
    </article>`).join("");

  const faq = qs("#detailFaq");
  if (faq) faq.innerHTML = (course.faqs || []).map(([question, answer]) => `
    <article class="detail-faq-item">
      <button type="button" aria-expanded="false"><span><b>Q</b>${esc(question)}</span><span class="faq-plus">+</span></button>
      <div class="detail-faq-answer"><p>${esc(answer)}</p></div>
    </article>`).join("");

  qsa(".detail-faq-item > button").forEach(btn => btn.addEventListener("click", () => {
    const item = btn.closest(".detail-faq-item");
    const open = item.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  }));

  const statusClosed = course.status === "마감";
  qsa("[data-course-cta]").forEach(btn => {
    if (statusClosed) btn.textContent = "다음 일정 상담받기";
    btn.addEventListener("click", () => {
      const select = qs('#inquiryForm select[name="course"]');
      if (select) {
        const label = typeLabels[course.type];
        const option = [...select.options].find(opt => opt.textContent.includes(label));
        if (option) select.value = option.value;
      }
      const message = qs('#inquiryForm textarea[name="message"]');
      if (message && !message.value) message.value = `[${course.title}] 과정 상담을 받고 싶습니다.`;
      document.querySelector("[data-open-inquiry]")?.click();
    });
  });

  const navLinks = qsa(".detail-anchor-nav a");
  const sections = navLinks.map(link => qs(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`));
    }, { rootMargin: "-18% 0px -68% 0px", threshold: [0.05, 0.2, 0.5] });
    sections.forEach(section => observer.observe(section));
  }
})();
