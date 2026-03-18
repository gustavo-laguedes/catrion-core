// shared/store/stock.js
(function () {
  function assertClient() {
    if (!window.sb) throw new Error("Supabase client não inicializado (window.sb indefinido).");
  }

  function dbToApp(row) {
  if (!row) return row;
  return {
    id: row.id,
    productId: row.product_id,
    kind: row.kind,
    qty: row.qty,
    note: row.note ?? null,
    ref: row.ref ?? null,
    createdAt: row.created_at ?? null,
  };
}

  function appToDb(move) {
  if (!move) throw new Error("addMove(): move inválido.");

  // aceita vários formatos pra não quebrar telas antigas/novas
  const pid =
    move.productId ??
    move.product_id ??
    move.productid ??
    null;

  if (!pid) {
    // <-- AQUI está o “mata-zica”: se não tem productId, nem tenta inserir
    throw new Error("addMove(): productId é obrigatório (veio vazio/null).");
  }

  const out = {
    product_id: pid,                // banco recebe sempre product_id
    kind: move.kind,
    qty: Number(move.qty || 0),
    note: move.note ?? null,
    ref: move.ref ?? null,
    // created_at deixa o banco gerar
  };

  // Só envia id se for um UUID válido (ou pelo menos um valor truthy)
  // Isso evita "id: null" cair no insert.
  if (move.id) out.id = move.id;

  return out;
}

  async function addMove(move) {
    assertClient();

    const payload = appToDb(move);

    const tenantId = window.CatrionTenant.requireTenantId();
payload.tenant_id = tenantId;

    if (!payload.kind) throw new Error("addMove(): kind é obrigatório.");
if (!Number.isFinite(payload.qty) || payload.qty <= 0) throw new Error("addMove(): qty inválida.");

    const { data: row, error } = await window.sb
      .from("stock_moves")
      .insert([payload])
      .select("id,product_id,kind,qty,note,ref,created_at")
      .single();

    if (error) throw error;
    return dbToApp(row);
  }

  async function listMoves({ productId, limit = 200 } = {}) {
  assertClient();

  const tenantId = window.CatrionTenant.requireTenantId();

  let q = window.sb
    .from("stock_moves")
    .select("id,product_id,kind,qty,note,ref,created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (productId) q = q.eq("product_id", productId);

  const { data: rows, error } = await q;
  if (error) throw error;

  return (rows || []).map(dbToApp);
}

  window.StockStore = { addMove, listMoves };
})();