/** Utilisateur MongoDB exposé au front après `POST /api/users/login`. */
export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  role: string;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}


