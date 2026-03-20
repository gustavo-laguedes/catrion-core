  // shared/store/products.js
(function () {
  function assertClient() {
    if (!window.sb) throw new Error("Supabase client não inicializado. window.sb está indefinido.");
  }

  // DB -> App
  function dbToApp(r) {
    if (!r) return null;
    return {
  id: r.id,
  name: r.name ?? "",
  sku: r.sku ?? "",
  unit: r.unit ?? "UN",

  // taxonomia
  cat: r.cat ?? "",
  sub1: r.sub1 ?? "",
  sub2: r.sub2 ?? "",
  sub3: r.sub3 ?? "",

  priceCents: Number(r.price_cents ?? 0),
  costCents: Number(r.cost_cents ?? 0),
  stockOnHand: Number(r.stock_on_hand ?? 0),
  stockMin: Number(r.stock_min ?? 0),

  status: r.status ?? "active",
  imageData: r.image_data ?? null,
  createdAt: r.created_at ?? null,
  updatedAt: r.updated_at ?? null,
};
  }

  // App -> DB
  // IMPORTANTÍSSIMO: não mandar "id" no INSERT se não existir.
  function appToDb(p) {
  const out = {
    // IMPORTANTÍSSIMO:
    // aqui pode ter nulls se p vier incompleto, mas update NÃO vai usar essa função mais
    name: p?.name ?? null,
    sku: p?.sku ?? null,
    unit: p?.unit ?? "UN",

    cat: p?.cat ?? "",
    sub1: p?.sub1 ?? "",
    sub2: p?.sub2 ?? "",
    sub3: p?.sub3 ?? "",

    price_cents: Number(p?.priceCents ?? 0),
    cost_cents: Number(p?.costCents ?? 0),
    stock_on_hand: Number(p?.stockOnHand ?? 0),
    stock_min: Number(p?.stockMin ?? 0),

    status: p?.status ?? "active",
    image_data: p?.imageData ?? null,
  };

  if (p?.id) out.id = p.id;
  return out;
}

function appPatchToDb(patch) {
  const out = {};

  if ("name" in patch) out.name = patch.name;
  if ("sku" in patch) out.sku = patch.sku;
  if ("unit" in patch) out.unit = patch.unit;

  if ("cat" in patch) out.cat = patch.cat;
  if ("sub1" in patch) out.sub1 = patch.sub1;
  if ("sub2" in patch) out.sub2 = patch.sub2;
  if ("sub3" in patch) out.sub3 = patch.sub3;

  if ("priceCents" in patch) out.price_cents = Number(patch.priceCents ?? 0);
  if ("costCents" in patch) out.cost_cents = Number(patch.costCents ?? 0);
  if ("stockOnHand" in patch) out.stock_on_hand = Number(patch.stockOnHand ?? 0);
  if ("stockMin" in patch) out.stock_min = Number(patch.stockMin ?? 0);

  if ("status" in patch) out.status = patch.status ?? "active";
  if ("imageData" in patch) out.image_data = patch.imageData ?? null;

  return out;
}

  async function list({ limit = 200, orderBy = "created_at", ascending = false } = {}) {
  assertClient();

  return window.CatrionTenantContext.withTenant(async (tenantId) => {
    const { data, error } = await window.sb
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .order(orderBy, { ascending })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(dbToApp);
  });
}

  async function create(product) {
  assertClient();

  return window.CatrionTenantContext.withTenant(async (tenantId) => {
    const payload = appToDb(product);
    if (!payload.id) delete payload.id;

    payload.tenant_id = tenantId;

    const { data, error } = await window.sb
      .from("products")
      .insert([payload])
      .select("*")
      .single();

    if (error) throw error;
    return dbToApp(data);
  });
}

  async function update(id, patch) {
  assertClient();
  if (!id) throw new Error("update(): id é obrigatório.");

  return window.CatrionTenantContext.withTenant(async (tenantId) => {
    const payload = appPatchToDb(patch);

    const { data, error } = await window.sb
      .from("products")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

    if (error) throw error;
    return dbToApp(data);
  });
}

async function getById(id) {
  assertClient();
  if (!id) throw new Error("getById(): id é obrigatório.");

  return window.CatrionTenantContext.withTenant(async (tenantId) => {
    const { data, error } = await window.sb
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error) throw error;
    return dbToApp(data);
  });
}

  async function remove(id) {
  assertClient();
  if (!id) throw new Error("remove(): id é obrigatório.");

  return window.CatrionTenantContext.withTenant(async (tenantId) => {
    const { error } = await window.sb
      .from("products")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;
    return true;
  });
}

  // expõe no global
  window.ProductsStore = { list, create, update, getById, remove };
})();