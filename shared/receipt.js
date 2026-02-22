// core/receipt.js
(function(){
  function fmtDateBR(iso){
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleString("pt-BR");
  }

  function brl(n){
    const v = Number(n || 0);
    return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  }

  function printThermalReceipt(sale){
    const w = window.open("", "_blank", "width=420,height=700");
    if (!w) return alert("Popup bloqueado. Permita popups para imprimir.");

    // ✅ logo (como seu index.html está dentro de /core, assets está em /core/assets)
    const logoUrl = new URL("assets/logo-cfiscal.png", window.location.href).href;

    const cust = sale?.customer?.name ? sale.customer.name : "Consumidor final";

    // pagamentos (com crédito x vezes, quando existir)
    const linesPay = [];
    if (sale?.payments?.cash) linesPay.push(["Dinheiro", sale.payments.cash]);
    if (sale?.payments?.pix) linesPay.push(["Pix", sale.payments.pix]);

    if (sale?.payments?.cardCredit) {
      // tenta achar parcelas no operationalCosts
      let inst = null;
      const oc = (sale.operationalCosts || []).find(x => x.method === "credit" && x.installments);
      if (oc) inst = Number(oc.installments);
      const label = inst ? `Crédito (${inst}x)` : "Crédito";
      linesPay.push([label, sale.payments.cardCredit]);
    }

    if (sale?.payments?.cardDebit) linesPay.push(["Débito", sale.payments.cardDebit]);

    const css = `
      <style>
        @media print{ @page{ margin:0 } }
        *{ box-sizing:border-box; }
        body{ margin:0; padding:0; font-family: ui-monospace, Menlo, Consolas, monospace; color:#000; }
        .paper{ width:58mm; padding:2mm 2mm; }
        .center{ text-align:center; }
        .small{ font-size:11px; line-height:1.25; }
        .tiny{ font-size:10px; line-height:1.2; }
        .title{ font-size:12px; font-weight:900; }
        .hr{ border-top:1px dashed #000; margin:6px 0; }
        .row{ display:flex; justify-content:space-between; gap:8px; font-size:12px; }
        .item{ font-size:12px; margin:5px 0; }
        .muted{ opacity:.85; font-size:11px; }

        /* logo no rodapé (ajustado pra ficar bem próximo) */
        .logo-wrap{ display:flex; justify-content:center; margin-top:-8px; }
        .logo{ width:96px; height:auto; display:block; }
      </style>
    `;

    const html = `
      <div class="paper">
        <div class="center title">CUPOM</div>
        <div class="hr"></div>

        <div class="center small"><b>Clube do Suplemento</b></div>
        <div class="center tiny">Bruno Moretti - ME</div>
        <div class="center tiny">CNPJ: 24.001.906/0001-99</div>
        <div class="center tiny">Rua Euclides de Figueiredo, 36</div>
        <div class="center tiny">Alto do Cardoso • Pindamonhangaba-SP</div>

        <div class="hr"></div>

        <div class="center small">Venda ${sale.saleId || "—"}</div>
        <div class="small">Operador: ${sale.by || "—"}</div>
        <div class="small">Cliente: ${cust}</div>

        <div class="hr"></div>

        ${(sale.items||[]).map(it => `
          <div class="item">
            <div><b>${it.name || "Item"}</b> <span class="muted">${it.barcode || ""}</span></div>
            <div class="row"><span>${Number(it.qty||0)} x ${brl(it.price)}</span><span>${brl(Number(it.qty||0)*Number(it.price||0))}</span></div>
          </div>
        `).join("")}

        <div class="hr"></div>

        <div class="row"><span><b>Total</b></span><span><b>${brl(sale.total)}</b></span></div>

        <div class="hr"></div>

        <div class="small"><b>Pagamento</b></div>
        ${linesPay.map(([l,v]) => `<div class="row"><span>${l}</span><span>${brl(v)}</span></div>`).join("")}

        <div class="hr"></div>

        <div class="center small">Obrigado pela preferência!</div>
        <div class="center small">#VemProClube</div>

        <div class="logo-wrap">
          <img class="logo" src="${logoUrl}" alt="Logo">
        </div>
      </div>
    `;

    w.document.open();
    w.document.write(`<!doctype html><html><head><meta charset="utf-8">${css}</head><body>${html}</body></html>`);
    w.document.close();

    // ✅ espera o logo carregar antes de imprimir
    const startPrint = () => {
      w.focus();
      w.print();
      setTimeout(()=>{ try{ w.close(); } catch(e){} }, 250);
    };

    w.onload = () => {
      const img = w.document.querySelector("img.logo");
      if (!img) return startPrint();
      if (img.complete) return startPrint();
      img.onload = startPrint;
      img.onerror = startPrint;
      setTimeout(startPrint, 600);
    };
  }

  // expõe global
  window.CoreReceipt = window.CoreReceipt || {};
  window.CoreReceipt.printThermal = printThermalReceipt;
})();
