// app.js
const app = document.getElementById("app");
const router = window.CoreRouter.createRouter({ mountEl: app });

(async () => {
  try {
    if (window.CoreAuth?.bootstrap) {
      const result = await window.CoreAuth.bootstrap();
      const current = window.CoreAuth?.getCurrentUser?.();
if (current) {
  const url = new URL(window.location.href);
  const maybeName = url.searchParams.get("user_name") || "";
  if (maybeName && !current.name) {
    current.name = maybeName;
    localStorage.setItem("core_session_v2", JSON.stringify(current));
  }
}
      console.log("[CORE] bootstrap result:", result);
      console.log("[CORE] current user after bootstrap:", window.CoreAuth?.getCurrentUser?.());
      console.log("[CORE] active tenant after bootstrap:", window.CoreAuth?.getActiveTenantId?.());
    }
  } catch (e) {
    console.warn("CoreAuth.bootstrap falhou:", e);
  }

  setActiveSidebar("home");
  router.render("home");
})();

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-go-home]");
  if (!el) return;

  setActiveSidebar("home");
  router.go("home");
});


function setActiveSidebar(routeName) {
  document.querySelectorAll(".sidebar-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.route === routeName);
  });
}

document.addEventListener("click", (e) => {
  const navBtn = e.target.closest(".sidebar-link[data-route]");
  if (!navBtn) return;

  const route = navBtn.dataset.route;
  if (!route) return;

  router.go(route);
  setActiveSidebar(route);
});

// acessibilidade: Enter/Espaço no “logo”
document.addEventListener("keydown", (e) => {
  const el = document.activeElement;
  if (!el || el.id !== "btnGoHome") return;

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    router.go("home");
  }
});

// ===== refs DOM (config global) =====
const adminAuthOverlay = document.getElementById("adminAuthOverlay");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const adminAuthError = document.getElementById("adminAuthError");

const systemConfigOverlay = document.getElementById("systemConfigOverlay");


const configMachines = document.getElementById("machinesSection");

// machines
const machineForm = document.getElementById("machineForm");
const btnNewMachine = document.getElementById("btnNewMachine");
const saveMachineBtn = document.getElementById("saveMachine");
const machineNameInput = document.getElementById("machineName");
const machinesList = document.getElementById("machineList");


/* =========================
   CUSTOMERS STORE (Supabase)
========================= */

window.CustomersStore = (function () {
  function requireSb() {
  const candidates = [
    window.sb,
    window.CoreSupabase?.client,
    window.supabase
  ];

  const sb = candidates.find(c => c && typeof c.from === "function") || null;

  if (!sb) {
    throw new Error("Cliente Supabase não encontrado ou inválido em window.");
  }

  return sb;
}

  function getTenantId() {
    const auth = window.CoreAuth;
    if (auth?.getCurrentTenantId) return auth.getCurrentTenantId();
    if (auth?.getTenantId) return auth.getTenantId();

    const u = auth?.getCurrentUser?.() || null;
    return u?.tenant_id || u?.tenantId || null;
  }

  function mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name || "",
      phone: row.phone || "",
      doc: row.doc || "",
      notes: row.notes || "",
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null
    };
  }

  async function list({ limit = 1000, orderBy = "name", ascending = true } = {}) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");

    let query = sb
      .from("customers")
      .select("*")
      .eq("tenant_id", tenantId)
      .order(orderBy, { ascending });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(mapRow);
  }

  async function create(payload = {}) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");

    const row = {
      tenant_id: tenantId,
      name: String(payload.name || "").trim(),
      phone: String(payload.phone || "").trim() || null,
      doc: String(payload.doc || "").trim() || null,
      notes: String(payload.notes || "").trim() || null
    };

    const { data, error } = await sb
      .from("customers")
      .insert(row)
      .select("*")
      .single();

    if (error) throw error;
    return mapRow(data);
  }

  async function update(id, payload = {}) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");
    if (!id) throw new Error("ID do cliente é obrigatório.");

    const row = {
      name: String(payload.name || "").trim(),
      phone: String(payload.phone || "").trim() || null,
      doc: String(payload.doc || "").trim() || null,
      notes: String(payload.notes || "").trim() || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await sb
      .from("customers")
      .update(row)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

    if (error) throw error;
    return mapRow(data);
  }

  async function remove(id) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");
    if (!id) throw new Error("ID do cliente é obrigatório.");

    const { error } = await sb
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;
    return true;
  }

  return {
    list,
    create,
    update,
    remove
  };
})();


