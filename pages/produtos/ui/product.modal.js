// pages/produtos/ui/product.modal.js
import { toCents, fromCents } from "../../../core/utils/money.js";
import { clearErrors, showErrors } from "./errors.js";

export function createProductModal(dlg, store) {
  const frm = dlg.querySelector("#frmProduct");

  const els = {
    title: dlg.querySelector("#dlgProductTitle"),
    id: dlg.querySelector("#prd_id"),
    name: dlg.querySelector("#prd_name"),
    sku: dlg.querySelector("#prd_sku"),
    price: dlg.querySelector("#prd_price"),
    cost: dlg.querySelector("#prd_cost"),
    stockOnHand: dlg.querySelector("#prd_stockOnHand"),
    stockMin: dlg.querySelector("#prd_stockMin"),
    status: dlg.querySelector("#prd_status"),
    btnDelete: dlg.querySelector("#btnDeleteProduct"),
  };

  let mode = "create"; // create | edit

  function openCreate() {
    mode = "create";
    els.title.textContent = "Novo produto";
    els.btnDelete.hidden = true;

    els.id.value = "";
    els.name.value = "";
    els.sku.value = "";
    els.price.value = "0,00";
    els.cost.value = "";
    els.stockOnHand.value = "0";
    els.stockMin.value = "0";
    els.status.value = "active";

    clearErrors(dlg);
    dlg.showModal();
    els.name.focus();
  }

  function openEdit(id) {
    const p = store.getById(id);
    if (!p) return;

    mode = "edit";
    els.title.textContent = "Editar produto";
    els.btnDelete.hidden = false;

    els.id.value = p.id;
    els.name.value = p.name;
    els.sku.value = p.sku;
    els.price.value = fromCents(p.priceCents);
    els.cost.value = p.costCents == null ? "" : fromCents(p.costCents);
    els.stockOnHand.value = String(p.stockOnHand);
    els.stockMin.value = String(p.stockMin);
    els.status.value = p.status;

    clearErrors(dlg);
    dlg.showModal();
    els.name.focus();
  }

  function collectDraft() {
    return {
      id: els.id.value || undefined,
      name: els.name.value,
      sku: els.sku.value,
      priceCents: toCents(els.price.value),
      costCents: els.cost.value.trim() ? toCents(els.cost.value) : null,
      stockOnHand: parseInt(els.stockOnHand.value || "0", 10),
      stockMin: parseInt(els.stockMin.value || "0", 10),
      status: els.status.value,
    };
  }

  frm.addEventListener("submit", (ev) => {
    ev.preventDefault();

    const draft = collectDraft();

    let res;
    if (mode === "create") {
      res = store.createProduct(draft);
    } else {
      res = store.updateProduct(draft.id, draft);
    }

    if (!res.ok) {
      showErrors(dlg, res.errors);
      return;
    }

    dlg.close();
  });

  els.btnDelete.addEventListener("click", () => {
    const id = els.id.value;
    if (!id) return;
    if (!confirm("Excluir este produto?")) return;

    const res = store.deleteProduct(id);
    if (!res.ok) {
      showErrors(dlg, res.errors);
      return;
    }
    dlg.close();
  });

  return { openCreate, openEdit };
}
