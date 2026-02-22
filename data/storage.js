// core/data/storage.js
export const CoreStorage = (() => {
  function get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  // "transação" simples: lê -> muta -> grava
  function update(key, fallback, mutatorFn) {
    const current = get(key, fallback);
    const next = mutatorFn(structuredClone(current));
    set(key, next);
    return next;
  }

  return { get, set, remove, update };
})();
