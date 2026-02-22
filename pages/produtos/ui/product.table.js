// pages/produtos/ui/product.table.js
import { fmtBRL } from "../../../core/utils/money.js";

export function renderProductsTable(tbody, products, { onEdit, onMove }) {
  tbody.innerHTML = "";

  const frag = document.createDocumentFragment();

  for (const p of products) {
    const tr = document.createElement("tr");

    const low = p.stockOnHand <= p.stockMin;

    tr.innerHTML = `
      <td>${escapeHtml(p.name)}</td>
      <td class="muted">${escapeHtml(p.sku)}</td>
      <td>${fmtBRL(p.priceCents)}</td>
      <td><span class="pill ${low ? "low" : ""}">${p.stockOnHand}</span></td>
      <td class="muted">${p.stockMin}</td>
      <td><span class="pill ${p.status === "inactive" ? "off" : ""}">${p.status === "active" ? "Ativo" : "Inativo"}</span></td>
      <td class="actions">
        <div class="row-actions">
          <button class="icon-btn" data-act="edit">Editar</button>
          <button class="icon-btn" data-act="move">Mov.</button>
        </div>
      </td>
    `;

    tr.querySelector('[data-act="edit"]').addEventListener("click", () => onEdit(p.id));
    tr.querySelector('[data-act="move"]').addEventListener("click", () => onMove(p.id));

    frag.appendChild(tr);
  }

  tbody.appendChild(frag);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
