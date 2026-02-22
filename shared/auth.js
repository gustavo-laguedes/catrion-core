// shared/auth.js
(function () {
  const SESSION_KEY = "core_session_v1";
  const USERS_KEY = "core_users"; // mesma key usada no app.js (Configurações > Usuários)

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  }

  function setSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function normalizeRole(role) {
    const r = String(role || "FUNC").toUpperCase().trim();
    if (r === "DEV" || r === "ADMIN" || r === "FUNC") return r;
    return "FUNC";
  }

  function findUser(username, password) {
    const u = String(username || "").trim();
    const p = String(password || "").trim();
    if (!u || !p) return null;

    const list = loadUsers();

    // IMPORTANT: no seu cadastro hoje o campo é "name" e a senha é "pass"
    // então username precisa bater EXATAMENTE com o name cadastrado.
    return list.find(x =>
      x &&
      x.active !== false &&
      String(x.name || "").trim() === u &&
      String(x.pass || "").trim() === p
    ) || null;
  }

  function login(username, password) {
    const u = findUser(username, password);
    if (!u) return { ok: false, message: "Usuário ou senha inválidos." };

    const session = {
      userId: u.id || `u_${String(u.name || "user").toLowerCase()}`,
      name: String(u.name || "Usuário"),
      role: normalizeRole(u.role),
      ts: Date.now()
    };

    setSession(session);
    return { ok: true, session };
  }

  function logout() {
    clearSession();
  }

  function isLoggedIn() {
    return !!getSession();
  }

  // Regras de acesso (RBAC simples) — mantém o que você já tinha
  const roleAccess = {
    DEV:    ["home", "venda", "produtos", "caixa", "relatorios", "login"],
    ADMIN:  ["home", "venda", "produtos", "caixa", "relatorios", "login"],
    FUNC:   ["home", "venda", "produtos", "caixa", "login"],
  };

  function canAccess(pageName) {
    if (pageName === "login") return true;

    const s = getSession();
    if (!s) return false;

    const allowed = roleAccess[s.role] || [];
    return allowed.includes(pageName);
  }

  function getCurrentUser(){
    return getSession();
  }

  window.CoreAuth = {
    login, logout,
    getSession, isLoggedIn,
    canAccess,
    getCurrentUser,
  };
})();
