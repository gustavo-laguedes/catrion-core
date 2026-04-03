// shared/ui.js
(function () {
  function updateTopbar() {
    const hello = document.getElementById("userHello");
    const btnLogout = document.getElementById("btnLogout");

    if (!hello || !btnLogout) return;

    // ✅ auth novo
    const session = window.CoreAuth?.getCurrentUser?.() || null;

    if (!session) {
      hello.textContent = "Olá!";
      btnLogout.style.display = "none";
      return;
    }

    const roleLabelMap = {
  DEV: "DEV",
  ADMIN: "ADMIN",
  OPER: "OPER",
  VISU: "VISU"
};

const nameLabel =
  session.name ||
  session.email ||
  "usuário";

const roleLabel = roleLabelMap[String(session.role || "").toUpperCase()] || "OPER";

hello.textContent = `Olá, ${nameLabel} (${roleLabel})`;
btnLogout.style.display = "inline-flex";

    btnLogout.onclick = async () => {
  try {
    window.CoreAudit?.log?.("LOGOUT");
    await window.CoreAuth.logout();
  } finally {
    const portalLogin = "https://catrion.com.br/app/index.html#/login";
    window.location.href = portalLogin;
  }
};
  }

  window.CoreUI = { updateTopbar };
})();