/* =========================
   MACHINES STORE (Supabase)
========================= */

window.MachinesStore = (function () {
  function requireSb() {
    const candidates = [
      window.sb,
      window.CoreSupabase?.client,
      window.supabase
    ];

    const sb = candidates.find(c => c && typeof c.from === "function") || null;

    if (!sb) {
      throw new Error("Cliente Supabase não encontrado ou inválido em window.");
    }

    return sb;
  }

  function getTenantId() {
    const auth = window.CoreAuth;
    if (auth?.getCurrentTenantId) return auth.getCurrentTenantId();
    if (auth?.getTenantId) return auth.getTenantId();

    const u = auth?.getCurrentUser?.() || null;
    return u?.tenant_id || u?.tenantId || null;
  }

  function normalizeRates(rates) {
  const src = rates && typeof rates === "object" ? rates : {};
  const out = {};

  Object.keys(src).forEach(key => {
    const raw = src[key];

    if (raw && typeof raw === "object") {
      out[String(key)] = {
        enabled: raw.enabled !== false,
        rate: Number(raw.rate || 0)
      };
      return;
    }

    out[String(key)] = {
      enabled: true,
      rate: Number(raw || 0)
    };
  });

  return out;
}

  function mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name || "",
      rates: normalizeRates(row.rates || {}),
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
      raw: row
    };
  }

  async function list({ limit = 1000, orderBy = "name", ascending = true } = {}) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");

    let query = sb
      .from("machines")
      .select("*")
      .eq("tenant_id", tenantId)
      .order(orderBy, { ascending });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(mapRow);
  }

  async function create(payload = {}) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");

    const row = {
      tenant_id: tenantId,
      name: String(payload.name || "").trim(),
      rates: normalizeRates(payload.rates || {})
    };

    const { data, error } = await sb
      .from("machines")
      .insert(row)
      .select("*")
      .single();

    if (error) throw error;
    return mapRow(data);
  }

  async function update(id, payload = {}) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");
    if (!id) throw new Error("ID da maquininha é obrigatório.");

    const row = {
      name: String(payload.name || "").trim(),
      rates: normalizeRates(payload.rates || {}),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await sb
      .from("machines")
      .update(row)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

    if (error) throw error;
    return mapRow(data);
  }

  async function remove(id) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");
    if (!id) throw new Error("ID da maquininha é obrigatório.");

    const { error } = await sb
      .from("machines")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;
    return true;
  }

  return {
    list,
    create,
    update,
    remove
  };
})();


/* =========================
   AP CATEGORIES STORE (Supabase)
========================= */

window.APCategoriesStore = (function () {
  function requireSb() {
    const candidates = [
      window.sb,
      window.CoreSupabase?.client,
      window.supabase
    ];
    const sb = candidates.find(c => c && typeof c.from === "function") || null;
    if (!sb) throw new Error("Cliente Supabase não encontrado ou inválido em window.");
    return sb;
  }

  function getTenantId() {
    const auth = window.CoreAuth;
    if (auth?.getCurrentTenantId) return auth.getCurrentTenantId();
    if (auth?.getTenantId) return auth.getTenantId();
    const u = auth?.getCurrentUser?.() || null;
    return u?.tenant_id || u?.tenantId || null;
  }

  function mapRow(row) {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: String(row.name || "").trim(),
      createdAt: row.created_at || null
    };
  }

  async function list({ limit = 1000, orderBy = "name", ascending = true } = {}) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");

    let query = sb
      .from("ap_categories")
      .select("*")
      .eq("tenant_id", tenantId)
      .order(orderBy, { ascending });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async function create(payload = {}) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");

    const row = {
      tenant_id: tenantId,
      name: String(payload.name || "").trim()
    };

    const { data, error } = await sb
      .from("ap_categories")
      .insert(row)
      .select("*")
      .single();

    if (error) throw error;
    return mapRow(data);
  }

  async function remove(id) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");
    if (!id) throw new Error("ID da categoria é obrigatório.");

    const { error } = await sb
      .from("ap_categories")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;
    return true;
  }

  return { list, create, remove };
})();


