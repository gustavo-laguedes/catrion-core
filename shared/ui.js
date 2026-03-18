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

    const label = session.email || "usuário";
    hello.textContent = `Olá, ${label} (${session.role})`;
    btnLogout.style.display = "inline-flex";

    btnLogout.onclick = async () => {
      try {
        window.CoreAudit?.log?.("LOGOUT");
        await window.CoreAuth.logout(); // ✅ agora é async
      } finally {
        location.reload();
      }
    };
  }

  window.CoreUI = { updateTopbar };
})();