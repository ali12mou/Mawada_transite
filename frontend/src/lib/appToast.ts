import toast from 'react-hot-toast';

const SUCCESS_RE =
  /success|enregistr|approuv|généré|genere|generated|submitted|approved|rejected\.|sauvegard|import finished|import termin|ok\b|terminé|termine/i;

const ERROR_RE =
  /error|erreur|impossible|invalid|fail|échou|trop |veuillez|autorisez|required|not allowed|unique|empty|vide|chargement|suppression|saving|deleting|creating/i;

/** Toast succès (icône verte + barre de progression). */
export function toastSuccess(message: string) {
  return toast.success(String(message));
}

/** Toast erreur (icône rouge + barre de progression). */
export function toastError(message: string) {
  return toast.error(String(message));
}

/** Toast neutre. */
export function toastInfo(message: string) {
  return toast(String(message));
}

/** Succès après création ou modification. */
export function notifySaved(isEdit = false, messages?: { saved?: string; updated?: string }) {
  return toastSuccess(
    isEdit
      ? messages?.updated || 'Modifié avec succès'
      : messages?.saved || 'Enregistré avec succès'
  );
}

/** Succès après suppression. */
export function notifyDeleted(message?: string) {
  return toastSuccess(message || 'Supprimé avec succès');
}

/** Erreur CRUD (message Error ou fallback). */
export function notifyError(error: unknown, fallback = 'Une erreur est survenue') {
  const msg =
    error instanceof Error && error.message.trim() ? error.message : String(fallback);
  return toastError(msg);
}

/**
 * Remplace window.alert : détecte succès / erreur / info et affiche le toast adapté.
 */
export function appAlert(message?: unknown) {
  const msg = message == null ? '' : String(message);
  if (!msg.trim()) return;
  if (SUCCESS_RE.test(msg)) {
    return toast.success(msg);
  }
  if (ERROR_RE.test(msg)) {
    return toast.error(msg);
  }
  return toast(msg);
}

/** Branche tous les `alert()` natifs vers le toast de l’application. */
export function installAppAlert() {
  if (typeof window === 'undefined') return;
  window.alert = (message?: unknown) => {
    appAlert(message);
  };
}

export { toast };
