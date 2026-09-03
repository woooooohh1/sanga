(function () {
  "use strict";
  const auth = window.SangaAdminAuth;
  const form = document.getElementById("adminLoginForm");
  const error = document.getElementById("loginError");
  const submit = document.getElementById("loginSubmit");
  const shell = document.getElementById("adminLoginShell");
  const loginIdInput = document.getElementById("loginId");
  const passwordInput = document.getElementById("loginPassword");
  const rememberInput = document.querySelector('input[name="remember"]');

  if (auth?.isAuthenticated()) { location.replace("index.html"); return; }

  [loginIdInput,passwordInput].forEach(input => input?.addEventListener("input", () => {
    error.textContent=""; error.classList.remove("is-shake");
  }));

  form?.addEventListener("submit", async function (event) {
    event.preventDefault();
    const loginId = loginIdInput.value.trim();
    const password = passwordInput.value;
    if (!loginId || !password) {
      error.textContent = "아이디와 비밀번호를 입력해 주세요.";
      error.classList.add("is-shake");
      (!loginId ? loginIdInput : passwordInput).focus();
      return;
    }
    error.textContent=""; submit.disabled=true; submit.classList.add("is-loading");
    try {
      await auth.login(loginId,password,Boolean(rememberInput?.checked));
      submit.classList.remove("is-loading"); submit.classList.add("is-success");
      shell?.classList.add("is-success");
      setTimeout(() => location.replace("index.html"), 250);
    } catch (e) {
      submit.disabled=false; submit.classList.remove("is-loading");
      error.textContent = e?.message || "로그인에 실패했습니다.";
      error.classList.remove("is-shake"); void error.offsetWidth; error.classList.add("is-shake");
    }
  });
})();