/* =========================
   AP PAYABLES STORE (Supabase)
========================= */

window.APPayablesStore = (function () {
  function requireSb() {
    const candidates = [
      window.sb,
      window.CoreSupabase?.client,
      window.supabase
    ];
    const sb = candidates.find(c => c && typeof c.from === "function") || null;
    if (!sb) throw new Error("Cliente Supabase não encontrado ou inválido em window.");
    return sb;
  }

  function getTenantId() {
    const auth = window.CoreAuth;
    if (auth?.getCurrentTenantId) return auth.getCurrentTenantId();
    if (auth?.getTenantId) return auth.getTenantId();
    const u = auth?.getCurrentUser?.() || null;
    return u?.tenant_id || u?.tenantId || null;
  }

  function mapRow(row) {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      title: row.title || "",
      categoryId: row.category_id || null,
      category: row.category_name || "",
      supplier: row.supplier || "",
      amount: Number(row.amount || 0),
      dueDate: row.due_date || "",
      status: row.status || "pending",
      paidAt: row.paid_at || null,
      paidMethod: row.paid_method || "",
      notes: row.notes || "",
      groupId: row.group_id || "",
      installment: row.installment != null ? Number(row.installment) : null,
      installments: row.installments != null ? Number(row.installments) : null,
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null
    };
  }

  async function list({ limit = 5000, orderBy = "due_date", ascending = true } = {}) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");

    let query = sb
      .from("ap_payables")
      .select("*")
      .eq("tenant_id", tenantId)
      .order(orderBy, { ascending });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async function create(payload = {}) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");

    const row = {
      tenant_id: tenantId,
      title: String(payload.title || "").trim(),
      category_id: payload.categoryId || null,
      category_name: String(payload.category || "").trim() || null,
      supplier: String(payload.supplier || "").trim() || null,
      amount: Number(payload.amount || 0),
      due_date: payload.dueDate || null,
      status: String(payload.status || "pending"),
      paid_at: payload.paidAt || null,
      paid_method: String(payload.paidMethod || "").trim() || null,
      notes: String(payload.notes || "").trim() || null,
      group_id: String(payload.groupId || "").trim() || null,
      installment: payload.installment != null ? Number(payload.installment) : null,
      installments: payload.installments != null ? Number(payload.installments) : null
    };

    const { data, error } = await sb
      .from("ap_payables")
      .insert(row)
      .select("*")
      .single();

    if (error) throw error;
    return mapRow(data);
  }

  async function update(id, payload = {}) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");
    if (!id) throw new Error("ID da conta é obrigatório.");

    const row = {
      title: String(payload.title || "").trim(),
      category_id: payload.categoryId || null,
      category_name: String(payload.category || "").trim() || null,
      supplier: String(payload.supplier || "").trim() || null,
      amount: Number(payload.amount || 0),
      due_date: payload.dueDate || null,
      status: String(payload.status || "pending"),
      paid_at: payload.paidAt || null,
      paid_method: String(payload.paidMethod || "").trim() || null,
      notes: String(payload.notes || "").trim() || null,
      group_id: String(payload.groupId || "").trim() || null,
      installment: payload.installment != null ? Number(payload.installment) : null,
      installments: payload.installments != null ? Number(payload.installments) : null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await sb
      .from("ap_payables")
      .update(row)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

    if (error) throw error;
    return mapRow(data);
  }

  async function remove(id) {
    const sb = requireSb();
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("tenant_id não encontrado na sessão.");
    if (!id) throw new Error("ID da conta é obrigatório.");

    const { error } = await sb
      .from("ap_payables")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;
    return true;
  }

  return { list, create, update, remove };
})();


/* =========================
   ADMIN / CONFIGURAÇÕES
========================= */

