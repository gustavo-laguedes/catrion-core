// pages/produtos/domain/stock.rules.js
import { assert } from "../../../core/utils/validate.js";

export function validateMovementDraft(draft) {
  const errors = [];

  assert(!!draft?.productId, "productId", "Selecione um produto.", errors);

  const type = draft?.type;
  assert(type === "IN" || type === "OUT" || type === "ADJUST", "type", "Tipo inválido.", errors);

  const qty = Number(draft?.qty ?? NaN);
  assert(Number.isInteger(qty) && qty > 0, "qty", "Quantidade inválida.", errors);

  assert(!!draft?.reason, "reason", "Motivo é obrigatório.", errors);

  return { ok: errors.length === 0, errors };
}

export function applyMovementToStock(currentStock, movement) {
  const s = Number(currentStock || 0);
  const q = Number(movement.qty || 0);

  if (movement.type === "IN") return s + q;
  if (movement.type === "OUT") return s - q;
  if (movement.type === "ADJUST") return s + q; // aqui é delta; se quiser "novo valor", trocamos depois

  return s;
}
