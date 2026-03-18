// shared/router.js
(function () {
  async function loadText(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Falha ao carregar: ${url} (${res.status})`);
    return await res.text();
  }

  function ensureCss(id, href) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("link");
      el.rel = "stylesheet";
      el.id = id;
      document.head.appendChild(el);
    }
    el.href = href;
  }

  function ensureScript(id, src) {
    return new Promise((resolve, reject) => {
      const old = document.getElementById(id);
      if (old) old.remove();

      const s = document.createElement("script");
      s.id = id;
      s.src = src + `?v=${Date.now()}`;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Falha ao carregar JS: ${src}`));
      document.body.appendChild(s);
    });
  }

  function createRouter({ mountEl }) {
    let current = "home";

    window.CoreRouterState = window.CoreRouterState || {};
    window.CoreRouterState.current = current;

    async function render(pageName) {
      current = pageName;
      window.CoreRouterState.current = current;

      // CORE não usa mais tela de login interna
      document.body.classList.remove("is-login");

      const base = `pages/${pageName}/${pageName}`;

      mountEl.innerHTML = await loadText(`${base}.html`);
      ensureCss("pageStyles", `${base}.css?v=${Date.now()}`);
      await ensureScript("pageScript", `${base}.js`);

      const mods = window.CorePageModules || {};
      if (typeof mods[pageName] === "function") {
        mods[pageName]({ go });
      }

      if (window.CoreUI) {
        window.CoreUI.updateTopbar();
      }

      if (window.CoreAudit) {
        window.CoreAudit.log("PAGE_VIEW", { page: current });
      }
    }

    function go(pageName) {
      render(pageName).catch(err => {
        console.error(err);
        mountEl.innerHTML = `
          <div class="small-card">
            <div class="small-title"><span class="ico">⚠️</span>Erro</div>
            <div class="hr"></div>
            <pre style="white-space:pre-wrap; margin:0; color:#b91c1c; font-weight:800;">${String(err.message)}</pre>
          </div>
        `;
      });
    }

    return { go, render, getCurrent: () => current };
  }

  window.CoreRouter = { createRouter };
})();