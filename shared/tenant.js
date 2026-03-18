(function () {
  const KEY = "catrion_active_tenant";

  function getActiveTenantId() {
    return localStorage.getItem(KEY) || null;
  }

  function setActiveTenantId(id) {
    if (!id) throw new Error("setActiveTenantId: tenant_id inválido.");
    localStorage.setItem(KEY, id);
    return id;
  }

  function clearActiveTenantId() {
    localStorage.removeItem(KEY);
  }

  function requireTenantId() {
    const id = getActiveTenantId();
    if (!id) throw new Error("Tenant não definido.");
    return id;
  }

  /**
   * Garante que exista tenant ativo.
   * - Se já existe no localStorage, retorna.
   * - Se não existe, busca em memberships do usuário logado:
   *    - Se tiver 1 tenant -> seta e retorna
   *    - Se tiver 0 -> erro
   *    - Se tiver >1 -> erro (mais pra frente a gente cria tela de seleção)
   */
  async function ensureActiveTenant() {
    const existing = getActiveTenantId();
if (existing) {
  // Confere se esse tenant ainda existe nas memberships do user
  if (!window.sb) throw new Error("Supabase client (window.sb) não inicializado.");

  const { data: userRes, error: userErr } = await window.sb.auth.getUser();
  if (userErr) throw userErr;

  const user = userRes?.user;
  if (!user) throw new Error("Usuário não autenticado.");

  const { data: check, error: checkErr } = await window.sb
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("tenant_id", existing)
    .limit(1);

  if (checkErr) throw checkErr;

  if (check && check.length > 0) return existing;

  // tenant salvo não é mais válido
  clearActiveTenantId();
}

    if (!window.sb) throw new Error("Supabase client (window.sb) não inicializado.");

    const { data: userRes, error: userErr } = await window.sb.auth.getUser();
    if (userErr) throw userErr;

    const user = userRes?.user;
    if (!user) throw new Error("Usuário não autenticado.");

    const { data, error } = await window.sb
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", user.id);

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error("Usuário não possui membership (nenhum tenant vinculado).");
    }

    if (data.length > 1) {
      // Por enquanto a gente não escolhe automaticamente,
      // senão você pode “cair” no tenant errado.
      throw new Error("Usuário possui múltiplos tenants. Falta seleção de tenant.");
    }

    return setActiveTenantId(data[0].tenant_id);
  }

  // Expor API
  window.CatrionTenant = {
    getActiveTenantId,
    setActiveTenantId,
    clearActiveTenantId,
    requireTenantId,
    ensureActiveTenant,
  };
})();