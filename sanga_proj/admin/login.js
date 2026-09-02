(function () {
  "use strict";

  const auth = window.SangaAdminAuth;
  if (auth?.isAuthenticated()) {
    window.location.replace("index.html");
    return;
  }

  const form = document.getElementById("adminLoginForm");
  const error = document.getElementById("loginError");
  const submit = document.getElementById("loginSubmit");
  const shell = document.getElementById("adminLoginShell");
  const loginIdInput = document.getElementById("loginId");
  const passwordInput = document.getElementById("loginPassword");

  [loginIdInput, passwordInput].forEach(function (input) {
    input?.addEventListener("input", function () {
      if (error.textContent) error.textContent = "";
      error.classList.remove("is-shake");
    });
  });

  form?.addEventListener("submit", function (event) {
    event.preventDefault();

    const loginId = loginIdInput.value.trim();
    const password = passwordInput.value;

    if (!loginId || !password) {
      error.textContent = "아이디와 비밀번호를 입력해 주세요.";
      error.classList.remove("is-shake");
      void error.offsetWidth;
      error.classList.add("is-shake");
      (!loginId ? loginIdInput : passwordInput).focus();
      return;
    }

    error.textContent = "";
    submit.disabled = true;
    submit.classList.add("is-loading");

    // TODO: Supabase 연동 시 signInWithPassword() 호출로 교체합니다.
    window.setTimeout(function () {
      submit.classList.remove("is-loading");
      submit.classList.add("is-success");

      window.setTimeout(function () {
        shell?.classList.add("is-success");
        auth?.login();

        window.setTimeout(function () {
          window.location.replace("index.html");
        }, 330);
      }, 320);
    }, 520);
  });
})();
