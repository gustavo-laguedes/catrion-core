// pages/produtos/domain/product.rules.js
import { assert } from "../../../core/utils/validate.js";

export function validateProductDraft(draft, { existingSkus = [], editingId = null } = {}) {
  const errors = [];

  const name = String(draft?.name ?? "").trim();
  const sku = String(draft?.sku ?? "").trim();

  assert(name.length >= 2, "name", "Nome precisa ter pelo menos 2 caracteres.", errors);

  // ✅ SKU/Código agora é OPCIONAL.
  // Se estiver preenchido, valida unicidade.
  if (sku.length > 0) {
    // SKU único (case-insensitive)
    const skuNorm = sku.toLowerCase();
    const clash = existingSkus.find(e => e.skuNorm === skuNorm && e.id !== editingId);
    assert(!clash, "sku", "Já existe um produto com esse SKU.", errors);
  }

  const priceCents = Number(draft?.priceCents ?? NaN);
  assert(Number.isInteger(priceCents) && priceCents >= 0, "price", "Preço inválido.", errors);

  const cost = draft?.costCents;
  if (cost != null) {
    const costCents = Number(cost ?? NaN);
    assert(Number.isInteger(costCents) && costCents >= 0, "cost", "Custo inválido.", errors);
  }

  const stockOnHand = Number(draft?.stockOnHand ?? NaN);
  const stockMin = Number(draft?.stockMin ?? NaN);

  assert(Number.isInteger(stockOnHand) && stockOnHand >= 0, "stockOnHand", "Estoque atual inválido.", errors);
  assert(Number.isInteger(stockMin) && stockMin >= 0, "stockMin", "Estoque mínimo inválido.", errors);

  const status = draft?.status;
  assert(status === "active" || status === "inactive", "status", "Status inválido.", errors);

  return { ok: errors.length === 0, errors };
}
