// shared/audit.js
(function () {
  const KEY = "core_audit_v1";
  const MAX = 1000; // evita lotar
  const RETENTION_DAYS = 90;
  const ENABLE_AUDIT = false;


  function now() {
  const d = new Date();

  // ISO (bom pra persistência / Firebase depois)
  const ts_iso = d.toISOString();

  // Brasilia (pt-BR), bem legível
  const ts_br = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "medium"
  }).format(d);

  return { ts_iso, ts_br };
}


  function readAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function cleanupOld(items) {
  const limit = Date.now() - (RETENTION_DAYS * 24 * 60 * 60 * 1000);

  return items.filter(item => {
    const ts = new Date(item.ts_iso).getTime();
    return ts >= limit;
  });
}


  function safeSet(value) {
  localStorage.setItem(KEY, value);
}

function writeAll(items) {
  // sempre limpa por data e limita por MAX
  let cleaned = cleanupOld(items);

  // mantém só os últimos MAX (mais recentes)
  cleaned = cleaned.slice(-MAX);

  // tentativa 1: normal
  try {
    safeSet(JSON.stringify(cleaned));
    return;
  } catch (e) {
    // cai pra estratégia de redução
  }

  // tentativa 2: corta pela metade e tenta
  try {
    cleaned = cleaned.slice(Math.floor(cleaned.length / 2));
    safeSet(JSON.stringify(cleaned));
    return;
  } catch (e) {}

  // tentativa 3: corta agressivo (últimos 50)
  try {
    cleaned = cleaned.slice(-50);
    safeSet(JSON.stringify(cleaned));
    return;
  } catch (e) {}

  // tentativa 4: salva só o último evento
  try {
    const last = cleaned.length ? [cleaned[cleaned.length - 1]] : [];
    safeSet(JSON.stringify(last));
    return;
  } catch (e) {}

  // tentativa 5: desistir SEM travar o sistema
  // (não joga erro pra aplicação)
}


function sanitizeDetails(details, maxLen = 2000) {
  // evita objetos gigantes / circulares
  let json = "";
  try {
    json = JSON.stringify(details);
  } catch {
    return { note: "details_unserializable" };
  }

  if (json.length <= maxLen) return details;

  // corta string serializada (e guarda só um preview)
  return {
    note: "details_truncated",
    preview: json.slice(0, maxLen) + "…"
  };
}




  function log(action, details = {}) {
    if (!ENABLE_AUDIT) return null;

    const session = window.CoreAuth ? window.CoreAuth.getSession() : null;

    const entry = {
      id: `a_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ...now(),
      page: window.CoreRouterState?.current || "unknown",
      user: session
        ? { userId: session.userId, name: session.name, role: session.role }
        : null,
      action,
      details: sanitizeDetails(details)
    };

    const items = readAll();
    items.push(entry);
    writeAll(items);

    return entry;
  }

  function list({ limit = 200 } = {}) {
  const items = readAll();
  writeAll(items); // força limpeza silenciosa
  return items.slice(-limit).reverse();
}


  function clear() {
    localStorage.removeItem(KEY);
  }

  window.CoreAudit = { log, list, clear };
})();
