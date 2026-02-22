/* pages/caixa/caixa.js */
(function () {

  // trava scroll do body só enquanto a página Caixa estiver ativa
  document.body.classList.add("cash-scroll-lock");

  const user = window.CoreAuth?.getCurrentUser?.();
const isFunc = (user?.role || "FUNC") === "FUNC";

if (isFunc) {
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setTxt("profitValue", "— — —");
  setTxt("profitPct", "— — —");
  setTxt("profitHint", "— — —");
}


  // cleanup básico (se recarregar)
  window.addEventListener("beforeunload", () => {
    document.body.classList.remove("cash-scroll-lock");
  });

  const el = (id) => document.getElementById(id);

  const $pill = el("cashStatusPill");
  const $meta = el("cashStatusMeta");

  const $kpiInitial = el("kpiInitial");
  const $kpiTheoCash = el("kpiTheoCash");
  const $kpiSalesCount = el("kpiSalesCount");

  const $sumCash = el("sumCash");
  const $sumPix = el("sumPix");
  const $sumCredit = el("sumCredit");
  const $sumDebit = el("sumDebit");
  const $sumObs = el("sumObs");

  const $profitValue = el("profitValue");
  const $profitPct = el("profitPct");
  const $profitHint = el("profitHint");

  const $eventsList = el("eventsList");

  const $btnOpen = el("btnOpenCash");
  const $btnClose = el("btnCloseCash");
  const $btnSupply = el("btnSupply");
  const $btnWithdraw = el("btnWithdraw");

  // modal (abrir/fechar/suprimento/sangria)
  const $backdrop = el("cashModalBackdrop");
  const $mTitle = el("cashModalTitle");
  const $mValue = el("cashModalValue");
  const $mNotes = el("cashModalNotes");
  const $mHint = el("cashModalHint");
  const $mClose = el("cashModalClose");
  const $mCancel = el("cashModalCancel");
  const $mConfirm = el("cashModalConfirm");

  let modalValueLocked = false;


  const $btnEventsEdit = el("btnEventsEdit");

  const $eventsDate = el("eventsDate");
const $btnEventsToday = el("btnEventsToday");


  // admin modal
  const $adminBackdrop = el("adminBackdrop");
  const $adminPass = el("adminPass");
  const $adminClose = el("adminClose");
  const $adminCancel = el("adminCancel");
  const $adminConfirm = el("adminConfirm");

  // sale view modal
  const $saleViewBackdrop = el("saleViewBackdrop");
  const $saleViewClose = el("saleViewClose");
  const $saleViewOk = el("saleViewOk");
  const $saleViewPrint = el("saleViewPrint");

  const $saleViewBody = el("saleViewBody");
  const $saleViewTitle = el("saleViewTitle");

  let adminMode = false;
  const ADMIN_PASSWORD = "1234"; // ✅ senha do admin

  const moneyOrMask = (v) =>
  isFunc
    ? "— — —"
    : Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });


  


  function openAdminModal() {
    $adminPass.value = "";
    $adminBackdrop.classList.remove("hidden");
    setTimeout(() => $adminPass.focus(), 50);
  }

  function closeAdminModal() {
    $adminBackdrop.classList.add("hidden");
  }

  function moneyBR(v) {
    const n = Number(v || 0);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("pt-BR");
  }

  function dayKeyFromISO(iso){
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`; // YYYY-MM-DD
}

function todayKey(){
  return dayKeyFromISO(new Date().toISOString());
}

function getFilteredEvents(core){
  const events = core?.getEvents?.() || [];
  const selected = ($eventsDate && $eventsDate.value) ? $eventsDate.value : todayKey();
  return events.filter(e => dayKeyFromISO(e.at) === selected);
}




  function typeLabel(t) {
    return ({
      OPEN: "ABERTURA",
      CLOSE: "FECHAMENTO",
      SALE: "VENDA",
      WITHDRAW: "SANGRIA",
      SUPPLY: "SUPRIMENTO",
    }[t] || t);
  }

  function getOperatorName() {
    const a = window.CoreAuth;

    // 1) tenta CoreAuth direto
    if (a) {
      const u =
        a.getCurrentUser?.() ||
        a.getUser?.() ||
        a.currentUser ||
        a.user ||
        a.session?.user ||
        a.state?.user ||
        null;

      if (u) {
        if (typeof u === "string") return u;
        return u.name || u.displayName || u.fullName || u.email || u.username || "operador";
      }

      if (typeof a.getDisplayName === "function") {
        const n = a.getDisplayName();
        if (n) return n;
      }
      if (a.username) return a.username;
    }

    // 2) fallback: pega da topbar
    const hello = document.getElementById("userHello");
    if (hello && hello.textContent) {
      const txt = hello.textContent.trim();
      const cleaned = txt
        .replace(/^Olá[,!]?\s*/i, "")
        .replace(/\s*\(.*?\)\s*/g, "")
        .trim();
      if (cleaned) return cleaned;
    }

    return "operador";
  }

  function openSaleView(eventSale) {
    lastSaleForPrint = eventSale;

    const e = eventSale;
    const meta = e.meta || {};
    const a = window.CoreAuth;
const u =
  a?.getCurrentUser?.() ||
  a?.getUser?.() ||
  a?.currentUser ||
  a?.user ||
  a?.session?.user ||
  a?.state?.user ||
  null;

const isFunc = (u && typeof u === "object" && u.role === "FUNC");

    const cust = meta.customer || null;
    const discounts = meta.discounts || [];
    const items = meta.items || [];
    const pay = e.payments || {};

    $saleViewTitle.textContent = `Detalhes • ${e.saleId || ""}`.trim();

    const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // ===== PAGAMENTO (com troco no dinheiro) =====
const payLines = [];

// dinheiro líquido (já deve vir assim da Venda)
const cashNet = Number(pay.cash || 0);

// valores extras vêm do meta (a Venda vai gravar)
const cashReceived = Number(meta.cashReceived || 0); // ex: 100
const changeCash   = Number(meta.changeCash || 0);   // ex: 6

// Dinheiro: mostra recebido/troco/líquido quando houver
if (cashReceived > 0 || cashNet > 0) {
  const received = cashReceived > 0 ? cashReceived : cashNet;

  payLines.push(`<div>Dinheiro recebido: <b>${money(received)}</b></div>`);

  if (changeCash > 0) {
    payLines.push(`<div>Troco: <b>${money(changeCash)}</b></div>`);
    payLines.push(`<div>Dinheiro líquido: <b>${money(cashNet)}</b></div>`);
  } else {
    if (cashNet > 0) payLines.push(`<div>Dinheiro: <b>${money(cashNet)}</b></div>`);
  }
}

// Outras formas (só se usadas)
const pix = Number(pay.pix || 0);
const cc  = Number(pay.cardCredit || 0);
const cd  = Number(pay.cardDebit || 0);

if (pix > 0) payLines.push(`<div>Pix: <b>${money(pix)}</b></div>`);
if (cc  > 0) payLines.push(`<div>Crédito: <b>${money(cc)}</b></div>`);
if (cd  > 0) payLines.push(`<div>Débito: <b>${money(cd)}</b></div>`);


    const payHtml = `
      <div class="sale-box">
        <div style="font-weight:900;margin-bottom:6px;">Pagamento</div>
        ${payLines.length ? payLines.join("") : `<div class="muted">Sem pagamentos registrados</div>`}
        <div style="margin-top:10px;">Total: <b>${money(e.total)}</b></div>
        <div>Custo: <b>${moneyOrMask(e.costTotal || 0)}</b></div>
        <div>Lucro bruto: <b>${moneyOrMask(meta.profitGross != null ? meta.profitGross : ((e.total||0)-(e.costTotal||0)))}</b></div>
<div>Taxas: <b>${moneyOrMask(meta.cardFeeTotal || 0)}</b></div>
<div>Lucro líquido: <b>${moneyOrMask(e.profit != null ? e.profit : ((e.total || 0) - (e.costTotal || 0)))}</b></div>


      </div>
    `;

    // ===== CLIENTE =====
    const custHtml = `
      <div class="sale-box">
        <div style="font-weight:900;margin-bottom:6px;">Cliente</div>
        <div>${cust ? `<b>${cust.name}</b> (${cust.id || "—"})` : "Consumidor final / não informado"}</div>
        <div style="margin-top:10px;font-weight:900;">Operador</div>
        <div>${e.by || "—"}</div>
        <div style="margin-top:10px;font-weight:900;">Data</div>
        <div>${fmtDate(e.at)}</div>
      </div>
    `;

    // ===== DESCONTOS =====
    const discHtml = `
      <div class="sale-box">
        <div style="font-weight:900;margin-bottom:6px;">Descontos</div>
        ${
          discounts.length
            ? discounts.map(d => `<div>• ${d.type === "percent" ? `${d.value}%` : money(d.value)} ${d.reason ? `— ${d.reason}` : ""}</div>`).join("")
            : `<div class="muted">Nenhum desconto</div>`
        }
      </div>
    `;

    // ===== CUSTOS OPERACIONAIS =====
const opCosts = meta.operationalCosts || [];
const opTotal = Number(meta.cardFeeTotal || 0);

const opHtml = isFunc
  ? `
    <div class="sale-box">
      <div style="font-weight:900;margin-bottom:6px;">Custos operacionais</div>
      <div>• — — —</div>
      <div style="margin-top:10px;">Total: <b>— — —</b></div>
    </div>
  `
  : `
    <div class="sale-box">
      <div style="font-weight:900;margin-bottom:6px;">Custos operacionais</div>
      ${
        opCosts.length
          ? opCosts.map(c => `
              <div>• ${c.label || "Custo"}: <b>${money(c.value || 0)}</b></div>
            `).join("")
          : `<div class="muted">Nenhum custo operacional</div>`
      }
      ${opCosts.length ? `<div style="margin-top:10px;">Total: <b>${money(opTotal)}</b></div>` : ``}
    </div>
  `;



    // ===== ITENS (com DESCONTO RATEADO) =====
    const saleTotal = Number(e.total || 0);

    const fullItemsTotal = items.reduce((s, it) => {
      const unit = Number(it.price || 0);
      const qty = Number(it.qty || 0);
      return s + (unit * qty);
    }, 0);

    // fator: total_liquido / total_cheio
    const factor = (fullItemsTotal > 0 && saleTotal > 0) ? (saleTotal / fullItemsTotal) : 1;

    const itemsHtml = `
      <div class="sale-items">
        <div style="font-weight:900;margin-bottom:8px;">Itens</div>
        ${
          items.length
            ? items.map(it => {
                const unit = Number(it.price || 0);
                const qty = Number(it.qty || 0);

                // preço/total efetivos (desconto rateado proporcionalmente)
                const unitEff = unit * factor;
                const totalEff = unitEff * qty;

                return `
                  <div class="sale-item-row">
                    <div class="sale-item-img">
                      <img src="${it.img || "assets/img/placeholder.png"}" alt="">
                    </div>

                    <div>
                      <div style="font-weight:900;">
                        ${it.name} <span class="muted">(${it.barcode || ""})</span>
                      </div>
                      <div class="muted small">Qtd: ${qty}</div>
                    </div>

                    <div style="text-align:right;">
                      <div class="muted small">Preço</div>
                      <div style="font-weight:900;">${money(unitEff)}</div>
                    </div>

                    <div style="text-align:right;">
                      <div class="muted small">Total</div>
                      <div style="font-weight:900;">${money(totalEff)}</div>
                    </div>
                  </div>
                `;
              }).join("")
            : `<div class="muted">Sem itens salvos no evento.</div>`
        }

        <div class="muted small" style="margin-top:8px;">
          * Valores dos itens com desconto rateado proporcionalmente.
        </div>
      </div>
    `;

    $saleViewBody.innerHTML = `
  <div class="sale-detail-grid">
    ${custHtml}
    ${payHtml}
  </div>
  ${discHtml}
  ${opHtml}
  <div style="height:10px;"></div>
  ${itemsHtml}
`;


    $saleViewBackdrop.classList.remove("hidden");
  }

  function closeSaleView() {
    $saleViewBackdrop.classList.add("hidden");
    $saleViewBody.innerHTML = "";
  }

  let modalMode = null;

  function disableAllActions(disabled) {
    if ($btnOpen) $btnOpen.disabled = !!disabled;
    if ($btnClose) $btnClose.disabled = !!disabled;
    if ($btnSupply) $btnSupply.disabled = !!disabled;
    if ($btnWithdraw) $btnWithdraw.disabled = !!disabled;
  }

  // proteção CoreCash
  if (!window.CoreCash) {
    console.error("CoreCash não carregou. Inclua <script src='CoreCash.js'></script> no index.html (antes do app.js).");
    try { alert("Erro: CoreCash não carregou.\n\nConfira se você adicionou o script CoreCash.js no index.html."); } catch (_) {}
    disableAllActions(true);
  }

  function openModal(mode) {
    if (!window.CoreCash) return;
    modalMode = mode;
    $mValue.value = "";
    $mNotes.value = "";
    $mHint.textContent = "";

    if (mode === "OPEN") {
  $mTitle.textContent = "Abrir caixa";
  $mHint.textContent = "Saldo inicial baseado no último fechamento.";

  const lastClosed =
    CoreCash.getSession()?.finalAmount ?? 0;

  $mValue.value = Number(lastClosed || 0);
  $mValue.disabled = true;
  modalValueLocked = true;

  injectEditButton();
}


    if (mode === "CLOSE") {
  $mTitle.textContent = "Fechar caixa";
  $mHint.textContent = "Saldo final sugerido com base no dinheiro teórico.";

  const theoCash = CoreCash.getTheoreticalCash?.() || 0;

  $mValue.value = Number(theoCash || 0);
  $mValue.disabled = true;
  modalValueLocked = true;

  injectEditButton();
}

    if (mode === "SUPPLY") {
      $mTitle.textContent = "Suprimento (entrada)";
      $mHint.textContent = "Entrada de dinheiro no caixa.";
    }
    if (mode === "WITHDRAW") {
      $mTitle.textContent = "Sangria (retirada)";
      $mHint.textContent = "Retirada de dinheiro do caixa.";
    }

    $backdrop.classList.remove("hidden");
    setTimeout(() => $mValue.focus(), 50);
  }

  function injectEditButton() {
  let btn = document.getElementById("btnEditCashValue");
  if (btn) return;

  btn = document.createElement("button");
  btn.id = "btnEditCashValue";
  btn.className = "btn";
  btn.textContent = "Editar";

  btn.addEventListener("click", () => {
    openAdminModal();
    btn.dataset.unlockTarget = "cashValue";
  });

  const actions = document.querySelector(".modal-actions");
  actions.prepend(btn);
}


  function closeModal() {
    modalMode = null;
    $backdrop.classList.add("hidden");
    const btn = document.getElementById("btnEditCashValue");
if (btn) btn.remove();

$mValue.disabled = false;
modalValueLocked = false;



  }

  function render() {
    const core = window.CoreCash;

    const session = core?.getSession?.() || null;
    const events = getFilteredEvents(core);
    const summary = core?.getSummary?.() || {
      byPayment: { cash: 0, pix: 0, cardCredit: 0, cardDebit: 0 },
      salesCount: 0,
      salesTotal: 0,
      suppliesCash: 0,
      withdrawsCash: 0,
      profitTotal: 0,
      profitPct: 0,
      costTotal: 0
    };
    const theoCash = core?.getTheoreticalCash?.() || 0;

    const isOpen = !!(session && session.isOpen);

    // status
    $pill.textContent = isOpen ? "CAIXA ABERTO" : "CAIXA FECHADO";
    $pill.classList.toggle("open", isOpen);
    $pill.classList.toggle("closed", !isOpen);

    if (!core) {
      $meta.textContent = "CoreCash não carregado. Verifique o script CoreCash.js no index.html.";
    } else if (isOpen) {
      $meta.textContent = `Aberto em ${fmtDate(session.openedAt)} por ${session.openedBy || "—"}`;
    } else if (session && session.closedAt) {
      $meta.textContent = `Fechado em ${fmtDate(session.closedAt)} por ${session.closedBy || "—"}`;
    } else {
      $meta.textContent = "Nenhuma sessão registrada ainda.";
    }

    if (isOpen) {
  // Caixa aberto
  $kpiInitial.textContent = moneyBR(session?.initialAmount || 0);
  $kpiTheoCash.textContent = moneyBR(theoCash);
} else {
  // Caixa fechado
  $kpiInitial.textContent = moneyBR(session?.finalAmount || 0);
  $kpiTheoCash.textContent = "—";
}

    $kpiSalesCount.textContent = String(summary.salesCount || 0);

    // resumo por pagamento
    $sumCash.textContent = moneyBR(summary.byPayment?.cash || 0);
    $sumPix.textContent = moneyBR(summary.byPayment?.pix || 0);
    $sumCredit.textContent = moneyBR(summary.byPayment?.cardCredit || 0);
    $sumDebit.textContent = moneyBR(summary.byPayment?.cardDebit || 0);

    $sumObs.textContent =
      `Total vendido: ${moneyBR(summary.salesTotal || 0)} • ` +
      `Suprimento: ${moneyBR(summary.suppliesCash || 0)} • ` +
      `Sangria: ${moneyBR(summary.withdrawsCash || 0)}`;

      const a = window.CoreAuth;
const u =
  a?.getCurrentUser?.() ||
  a?.getUser?.() ||
  a?.currentUser ||
  a?.user ||
  a?.session?.user ||
  a?.state?.user ||
  null;

const isFunc = (u && typeof u === "object" && u.role === "FUNC");


    // lucro
if (isFunc) {
  $profitValue.textContent = "— — —";
  $profitPct.textContent = "— — —";
  $profitHint.textContent = "— — —";
} else {
  $profitValue.textContent = moneyBR(summary.profitTotal || 0);
  $profitPct.textContent = `${Number(summary.profitPct || 0).toFixed(1)}%`;

  if ((summary.costTotal || 0) > 0) {
    $profitHint.textContent =
      `Custo total: ${moneyBR(summary.costTotal)} • Margem: ${Number(summary.profitPct || 0).toFixed(1)}%`;
  } else {
    $profitHint.textContent =
      "Para calcular o lucro, a Venda precisa enviar o custo total (costTotal) ao registrar a venda.";
  }
}


    // botões
    if (core) {
      $btnOpen.disabled = isOpen;
      $btnClose.disabled = !isOpen;
      $btnSupply.disabled = !isOpen;
      $btnWithdraw.disabled = !isOpen;
    }

    // eventos
    $eventsList.innerHTML = "";
    if (!core) {
      $eventsList.innerHTML = `<div class="muted">Não foi possível carregar eventos porque o CoreCash não está disponível.</div>`;
      return;
    }

    if (!events.length) {
      $eventsList.innerHTML = `<div class="muted">Nenhum evento registrado ainda.</div>`;
      return;
    }

    events.slice(0, 200).forEach(e => {
      const t = typeLabel(e.type);
      const when = fmtDate(e.at);
      const who = e.by ? ` • por ${e.by}` : "";

      let desc = `${when}${who}`;
      let amt = "";

      if (e.type === "SALE") {
        const p = e.payments || {};
        const total = e.total || (Number(p.cash || 0) + Number(p.pix || 0) + Number(p.cardCredit || 0) + Number(p.cardDebit || 0));
        desc = `${when} • Venda ${e.saleId || ""}${who}`.trim();
        amt = moneyBR(total);
      } else if (e.type === "OPEN") {
        desc = `${when} • Abertura${who}`;
        amt = moneyBR(e.amount || 0);
      } else if (e.type === "CLOSE") {
        desc = `${when} • Fechamento${who}`;
        amt = moneyBR(e.amount || 0);
      } else if (e.type === "SUPPLY") {
        desc = `${when} • Entrada (suprimento)${who}`;
        amt = moneyBR(e.amount || 0);
      } else if (e.type === "WITHDRAW") {
        desc = `${when} • Retirada (sangria)${who}`;
        amt = moneyBR(e.amount || 0);
      }

      const row = document.createElement("div");
      row.className = "event-row";

      const leftActions = [];
      const rightActions = [];

      // 👁 ao lado do tipo
      if (e.type === "SALE") {
        leftActions.push(`<button class="event-btn" data-view="${e.id}" title="Ver detalhes">👁</button>`);
      }

      // 🗑 só no modo admin
      if (adminMode) {
        rightActions.push(`<button class="event-btn danger" data-del="${e.id}" title="Excluir evento">🗑</button>`);
      }

      row.innerHTML = `
        <div class="event-type">
          <span>${t}</span>
          ${leftActions.join("")}
        </div>
        <div class="event-desc">${desc}</div>
        <div class="event-amt">${amt}</div>
        <div class="event-actions">${rightActions.join("")}</div>
      `;

      $eventsList.appendChild(row);
    });
  }

  function confirmModal() {
    if (!window.CoreCash) return;

  


    const val = Number($mValue.value || 0);
    const notes = ($mNotes.value || "").trim();
    const by = getOperatorName();

    if (modalMode === "OPEN") {
      const r = CoreCash.open({ initialAmount: val, by, notes });
      if (!r.ok) alert(r.reason || "Não foi possível abrir o caixa.");
      closeModal();
      render();
      return;
    }

    if (modalMode === "CLOSE") {
      const r = CoreCash.close({ finalAmount: val, by, notes });
      if (!r.ok) alert(r.reason || "Não foi possível fechar o caixa.");
      closeModal();
      render();
      return;
    }

    if (modalMode === "SUPPLY") {
      const r = CoreCash.supply({ amount: val, by, notes });
      if (!r.ok) alert(r.reason || "Não foi possível lançar suprimento.");
      closeModal();
      render();
      return;
    }

    if (modalMode === "WITHDRAW") {
      const r = CoreCash.withdraw({ amount: val, by, notes });
      if (!r.ok) alert(r.reason || "Não foi possível lançar sangria.");
      closeModal();
      render();
      return;
    }
  }

  function wire() {
    // filtro de data (Eventos)
if ($eventsDate) $eventsDate.value = todayKey();

$btnEventsToday?.addEventListener("click", () => {
  if (!$eventsDate) return;
  $eventsDate.value = todayKey();
  render();
});

$eventsDate?.addEventListener("change", () => {
  render();
});

      
    $btnOpen.addEventListener("click", () => openModal("OPEN"));
    $btnClose.addEventListener("click", () => openModal("CLOSE"));
    $btnSupply.addEventListener("click", () => openModal("SUPPLY"));
    $btnWithdraw.addEventListener("click", () => openModal("WITHDRAW"));

    $mClose.addEventListener("click", closeModal);
    $mCancel.addEventListener("click", closeModal);
    $backdrop.addEventListener("click", (e) => { if (e.target === $backdrop) closeModal(); });
    $mConfirm.addEventListener("click", confirmModal);

    $btnEventsEdit.addEventListener("click", () => {
      if (adminMode) {
        adminMode = false;
        render();
        return;
      }
      openAdminModal();
    });

    $adminClose.addEventListener("click", closeAdminModal);
    $adminCancel.addEventListener("click", closeAdminModal);
    $adminBackdrop.addEventListener("click", (e) => { if (e.target === $adminBackdrop) closeAdminModal(); });

    $adminConfirm.addEventListener("click", () => {
  const pass = ($adminPass.value || "").trim();
  if (pass !== ADMIN_PASSWORD) {
    alert("Senha incorreta.");
    return;
  }

  const btnEdit = document.getElementById("btnEditCashValue");
  const target = btnEdit?.dataset.unlockTarget;

  // 🔓 Caso especial: destravar valor do modal OPEN
  if (target === "cashValue") {
    delete btnEdit.dataset.unlockTarget; // 🔥 limpa o alvo
    $mValue.disabled = false;
    modalValueLocked = false;
    closeAdminModal();
    $mValue.focus();
    return; // ⛔ NÃO entra em adminMode, NÃO renderiza
  }

  // 🛠️ Caso normal: modo admin global (lixeiras)
  adminMode = true;
  closeAdminModal();
  render();
});


    $adminPass.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation(); // 🔒 ESSENCIAL
    $adminConfirm.click();
  }
});



    $saleViewClose.addEventListener("click", closeSaleView);
    $saleViewOk.addEventListener("click", closeSaleView);
    $saleViewPrint?.addEventListener("click", () => {
  if (!lastSaleForPrint) return;

  // monta o objeto no formato que o cupom espera
  const e = lastSaleForPrint;
  const meta = e.meta || {};
  const items = meta.items || [];

  const saleForReceipt = {
    saleId: e.saleId,
    at: e.at,
    by: e.by,
    customer: meta.customer || null,
    items: items.map(it => ({
      name: it.name,
      barcode: it.barcode,
      qty: it.qty,
      price: it.price,
      img: it.img || null
    })),
    total: e.total,
    payments: e.payments || {},
    operationalCosts: meta.operationalCosts || [],
    cardFeeTotal: meta.cardFeeTotal || 0
  };

  // chama impressão global (venda.js expõe)
  if (window.CoreReceipt?.printThermal) {
    window.CoreReceipt.printThermal(saleForReceipt);
    return;
  }

  alert("Impressão não disponível. Abra uma Venda e recarregue para carregar o módulo de impressão.");
});

    $saleViewBackdrop.addEventListener("click", (e) => { if (e.target === $saleViewBackdrop) closeSaleView(); });

    document.addEventListener("keydown", (e) => {
      // Se o foco estiver no input da senha admin, não faz mais nada
if (document.activeElement === $adminPass) {
  return;
}

  // 🔒 Se o modal admin estiver aberto, ele tem prioridade total
  if (!$adminBackdrop.classList.contains("hidden")) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeAdminModal();
    }
    return; // ⛔ impede qualquer ação no modal principal
  }

  // Modal principal
  if (!$backdrop.classList.contains("hidden")) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      confirmModal();
    }
  }

  if (!$saleViewBackdrop.classList.contains("hidden")) {
    if (e.key === "Escape") closeSaleView();
  }
});


    // Delegação: funciona mesmo após re-render
    $eventsList.addEventListener("click", (ev) => {
      const viewBtn = ev.target.closest("[data-view]");
      if (viewBtn) {
        ev.stopPropagation();
        const id = viewBtn.getAttribute("data-view");
        const eventsAll = window.CoreCash.getEvents();
        const saleEvt = eventsAll.find(x => String(x.id) === String(id));
        if (saleEvt) openSaleView(saleEvt);
        return;
      }

      const delBtn = ev.target.closest("[data-del]");
      if (delBtn) {
        ev.stopPropagation();
        const id = delBtn.getAttribute("data-del");
        if (!confirm("Excluir este evento? Isso vai recalcular os totais do caixa.")) return;

        const r = window.CoreCash.deleteEvent(id);
        if (!r.ok) {
          alert(r.reason || "Não foi possível excluir.");
          return;
        }
        render();
      }
    });
  }

  wire();
  render();

  window.CoreCaixaPage = { render };
})();
