/* CoreCash.js
   Caixa (localStorage) - sessão + eventos + resumo (inclui lucro preparado)
*/
(function (global) {
  const KEY_SESSION = "core.cash.session.v1";
  const KEY_EVENTS  = "core.cash.events.v1";
  const MAX_EVENTS = 20000; // histórico grande pro modo local-dev (ajuste se quiser)

// === Integração simples com Estoque (localStorage) ===
const KEY_PRODUCTS = "core.products.v1";
const KEY_MOVES    = "core.stock.movements.v1";

function safeArr(raw) {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

function loadProductsLS() {
  return safeArr(localStorage.getItem(KEY_PRODUCTS));
}

function saveProductsLS(list) {
  try { localStorage.setItem(KEY_PRODUCTS, JSON.stringify(list || [])); } catch {}
}

function getActorNameLS(fallback) {
  // tenta pegar do CoreAuth ou do "Olá, Fulano"
  try {
    const a = window.CoreAuth;
    if (a?.getCurrentUser) {
      const u = a.getCurrentUser();
      if (u?.name) return u.name;
      if (u?.displayName) return u.displayName;
    }
    const hello = document.getElementById("userHello")?.textContent || "";
    const cleaned = String(hello).trim()
      .replace(/^Olá[,!]?\s*/i, "")
      .replace(/\s*\(.*?\)\s*/g, "")
      .trim();
    return cleaned || fallback || "operador";
  } catch {
    return fallback || "operador";
  }
}

function appendMoveLS(move) {
  const arr = safeArr(localStorage.getItem(KEY_MOVES));
  arr.push({
    ...move,
    createdBy: move.createdBy || getActorNameLS(move.createdBy),
  });
  try { localStorage.setItem(KEY_MOVES, JSON.stringify(arr)); } catch {}
}

// devolve estoque da venda removida (se tiver meta.items)
function restoreStockFromSaleEvent(removedEvt) {
  const items = removedEvt?.meta?.items;
  if (!Array.isArray(items) || items.length === 0) return { restored: 0, skipped: 0 };

  const products = loadProductsLS();
  if (!products.length) return { restored: 0, skipped: items.length };

  // índice por ID e por SKU (fallback)
const byId = new Map(
  products.map(p => [String(p.id || "").trim(), p]).filter(([k]) => !!k)
);

const bySku = new Map(
  products.map(p => [String(p.sku || "").trim(), p]).filter(([k]) => !!k)
);


  let restored = 0;
  let skipped = 0;

  const actor = getActorNameLS(removedEvt?.by || "operador");
  const ref = removedEvt?.saleId || removedEvt?.id || "sale";

  for (const it of items) {
    const qty = Number(it?.qty || 0);
    if (!qty || qty <= 0) { skipped++; continue; }

    // ✅ primeiro tenta por productId (mais confiável)
const pid = String(it?.productId || "").trim();
let prod = pid ? byId.get(pid) : null;

// fallback: tenta por SKU/barcode/code
if (!prod) {
  const sku = String(it?.sku || it?.barcode || it?.code || "").trim();
  if (sku) prod = bySku.get(sku);
}

if (!prod) { skipped++; continue; }


    prod.stockOnHand = Number(prod.stockOnHand || 0) + qty;
    restored++;

    appendMoveLS({
      id: `mov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      productId: prod.id,
      type: "IN",
      qty,
      reason: "sale_cancel",
      ref,
      note: `Estorno de venda removida (${ref})`,
      createdAt: new Date().toISOString(),
      createdBy: actor
    });
  }

  saveProductsLS(products);
  return { restored, skipped };
}


  function nowISO() {
    return new Date().toISOString();
  }

  function isSameDayBR(isoA, isoB) {
  if (!isoA || !isoB) return false;

  const a = new Date(isoA);
  const b = new Date(isoB);

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}


  function uid(prefix = "evt") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function safeParse(json, fallback) {
    try { return JSON.parse(json); } catch { return fallback; }
  }

  function loadSession() {
    const raw = localStorage.getItem(KEY_SESSION);
    return raw ? safeParse(raw, null) : null;
  }

  function saveSession(session) {
  if (!session) {
    localStorage.removeItem(KEY_SESSION);
    return;
  }

  try {
    localStorage.setItem(KEY_SESSION, JSON.stringify(session));
  } catch (e) {
    // se falhar, pelo menos não trava o sistema
  }
} // ✅ FECHOU saveSession aqui

function loadEvents() {
  const raw = localStorage.getItem(KEY_EVENTS);
  const arr = raw ? safeParse(raw, []) : [];
  return Array.isArray(arr) ? arr : [];
}


  function saveEvents(events) {
  let list = Array.isArray(events) ? events : [];

  // limite duro (mantém mais recentes: você usa unshift)
  if (list.length > MAX_EVENTS) {
    list = list.slice(0, MAX_EVENTS);
  }

  // fusível: tenta salvar, se estourar quota corta e tenta de novo
  const trySave = (arr) => {
    localStorage.setItem(KEY_EVENTS, JSON.stringify(arr));
    return true;
  };

  // tentativa 1: salva tudo (já limitado)
  try {
    trySave(list);
    return;
  } catch (e) {}

  // tentativa 2: corta pela metade
  try {
    list = list.slice(0, Math.max(1000, Math.floor(list.length / 2)));
    trySave(list);
    return;
  } catch (e) {}

  // tentativa 3: salva só os últimos 2000
  try {
    list = list.slice(0, Math.min(list.length, 2000));
    trySave(list);
    return;
  } catch (e) {}

  // tentativa 4: salva só os últimos 300
  try {
    list = list.slice(0, Math.min(list.length, 300));
    trySave(list);
    return;
  } catch (e) {}

  // tentativa 5: desiste sem travar o sistema (não lança erro)
}



  function addEvent(evt) {
    const events = loadEvents();
    events.unshift(evt); // mais recente primeiro
    saveEvents(events);
    return evt;
  }

  function ensureOpenSession() {
    const s = loadSession();
    return s && s.isOpen;
  }

  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function normalizeMoney(v) {
    const n = Number(v);
    if (!isFinite(n)) return 0;
    return round2(n);
  }

  function normalizePayments(payments) {
    const p = payments || {};
    return {
      cash:       normalizeMoney(p.cash || 0),
      pix:        normalizeMoney(p.pix || 0),
      cardCredit: normalizeMoney(p.cardCredit || 0),
      cardDebit:  normalizeMoney(p.cardDebit || 0),
    };
  }

  


  function buildSummary(events) {
    const out = {
      salesCount: 0,
      salesTotal: 0,
      byPayment: { cash: 0, pix: 0, cardCredit: 0, cardDebit: 0 },
      suppliesCash: 0,
      withdrawsCash: 0,
      costTotal: 0,
      profitTotal: 0,
      profitPct: 0,
    };

    (events || []).forEach(e => {
      if (e.type === "SALE") {
        out.salesCount += 1;

        const pay = normalizePayments(e.payments);
        out.byPayment.cash       = round2(out.byPayment.cash + pay.cash);
        out.byPayment.pix        = round2(out.byPayment.pix + pay.pix);
        out.byPayment.cardCredit = round2(out.byPayment.cardCredit + pay.cardCredit);
        out.byPayment.cardDebit  = round2(out.byPayment.cardDebit + pay.cardDebit);

        const total = normalizeMoney(
          e.total != null ? e.total : (pay.cash + pay.pix + pay.cardCredit + pay.cardDebit)
        );
        out.salesTotal = round2(out.salesTotal + total);

        const cost = normalizeMoney(e.costTotal || 0);
        out.costTotal = round2(out.costTotal + cost);

        const profit = normalizeMoney(e.profit != null ? e.profit : (total - cost));
        out.profitTotal = round2(out.profitTotal + profit);
      }

      if (e.type === "SUPPLY") out.suppliesCash = round2(out.suppliesCash + normalizeMoney(e.amount));
      if (e.type === "WITHDRAW") out.withdrawsCash = round2(out.withdrawsCash + normalizeMoney(e.amount));
    });

    out.profitPct = out.salesTotal > 0 ? round2((out.profitTotal / out.salesTotal) * 100) : 0;
    return out;
  }

  function getSessionEvents(){
  const events = loadEvents();
  const s = loadSession();

  // ✅ caixa fechado = resumo zerado
  if (!s?.openedAt || !s.isOpen) return [];

  const start = new Date(s.openedAt).getTime();
  return events.filter(e => new Date(e.at).getTime() >= start);
}

function getTodayEvents() {
  const events = loadEvents();
  const today = new Date();

  return events.filter(e => isSameDayBR(e.at, today));
}


  

  function rebuildSessionFromEvents(events){
  const list = Array.isArray(events) ? [...events] : [];

  // se não tem nenhum OPEN, não existe sessão
  const opens = list.filter(e => e.type === "OPEN");
  if (!opens.length) {
    saveSession(null);
    return null;
  }

  // evento mais recente pelo timestamp (não confia só na ordem do array)
  const mostRecent = (arr) =>
    arr.reduce((best, cur) => {
      const tb = best ? new Date(best.at).getTime() : -Infinity;
      const tc = cur ? new Date(cur.at).getTime() : -Infinity;
      return tc > tb ? cur : best;
    }, null);

  const lastOpen = mostRecent(opens);

  // pega o CLOSE mais recente que aconteceu DEPOIS desse OPEN
  const openAt = new Date(lastOpen.at).getTime();
  const closesAfterOpen = list.filter(e => e.type === "CLOSE" && new Date(e.at).getTime() >= openAt);
  const lastClose = closesAfterOpen.length ? mostRecent(closesAfterOpen) : null;

  const isOpen = !lastClose;

  const session = {
    isOpen,
    openedAt: lastOpen.at,
    openedBy: lastOpen.by || "—",
    initialAmount: Number(lastOpen.amount || 0),
    notes: lastOpen.meta?.notes || "",
    closedAt: isOpen ? null : lastClose.at,
    closedBy: isOpen ? null : (lastClose.by || "—"),
    finalAmount: isOpen ? null : Number(lastClose.amount || 0),
  };

  saveSession(session);
  return session;
}


  const CoreCash = {
    keys: { KEY_SESSION, KEY_EVENTS },

    getSession() { return loadSession(); },
    isOpen() { return !!ensureOpenSession(); },
    getEvents() { return loadEvents(); },

    deleteEvent(eventId){
  const events = loadEvents();
  const idx = events.findIndex(e => String(e.id) === String(eventId));
  if (idx < 0) return { ok:false, reason:"Evento não encontrado." };

  const removed = events.splice(idx, 1)[0];
  saveEvents(events);

  // ✅ NOVO: se apagou uma venda, devolve estoque
  let stockRestore = null;
  if (removed?.type === "SALE") {
    stockRestore = restoreStockFromSaleEvent(removed);
  }

  rebuildSessionFromEvents(events);

  return { ok:true, removed, stockRestore };
},




    open({ initialAmount = 0, by = "system", notes = "" } = {}) {
      const current = loadSession();
      if (current && current.isOpen) {
        return { ok: false, reason: "Caixa já está aberto.", session: current };
      }

      const session = {
        isOpen: true,
        openedAt: nowISO(),
        openedBy: by,
        initialAmount: normalizeMoney(initialAmount),
        notes: notes || "",
        closedAt: null,
        closedBy: null,
        finalAmount: null,
      };

      saveSession(session);

      addEvent({
        id: uid("evt"),
        type: "OPEN",
        at: session.openedAt,
        by,
        amount: session.initialAmount,
        meta: { notes: session.notes || "" }
      });

      return { ok: true, session };
    },

    close({ finalAmount = 0, by = "system", notes = "" } = {}) {
      const session = loadSession();
      if (!session || !session.isOpen) {
        return { ok: false, reason: "Não existe caixa aberto para fechar.", session: session || null };
      }

      session.isOpen = false;
      session.closedAt = nowISO();
      session.closedBy = by;
      session.finalAmount = normalizeMoney(finalAmount);
      if (notes) session.notes = notes;

      saveSession(session);

      addEvent({
        id: uid("evt"),
        type: "CLOSE",
        at: session.closedAt,
        by,
        amount: session.finalAmount,
        meta: { notes: notes || "" }
      });

      return { ok: true, session };
    },

    supply({ amount, by = "system", notes = "" } = {}) {
      if (!ensureOpenSession()) return { ok: false, reason: "Abra o caixa antes de lançar suprimento." };
      const v = normalizeMoney(amount);
      if (v <= 0) return { ok: false, reason: "Informe um valor válido (> 0)." };

      const evt = addEvent({
        id: uid("evt"),
        type: "SUPPLY",
        at: nowISO(),
        by,
        amount: v,
        meta: { notes: notes || "" }
      });

      return { ok: true, event: evt };
    },

    withdraw({ amount, by = "system", notes = "" } = {}) {
      if (!ensureOpenSession()) return { ok: false, reason: "Abra o caixa antes de lançar sangria." };
      const v = normalizeMoney(amount);
      if (v <= 0) return { ok: false, reason: "Informe um valor válido (> 0)." };

      const evt = addEvent({
        id: uid("evt"),
        type: "WITHDRAW",
        at: nowISO(),
        by,
        amount: v,
        meta: { notes: notes || "" }
      });

      return { ok: true, event: evt };
    },

    registerSale({ saleId, total, payments, costTotal = 0, profit = null, by = "system", meta = {} } = {}) {

      if (!ensureOpenSession()) {
        return { ok: false, reason: "Caixa fechado. Abra o caixa para registrar vendas no log." };
      }

      const pay = normalizePayments(payments);
      const tot = normalizeMoney(total || (pay.cash + pay.pix + pay.cardCredit + pay.cardDebit));
      if (tot <= 0) return { ok: false, reason: "Total inválido." };

      const cost = normalizeMoney(costTotal || 0);

// ✅ Se a Venda mandar profit (já líquido com taxa), usa ele.
// Senão, mantém o fallback antigo (tot - cost).
const profitNorm = (profit != null)
  ? normalizeMoney(profit)
  : normalizeMoney(tot - cost);


      const evt = addEvent({
        id: uid("evt"),
        type: "SALE",
        at: nowISO(),
        by,
        saleId: saleId || uid("sale"),
        total: tot,
        payments: pay,
        costTotal: cost,
        profit: profitNorm,
        meta: meta || {}
      });

      return { ok: true, event: evt };
    },

    getSummary() {
  return buildSummary(getTodayEvents());
},


    getTheoreticalCash() {
      const s = loadSession();
  const initial = s ? normalizeMoney(s.initialAmount) : 0;
  const summary = buildSummary(getSessionEvents());
  return round2(initial + summary.suppliesCash - summary.withdrawsCash + summary.byPayment.cash);
}
  };

  global.CoreCash = CoreCash;
})(window);
