/** Extrait un message lisible depuis une erreur PostgREST / Supabase (souvent un objet sans instanceof Error). */
export function formatPostgrestError(error: unknown): string {
  if (error == null) return 'Erreur inconnue.';
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object') {
    const e = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [e.message, e.details, e.hint, e.code ? `[${e.code}]` : ''].filter(Boolean);
    if (parts.length) return parts.join(' — ');
  }
  try {
    return JSON.stringify(error);
  } catch {
    return 'Erreur inconnue.';
  }
}