const ADMIN_PASSWORD = "adminconfig00";


/* ---------- AUTH ---------- */
function openAdminAuth() {
  adminAuthOverlay.classList.remove("core-hidden");
  adminPasswordInput.value = "";
  adminPasswordInput.focus();
}

function closeAdminAuth() {
  adminAuthOverlay.classList.add("core-hidden");
}

function confirmAdminAuth() {
  if (adminPasswordInput.value !== ADMIN_PASSWORD) {
    adminAuthError.classList.remove("hidden");
    return;
  }
  adminAuthError.classList.add("hidden");
  closeAdminAuth();
  openSystemConfig();
}

if (adminPasswordInput) {
  adminPasswordInput.addEventListener("keydown", e => {
    if (e.key === "Enter") confirmAdminAuth();
  });
}


async function openSystemConfig() {
  systemConfigOverlay.classList.remove("core-hidden");
  switchConfigTab("machines");
  await loadMachines();
  renderMachines();
}

function closeSystemConfig() {
  systemConfigOverlay.classList.add("core-hidden");
}

/* ---------- TABS ---------- */
function switchConfigTab(tab) {
  if (configMachines) {
    configMachines.classList.toggle("hidden", tab !== "machines");
  }

  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.tab[data-tab="${tab}"]`);
  if (btn) btn.classList.add("active");

  if (machineForm) machineForm.classList.add("hidden");
editingMachineId = null;
if (saveMachineBtn) saveMachineBtn.textContent = "Salvar";
}

/* =========================
   MAQUININHAS
========================= */

let editingMachineId = null;
let machinesCache = [];

function getRateInput(key){
  return document.querySelector(`[data-rate="${key}"]`);
}

function getRateCheckbox(key){
  return document.querySelector(`[data-rate-enabled="${key}"]`);
}

function setRateEnabled(key, enabled){
  const input = getRateInput(key);
  const checkbox = getRateCheckbox(key);

  const isEnabled = !!enabled;

  if (checkbox) checkbox.checked = isEnabled;

  if (input){
    input.disabled = !isEnabled;
    input.classList.toggle("is-disabled-rate", !isEnabled);

    if (!isEnabled){
      input.value = "";
    }
  }
}

function bindRateToggles(){
  document.querySelectorAll("[data-rate-enabled]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const key = checkbox.dataset.rateEnabled;
      const input = getRateInput(key);
      const enabled = checkbox.checked;

      if (input){
        input.disabled = !enabled;
        input.classList.toggle("is-disabled-rate", !enabled);

        if (!enabled){
          input.value = "";
        }
      }
    });
  });
}


function clearMachineForm(){
  machineNameInput.value = "";

  document.querySelectorAll("[data-rate]").forEach(inp => {
    inp.value = "";
    inp.disabled = false;
    inp.classList.remove("is-disabled-rate");
  });

  document.querySelectorAll("[data-rate-enabled]").forEach(chk => {
    chk.checked = true;
  });

  editingMachineId = null;
  if (saveMachineBtn) saveMachineBtn.textContent = "Salvar";
}

function showMachineForm(){
  machineForm.classList.toggle("hidden");
  if (!machineForm.classList.contains("hidden")) {
    machineNameInput.focus();
  } else {
    clearMachineForm();
  }
}

async function loadMachines(){
  try{
    if (!window.MachinesStore?.list){
      console.warn("[APP] MachinesStore não encontrado.");
      machinesCache = [];
      return machinesCache;
    }

    machinesCache = await window.MachinesStore.list({
      limit: 1000,
      orderBy: "name",
      ascending: true
    });

    return machinesCache;
  }catch(err){
    console.error("[APP] Erro ao carregar maquininhas:", err);
    machinesCache = [];
    return machinesCache;
  }
}

async function startEditMachine(id){
  if (!id) return;

  const m = machinesCache.find(x => String(x.id) === String(id));
  if (!m) return;

  editingMachineId = m.id;
  machineForm.classList.remove("hidden");
  machineNameInput.value = m.name || "";

  document.querySelectorAll("[data-rate]").forEach(inp => {
  const key = inp.dataset.rate;
  const cfg = m.rates?.[key] || { enabled: true, rate: 0 };

  inp.value = cfg.enabled ? Number(cfg.rate || 0) : "";
  inp.disabled = !cfg.enabled;
  inp.classList.toggle("is-disabled-rate", !cfg.enabled);

  const checkbox = getRateCheckbox(key);
  if (checkbox) checkbox.checked = !!cfg.enabled;
});

  saveMachineBtn.textContent = "Salvar alterações";
}

async function saveMachine(){
  const name = machineNameInput.value.trim();
  if (!name) return;

  const rates = {};

document.querySelectorAll("[data-rate]").forEach(inp => {
  const key = inp.dataset.rate;
  const checkbox = getRateCheckbox(key);
  const enabled = checkbox ? checkbox.checked : true;

  rates[key] = {
    enabled,
    rate: enabled ? Number(inp.value || 0) : 0
  };
});

  try{
    if (editingMachineId === null){
      await window.MachinesStore.create({ name, rates });
    } else {
      await window.MachinesStore.update(editingMachineId, { name, rates });
    }

    await loadMachines();
    renderMachines();

    clearMachineForm();
    machineForm.classList.add("hidden");
  }catch(err){
    console.error("[APP] Erro ao salvar maquininha:", err);
    alert("Não foi possível salvar a maquininha.");
  }
}

function renderMachines(){
  machinesList.innerHTML = "";

  machinesCache.forEach((m) => {
    machinesList.innerHTML += `
      <div class="list-item">
        <div>
          <div style="font-weight:950; color:#0f172a;">${m.name}</div>
          <div class="meta">
  Débito: <b>${m.rates?.debito?.enabled ? `${Number(m.rates?.debito?.rate || 0)}%` : "desabilitado"}</b> •
  Crédito 1x: <b>${m.rates?.["1"]?.enabled ? `${Number(m.rates?.["1"]?.rate || 0)}%` : "desabilitado"}</b> •
  Crédito 2x: <b>${m.rates?.["2"]?.enabled ? `${Number(m.rates?.["2"]?.rate || 0)}%` : "desabilitado"}</b>
</div>
        </div>
        <div class="actions">
          <button class="icon-action edit" title="Editar" onclick="startEditMachine('${m.id}')">✏️</button>
          <button class="icon-action del" title="Excluir" onclick="removeMachine('${m.id}')">✖</button>
        </div>
      </div>
    `;
  });
}

async function removeMachine(id){
  if (!id) return;

  const ok = confirm("Deseja realmente excluir esta maquininha?");
  if (!ok) return;

  try{
    await window.MachinesStore.remove(id);

    await loadMachines();
    renderMachines();

    if (editingMachineId === id){
      clearMachineForm();
      machineForm.classList.add("hidden");
    }
  }catch(err){
    console.error("[APP] Erro ao excluir maquininha:", err);
    alert("Não foi possível excluir a maquininha.");
  }
}

if (btnNewMachine){
  btnNewMachine.addEventListener("click", showMachineForm);
}

if (saveMachineBtn){
  saveMachineBtn.addEventListener("click", async () => {
    await saveMachine();
  });
}

bindRateToggles();

/* =========================
   CHAT GLOBAL (LocalStorage)
   1 sala / todos
========================= */

const CHAT_KEY = "core.chat.v1";
const CHAT_READ_KEY = "core.chat.readAt.v1"; // por usuário

const btnChat = document.getElementById("btnChat");
const chatUnreadBadge = document.getElementById("chatUnreadBadge");

const chatOverlay = document.getElementById("chatOverlay");
const btnChatClose = document.getElementById("btnChatClose");
const btnChatClear = document.getElementById("btnChatClear");
// Modal limpar chat (senha admin)
const chatClearOverlay = document.getElementById("chatClearOverlay");
const btnChatClearClose = document.getElementById("btnChatClearClose");
const btnChatClearCancel = document.getElementById("btnChatClearCancel");
const btnChatClearConfirm = document.getElementById("btnChatClearConfirm");
const chatClearPass = document.getElementById("chatClearPass");
const chatClearError = document.getElementById("chatClearError");

const chatList = document.getElementById("chatList");
const chatInput = document.getElementById("chatInput");
const btnChatSend = document.getElementById("btnChatSend");

function chatNowISO(){ return new Date().toISOString(); }
function chatFmtTime(iso){
  try { return new Date(iso).toLocaleString("pt-BR"); }
  catch { return ""; }
}

function chatLoad(){
  try{
    const raw = localStorage.getItem(CHAT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch(e){
    return [];
  }
}

function chatSave(list){
  localStorage.setItem(CHAT_KEY, JSON.stringify(list || []));
}

function chatGetSessionUser(){
  // tenta pegar de CoreAuth; fallback pro texto da topbar
  const s = window.CoreAuth?.getCurrentUser?.();
  if (s && (s.name || s.user || s.username)){
    return {
      id: String(s.id || s.user || s.username || s.name),
      name: String(s.name || s.user || s.username),
      role: String(s.role || "FUNC")
    };
  }

  const hello = document.getElementById("userHello")?.textContent || "Usuário";
  const cleaned = String(hello)
    .replace(/^Olá[,!]?\s*/i, "")
    .replace(/\s*\(.*?\)\s*/g, "")
    .trim();

  return { id: cleaned || "user", name: cleaned || "Usuário", role: "FUNC" };
}

function chatLoadUsers(){
  try{
    const raw = localStorage.getItem("core_users");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch{
    return [];
  }
}

function isAdminSession(){
  const s = window.CoreAuth?.getCurrentUser?.();
  const role = String(s?.role || "").toUpperCase();
  return role === "ADMIN" || role === "DEV";
}

function validateAdminPassword(pass){
  return String(pass || "").trim() === ADMIN_PASSWORD;
}

function chatClearAll(){
  localStorage.removeItem(CHAT_KEY);
  localStorage.removeItem(CHAT_READ_KEY);
  chatRender();
  chatRefreshBadge();
}

btnChatClear?.addEventListener("click", () => {
  // só ADMIN/DEV pode nem abrir o modal
  if (!isAdminSession()){
    alert("Apenas ADMIN pode limpar o chat.");
    return;
  }
  openChatClearModal();
});

btnChatClearClose?.addEventListener("click", closeChatClearModal);
btnChatClearCancel?.addEventListener("click", closeChatClearModal);

chatClearOverlay?.addEventListener("click", (e) => {
  if (e.target === chatClearOverlay) closeChatClearModal();
});

btnChatClearConfirm?.addEventListener("click", () => {
  const pass = String(chatClearPass?.value || "").trim();

  if (!pass){
    chatClearError.textContent = "Digite a senha do ADMIN.";
    chatClearError.classList.remove("hidden");
    chatClearPass?.focus();
    return;
  }

  if (!validateAdminPassword(pass)){
    chatClearError.textContent = "Senha inválida.";
    chatClearError.classList.remove("hidden");
    chatClearPass?.select();
    chatClearPass?.focus();
    return;
  }

  // ✅ limpa de verdade
  chatClearAll();

  // fecha modal
  closeChatClearModal();
});

chatClearPass?.addEventListener("keydown", (e) => {
  if (e.key === "Enter"){
    e.preventDefault();
    btnChatClearConfirm?.click();
  }
  if (e.key === "Escape"){
    e.preventDefault();
    closeChatClearModal();
  }
});


function chatLoadReadMap(){
  try{
    const raw = localStorage.getItem(CHAT_READ_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  }catch{
    return {};
  }
}

function chatSaveReadMap(obj){
  localStorage.setItem(CHAT_READ_KEY, JSON.stringify(obj || {}));
}

function chatGetReadAt(userId){
  const map = chatLoadReadMap();
  return map[userId] ? Number(map[userId]) : 0;
}

function chatMarkRead(){
  const u = chatGetSessionUser();
  const map = chatLoadReadMap();
  map[u.id] = Date.now();
  chatSaveReadMap(map);
  chatRefreshBadge();
}

function chatHasUnread(){
  const u = chatGetSessionUser();
  const msgs = chatLoad();
  if (!msgs.length) return false;

  const lastTs = msgs[msgs.length - 1]?.ts || 0;
  const readAt = chatGetReadAt(u.id);
  return Number(lastTs) > Number(readAt);
}

function chatRefreshBadge(){
  if (!chatUnreadBadge) return;
  const has = chatHasUnread();
  chatUnreadBadge.classList.toggle("hidden", !has);
}

function chatRender(){
  if (!chatList) return;

  const msgs = chatLoad();
  if (!msgs.length){
    chatList.innerHTML = `<div class="muted" style="padding:10px;font-weight:900;">Sem mensagens ainda.</div>`;
    return;
  }

  chatList.innerHTML = msgs.map(m => {
    const initial = String(m.byName || "?").trim().slice(0,1).toUpperCase();
    const role = m.byRole ? ` (${m.byRole})` : "";
    return `
      <div class="chat-msg">
        <div class="chat-avatar">${initial}</div>
        <div class="chat-bubble">
          <div class="chat-meta">
            <span>${m.byName || "—"}${role}</span>
            <span class="time">${chatFmtTime(m.at)}</span>
          </div>
          <div class="chat-text">${escapeHtml(String(m.text || ""))}</div>
        </div>
      </div>
    `;
  }).join("");

  // scroll pro fim
  chatList.scrollTop = chatList.scrollHeight;
}

function escapeHtml(str){
  return str
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function chatOpen(){
  if (!chatOverlay) return;
  chatOverlay.classList.remove("core-hidden");
  chatRender();
  chatMarkRead();
  setTimeout(() => chatInput?.focus(), 30);
}

function chatClose(){
  if (!chatOverlay) return;
  chatOverlay.classList.add("core-hidden");
}

function openChatClearModal(){
  if (!chatClearOverlay) return;

  chatClearError?.classList.add("hidden");
  if (chatClearPass) chatClearPass.value = "";

  chatClearOverlay.classList.remove("core-hidden");
  setTimeout(() => chatClearPass?.focus(), 30);
}

function closeChatClearModal(){
  if (!chatClearOverlay) return;
  chatClearOverlay.classList.add("core-hidden");
}


function chatSend(){
  const text = String(chatInput?.value || "").trim();
  if (!text) return;

  const u = chatGetSessionUser();
  const msgs = chatLoad();

  msgs.push({
    id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`,
    at: chatNowISO(),
    ts: Date.now(),
    byId: u.id,
    byName: u.name,
    byRole: u.role,
    text
  });

  // limite simples pra não explodir localStorage
  const MAX = 300;
  const next = msgs.length > MAX ? msgs.slice(msgs.length - MAX) : msgs;

  chatSave(next);
  chatInput.value = "";
  chatRender();
  chatMarkRead();
}

// listeners
btnChat?.addEventListener("click", (e) => { e.preventDefault(); chatOpen(); });
btnChatClose?.addEventListener("click", chatClose);
chatOverlay?.addEventListener("click", (e) => { if (e.target === chatOverlay) chatClose(); });

btnChatSend?.addEventListener("click", chatSend);
chatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter"){
    e.preventDefault();
    chatSend();
  }
  if (e.key === "Escape"){
    e.preventDefault();
    chatClose();
  }
});

// atualiza badge quando storage muda (outra aba/janela)
window.addEventListener("storage", (e) => {
  if (e.key === CHAT_KEY || e.key === CHAT_READ_KEY){
    chatRefreshBadge();
    // se o chat estiver aberto, re-renderiza
    if (chatOverlay && !chatOverlay.classList.contains("core-hidden")){
      chatRender();
      chatMarkRead();
    }
  }
});

// init
chatRefreshBadge();

// expõe API global (se quiser mandar msg do DEV/rotas etc)
window.CoreChat = {
  open: chatOpen,
  close: chatClose,
  send: (text) => {
    if (!text) return;
    if (!chatInput) return;
    chatInput.value = String(text);
    chatSend();
  },
  refreshBadge: chatRefreshBadge
};
