// pages/login/login.js
window.CorePageModules = window.CorePageModules || {};
window.CorePageModules.login = function ({ go }) {

  document.body.classList.add("is-login");

  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.textContent = "";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const result = window.CoreAuth.login(username, password);
    if (!result.ok) {
      msg.textContent = result.message;
      return;
    }

    document.body.classList.remove("is-login");

    window.CoreAudit.log("LOGIN_SUCCESS", { username });

    go("home");
  });
};
