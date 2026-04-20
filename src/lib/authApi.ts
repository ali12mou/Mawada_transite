import type { AuthUser } from '../types/authUser';
import { getApiBaseUrl } from './apiBase';

function normalizeUser(raw: Record<string, unknown>): AuthUser {
  const id = String(raw._id ?? raw.id ?? '');
  return {
    id,
    email: String(raw.email ?? ''),
    nom: String(raw.nom ?? ''),
    role: String(raw.role ?? ''),
    permissions: Array.isArray(raw.permissions) ? (raw.permissions as string[]) : [],
    createdAt: raw.createdAt != null ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : undefined,
  };
}

export async function loginWithMongo(email: string, password: string): Promise<AuthUser> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      'Connexion au serveur impossible. Lancez le backend : npm run backend (MongoDB doit être démarré).'
    );
  }

  const json = (await res.json().catch(() => ({}))) as { message?: string; data?: Record<string, unknown> };

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'API introuvable : démarrez le backend (npm run backend). Port par défaut 4000 — ou définissez VITE_API_URL / VITE_API_PORT dans .env'
      );
    }
    if (res.status >= 500) {
      throw new Error('Serveur API indisponible. Vérifiez que MongoDB tourne et que le backend est démarré.');
    }
    throw new Error((json.message as string) || 'Identifiants invalides');
  }

  if (!json.data) {
    throw new Error('Réponse API invalide');
  }

  return normalizeUser(json.data as Record<string, unknown>);
}
