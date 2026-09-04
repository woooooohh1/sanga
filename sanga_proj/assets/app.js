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

  function enhancePublicSelect(select) {
    if (!select || select.dataset.customized === "true") return;

    select.dataset.customized = "true";
    select.classList.add("custom-select-native");

    const wrap = document.createElement("div");
    wrap.className = "custom-select";
    if (select.closest(".toolbar")) wrap.classList.add("custom-select-toolbar");
    if (select.closest(".form-grid")) wrap.classList.add("custom-select-form");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.disabled = select.disabled;

    const selectLabel = select.getAttribute("aria-label") ||
      select.closest("label")?.querySelector(".sr-only")?.textContent?.trim() ||
      select.name || select.id || "선택";
    trigger.setAttribute("aria-label", selectLabel);

    const value = document.createElement("span");
    value.className = "custom-select-value";
    const arrow = document.createElement("span");
    arrow.className = "custom-select-arrow";
    arrow.setAttribute("aria-hidden", "true");
    trigger.append(value, arrow);

    const list = document.createElement("div");
    list.className = "custom-select-list";
    list.setAttribute("role", "listbox");
    list.tabIndex = -1;

    const close = () => {
      wrap.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    };

    const sync = () => {
      const selected = select.options[select.selectedIndex] || select.options[0];
      value.textContent = selected?.textContent || "선택해 주세요";
      trigger.disabled = select.disabled;
      qsa('.custom-select-option', list).forEach((option) => {
        const active = option.dataset.value === select.value;
        option.classList.toggle("is-selected", active);
        option.setAttribute("aria-selected", String(active));
      });
    };

    const open = () => {
      if (trigger.disabled || !list.children.length) return;
      qsa('.custom-select.is-open').forEach((other) => {
        if (other !== wrap) {
          other.classList.remove('is-open');
          qs('.custom-select-trigger', other)?.setAttribute('aria-expanded', 'false');
        }
      });
      wrap.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      const active = qs('.custom-select-option.is-selected', list) || qs('.custom-select-option:not(:disabled)', list);
      active?.focus();
    };

    const rebuild = () => {
      const wasOpen = wrap.classList.contains("is-open");
      list.replaceChildren();

      [...select.options].forEach((nativeOption) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "custom-select-option";
        option.dataset.value = nativeOption.value;
        option.textContent = nativeOption.textContent;
        option.setAttribute("role", "option");
        option.disabled = nativeOption.disabled;

        option.addEventListener("click", () => {
          if (nativeOption.disabled) return;
          select.value = nativeOption.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          close();
          trigger.focus();
        });

        option.addEventListener("keydown", (e) => {
          const options = qsa('.custom-select-option:not(:disabled)', list);
          const index = options.indexOf(option);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            options[(index + 1) % options.length]?.focus();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            options[(index - 1 + options.length) % options.length]?.focus();
          } else if (e.key === "Home") {
            e.preventDefault();
            options[0]?.focus();
          } else if (e.key === "End") {
            e.preventDefault();
            options.at(-1)?.focus();
          } else if (e.key === "Escape" || e.key === "Tab") {
            close();
            if (e.key === "Escape") {
              e.preventDefault();
              trigger.focus();
            }
          }
        });
        list.appendChild(option);
      });

      sync();
      if (wasOpen) open();
    };

    select.parentNode.insertBefore(wrap, select.nextSibling);
    wrap.append(select, trigger, list);

    trigger.addEventListener("click", () => {
      if (wrap.classList.contains("is-open")) close();
      else open();
    });
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      } else if (e.key === "Escape") {
        close();
      }
    });
    select.addEventListener("change", sync);
    select.form?.addEventListener("reset", () => setTimeout(sync, 0));

    const optionObserver = new MutationObserver(() => rebuild());
    optionObserver.observe(select, { childList: true, subtree: true, characterData: true });

    rebuild();
  }

  function initPublicSelects() {
    qsa("select").forEach(enhancePublicSelect);

    const selectObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches?.("select")) enhancePublicSelect(node);
          qsa("select", node).forEach(enhancePublicSelect);
        });
      });
    });
    selectObserver.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("click", (e) => {
      qsa('.custom-select.is-open').forEach((wrap) => {
        if (!wrap.contains(e.target)) {
          wrap.classList.remove('is-open');
          qs('.custom-select-trigger', wrap)?.setAttribute('aria-expanded', 'false');
        }
      });
    });
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

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      const payload = Object.fromEntries(new FormData(form).entries());
      if (submit) submit.disabled = true;
      try {
        if (!window.SangaPublicData?.submitInquiry) throw new Error("상담 API 연결정보를 확인해 주세요.");
        await window.SangaPublicData.submitInquiry(payload);
        closeModal();
        if (toast) {
          toast.textContent = "상담 신청이 접수되었습니다.";
          toast.classList.add("show");
          setTimeout(() => toast.classList.remove("show"), 2400);
        }
        form.reset();
      } catch (error) {
        console.error("상담신청 저장 실패", error);
        if (toast) {
          toast.textContent = error?.message || "상담 신청 중 오류가 발생했습니다.";
          toast.classList.add("show");
          setTimeout(() => toast.classList.remove("show"), 3000);
        }
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

    function initCourseFilter() {
    if (window.SangaPublicData) return;
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

  let historyCleanup = null;
  function initAcademyHistory() {
    if (historyCleanup) { historyCleanup(); historyCleanup = null; }

    const section = qs("#history");
    const toggle = qs("#historyToggle");
    const details = qs("#historyDetails");
    const revealItems = section ? qsa("[data-history-reveal]", section) : [];
    if (!section) return;

    const reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanup = [];

    if (reduced || !("IntersectionObserver" in window)) {
      revealItems.forEach((el) => el.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -7%" });
      revealItems.forEach((el, i) => {
        el.style.setProperty("--history-delay", `${Math.min(i, 6) * 55}ms`);
        observer.observe(el);
      });
      cleanup.push(() => observer.disconnect());
    }

    if (toggle && details) {
      const label = qs(".history-toggle-label", toggle);
      const onToggle = () => {
        const open = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(open));
        details.setAttribute("aria-hidden", String(!open));
        section.classList.toggle("is-history-expanded", open);
        if (label) label.textContent = open ? "연혁 접기" : "전체 연혁 보기";

        if (open && !reduced) {
          qsa("[data-history-reveal]", details).forEach((el, i) => {
            window.setTimeout(() => el.classList.add("is-visible"), Math.min(i, 8) * 45);
          });
        }
      };
      toggle.addEventListener("click", onToggle);
      cleanup.push(() => toggle.removeEventListener("click", onToggle));
    }

    historyCleanup = () => cleanup.forEach((fn) => fn());
  }
  window.addEventListener("sanga:history-rendered", initAcademyHistory);

  let statCounterObserver = null;
  function initStatCounters() {
    if (statCounterObserver) { statCounterObserver.disconnect(); statCounterObserver = null; }
    const counters = qsa(".stat-value[data-count]");
    if (!counters.length) return;

    const reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setFinal = (el) => {
      const target = Number(el.dataset.count || 0);
      el.textContent = Number.isFinite(target) ? target.toLocaleString("ko-KR") : "0";
      el.dataset.counted = "true";
    };

    const animate = (el) => {
      if (el.dataset.counted === "true") return;
      const target = Number(el.dataset.count || 0);
      if (!Number.isFinite(target)) { setFinal(el); return; }

      el.dataset.counted = "true";
      const duration = 900;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased).toLocaleString("ko-KR");
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (reduced || !("IntersectionObserver" in window)) {
      counters.forEach(setFinal);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35, rootMargin: "0px 0px -5% 0px" });
    statCounterObserver = observer;

    counters.forEach((el) => observer.observe(el));
  }
  window.addEventListener("sanga:stats-rendered", initStatCounters);

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
  initPublicSelects();
  initInquiryModal();
  initCourseFilter();
  initAcademyHistory();
  initStatCounters();
  initCourseDetailButtons();
})();
