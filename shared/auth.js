// shared/auth.js (Supabase Auth + memberships)
(function () {
  // cache local só para o CORE (router/RBAC continuam simples)
  const SESSION_KEY = "core_session_v2";

  // Mantém suas permissões por role (igual à ideia atual)
  const roleAccess = {
  DEV:   ["home", "venda", "produtos", "caixa", "relatorios"],
  ADMIN: ["home", "venda", "produtos", "caixa", "relatorios"],
  FUNC:  ["home", "venda", "produtos", "caixa"],
};

  function normalizeRole(role) {
    const r = String(role || "FUNC").toUpperCase().trim();
    if (r === "DEV" || r === "ADMIN" || r === "FUNC") return r;
    return "FUNC";
  }

  function getCachedSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  }

  function setCachedSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearCachedSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getActiveTenantId() {
  if (window.CatrionTenant?.getActiveTenantId) return window.CatrionTenant.getActiveTenantId();
  // fallback (caso tenant.js não tenha carregado por algum motivo)
  return localStorage.getItem("catrion_active_tenant") || null;
}

function setActiveTenantId(tenantId) {
  if (!tenantId) {
    if (window.CatrionTenant?.clearActiveTenantId) return window.CatrionTenant.clearActiveTenantId();
    localStorage.removeItem("catrion_active_tenant");
    return null;
  }
  if (window.CatrionTenant?.setActiveTenantId) return window.CatrionTenant.setActiveTenantId(String(tenantId));
  localStorage.setItem("catrion_active_tenant", String(tenantId));
  return String(tenantId);
}

  function requireSb() {
    if (!window.sb) throw new Error("Supabase client (window.sb) não foi inicializado.");
    return window.sb;
  }

  async function fetchMembershipsForUser(userId) {
    const sb = requireSb();
    const { data, error } = await sb
      .from("memberships")
      .select("tenant_id, role")
      .eq("user_id", userId);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }

  function pickTenant(memberships) {
    // se já tem tenant salvo e ele existe na lista, mantém
    const saved = getActiveTenantId();
    if (saved && memberships.some(m => m.tenant_id === saved)) return saved;

    // senão, pega o primeiro tenant do usuário
    return memberships[0]?.tenant_id || null;
  }

  function pickRole(memberships) {
    // por enquanto: pega a role do primeiro vínculo (depois podemos evoluir pra role por tenant ativo)
    return normalizeRole(memberships[0]?.role || "FUNC");
  }

  async function bootstrap() {
    // Reconstrói o cache do Core se o Supabase tiver sessão
    const sb = requireSb();

    const { data: sessionData, error: sessErr } = await sb.auth.getSession();
    if (sessErr) {
      clearCachedSession();
      return { ok: false, message: "Falha ao ler sessão do Supabase.", error: sessErr };
    }

    const supaSession = sessionData?.session || null;
    if (!supaSession?.user?.id) {
      clearCachedSession();
      return { ok: false, message: "Sem sessão." };
    }

    const user = supaSession.user;
    const memberships = await fetchMembershipsForUser(user.id);

    if (!memberships.length) {
      // usuário existe, mas não pertence a nenhum tenant
      clearCachedSession();
      return { ok: false, message: "Usuário sem empresa vinculada (memberships vazia)." };
    }

    const tenantId = pickTenant(memberships);
    const role = pickRole(memberships);

    if (!tenantId) {
      clearCachedSession();
      return { ok: false, message: "Não foi possível determinar tenant ativo." };
    }

    // grava tenant ativo (para seleção futura)
    setActiveTenantId(tenantId);

    // grava cache do Core (para router/RBAC síncrono)
    const coreSession = {
      userId: user.id,
      email: user.email || null,
      role,
      tenantId,
      ts: Date.now(),
    };

    setCachedSession(coreSession);
    return { ok: true, session: coreSession };
  }

  async function login() {
  return {
    ok: false,
    message: "O CORE não utiliza mais login interno."
  };
}

  async function logout() {
    const sb = requireSb();
    try {
      await sb.auth.signOut();
    } catch {
      // mesmo se falhar, limpa cache local
    }
    clearCachedSession();
    // opcional: manter tenant salvo, ou limpar. Eu prefiro manter pra UX.
    // setActiveTenantId(null);
  }

  function isLoggedIn() {
    return !!getCachedSession();
  }

  function canAccess(pageName) {
  const s = getCachedSession();
  if (!s) return false;

  const allowed = roleAccess[s.role] || [];
  return allowed.includes(pageName);
}

  function getCurrentUser() {
    return getCachedSession();
  }

  function requireTenantId() {
  // fonte oficial
  if (window.CatrionTenant?.requireTenantId) return window.CatrionTenant.requireTenantId();

  // fallback
  const s = getCachedSession();
  const t = s?.tenantId || getActiveTenantId();
  if (!t) throw new Error("Nenhum tenant ativo definido.");
  return t;
}

  // Expondo para o resto do Core
  window.CoreAuth = {
    // auth
    login,
    logout,
    bootstrap,

    // estado
    isLoggedIn,
    canAccess,
    getCurrentUser,

    // tenant
    getActiveTenantId,
    setActiveTenantId,
    requireTenantId,
  };
})();