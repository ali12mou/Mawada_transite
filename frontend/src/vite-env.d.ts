/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Port du backend Express si l’URL complète n’est pas dans VITE_API_URL (défaut 4000). */
  readonly VITE_API_PORT?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}



