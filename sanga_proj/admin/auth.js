(function () {
  "use strict";

  const AUTH_KEY = "sanga_admin_mock_auth_v1";
  const isLoginPage = /(^|\/)login\.html(?:$|[?#])/.test(window.location.pathname + window.location.search);

  function isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === "authenticated";
  }

  function login() {
    localStorage.setItem(AUTH_KEY, "authenticated");
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.replace("login.html");
  }

  window.SangaAdminAuth = { isAuthenticated, login, logout };

  if (!isLoginPage && !isAuthenticated()) {
    window.location.replace("login.html");
    return;
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-admin-logout]").forEach(function (button) {
      button.addEventListener("click", logout);
    });
  });
})();
