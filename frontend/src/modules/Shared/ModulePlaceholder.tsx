import { useLanguage } from '../../contexts/LanguageContext';

type ModulePlaceholderProps = {
  menuKey: string;
};

/** Page légère pour les entrées de menu sans module dédié (évite de recharger tout le tableau de bord). */
export function ModulePlaceholder({ menuKey }: ModulePlaceholderProps) {
  const { t } = useLanguage();
  const title = t(`menu.${menuKey}`);

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
      <h2 className="text-xl font-semibold text-[#0F3C66]">{title}</h2>
      <p className="mt-3 text-sm text-gray-600">
        Ce module n&apos;est pas encore disponible. Utilisez un autre sous-menu ou contactez
        l&apos;administrateur.
      </p>
    </div>
  );
}
