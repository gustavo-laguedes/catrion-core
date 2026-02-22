// shared/productsRepo.js
(function (global) {
  const KEY = "core.products.v1";

  function safeParse(raw, fallback) {
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  function loadAll() {
    // ✅ PRIORIDADE: usar CoreStorage (mesmo que Produtos usa)
    if (global.CoreStorage?.get) {
      const data = global.CoreStorage.get(KEY, []);
      return Array.isArray(data) ? data : [];
    }

    // fallback: localStorage direto
    const raw = localStorage.getItem(KEY);
    const arr = raw ? safeParse(raw, []) : [];
    return Array.isArray(arr) ? arr : [];
  }

  function saveAll(list) {
    if (global.CoreStorage?.set) {
      global.CoreStorage.set(KEY, list || []);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(list || []));
  }

  function norm(s) {
    return String(s || "").trim().toLowerCase();
  }

  function isActive(p) {
    // Produtos filtra por status === "active" / "inactive"
    const st = String(p.status || "active").toLowerCase();
    return st !== "inactive";
  }

  // aceita tanto centavos quanto reais, só pra ficar robusto
  function priceToNumber(p) {
    if (p.priceCents != null) return Number(p.priceCents || 0) / 100;
    return Number(p.price ?? p.preco ?? 0);
  }
  function costToNumber(p) {
    if (p.costCents != null) return Number(p.costCents || 0) / 100;
    return Number(p.cost ?? p.custo ?? 0);
  }

  const CoreProductsRepo = {
    key: KEY,

    getAll() { return loadAll(); },
    getActive() { return loadAll().filter(isActive); },

    getById(id) {
      return loadAll().find(p => String(p.id) === String(id)) || null;
    },

    findByQuery(q, limit = 20) {
      const s = norm(q);
      if (!s) return [];

      const list = loadAll().filter(isActive);
      const out = list.filter(p => {
        const name = norm(p.name);
        const sku = norm(p.sku);
        return name.includes(s) || sku.includes(s) || String(p.sku || "").includes(String(q).trim());
      });

      return out.slice(0, limit);
    },

    decreaseStock(productId, qty) {
      const q = Number(qty);
      if (!Number.isFinite(q) || q <= 0) return { ok:false, reason:"qty inválida" };

      const all = loadAll();
      const idx = all.findIndex(p => String(p.id) === String(productId));
      if (idx < 0) return { ok:false, reason:"produto não encontrado" };

      const p = all[idx];
      const current = Number(p.stockOnHand || 0);
      const next = Math.max(current - q, 0);

      p.stockOnHand = next;
      all[idx] = p;
      saveAll(all);

      return { ok:true, before: current, after: next, product: p };
    },

    // helpers (pra lucro/estoque)
    getPrice(productId) {
      const p = this.getById(productId);
      return p ? priceToNumber(p) : 0;
    },
    getCost(productId) {
      const p = this.getById(productId);
      return p ? costToNumber(p) : 0;
    },
    getStock(productId) {
      const p = this.getById(productId);
      return p ? Number(p.stockOnHand || 0) : 0;
    }
  };

  global.CoreProductsRepo = CoreProductsRepo;
})(window);
