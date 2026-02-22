// pages/produtos/domain/product.model.js
import { uid } from "../../../core/utils/id.js";

export function makeProduct(input) {
  const now = new Date().toISOString();

  return {
    id: input?.id ?? uid("prd"),
    name: String(input?.name ?? "").trim(),
    sku: String(input?.sku ?? "").trim(),
    priceCents: Number.isFinite(input?.priceCents) ? input.priceCents : 0,
    costCents: input?.costCents == null ? null : (Number.isFinite(input.costCents) ? input.costCents : 0),
    stockOnHand: Number.isFinite(input?.stockOnHand) ? input.stockOnHand : 0,
    stockMin: Number.isFinite(input?.stockMin) ? input.stockMin : 0,
    status: input?.status === "inactive" ? "inactive" : "active",
    createdAt: input?.createdAt ?? now,
    updatedAt: now,
  };
}
