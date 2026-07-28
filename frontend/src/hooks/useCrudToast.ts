import { useLanguage } from '../contexts/LanguageContext';
import { notifyDeleted, notifyError, notifySaved, toastSuccess } from '../lib/appToast';

/**
 * Toasts CRUD localisés (enregistrer / modifier / supprimer / erreur).
 */
export function useCrudToast() {
  const { t } = useLanguage();

  return {
    onSaved: (isEdit: boolean) =>
      notifySaved(isEdit, {
        saved: t('common.saved'),
        updated: t('common.updated'),
      }),
    onDeleted: () => notifyDeleted(t('common.deleted')),
    onError: (
      error: unknown,
      fallbackKey: 'common.errorSaving' | 'common.errorDeleting' = 'common.errorSaving'
    ) => notifyError(error, t(fallbackKey)),
    onApproved: () => toastSuccess(t('common.approvedSuccess')),
    onRejected: () => toastSuccess(t('common.rejectedSuccess')),
  };
}
