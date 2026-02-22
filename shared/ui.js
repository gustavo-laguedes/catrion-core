// shared/ui.js
(function () {
  function updateTopbar() {
    const hello = document.getElementById("userHello");
    const btnLogout = document.getElementById("btnLogout");
    const session = window.CoreAuth.getSession();

    if (!hello || !btnLogout) return;

    if (!session) {
      hello.textContent = "Olá!";
      btnLogout.style.display = "none";
      return;
    }

    hello.textContent = `Olá, ${session.name} (${session.role})`;
    btnLogout.style.display = "inline-flex";

    btnLogout.onclick = () => {
      window.CoreAudit.log("LOGOUT");
      window.CoreAuth.logout();
      location.reload();
    };
  }

  window.CoreUI = { updateTopbar };
})();
