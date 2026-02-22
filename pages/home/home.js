// pages/home/home.js
window.CorePageModules = window.CorePageModules || {};
window.CorePageModules.home = function ({ go }) {

  // Navegação dos cards principais
document.querySelectorAll("[data-go]").forEach(el => {
  el.addEventListener("click", (ev) => {
    const page = el.getAttribute("data-go");

    // se não pode acessar, trava clique
    if (!window.CoreAuth?.canAccess?.(page)) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    go(page);
  });
});

// trava visual do card Relatórios pro FUNC
const user = window.CoreAuth?.getCurrentUser?.();
const isFunc = (user?.role || "FUNC") === "FUNC";
if (isFunc) {
  const cardRel = document.querySelector('[data-go="relatorios"]');
  if (cardRel) {
    cardRel.classList.add("locked");
    cardRel.setAttribute("aria-disabled", "true");
    cardRel.style.pointerEvents = "auto"; // mantém hover/visual, mas clique é bloqueado pelo JS
  }
}


  // ===== Atalhos Rápidos =====
  const modal = document.getElementById("clientModal");
  const cName = document.getElementById("cName");
  const cPhone = document.getElementById("cPhone");
  const cCpf = document.getElementById("cCpf");
  const cNote = document.getElementById("cNote");
  const btnCancel = document.getElementById("btnClientCancel");
  const btnSave = document.getElementById("btnClientSave");

  const STORAGE_KEY = "corepos:customers";

  function openClientModal(){
    modal.classList.remove("hidden");
    cName.value = "";
    cPhone.value = "";
    cCpf.value = "";
    cNote.value = "";
    cName.focus();
  }

  function closeClientModal(){
    modal.classList.add("hidden");
  }

  function loadCustomers(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }catch{
      return [];
    }
  }

  function saveCustomers(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function normalize(str){
    return (str || "").trim().toLowerCase();
  }

  function saveClient(){
    const name = (cName.value || "").trim();
    const phone = (cPhone.value || "").trim();
    const cpf = (cCpf.value || "").trim();
    const note = (cNote.value || "").trim();

    if (!name){
      alert("Informe o nome do cliente.");
      return;
    }

    const customers = loadCustomers();

    // Evita duplicar por CPF ou telefone (bem simples)
    if (cpf && customers.some(c => normalize(c.cpf) === normalize(cpf))){
      alert("Já existe cliente com esse CPF.");
      return;
    }
    if (phone && customers.some(c => normalize(c.phone) === normalize(phone))){
      alert("Já existe cliente com esse telefone.");
      return;
    }

    const id = `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    customers.push({ id, name, phone, cpf, note, createdAt: Date.now() });
    saveCustomers(customers);

    alert("Cliente cadastrado (mock).");
    closeClientModal();
  }

  // Click nos atalhos
  document.querySelectorAll(".quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");

      if (action === "clientes") openClientModal();
      else if (action === "sangria") alert("Sangria (mock) — vamos implementar no Caixa.");
      else if (action === "suprimento") alert("Suprimento (mock) — vamos implementar no Caixa.");
    });
  });

  // Modal events
  btnCancel.addEventListener("click", closeClientModal);
  btnSave.addEventListener("click", saveClient);

  // Fechar clicando fora do card
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeClientModal();
  });

  // Esc fecha
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("hidden") && e.key === "Escape") closeClientModal();
  });

(function () {
  const DEV_PASSWORD = "core-dev";

  function factoryResetCore() {
    // apaga só o que é do CORE / COREPOS
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;

      // ajuste os prefixes aqui se quiser
      if (
        k.startsWith("core.") ||
        k.startsWith("corepos:") ||
        k.startsWith("corepos") ||
        k.startsWith("COREPOS")
      ) {
        keys.push(k);
      }
    }

    // remove fora do loop pra não bagunçar o índice
    keys.forEach(k => localStorage.removeItem(k));

    alert(`Factory reset concluído ✅\n\nRemovidas ${keys.length} chaves do CORE.\nA página vai recarregar.`);
    location.reload();
  }

  function askAndReset() {
    const pass = prompt("Senha DEV (Factory Reset):");
    if (pass !== DEV_PASSWORD) {
      alert("Senha incorreta.");
      return;
    }

    const ok = confirm(
      "⚠️ FACTORY RESET\n\nIsso vai apagar TODOS os dados do sistema (produtos, caixa, eventos, layouts DEV, etc.).\n\nDeseja continuar?"
    );
    if (!ok) return;

    // segunda confirmação pra evitar acidente
    const ok2 = confirm("Última confirmação: apagar TUDO e voltar ao padrão de fábrica?");
    if (!ok2) return;

    factoryResetCore();
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === "L" || e.key === "l")) {
      e.preventDefault();
      askAndReset();
    }
  });
})();


  // ===== Resumo do Dia (Caixa) =====
  function moneyBR(v){
    const n = Number(v || 0);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function fmtDateBR(d){
    return d.toLocaleDateString("pt-BR");
  }

  function renderDaySummary(){
    const $date = document.getElementById("daySummaryDate");
    const $sales = document.getElementById("daySummarySales");
    const $cust = document.getElementById("daySummaryCustomers");

    if ($date) $date.textContent = `(${fmtDateBR(new Date())})`;

    // Se CoreCash não existir ainda, fica no zero mesmo
    if (!window.CoreCash){
      if ($sales) $sales.textContent = moneyBR(0);
      if ($cust) $cust.textContent = "0";
      return;
    }

    const sum = window.CoreCash.getSummary?.() || null;

    const salesTotal = sum ? (sum.salesTotal || 0) : 0;
    const salesCount = sum ? (sum.salesCount || 0) : 0;

    // Vendas = valor bruto vendido no dia
    if ($sales) $sales.textContent = moneyBR(salesTotal);

    // Clientes = quantidade de vendas do dia (como você pediu)
    if ($cust) $cust.textContent = String(salesCount);
  }

  renderDaySummary();

  // ===== Notificações (Estoque) =====
  const KEY_PRODUCTS = "core.products.v1";

  function loadProductsSafe(){
    try{ return JSON.parse(localStorage.getItem(KEY_PRODUCTS) || "[]"); }
    catch{ return []; }
  }

  function getStockAlerts(){
    const products = loadProductsSafe();

    // só ATIVOS
    const active = products.filter(p => (p.status || "active") !== "inactive");

    // margem "perto do mínimo": 20% do mínimo (mínimo 1)
    function nearLimit(min){
      const m = Number(min || 0);
      if (m <= 0) return 0;
      return m + Math.max(1, Math.ceil(m * 0.2));
    }

    const zero = [];
    const below = [];
    const near = [];

    for (const p of active){
      const stock = Number(p.stockOnHand || 0);
      const min = Number(p.stockMin || 0);

      if (stock <= 0){
        zero.push(p);
        continue;
      }

      if (min > 0 && stock < min){
        below.push(p);
        continue;
      }

      if (min > 0 && stock <= nearLimit(min)){
        near.push(p);
      }
    }

    // ordena por gravidade e “mais crítico primeiro”
    zero.sort((a,b) => Number(a.stockOnHand||0) - Number(b.stockOnHand||0));
    below.sort((a,b) => (Number(a.stockOnHand||0) - Number(a.stockMin||0)) - (Number(b.stockOnHand||0) - Number(b.stockMin||0)));
    near.sort((a,b) => (Number(a.stockOnHand||0) - Number(a.stockMin||0)) - (Number(b.stockOnHand||0) - Number(b.stockMin||0)));

    return { zero, below, near };
  }

  function renderNotifications(){
  const kpi = document.getElementById("notifyKpi");
  const preview = document.getElementById("notifyPreview");

  const { zero, below, near } = getStockAlerts();
  const total = zero.length + below.length + near.length;

  if (kpi) kpi.textContent = `(${total})`;

  if (!preview) return;

  // sem notificações
  if (!total){
    preview.innerHTML = `
      <div class="notifications-empty">
        <div class="notif-text">Nenhuma notificação no momento</div>
      </div>
    `;
    return;
  }

  // com notificações: mostra itens no card (até 3) com layout bonito + scroll
const top = [...zero, ...below, ...near].slice(0, 3);

preview.innerHTML = `
  <div class="notify-mini">
    ${top.map(p => {
      const stock = Number(p.stockOnHand || 0);
      const min = Number(p.stockMin || 0);
      const img = p.imageData
        ? `<img src="${p.imageData}" alt="">`
        : ``;

      const badge =
        stock <= 0 ? `<span class="pill danger">ZERADO</span>` :
        (min > 0 && stock < min) ? `<span class="pill warn">ABAIXO</span>` :
        `<span class="pill ok">PERTO</span>`;

      return `
        <div class="notify-item">
          <div class="notify-thumb">${img || "IMG"}</div>
          <div class="notify-main">
            <div class="notify-name">${p.name || "—"}</div>
            <div class="notify-meta">SKU: <b>${p.sku || "—"}</b> • Estoque: <b>${stock}</b> • Min: <b>${min}</b></div>
          </div>
          <div class="notify-badge">${badge}</div>
        </div>
      `;
    }).join("")}

    ${total > top.length ? `<div class="muted small" style="margin-top:6px;">Clique para ver todas…</div>` : ``}
  </div>
`;


  renderNotifyModalIfOpen();
}


  // Modal grandão
  const notifyModal = document.getElementById("notifyModal");
  const btnNotifyClose = document.getElementById("btnNotifyClose");
  const notifyPreview = document.getElementById("notifyPreview");
  const notifyModalBody = document.getElementById("notifyModalBody");
  const notifyModalHint = document.getElementById("notifyModalHint");

  function openNotifyModal(){
    if (!notifyModal) return;
    notifyModal.classList.remove("hidden");
    renderNotifyModal();
  }

  function closeNotifyModal(){
    if (!notifyModal) return;
    notifyModal.classList.add("hidden");
  }

  function renderNotifyModalIfOpen(){
    if (!notifyModal || notifyModal.classList.contains("hidden")) return;
    renderNotifyModal();
  }

  function renderNotifyModal(){
    const { zero, below, near } = getStockAlerts();
    const total = zero.length + below.length + near.length;

    if (notifyModalHint){
      notifyModalHint.textContent = total
        ? `Produtos ativos com atenção de estoque: ${total}`
        : "Nenhuma notificação no momento.";
    }

    if (!notifyModalBody) return;

    if (!total){
      notifyModalBody.innerHTML = `
        <div class="notifications-empty" style="padding:18px 0;">
          <div class="notif-ico">🔔</div>
          <div class="notif-text">Nenhuma notificação no momento</div>
        </div>
      `;
      return;
    }

    function section(title, list, kind){
  if (!list.length) return "";

  const badgeClass = kind === "danger" ? "danger" : (kind === "warn" ? "warn" : "ok");
  const badgeText =
    kind === "danger" ? "ZERADO" :
    kind === "warn" ? "ABAIXO" :
    "PERTO";

  return `
    <div style="margin-bottom:14px;">
      <div style="font-weight:950;margin:10px 0 8px;">${title} (${list.length})</div>

      <div class="notify-mini" style="max-height:none; overflow:visible; padding:0; margin:0;">
        ${list.map(p => {
          const stock = Number(p.stockOnHand || 0);
          const min = Number(p.stockMin || 0);
          const img = p.imageData ? `<img src="${p.imageData}" alt="">` : `IMG`;

          return `
            <div class="notify-item" style="margin-right:0;">
              <div class="notify-thumb">${img}</div>
              <div class="notify-main">
                <div class="notify-name">${p.name || "—"}</div>
                <div class="notify-meta">SKU: <b>${p.sku || "—"}</b> • Estoque: <b>${stock}</b> • Min: <b>${min}</b></div>
              </div>
              <div class="notify-badge">
                <span class="pill ${badgeClass}">${badgeText}</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}


    notifyModalBody.innerHTML =
      section("Zerado", zero, "danger") +
      section("Abaixo do mínimo", below, "warn") +
      section("Perto do mínimo", near, "ok") +
      `<div class="muted small">As notificações somem automaticamente ao repor o estoque ou marcar o produto como inativo.</div>`;
  }

  if (notifyPreview){
    notifyPreview.addEventListener("click", openNotifyModal);
  }
  if (btnNotifyClose){
    btnNotifyClose.addEventListener("click", closeNotifyModal);
  }
  if (notifyModal){
    notifyModal.addEventListener("click", (e) => { if (e.target === notifyModal) closeNotifyModal(); });
  }
  document.addEventListener("keydown", (e) => {
    if (notifyModal && !notifyModal.classList.contains("hidden") && e.key === "Escape") closeNotifyModal();
  });

  renderNotifications();

  
};

