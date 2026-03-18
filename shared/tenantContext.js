/* shared/tenantContext.js
   Guardião: garante tenant ativo antes de qualquer operação.
*/
(function () {
  // expõe como singleton global
  window.CatrionTenantContext = window.CatrionTenantContext || {};

  async function getTenantIdSafe() {
    if (!window.CatrionTenant) {
      throw new Error("CatrionTenant não encontrado. Garanta que shared/tenant.js foi carregado antes.");
    }

    // Se você já tem ensureActiveTenant no tenant.js, usamos ela
    if (typeof window.CatrionTenant.ensureActiveTenant === "function") {
      const tenantId = await window.CatrionTenant.ensureActiveTenant();
      if (!tenantId) throw new Error("TENANT_MISSING: ensureActiveTenant() não conseguiu definir tenant ativo.");
      return tenantId;
    }

    // fallback: exige que já exista tenant setado
    if (typeof window.CatrionTenant.requireTenantId === "function") {
      return window.CatrionTenant.requireTenantId();
    }

    throw new Error("CatrionTenant não tem ensureActiveTenant() nem requireTenantId().");
  }

  // padrão principal: execute sua operação dentro disso
  window.CatrionTenantContext.withTenant = async function withTenant(fn) {
    const tenantId = await getTenantIdSafe();
    return fn(tenantId);
  };
})();