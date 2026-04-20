import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

/** False si les variables VITE_* manquent — les écrans non-transit peuvent ne pas charger de données PG. Les modules transport passent par `/api/transit` (backend). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Ne pas lancer d’erreur à l’import : sinon React ne monte pas et la page reste blanche.
const url = isSupabaseConfigured ? supabaseUrl! : 'http://127.0.0.1:54321';
const key = isSupabaseConfigured ? supabaseAnonKey! : 'local-dev-missing-env';

export const supabase = createClient(url, key);
