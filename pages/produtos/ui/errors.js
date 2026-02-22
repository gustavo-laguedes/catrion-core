// pages/produtos/ui/errors.js
export function clearErrors(scopeEl) {
  scopeEl.querySelectorAll("[data-err]").forEach(el => (el.textContent = ""));
}

export function showErrors(scopeEl, errors) {
  clearErrors(scopeEl);
  for (const e of errors || []) {
    const el = scopeEl.querySelector(`[data-err="${e.field}"]`);
    if (el) el.textContent = e.message;
  }
  // erro geral opcional
  const general = (errors || []).find(x => x.field === "_");
  if (general) alert(general.message);
}
