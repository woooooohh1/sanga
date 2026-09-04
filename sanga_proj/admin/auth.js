(function () {
  "use strict";

  const SESSION_KEY = "sanga_admin_session_v1";
  const isLoginPage = /(^|\/)login\.html(?:$|[?#])/.test(location.pathname + location.search);
  let client = null;
  let currentUser = null;

  function getConfig() {
    return window.SANGA_SUPABASE_CONFIG || {};
  }

  function getClient() {
    if (client) return client;
    const cfg = getConfig();
    if (!window.supabase?.createClient || !cfg.url || !cfg.publishableKey) return null;
    client = window.supabase.createClient(cfg.url, cfg.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return client;
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function setSession(data, remember) {
    clearSession();
    const store = remember ? localStorage : sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify(data));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
  }

  function token() { return getSession()?.token || ""; }
  function isAuthenticated() {
    const s = getSession();
    if (!s?.token || !s?.expires_at) return false;
    return new Date(s.expires_at).getTime() > Date.now();
  }

  async function rpc(name, args) {
    const c = getClient();
    if (!c) throw new Error("Supabase 연결정보를 확인해 주세요.");
    const { data, error } = await c.rpc(name, args);
    if (error) throw error;
    return data;
  }

  async function login(loginId, password, remember) {
    const data = await rpc("admin_login", {
      p_login_id: loginId,
      p_password: password,
      p_user_agent: navigator.userAgent
    });
    if (!data?.ok) throw new Error(data?.message || "로그인에 실패했습니다.");
    setSession({ token: data.token, expires_at: data.expires_at, user: data.user }, remember);
    currentUser = data.user;
    return data.user;
  }

  async function me() {
    if (!isAuthenticated()) return null;
    try {
      const data = await rpc("admin_me", { p_token: token() });
      if (!data?.ok) throw new Error("세션 확인 실패");
      currentUser = data.user;
      return currentUser;
    } catch (e) {
      clearSession();
      return null;
    }
  }

  async function api(action, payload) {
    if (!isAuthenticated()) throw new Error("관리자 로그인이 필요합니다.");
    const data = await rpc("admin_api", {
      p_token: token(),
      p_action: action,
      p_payload: payload || {}
    });
    if (!data?.ok) throw new Error(data?.message || "관리자 API 요청에 실패했습니다.");
    return data.data;
  }

  async function logout() {
    const t = token();
    try { if (t) await rpc("admin_logout", { p_token: t }); } catch (_) {}
    clearSession();
    location.replace("login.html");
  }

  function updateUserUI(user) {
    if (!user) return;
    document.querySelectorAll(".admin-user strong").forEach(el => el.textContent = user.name || user.login_id || "관리자");
    document.querySelectorAll(".admin-user small").forEach(el => el.textContent = (user.roles || []).join(", ") || "Administrator");
  }

  window.SangaAdminAuth = { getClient, getSession, token, isAuthenticated, login, logout, me, api, clearSession };

  document.addEventListener("DOMContentLoaded", async function () {
    document.querySelectorAll("[data-admin-logout]").forEach(btn => btn.addEventListener("click", logout));
    if (isLoginPage) return;
    if (!isAuthenticated()) { location.replace("login.html"); return; }
    const user = await me();
    if (!user) { location.replace("login.html"); return; }
    updateUserUI(user);
    document.dispatchEvent(new CustomEvent("sanga:admin-ready", { detail: user }));
  });
})();
