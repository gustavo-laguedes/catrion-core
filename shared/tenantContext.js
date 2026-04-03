(function () {
  window.CatrionTenantContext = window.CatrionTenantContext || {};

  async function getTenantIdSafe() {
    if (!window.CatrionTenant) {
      throw new Error("CatrionTenant não encontrado. Garanta que shared/tenant.js foi carregado antes.");
    }

    if (typeof window.CatrionTenant.ensureActiveTenant === "function") {
      const tenantId = await window.CatrionTenant.ensureActiveTenant();
      if (!tenantId) {
        throw new Error("TENANT_MISSING: ensureActiveTenant() não conseguiu definir tenant ativo.");
      }
      return tenantId;
    }

    if (typeof window.CatrionTenant.requireTenantId === "function") {
      return window.CatrionTenant.requireTenantId();
    }

    throw new Error("CatrionTenant não tem ensureActiveTenant() nem requireTenantId().");
  }

  window.CatrionTenantContext.getTenantId = async function getTenantId() {
    return getTenantIdSafe();
  };

  window.CatrionTenantContext.withTenant = async function withTenant(fn) {
    const tenantId = await getTenantIdSafe();
    return fn(tenantId);
  };
})();