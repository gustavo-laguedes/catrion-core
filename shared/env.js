// shared/env.js
// Ambiente local (NÃO subir com chaves privadas).
// A anon key do Supabase é "public", mas mesmo assim vamos manter padrão limpo.

window.__ENV__ = window.__ENV__ || {};

window.__ENV__.SUPABASE_URL = "";
window.__ENV__.SUPABASE_ANON_KEY = "";