// pages/produtos/produtos.store.js
import { CoreBus } from "../../core/events/bus.js";
import { uid } from "../../core/utils/id.js";
import { makeProduct } from "./domain/product.model.js";
import { validateProductDraft } from "./domain/product.rules.js";
import { validateMovementDraft, applyMovementToStock } from "./domain/stock.rules.js";
import { ProductRepo } from "./data/product.repo.js";
import { StockRepo } from "./data/stock.repo.js";

export function createProductsStore() {
  const state = {
    products: [],
    movements: [],
    view: {
      search: "",
      status: "all",
      stock: "all",
      sortBy: "name",
      sortDir: "asc",
    },
  };

  function load() {
    state.products = ProductRepo.list();
    state.movements = StockRepo.list();
    return snapshot();
  }

  function snapshot() {
    return structuredClone(state);
  }

  function setView(patch) {
    state.view = { ...state.view, ...patch };
    CoreBus.emit("products:viewChanged", snapshot().view);
  }

  function listFiltered() {
    const { search, status, stock, sortBy, sortDir } = state.view;
    const q = String(search || "").trim().toLowerCase();

    let list = [...state.products];

    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }

    if (status !== "all") list = list.filter(p => p.status === status);

    if (stock === "low") list = list.filter(p => p.stockOnHand <= p.stockMin);
    if (stock === "zero") list = list.filter(p => p.stockOnHand === 0);

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va = a[sortBy];
      const vb = b[sortBy];

      // números
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;

      // string
      return String(va ?? "").localeCompare(String(vb ?? ""), "pt-BR") * dir;
    });

    return list;
  }

  function toggleSort(by) {
    if (state.view.sortBy === by) {
      state.view.sortDir = state.view.sortDir === "asc" ? "desc" : "asc";
    } else {
      state.view.sortBy = by;
      state.view.sortDir = "asc";
    }
    CoreBus.emit("products:viewChanged", snapshot().view);
  }

  function createProduct(draft) {
    const existingSkus = state.products.map(p => ({ id: p.id, skuNorm: p.sku.toLowerCase() }));
    const check = validateProductDraft(draft, { existingSkus });

    if (!check.ok) return { ok: false, errors: check.errors };

    const product = makeProduct(draft);
    state.products.push(product);
    ProductRepo.saveAll(state.products);

    CoreBus.emit("product:created", product);
    CoreBus.emit("products:changed", snapshot().products);

    return { ok: true, product };
  }

  function updateProduct(id, patch) {
    const idx = state.products.findIndex(p => p.id === id);
    if (idx < 0) return { ok: false, errors: [{ field: "_", message: "Produto não encontrado." }] };

    const existingSkus = state.products.map(p => ({ id: p.id, skuNorm: p.sku.toLowerCase() }));
    const draft = { ...state.products[idx], ...patch, updatedAt: new Date().toISOString() };

    const check = validateProductDraft(draft, { existingSkus, editingId: id });
    if (!check.ok) return { ok: false, errors: check.errors };

    state.products[idx] = draft;
    ProductRepo.saveAll(state.products);

    CoreBus.emit("product:updated", draft);
    CoreBus.emit("products:changed", snapshot().products);

    return { ok: true, product: draft };
  }

  function deleteProduct(id) {
    const idx = state.products.findIndex(p => p.id === id);
    if (idx < 0) return { ok: false, errors: [{ field: "_", message: "Produto não encontrado." }] };

    // bloqueio simples: não deletar se já tem movimentos (histórico)
    const hasMoves = state.movements.some(m => m.productId === id);
    if (hasMoves) {
      return { ok: false, errors: [{ field: "_", message: "Não é possível excluir: produto já tem movimentações." }] };
    }

    const removed = state.products.splice(idx, 1)[0];
    ProductRepo.saveAll(state.products);

    CoreBus.emit("product:deleted", removed);
    CoreBus.emit("products:changed", snapshot().products);

    return { ok: true };
  }

  function moveStock(draft) {
    const check = validateMovementDraft(draft);
    if (!check.ok) return { ok: false, errors: check.errors };

    const pIdx = state.products.findIndex(p => p.id === draft.productId);
    if (pIdx < 0) return { ok: false, errors: [{ field: "productId", message: "Produto inválido." }] };

    const product = state.products[pIdx];
    const nextStock = applyMovementToStock(product.stockOnHand, draft);

    // regra: não permitir estoque negativo
    if (nextStock < 0) {
      return { ok: false, errors: [{ field: "qty", message: "Estoque insuficiente para essa saída." }] };
    }

    const movement = {
      id: uid("mov"),
      productId: draft.productId,
      type: draft.type,
      qty: Number(draft.qty),
      reason: String(draft.reason),
      note: String(draft.note || "").trim(),
      ref: draft.ref ?? null,
      createdAt: new Date().toISOString(),
      createdBy: draft.createdBy ?? null, // pra CoreAuth/CoreAudit depois
    };

    // aplica no produto
    const updated = { ...product, stockOnHand: nextStock, updatedAt: new Date().toISOString() };
    state.products[pIdx] = updated;

    // salva
    ProductRepo.saveAll(state.products);
    state.movements.push(movement);
    StockRepo.append(movement);

    CoreBus.emit("stock:changed", { productId: updated.id, stockOnHand: updated.stockOnHand, movement });
    CoreBus.emit("product:updated", updated);
    CoreBus.emit("products:changed", snapshot().products);

    return { ok: true, movement, product: updated };
  }

  function getById(id) {
    return state.products.find(p => p.id === id) ?? null;
  }

  return {
    load,
    snapshot,
    setView,
    listFiltered,
    toggleSort,
    createProduct,
    updateProduct,
    deleteProduct,
    moveStock,
    getById,
  };
}
