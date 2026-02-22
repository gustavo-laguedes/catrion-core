// app.js
const app = document.getElementById("app");
const router = window.CoreRouter.createRouter({ mountEl: app });

if (!window.CoreAuth || !window.CoreAuth.getSession() ) {
  router.render("login");
} else {
  const session = window.CoreAuth.getSession();
  router.render(session ? "home" : "login");
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-go-home]");
  if (!el) return;

  // se não estiver logado, manda pro login
  if (!window.CoreAuth || !window.CoreAuth.getSession()) {
    router.render("login");
    return;
  }

  router.go("home");
});


// acessibilidade: Enter/Espaço no “logo”
document.addEventListener("keydown", (e) => {
  const el = document.activeElement;
  if (!el || el.id !== "btnGoHome") return;

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();

    if (!window.CoreAuth || !window.CoreAuth.getSession()) {
      router.render("login");
      return;
    }

    router.go("home");
  }
});

// ===== refs DOM (config global) =====
const adminAuthOverlay = document.getElementById("adminAuthOverlay");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const adminAuthError = document.getElementById("adminAuthError");

const systemConfigOverlay = document.getElementById("systemConfigOverlay");

// sections
const configUsers = document.getElementById("usersSection");
const configMachines = document.getElementById("machinesSection");

// users
const userForm = document.getElementById("userForm");
const btnNewUser = document.getElementById("btnNewUser");
const saveUserBtn = document.getElementById("saveUser");
const userNameInput = document.getElementById("userName");
const userRoleInput = document.getElementById("userRole");
const userPasswordInput = document.getElementById("userPass");
const usersList = document.getElementById("userList");

// machines
const machineForm = document.getElementById("machineForm");
const btnNewMachine = document.getElementById("btnNewMachine");
const saveMachineBtn = document.getElementById("saveMachine");
const machineNameInput = document.getElementById("machineName");
const machinesList = document.getElementById("machineList");




/* =========================
   ADMIN / CONFIGURAÇÕES
========================= */

const ADMIN_PASSWORD = "admin123";
const USERS_KEY = "core_users";
const MACHINES_KEY = "core_machines";

