// shared/money.js
(function () {
  function onlyDigits(s) {
    return (s || "").replace(/\D/g, "");
  }

  // Digita: 1 -> 0,01 | 12 -> 0,12 | 123 -> 1,23 | 1234 -> 12,34 ...
  function formatMoneyFromDigits(digits) {
    digits = onlyDigits(digits);
    if (!digits) return "0,00";

    // limita para não virar número gigante
    digits = digits.slice(0, 12);

    // garante pelo menos 3 dígitos pra recortar centavos
    const padded = digits.padStart(3, "0");
    const intPart = padded.slice(0, -2);
    const decPart = padded.slice(-2);

    const intFormatted = Number(intPart).toLocaleString("pt-BR");
    return `${intFormatted},${decPart}`;
  }

  // Aplica máscara num input (formato brasileiro com vírgula)
  function moneyMaskBRL(inputEl) {
    if (!inputEl) return;

    // evita aplicar duas vezes
    if (inputEl.__moneyMaskApplied) return;
    inputEl.__moneyMaskApplied = true;

    function onInput() {
      const digits = onlyDigits(inputEl.value);
      inputEl.value = formatMoneyFromDigits(digits);
    }

    inputEl.addEventListener("input", onInput);

    inputEl.addEventListener("focus", () => {
      if (!inputEl.value) inputEl.value = "0,00";
    });

    // inicializa
    onInput();
  }

  // "1.234,56" -> 123456 (centavos)
  function brlToCents(str) {
    const digits = onlyDigits(str);
    return Number(digits || 0);
  }

  // 123456 -> "1.234,56"
  function centsToBRL(cents) {
    const v = Number(cents || 0) / 100;
    return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  window.CatrionMoney = { moneyMaskBRL, brlToCents, centsToBRL };
})();