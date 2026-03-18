// shared/supabaseClient.js
(function () {
  if (!window.ENV) {
    console.error("ENV não carregou. Garanta que shared/env.js vem antes.");
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase lib não carregou. Verifique o script CDN antes do supabaseClient.js");
    return;
  }

  const url = window.ENV.SUPABASE_URL;
  const anon = window.ENV.SUPABASE_ANON_KEY;

  window.sb = window.supabase.createClient(url, anon, {
    auth: {
      persistSession: true,     // mantém login no reload
      autoRefreshToken: true,   // renova token sozinho
      detectSessionInUrl: true, // útil se usar magic link / oauth futuramente
      storageKey: "catrion_sb_auth" // evita conflito com outros projetos
    }
  });

  // Log básico de eventos de auth (ajuda MUITO no debug)
  window.sb.auth.onAuthStateChange((event, session) => {
    const uid = session?.user?.id || null;
    console.log("🔐 Auth event:", event, "uid:", uid);
  });

  console.log("✅ Supabase client criado (window.sb):", window.sb);
})();