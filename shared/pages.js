// shared/pages.js
(function () {
  window.CorePages = {
    home: {
      title: "Home",
      render: () => `
        <section class="hero-grid">

          <article class="hero-card hero-green" data-go="venda">
            <div class="hero-inner">
              <div>
                <h2 class="hero-title">Vendas</h2>
                <button class="hero-action">▶ Nova Venda</button>
              </div>
              <div class="hero-illu" title="Ilustração">🛒</div>
            </div>
          </article>

          <article class="hero-card hero-orange" data-go="produtos">
            <div class="hero-inner">
              <div>
                <h2 class="hero-title">Produtos</h2>
                <button class="hero-action">Gerenciar Itens</button>
              </div>
              <div class="hero-illu" title="Ilustração">📦</div>
            </div>
          </article>

          <article class="hero-card hero-blue" data-go="caixa">
            <div class="hero-inner">
              <div>
                <h2 class="hero-title">Caixa</h2>
                <button class="hero-action">Movimentar Caixa</button>
              </div>
              <div class="hero-illu" title="Ilustração">🏧</div>
            </div>
          </article>

          <article class="hero-card hero-purple" data-go="relatorios">
            <div class="hero-inner">
              <div>
                <h2 class="hero-title">Relatórios</h2>
                <button class="hero-action">Ver Estatísticas</button>
              </div>
              <div class="hero-illu" title="Ilustração">📊</div>
            </div>
          </article>

        </section>

        <section class="bottom-grid">

          <div class="small-card">
            <div class="small-title">
              <span class="ico">🧾</span>
              Resumo do Dia
            </div>
            <div class="hr"></div>
            <div class="small-row"><span>Vendas:</span><span>R$ 0,00</span></div>
            <div class="small-row"><span>Clientes:</span><span>0</span></div>
          </div>

          <div class="small-card">
            <div class="small-title">
              <span class="ico">⚡</span>
              Atalhos Rápidos
            </div>
            <div class="hr"></div>
            <div class="quick-grid">
              <button class="quick-btn" data-action="sangria">
                <div class="mini-ico">💸</div>
                Sangria
              </button>
              <button class="quick-btn" data-action="suprimento">
                <div class="mini-ico" style="background: rgba(109,94,252,.12); border-color: rgba(109,94,252,.18);">➕</div>
                Suprimento
              </button>
            </div>
          </div>

          <div class="small-card">
            <div class="small-title">
              <span class="ico">🔔</span>
              Notificações
            </div>
            <div class="hr"></div>
            <div class="notify">
              <div>
                <div>Sem novas notificações</div>
                <div class="bell">🔔</div>
              </div>
            </div>
          </div>

        </section>
      `,
      onMount: ({ go }) => {
        document.querySelectorAll("[data-go]").forEach(el => {
          el.addEventListener("click", () => go(el.getAttribute("data-go")));
        });
      }
    },

    venda: {
      title: "Vendas",
      render: () => `
        <div class="small-card">
          <div class="small-title"><span class="ico">🛒</span> Venda (PDV)</div>
          <div class="hr"></div>
          <p style="margin:0; color:#64748b; font-weight:700;">
            Tela de venda vai entrar aqui. (próxima sprint)
          </p>
        </div>
      `
    },

    produtos: {
      title: "Produtos",
      render: () => `
        <div class="small-card">
          <div class="small-title"><span class="ico">📦</span> Produtos</div>
          <div class="hr"></div>
          <p style="margin:0; color:#64748b; font-weight:700;">
            Cadastro/lista de produtos vai entrar aqui.
          </p>
        </div>
      `
    },

    caixa: {
      title: "Caixa",
      render: () => `
        <div class="small-card">
          <div class="small-title"><span class="ico">💰</span> Caixa</div>
          <div class="hr"></div>
          <p style="margin:0; color:#64748b; font-weight:700;">
            Abertura/fechamento/sangria/suprimento.
          </p>
        </div>
      `
    },

    relatorios: {
      title: "Relatórios",
      render: () => `
        <div class="small-card">
          <div class="small-title"><span class="ico">📊</span> Relatórios</div>
          <div class="hr"></div>
          <p style="margin:0; color:#64748b; font-weight:700;">
            Relatórios do período e do dia.
          </p>
        </div>
      `
    },
  };
})();
