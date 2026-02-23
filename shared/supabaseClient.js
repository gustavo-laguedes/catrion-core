// shared/supabaseClient.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// A gente vai ler do window.__ENV__ (definido no shared/env.js)
const SUPABASE_URL = window.__ENV__?.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.__ENV__?.SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);