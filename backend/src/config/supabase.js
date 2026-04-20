import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
let warnedAnonFallback = false;

/**
 * Résout l’URL et la clé Supabase (souvent déjà dans `.env` à la racine pour Vite).
 * Ordre : URL = SUPABASE_URL || VITE_SUPABASE_URL
 * Clé = SUPABASE_SERVICE_ROLE_KEY (recommandé serveur) sinon clé anon (SUPABASE_ANON_KEY || VITE_SUPABASE_ANON_KEY) — les politiques RLS doivent autoriser les opérations.
 */
function resolveSupabaseEnv() {
  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();
  const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  const key = serviceRole || anonKey;
  return { supabaseUrl, key, usingServiceRole: Boolean(serviceRole) };
}

export function getSupabaseAdminClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { supabaseUrl, key, usingServiceRole } = resolveSupabaseEnv();

  if (!supabaseUrl || !key) {
    return null;
  }

  if (!usingServiceRole && !warnedAnonFallback) {
    warnedAnonFallback = true;
    console.warn(
      '[supabase] Clé « anon » utilisée (pas de SUPABASE_SERVICE_ROLE_KEY). Pour contourner RLS côté serveur, ajoutez la clé service_role dans backend/.env ou la racine .env.'
    );
  }

  supabaseClient = createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}