// ===== storage helpers (faltavam) =====
function getUsers(){
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(list){
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}

const USERS_SEEDED_KEY = "core_users_seeded.v1";

function ensureDefaultUser(){
  const seeded = localStorage.getItem(USERS_SEEDED_KEY) === "1";
  if (seeded) return;

  const defaults = [{
    name: "Gustavo_dev",
    role: "DEV",
    pass: "core-dev-clubedosuplemento",
    active: true
  }];

  saveUsers(defaults);
  localStorage.setItem(USERS_SEEDED_KEY, "1");
}
ensureDefaultUser();


function getMachines(){
  return JSON.parse(localStorage.getItem(MACHINES_KEY) || "[]");
}

function saveMachines(list){
  localStorage.setItem(MACHINES_KEY, JSON.stringify(list));
}


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


/* ---------- CONFIG MODAL ---------- */
function openSystemConfig() {
  systemConfigOverlay.classList.remove("core-hidden");
  switchConfigTab("users");
  renderUsers();
  renderMachines();
}

function closeSystemConfig() {
  systemConfigOverlay.classList.add("core-hidden");
}

/* ---------- TABS ---------- */
function switchConfigTab(tab) {
  configUsers.classList.toggle("hidden", tab !== "users");
  configMachines.classList.toggle("hidden", tab !== "machines");

  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.tab[data-tab="${tab}"]`);
if (btn) btn.classList.add("active");

userForm.classList.add("hidden");
machineForm.classList.add("hidden");
editingUserIndex = null;
editingMachineIndex = null;
saveUserBtn.textContent = "Salvar";
saveMachineBtn.textContent = "Salvar";


}

/* =========================
   USUÁRIOS
========================= */

// 🔒 Usuário protegido (não pode editar nem excluir)
const PROTECTED_USER_NAME = "Gustavo_dev";

function isProtectedUser(u){
  return String(u?.name || "").trim() === PROTECTED_USER_NAME;
}


let editingUserIndex = null;

function showUserForm(){
  userForm.classList.toggle("hidden");
  if (!userForm.classList.contains("hidden")) {
    userNameInput.focus();
  }
}

function startEditUser(i){
  const users = getUsers();
  const u = users[i];

    if (isProtectedUser(u)){
    alert("Esse usuário é protegido e não pode ser editado.");
    return;
  }


  editingUserIndex = i;
  userForm.classList.remove("hidden");

  userNameInput.value = u.name || "";
  userRoleInput.value = u.role || "FUNC";
  userPasswordInput.value = ""; // opcional (senha só se for mudar)

  saveUserBtn.textContent = "Salvar alterações";
}

function saveUser(){
  const name = userNameInput.value.trim();
  const role = userRoleInput.value;
  const pass = userPasswordInput.value.trim();

  if (!name) return;

  const users = getUsers();

  if (editingUserIndex === null){
    // novo
    users.push({ name, role, pass, active:true });

  } else {
    // editar
    users[editingUserIndex].name = name;
    users[editingUserIndex].role = role;
    if (pass) users[editingUserIndex].pass = pass;
    editingUserIndex = null;
    saveUserBtn.textContent = "Salvar";
  }

  saveUsers(users);

  userNameInput.value = "";
  userPasswordInput.value = "";
  userForm.classList.add("hidden");

  renderUsers();
}

function renderUsers(){
  const users = getUsers();
  usersList.innerHTML = "";

  users.forEach((u,i)=>{
    usersList.innerHTML += `
      <div class="list-item">
        <div>
          <div style="font-weight:950; color:#0f172a;">${u.name}</div>
          <div class="meta">Função: <b>${u.role}</b></div>
        </div>
        <div class="actions">
  ${
    isProtectedUser(u)
      ? `<span class="meta" style="font-weight:950;color:#64748b;display:inline-flex;align-items:center;gap:6px;">
           🔒 Protegido
         </span>`
      : `
         <button class="icon-action edit" title="Editar" onclick="startEditUser(${i})">✏️</button>
         <button class="icon-action del" title="Excluir" onclick="removeUser(${i})">✖</button>
        `
  }
</div>

      </div>
    `;
  });
}


/* =========================
   MAQUININHAS
========================= */

let editingMachineIndex = null;

function showMachineForm(){
  machineForm.classList.toggle("hidden");
  if (!machineForm.classList.contains("hidden")) {
    machineNameInput.focus();
  }
}

function startEditMachine(i){
  const machines = getMachines();
  const m = machines[i];

  editingMachineIndex = i;
  machineForm.classList.remove("hidden");
  machineNameInput.value = m.name || "";

  // preencher taxas
  document.querySelectorAll("[data-rate]").forEach(inp=>{
    const key = inp.dataset.rate;
    inp.value = Number(m.rates?.[key] || 0);
  });

  saveMachineBtn.textContent = "Salvar alterações";
}

function saveMachine(){
  const name = machineNameInput.value.trim();
  if (!name) return;

  const rates = {};
  document.querySelectorAll("[data-rate]").forEach(inp=>{
    rates[inp.dataset.rate] = Number(inp.value || 0);
  });

  const machines = getMachines();

  if (editingMachineIndex === null){
    machines.push({ name, rates });
  } else {
    machines[editingMachineIndex].name = name;
    machines[editingMachineIndex].rates = rates;
    editingMachineIndex = null;
    saveMachineBtn.textContent = "Salvar";
  }

  saveMachines(machines);

  machineNameInput.value = "";
  document.querySelectorAll("[data-rate]").forEach(inp => inp.value = "");
  machineForm.classList.add("hidden");

  renderMachines();
}

function renderMachines(){
  const machines = getMachines();
  machinesList.innerHTML = "";

  machines.forEach((m,i)=>{
    machinesList.innerHTML += `
      <div class="list-item">
        <div>
          <div style="font-weight:950; color:#0f172a;">${m.name}</div>
          <div class="meta">Débito: <b>${Number(m.rates?.debito||0)}%</b> • Crédito 1x: <b>${Number(m.rates?.["1"]||0)}%</b> • ...</div>
        </div>
        <div class="actions">
          <button class="icon-action edit" title="Editar" onclick="startEditMachine(${i})">✏️</button>
          <button class="icon-action del" title="Excluir" onclick="removeMachine(${i})">✖</button>
        </div>
      </div>
    `;
  });
}


btnNewUser.onclick = showUserForm;
saveUserBtn.onclick = saveUser;

btnNewMachine.onclick = showMachineForm;
saveMachineBtn.onclick = saveMachine;

renderUsers();
renderMachines();

function removeUser(i){
  // (se quiser no futuro, pede senha admin aqui)
  const users = getUsers();
  users.splice(i, 1);
  saveUsers(users);

  // se estava editando e apagou o item, reseta estado
  editingUserIndex = null;
  saveUserBtn.textContent = "Salvar";
  userForm.classList.add("hidden");

  renderUsers();
}

function removeMachine(i){
  const machines = getMachines();
  machines.splice(i, 1);
  saveMachines(machines);

  editingMachineIndex = null;
  saveMachineBtn.textContent = "Salvar";
  machineForm.classList.add("hidden");

  renderMachines();
}

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
  const s = window.CoreAuth?.getSession?.();
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
  const s = window.CoreAuth?.getSession?.();
  const role = String(s?.role || "").toUpperCase();
  return role === "ADMIN" || role === "DEV";
}

function validateAdminPassword(pass){
  const p = String(pass || "").trim();
  if (!p) return false;

  const users = chatLoadUsers();
  return users.some(u =>
    u &&
    u.active !== false &&
    String(u.role || "").toUpperCase() === "ADMIN" &&
    String(u.pass || "").trim() === p
  );
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
