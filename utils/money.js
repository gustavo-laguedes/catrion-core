// core/utils/money.js
export function toCents(input) {
  // aceita "12,34" "12.34" "12" 12.34
  const str = String(input ?? "").trim();
  if (!str) return 0;
  const norm = str.replace(/\./g, "").replace(",", ".");
  const n = Number(norm);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function fromCents(cents) {
  const n = Number(cents || 0) / 100;
  return n.toFixed(2).replace(".", ",");
}

export function fmtBRL(cents) {
  const n = Number(cents || 0) / 100;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
