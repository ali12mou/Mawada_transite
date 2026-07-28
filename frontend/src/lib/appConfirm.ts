export type ConfirmVariant = 'danger' | 'warning' | 'default';

export interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export type ConfirmRequest = {
  message: string;
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

type ConfirmHandler = (message: string, options?: ConfirmOptions) => Promise<boolean>;

let handler: ConfirmHandler | null = null;

export function registerConfirmHandler(fn: ConfirmHandler | null) {
  handler = fn;
}

/**
 * Confirmation async (remplace window.confirm).
 * Affiche une modale professionnelle et renvoie true si l’utilisateur confirme.
 */
export function appConfirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  if (!handler) {
    // Fallback si le provider n’est pas monté
    return Promise.resolve(window.confirm(message));
  }
  const variant =
    options.variant ||
    (/approuv|approve/i.test(message) ? 'warning' : 'danger');
  return handler(message, { ...options, variant });
}
