(function () {
  "use strict";

  /* =========================================================
   * 공통 UI 인터랙션 전용 스크립트
   * ---------------------------------------------------------
   * 중요:
   * - 페이지의 실제 콘텐츠/레이아웃은 각 HTML 파일에 직접 작성합니다.
   * - 이 파일에서는 메뉴, 모달, 스크롤 애니메이션, 필터 등
   *   "동작"만 담당합니다.
   * - DB/API 연동 시 데이터 렌더링 로직은 별도 api.js 또는
   *   각 백엔드 템플릿(JSP/PHP/Thymeleaf 등)로 분리하는 것을 권장합니다.
   * ========================================================= */

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  function initMobileMenu() {
    const btn = qs("#mobileMenuBtn");
    const nav = qs("#mainNav");
    if (!btn || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle("open", open);
      btn.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
      document.body.classList.toggle("mobile-nav-open", open);
    };

    btn.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
    qsa("a", nav).forEach((link) => link.addEventListener("click", () => setOpen(false)));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) setOpen(false);
    });
  }

  function initGlobalMotion() {
    const reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealEls = qsa("[data-reveal]:not(.is-revealed)");
    const staggerEls = qsa("[data-stagger]:not(.is-revealed)");
    const legacyRevealEls = qsa(".reveal-up:not(.is-visible)");

    if (reduced || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-revealed"));
      staggerEls.forEach((el) => el.classList.add("is-revealed"));
      legacyRevealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        if (entry.target.classList.contains("reveal-up")) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.add("is-revealed");
        }

        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

    revealEls.forEach((el) => observer.observe(el));
    staggerEls.forEach((el) => observer.observe(el));
    legacyRevealEls.forEach((el) => observer.observe(el));
  }

  function initInquiryModal() {
    const modal = qs("#inquiryModal");
    const form = qs("#inquiryForm");
    const toast = qs("#toast");
    if (!modal) return;

    const openModal = () => {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      qs("input, select, textarea, button", modal)?.focus();
    };

    const closeModal = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    };

    qsa("[data-open-inquiry]").forEach((btn) => btn.addEventListener("click", openModal));
    qsa("[data-close-modal]", modal).forEach((btn) => btn.addEventListener("click", closeModal));

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      /*
       * [DB/API 연동 지점 - 상담 신청]
       * 실제 운영에서는 아래 임시 처리 대신 API 호출로 교체하세요.
       *
       * 예시:
       * const payload = Object.fromEntries(new FormData(form).entries());
       * const response = await fetch("/api/inquiries", {
       *   method: "POST",
       *   headers: { "Content-Type": "application/json" },
       *   body: JSON.stringify(payload)
       * });
       */
      const payload = Object.fromEntries(new FormData(form).entries());
      const DB_KEY = "sanga_admin_demo_v2";
      try {
        const saved = localStorage.getItem(DB_KEY);
        const db = saved ? JSON.parse(saved) : { inquiries: [] };
        if (!Array.isArray(db.inquiries)) db.inquiries = [];
        const nextId = db.inquiries.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        db.inquiries.unshift({
          id: nextId,
          name: String(payload.name || "").trim(),
          phone: String(payload.phone || "").trim(),
          course: String(payload.course || "상담 과정 미지정").trim(),
          message: String(payload.message || "").trim(),
          consultationNote: "",
          status: "대기",
          createdAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
        });
        localStorage.setItem(DB_KEY, JSON.stringify(db));
      } catch (error) {
        console.warn("상담신청 데모 저장 실패", error);
      }

      closeModal();

      if (toast) {
        toast.textContent = "상담 신청이 접수되었습니다.";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2400);
      }
      form.reset();
    });
  }

  function initCourseFilter() {
    const list = qs("#courseList");
    const search = qs("#courseSearch");
    const category = qs("#categoryFilter");
    if (!list || (!search && !category)) return;

    const cards = qsa("[data-course-card]", list);

    const filter = () => {
      const keyword = (search?.value || "").trim().toLowerCase();
      const categoryValue = category?.value || "";

      let visibleCount = 0;
      cards.forEach((card) => {
        const cardCategory = card.dataset.category || "";
        const haystack = (card.textContent || "").toLowerCase();

        const matchCategory = !categoryValue || cardCategory === categoryValue;
        const matchKeyword = !keyword || haystack.includes(keyword);
        const visible = matchCategory && matchKeyword;

        card.hidden = !visible;
        if (visible) visibleCount++;
      });

      const empty = qs("#courseEmpty");
      if (empty) empty.hidden = visibleCount !== 0;
    };

    search?.addEventListener("input", filter);
    category?.addEventListener("change", filter);
  }

  function initAcademyHistory() {
    const stage = qs("#historyStage");
    const fill = qs("#historyRailFill");
    const nodes = qsa(".history-node");
    const counters = qsa("[data-count]");

    if (!stage || !fill) return;

    const reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      fill.style.height = "100%";
      counters.forEach((el) => el.textContent = el.dataset.count || "0");
      return;
    }

    const historyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { threshold: 0.38 });

    nodes.forEach((node) => historyObserver.observe(node));

    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const end = Math.max(0, Number(el.dataset.count) || 0);
        const start = performance.now();
        const duration = 850;

        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * eased);
          if (p < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.6 });

    counters.forEach((el) => countObserver.observe(el));

    let raf = 0;
    const updateTimeline = () => {
      raf = 0;
      const rect = stage.getBoundingClientRect();
      const viewportMid = window.innerHeight * 0.58;
      const ratio = Math.max(
        0,
        Math.min(1, (viewportMid - rect.top) / Math.max(1, rect.bottom - rect.top))
      );

      fill.style.height = `${(ratio * 100).toFixed(2)}%`;

      let nearest = null;
      let nearestDist = Infinity;

      nodes.forEach((node) => {
        const r = node.getBoundingClientRect();
        const dist = Math.abs((r.top + r.height / 2) - viewportMid);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = node;
        }
      });

      nodes.forEach((node) => {
        node.classList.toggle("is-highlight", node === nearest && nearestDist < 180);
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(updateTimeline);
    };

    updateTimeline();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }

  function initCourseDetailButtons() {
    qsa("[data-course-detail]").forEach((btn) => {
      btn.addEventListener("click", () => {
        /*
         * [DB/API 연동 지점 - 과정 상세]
         * 운영에서는 data-course-id 값을 사용해 상세 API를 조회하거나
         * course-detail.html?id=123 형태로 페이지 이동시키세요.
         *
         * 예시:
         * location.href = `/course-detail.html?id=${btn.dataset.courseId}`;
         */
        const id = btn.dataset.courseId;
        if (id) location.href = `course-detail.html?id=${encodeURIComponent(id)}`;
      });
    });
  }

  initMobileMenu();
  initGlobalMotion();
  initInquiryModal();
  initCourseFilter();
  initAcademyHistory();
  initCourseDetailButtons();
})();
