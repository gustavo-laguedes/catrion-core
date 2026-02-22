// pages/produtos/ui/stock.modal.js
import { clearErrors, showErrors } from "./errors.js";

export function createStockModal(dlg, store) {
  const frm = dlg.querySelector("#frmMove");
  const selProduct = dlg.querySelector("#mv_productId");
  const selType = dlg.querySelector("#mv_type");
  const inpQty = dlg.querySelector("#mv_qty");
  const selReason = dlg.querySelector("#mv_reason");
  const inpNote = dlg.querySelector("#mv_note");

  function rebuildProductOptions(selectedId = null) {
    const snap = store.snapshot();
    const list = [...snap.products].sort((a,b) => a.name.localeCompare(b.name, "pt-BR"));

    selProduct.innerHTML = list.map(p => {
      const label = `${p.name} (${p.sku}) — est: ${p.stockOnHand}`;
      return `<option value="${p.id}">${escapeHtml(label)}</option>`;
    }).join("");

    if (selectedId) selProduct.value = selectedId;
  }

  function open(productId = null) {
    clearErrors(dlg);

    rebuildProductOptions(productId);

    selType.value = "IN";
    inpQty.value = "";
    selReason.value = "manual";
    inpNote.value = "";

    dlg.showModal();
    inpQty.focus();
  }

  frm.addEventListener("submit", (ev) => {
    ev.preventDefault();

    const draft = {
      productId: selProduct.value,
      type: selType.value,
      qty: parseInt(inpQty.value || "0", 10),
      reason: selReason.value,
      note: inpNote.value,
    };

    const res = store.moveStock(draft);
    if (!res.ok) {
      showErrors(dlg, res.errors);
      return;
    }

    dlg.close();
  });

  return { open, rebuildProductOptions };
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
