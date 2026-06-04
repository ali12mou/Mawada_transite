import { Document9 } from './Document9';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Même écran que Document N° 9 (enregistrement MongoDB + feuille « AVIS DE LIVRAISON »),
 * avec libellés du menu Services.
 */
export function TransferDocument9() {
  const { t } = useLanguage();
  return (
    <Document9
      pageTitle={t('transfer9.title')}
      addButtonLabel={t('common.addNew')}
      transferWizardModal
      rowActionsAsDropdown
    />
  );
}


