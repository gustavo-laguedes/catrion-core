(function () {
  const KEY = "catrion_active_tenant";
  const SLUG_KEY = "catrion_active_tenant_slug";
  const NAME_KEY = "catrion_active_tenant_name";

  function getUrlContext() {
    const url = new URL(window.location.href);

    return {
      tenantId: String(url.searchParams.get("tenant") || "").trim(),
      tenantSlug: String(url.searchParams.get("tenant_slug") || "").trim(),
      tenantName: String(url.searchParams.get("tenant_name") || "").trim()
    };
  }

  function getActiveTenantId() {
    return localStorage.getItem(KEY) || null;
  }

  function getActiveTenantSlug() {
    return localStorage.getItem(SLUG_KEY) || null;
  }

  function getActiveTenantName() {
    return localStorage.getItem(NAME_KEY) || null;
  }

  function setActiveTenantId(id) {
    if (!id) throw new Error("setActiveTenantId: tenant_id inválido.");
    localStorage.setItem(KEY, String(id));
    return String(id);
  }

  function setActiveTenantMeta({ tenantSlug = "", tenantName = "" } = {}) {
    if (tenantSlug) {
      localStorage.setItem(SLUG_KEY, String(tenantSlug));
    }

    if (tenantName) {
      localStorage.setItem(NAME_KEY, String(tenantName));
    }
  }

  function clearActiveTenantId() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SLUG_KEY);
    localStorage.removeItem(NAME_KEY);
  }

  function requireTenantId() {
    const id = getActiveTenantId();
    if (!id) throw new Error("Tenant não definido.");
    return id;
  }

  async function ensureActiveTenant() {
    const existing = getActiveTenantId();
    if (existing) {
      return existing;
    }

    const ctx = getUrlContext();

    if (ctx.tenantId) {
      setActiveTenantId(ctx.tenantId);
      setActiveTenantMeta({
        tenantSlug: ctx.tenantSlug,
        tenantName: ctx.tenantName
      });
      return ctx.tenantId;
    }

    throw new Error("Tenant não definido.");
  }

  window.CatrionTenant = {
    getActiveTenantId,
    getActiveTenantSlug,
    getActiveTenantName,
    setActiveTenantId,
    setActiveTenantMeta,
    clearActiveTenantId,
    requireTenantId,
    ensureActiveTenant,
  };
})();