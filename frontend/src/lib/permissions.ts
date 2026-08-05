import type { AuthUser } from '../types/authUser';
import { ALL_MENU_PERMISSIONS } from '../constants/menuPermissionsShared';

const FULL_ACCESS_ROLES = new Set(['superadmin', 'administrator', 'admin']);

export function isFullAccessRole(role?: string | null): boolean {
  return FULL_ACCESS_ROLES.has(String(role || '').trim().toLowerCase());
}

export function hasMenuAccess(
  user: AuthUser | null | undefined,
  menuId: string
): boolean {
  if (!user) return false;
  if (isFullAccessRole(user.role)) return true;
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  if (perms.length === 0) return false;
  return perms.includes(menuId);
}

/** Affiche un menu parent s’il a l’accès ou si un descendant est autorisé. */
export function canSeeMenuNode(
  user: AuthUser | null | undefined,
  nodeId: string,
  descendantIds: string[] = []
): boolean {
  if (!user) return false;
  if (isFullAccessRole(user.role)) return true;
  if (hasMenuAccess(user, nodeId)) return true;
  return descendantIds.some((id) => hasMenuAccess(user, id));
}

export function defaultPermissionsForRole(role?: string | null): string[] {
  if (isFullAccessRole(role)) return [...ALL_MENU_PERMISSIONS];
  return ['dashboard'];
}
