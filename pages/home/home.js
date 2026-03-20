window.CorePageModules = window.CorePageModules || {};
window.CorePageModules.home = function () {
  const DONUT_COLORS = [
    "#2563eb",
    "#7c3aed",
    "#f59e0b",
    "#10b981",
    "#ef4444",
    "#06b6d4",
    "#8b5cf6",
    "#84cc16"
  ];

  function moneyBR(v) {
    const n = Number(v || 0);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function toDateSafe(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatDateBR(date) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }

  function endOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  function isToday(value) {
    const d = toDateSafe(value);
    if (!d) return false;
    return d >= startOfToday() && d <= endOfToday();
  }

  function getSaleDate(sale) {
    return (
      sale?.createdAt ||
      sale?.created_at ||
      sale?.date ||
      sale?.saleDate ||
      sale?.soldAt ||
      sale?.datetime ||
      null
    );
  }

  function getSaleTotal(sale) {
    return Number(
      sale?.total ??
      sale?.grandTotal ??
      sale?.finalTotal ??
      sale?.amount ??
      sale?.paidTotal ??
      0
    );
  }

  function getSaleCustomerSnapshot(sale) {
  return (
    sale?.customerSnapshot ||
    sale?.customer_snapshot ||
    sale?.customer ||
    sale?.client ||
    null
  );
}

  function getSaleCustomerName(sale) {
  const snap = getSaleCustomerSnapshot(sale);

  return (
    sale?.customerName ||
    sale?.customer_name ||
    snap?.name ||
    sale?.clientName ||
    sale?.client_name ||
    ""
  ).trim();
}

  function getSaleCustomerPhone(sale) {
  const snap = getSaleCustomerSnapshot(sale);

  return (
    sale?.customerPhone ||
    sale?.customer_phone ||
    snap?.phone ||
    sale?.clientPhone ||
    sale?.client_phone ||
    ""
  ).trim();
}

  function getSaleItems(sale) {
  if (Array.isArray(sale?.items)) return sale.items;
  if (Array.isArray(sale?.sale_items)) return sale.sale_items;
  if (Array.isArray(sale?.line_items)) return sale.line_items;
  if (Array.isArray(sale?.lineItems)) return sale.lineItems;

  if (typeof sale?.itemsJson === "string") {
    try {
      const parsed = JSON.parse(sale.itemsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function isSaleCancelled(sale) {
  return String(sale?.status || "").toLowerCase() === "cancelled";
}

  function getItemName(item) {
    return (
      item?.name ||
      item?.productName ||
      item?.product_name ||
      item?.title ||
      item?.label ||
      "Produto sem nome"
    ).trim();
  }

  function getItemQty(item) {
    return Number(item?.qty ?? item?.quantity ?? item?.qtd ?? 0);
  }

  async function loadTodaySalesSafe() {
    try {
      if (window.SalesStore?.list) {
        const rows = await window.SalesStore.list({
  limit: 1000,
  orderBy: "created_at",
  ascending: false,
  startDateISO: startOfToday().toISOString(),
  endDateISO: endOfToday().toISOString()
});

        return Array.isArray(rows) ? rows : [];
      }
    } catch (err) {
      console.warn("[HOME] SalesStore.list falhou, tentando fallback:", err);
    }

    const fallbackKeys = ["corepos:sales", "core:sales", "sales"];
    for (const key of fallbackKeys) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(parsed)) {
          return parsed.filter((sale) => isToday(getSaleDate(sale)));
        }
      } catch {}
    }

    return [];
  }

  async function loadProductsSafe() {
    try {
      if (window.ProductsStore?.list) {
        return await window.ProductsStore.list({
          limit: 1000,
          orderBy: "name",
          ascending: true
        });
      }
    } catch (err) {
      console.error("[HOME] Erro ao carregar produtos:", err);
    }
    return [];
  }

  async function getProductsMapSafe() {
  const products = await loadProductsSafe();
  const map = new Map();

  for (const p of products) {
    map.set(String(p.id), {
      name: p.name || "Produto sem nome",
      image: p.imageData || p.image || p.photo || ""
    });
  }

  return map;
}

  async function getStockAlerts() {
    const products = await loadProductsSafe();
    const active = products.filter((p) => (p.status || "active") !== "inactive");

    const zero = [];
    const below = [];

    for (const p of active) {
      const stock = Number(p.stockOnHand || 0);
      const min = Number(p.stockMin || 0);

      if (stock <= 0) {
        zero.push(p);
        continue;
      }

      if (min > 0 && stock < min) {
        below.push(p);
      }
    }

    zero.sort((a, b) => Number(a.stockOnHand || 0) - Number(b.stockOnHand || 0));
    below.sort(
      (a, b) =>
        (Number(a.stockOnHand || 0) - Number(a.stockMin || 0)) -
        (Number(b.stockOnHand || 0) - Number(b.stockMin || 0))
    );

    return { zero, below };
  }

  function getPayableDate(item) {
    return (
      item?.dueDate ||
      item?.due_date ||
      item?.vencimento ||
      item?.dataVencimento ||
      item?.data_vencimento ||
      null
    );
  }

  function isPayablePaid(item) {
    const status = String(item?.status || "").toLowerCase();
    return !!(
      item?.paid === true ||
      item?.isPaid === true ||
      item?.pago === true ||
      status === "pago" ||
      status === "paid"
    );
  }

  function getPayableTitle(item) {
    return (
      item?.descricao ||
      item?.description ||
      item?.title ||
      item?.nome ||
      "Conta sem descrição"
    ).trim();
  }

  function getPayableAmount(item) {
    return Number(
      item?.valor ??
      item?.amount ??
      item?.total ??
      item?.value ??
      0
    );
  }

  function parseISODateSafe(iso) {
  if (!iso) return null;

  const s = String(iso).trim();

  if (s.includes("T")) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function dayStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(a, b) {
  const A = dayStart(a).getTime();
  const B = dayStart(b).getTime();
  return Math.floor((B - A) / 86400000);
}

function getPayableStatus(item) {
  const status = String(item?.status || "").toLowerCase();
  if (status === "paid" || status === "pago") return "paid";

  const due = parseISODateSafe(
    item?.dueDate ||
    item?.due_date ||
    item?.vencimento ||
    item?.dataVencimento ||
    item?.data_vencimento
  );

  if (!due) return "pending";

  const today = dayStart(new Date());

  if (due.getTime() < today.getTime()) return "late";
  if (due.getTime() === today.getTime()) return "today";
  return "pending";
}

  async function loadPayablesSafe() {
  try {
    if (window.APPayablesStore?.list) {
      const rows = await window.APPayablesStore.list({
        limit: 5000,
        orderBy: "due_date",
        ascending: true
      });

      return Array.isArray(rows) ? rows : [];
    }
  } catch (err) {
    console.warn("[HOME] Falha ao carregar contas a pagar via APPayablesStore:", err);
  }

  const fallbackKeys = [
    "corepos:contas_pagar",
    "core:contas_pagar",
    "contas_pagar"
  ];

  for (const key of fallbackKeys) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  return [];
}

  async function getPayablesAlerts() {
  const rows = await loadPayablesSafe();
  const today = dayStart(new Date());

  const overdue = [];
  const dueToday = [];
  const upcoming = [];

  for (const row of rows) {
    const status = getPayableStatus(row);
    if (status === "paid") continue;

    const due = parseISODateSafe(getPayableDate(row));
    if (!due) continue;

    if (status === "late") {
      overdue.push(row);
      continue;
    }

    if (status === "today") {
      dueToday.push(row);
      continue;
    }

    const days = diffDays(today, due);
    if (days >= 1 && days <= 7) {
      upcoming.push(row);
    }
  }

  overdue.sort((a, b) => parseISODateSafe(getPayableDate(a)) - parseISODateSafe(getPayableDate(b)));
  dueToday.sort((a, b) => parseISODateSafe(getPayableDate(a)) - parseISODateSafe(getPayableDate(b)));
  upcoming.sort((a, b) => parseISODateSafe(getPayableDate(a)) - parseISODateSafe(getPayableDate(b)));

  return { overdue, today: dueToday, upcoming };
}

  function renderDateBadge() {
    const badge = document.getElementById("todayDateBadge");
    if (badge) {
      badge.textContent = `Hoje • ${formatDateBR(new Date())}`;
    }
  }

  async function renderTopKpis(validSales, cancelledSales = []) {
  const revenue = validSales.reduce((acc, sale) => acc + getSaleTotal(sale), 0);

  const customerMap = new Map();

  for (const sale of validSales) {
    const snap = getSaleCustomerSnapshot(sale);
    const customerName = getSaleCustomerName(sale);
    if (!customerName) continue;

    const key =
      String(snap?.id || "").trim() ||
      String(snap?.doc || "").trim() ||
      String(getSaleCustomerPhone(sale) || "").trim() ||
      customerName.toLowerCase();

    if (!customerMap.has(key)) {
      customerMap.set(key, customerName);
    }
  }

  const customersCount = customerMap.size;
  const cancelledCount = cancelledSales.length;

  const $revenue = document.getElementById("kpiRevenue");
  const $customersCount = document.getElementById("kpiCustomersCount");
  const $cancelledSalesCount = document.getElementById("kpiCancelledSalesCount");

  if ($revenue) $revenue.textContent = moneyBR(revenue);
  if ($customersCount) $customersCount.textContent = String(customersCount);
  if ($cancelledSalesCount) $cancelledSalesCount.textContent = String(cancelledCount);
}

  async function buildProductTotalsFromSales(sales) {
  const map = new Map();
  const productsMap = await getProductsMapSafe();

  for (const sale of sales) {
    const items = getSaleItems(sale);

    for (const item of items) {
      const qty = getItemQty(item);
      if (!qty) continue;

      const productId = String(
        item?.productId ||
        item?.product_id ||
        ""
      ).trim();

      const productRef = productId ? productsMap.get(productId) : null;
      const name = productRef?.name || getItemName(item);
      const image = productRef?.image || item?.image || item?.photo || "";

      if (!map.has(name)) {
        map.set(name, {
          name,
          qty: 0,
          image
        });
      }

      const ref = map.get(name);
      ref.qty += qty;

      if (!ref.image && image) {
        ref.image = image;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
}

 async function renderProductsChart(sales) {
  const chart = document.getElementById("salesDonutChart");
  const center = document.getElementById("donutCenterValue");
  const legend = document.getElementById("salesLegend");

  if (!chart || !center || !legend) return;

  const totals = await buildProductTotalsFromSales(sales);
  const top = totals.slice(0, 6);
  const grandTotal = top.reduce((acc, item) => acc + item.qty, 0);

  center.textContent = String(grandTotal);

  if (!top.length) {
    chart.style.background = "conic-gradient(#cbd5e1 0deg 360deg)";
    legend.innerHTML = `<div class="empty-state-inline">Nenhuma saída de produto hoje.</div>`;
    return;
  }

  let currentDeg = 0;
  const segments = top.map((item, index) => {
    const portion = grandTotal > 0 ? item.qty / grandTotal : 0;
    const deg = portion * 360;
    const start = currentDeg;
    const end = currentDeg + deg;
    currentDeg = end;

    return {
      ...item,
      color: DONUT_COLORS[index % DONUT_COLORS.length],
      start,
      end,
      percent: portion * 100
    };
  });

  chart.style.background = `conic-gradient(${segments
    .map((seg) => `${seg.color} ${seg.start}deg ${seg.end}deg`)
    .join(", ")})`;

  legend.innerHTML = segments
  .map(
    (seg) => `
      <div class="legend-row">
        <div class="legend-left">
          <span class="legend-dot" style="background:${seg.color};"></span>

          <div class="product-thumb-wrap">
            ${
              seg.image
                ? `<img class="product-thumb" src="${seg.image}" alt="${seg.name}">`
                : `<div class="product-thumb product-thumb--placeholder">IMG</div>`
            }
          </div>

          <div class="legend-main">
            <div class="legend-name">${seg.name}</div>
            <div class="legend-meta">${seg.percent.toFixed(1)}% dos itens vendidos</div>
          </div>
        </div>

        <div class="legend-value">${seg.qty} un</div>
      </div>
    `
  )
  .join("");
}

  async function renderStockAlerts() {
    const stockSummary = document.getElementById("stockAlertSummary");
    const stockList = document.getElementById("stockAlertsList");
    const stockBadge = document.getElementById("stockAlertsBadge");

    const { zero, below } = await getStockAlerts();
    const stockTotal = zero.length + below.length;

    if (stockBadge) stockBadge.textContent = String(stockTotal);

    if (stockSummary) {
      stockSummary.textContent = stockTotal
        ? `${stockTotal} alerta(s) de estoque`
        : "Nenhum alerta no momento";
    }

    if (stockList) {
      const items = [
  ...zero.map((p) => ({
    title: p.name || "Produto sem nome",
    meta: `SKU: ${p.sku || "—"} • Estoque: ${Number(p.stockOnHand || 0)} • Mín: ${Number(p.stockMin || 0)}`,
    pill: "ZERADO",
    kind: "danger",
    image: p.imageData || p.image || p.photo || ""
  })),
  ...below.map((p) => ({
    title: p.name || "Produto sem nome",
    meta: `SKU: ${p.sku || "—"} • Estoque: ${Number(p.stockOnHand || 0)} • Mín: ${Number(p.stockMin || 0)}`,
    pill: "ABAIXO",
    kind: "warn",
    image: p.imageData || p.image || p.photo || ""
  }))
];

      stockList.innerHTML = items.length
  ? items.map((item) => `
      <div class="alert-item alert-item--product">
        <div class="alert-thumb">
          ${
            item.image
              ? `<img src="${item.image}" alt="${item.title}">`
              : `<span class="alert-thumb-fallback">IMG</span>`
          }
        </div>

        <div class="alert-item-main">
          <div class="alert-item-title">${item.title}</div>
          <div class="alert-item-meta">${item.meta}</div>
        </div>

        <span class="alert-pill ${item.kind}">${item.pill}</span>
      </div>
    `).join("")
  : `<div class="empty-state-inline">Nenhum alerta de estoque.</div>`;
    }
  }

  async function renderPayablesAlerts() {
    const payablesSummary = document.getElementById("payablesAlertSummary");
    const payablesList = document.getElementById("payablesAlertsList");
    const payablesBadge = document.getElementById("payablesAlertsBadge");

    const { overdue, today, upcoming } = await getPayablesAlerts();
    const total = overdue.length + today.length + upcoming.length;

    if (payablesBadge) payablesBadge.textContent = String(total);

    if (payablesSummary) {
      if (overdue.length) {
        payablesSummary.textContent = `${overdue.length} vencida(s), ${today.length} vence(m) hoje`;
      } else if (today.length) {
        payablesSummary.textContent = `${today.length} conta(s) vence(m) hoje`;
      } else if (upcoming.length) {
        payablesSummary.textContent = `${upcoming.length} conta(s) vence(m) em até 7 dias`;
      } else {
        payablesSummary.textContent = "Nenhum vencimento próximo";
      }
    }

    if (payablesList) {
      const items = [
        ...overdue.map((p) => ({
          title: getPayableTitle(p),
          meta: `Vencimento: ${formatDateBR(new Date(getPayableDate(p)))} • ${moneyBR(getPayableAmount(p))}`,
          pill: "VENCIDA",
          kind: "danger"
        })),
        ...today.map((p) => ({
          title: getPayableTitle(p),
          meta: `Vence hoje • ${moneyBR(getPayableAmount(p))}`,
          pill: "HOJE",
          kind: "warn"
        })),
        ...upcoming.map((p) => ({
          title: getPayableTitle(p),
          meta: `Vencimento: ${formatDateBR(new Date(getPayableDate(p)))} • ${moneyBR(getPayableAmount(p))}`,
          pill: "PRÓXIMA",
          kind: "ok"
        }))
      ].slice(0, 8);

      payablesList.innerHTML = items.length
        ? items.map((item) => `
            <div class="alert-item">
              <div class="alert-item-main">
                <div class="alert-item-title">${item.title}</div>
                <div class="alert-item-meta">${item.meta}</div>
              </div>
              <span class="alert-pill ${item.kind}">${item.pill}</span>
            </div>
          `).join("")
        : `<div class="empty-state-inline">Nenhuma conta crítica no momento.</div>`;
    }
  }

  function renderCustomersToday(sales) {
    const wrap = document.getElementById("customersTodayList");
    if (!wrap) return;

    const customerMap = new Map();

    for (const sale of sales) {
      const name = getSaleCustomerName(sale);
      if (!name) continue;

      const snap = getSaleCustomerSnapshot(sale);
const phone = getSaleCustomerPhone(sale);
const total = getSaleTotal(sale);

const key =
  String(snap?.id || "").trim() ||
  String(snap?.doc || "").trim() ||
  String(phone || "").trim() ||
  name.toLowerCase();

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name,
          phone,
          purchases: 0,
          total: 0
        });
      }

      const ref = customerMap.get(key);
      ref.purchases += 1;
      ref.total += total;
    }

    const customers = Array.from(customerMap.values()).sort((a, b) => b.total - a.total);

    if (!customers.length) {
      wrap.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">Nenhum cliente encontrado hoje</div>
          <div class="empty-state-text">Assim que houver vendas com cliente vinculado, eles aparecem aqui.</div>
        </div>
      `;
      return;
    }

    wrap.innerHTML = customers
  .map((customer) => `
    <div class="customer-row customer-row--stacked">
      <div class="customer-main">
        <div class="customer-name">${customer.name}</div>
        <div class="customer-meta">${customer.phone || "Sem telefone informado"}</div>
      </div>

      <div class="customer-side">
        <div class="customer-count">${customer.purchases} compra(s)</div>
        <div class="customer-total">${moneyBR(customer.total)}</div>
      </div>
    </div>
  `)
  .join("");
  }

  async function renderHome() {
    renderDateBadge();

    const sales = await loadTodaySalesSafe();

const validSales = sales.filter((sale) => !isSaleCancelled(sale));
const cancelledSales = sales.filter((sale) => isSaleCancelled(sale));

await renderTopKpis(validSales, cancelledSales);
await renderProductsChart(validSales);
renderCustomersToday(validSales);
await renderStockAlerts();
await renderPayablesAlerts();
  }

  renderHome().catch((err) => {
    console.error("[HOME] Erro ao renderizar painel do dia:", err);
  });

  function rerenderHome() {
    renderHome().catch((err) => {
      console.error("[HOME] Erro ao atualizar painel do dia:", err);
    });
  }

  window.CoreBus?.on?.("stock:changed", rerenderHome);
  window.CoreBus?.on?.("cash:changed", rerenderHome);
  window.CoreBus?.on?.("sale:created", rerenderHome);
  window.CoreBus?.on?.("sale:finished", rerenderHome);
  window.CoreBus?.on?.("contas_pagar:changed", rerenderHome);
  window.CoreBus?.on?.("finance:changed", rerenderHome);
};