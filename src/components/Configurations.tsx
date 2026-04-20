import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { fetchAppConfig, patchAppConfig } from '../api/appConfigApi';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

const CONFIG_KEYS = [
  'company_name',
  'company_address',
  'company_phone',
  'company_email',
  'freight_rate',
  'units',
  'ci_amount',
  'currency_symbol',
  'decimals',
  'employee_id_prefix',
  'welcome_message_enabled',
  'djf_exchange_rate',
  'letter_head_image',
  'footer_logo_image',
  'signature_logo_image',
  'payroll_start_day',
  'payroll_end_day',
  'absence_threshold',
] as const;

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function mergeConfig(data: Record<string, string>): Record<string, string> {
  const m: Record<string, string> = {};
  for (const k of CONFIG_KEYS) {
    m[k] = data[k] ?? '';
  }
  return m;
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('Lecture fichier impossible'));
    r.readAsDataURL(file);
  });
}

export function Configurations() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('base_settings');
  const [formData, setFormData] = useState<Record<string, string>>(() => mergeConfig({}));
  const [saveError, setSaveError] = useState<string | null>(null);
  const { t } = useLanguage();
  const { setCurrencyCode } = useCurrency();

  useEffect(() => {
    loadConfigurations();
  }, []);

  useEffect(() => {
    const c = formData.currency_symbol;
    if (c === 'USD' || c === 'FDJ') {
      setCurrencyCode(c);
    }
  }, [formData.currency_symbol, setCurrencyCode]);

  const loadConfigurations = async () => {
    setSaveError(null);
    try {
      const data = await fetchAppConfig();
      setFormData(mergeConfig(data));
    } catch (error) {
      console.error('Error loading configurations:', error);
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Impossible de charger la configuration (backend / MongoDB).'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      await patchAppConfig(formData);
      alert('Configurations enregistrées.');
      await loadConfigurations();
    } catch (error: unknown) {
      console.error('Error saving configurations:', error);
      setSaveError(error instanceof Error ? error.message : 'Erreur à l’enregistrement');
    }
  };

  const handleImagePick = async (key: 'letter_head_image' | 'footer_logo_image' | 'signature_logo_image', file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Veuillez choisir une image.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      alert('Image trop volumineuse (maximum 2 Mo).');
      return;
    }
    try {
      const dataUrl = await readImageFile(file);
      setFormData((prev) => ({ ...prev, [key]: dataUrl }));
    } catch {
      alert('Impossible de lire le fichier.');
    }
  };

  const getConfigValue = (key: string) => {
    if (key === 'currency_symbol') {
      const value = formData[key] || '';
      if (value === '€' || value === '$' || value === '£') {
        return value === '$' ? 'USD' : 'FDJ';
      }
    }
    return formData[key] || '';
  };

  const setConfigValue = (key: string, value: string) => {
    if (key === 'currency_symbol') {
      const normalized = value === 'DJF' ? 'FDJ' : value;
      setFormData(prev => ({ ...prev, [key]: normalized }));
      if (normalized === 'USD' || normalized === 'FDJ') {
        setCurrencyCode(normalized);
      }
      return;
    }
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;
  }

  return (
    <div className="flex h-full">
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab('base_settings')}
            className={`w-full text-left px-4 py-2 rounded transition ${
              activeTab === 'base_settings'
                ? 'bg-blue-50 text-[#1e3a5f] font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('config.baseSettings')}
          </button>
          <button
            onClick={() => setActiveTab('hr')}
            className={`w-full text-left px-4 py-2 rounded transition ${
              activeTab === 'hr'
                ? 'bg-blue-50 text-[#1e3a5f] font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Ressources humaines
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`w-full text-left px-4 py-2 rounded transition ${
              activeTab === 'payroll'
                ? 'bg-blue-50 text-[#1e3a5f] font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Paie
          </button>
          <button
            onClick={() => setActiveTab('presence')}
            className={`w-full text-left px-4 py-2 rounded transition ${
              activeTab === 'presence'
                ? 'bg-blue-50 text-[#1e3a5f] font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Présence
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`w-full text-left px-4 py-2 rounded transition ${
              activeTab === 'auth'
                ? 'bg-blue-50 text-[#1e3a5f] font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Authentifications
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-2 rounded transition ${
              activeTab === 'security'
                ? 'bg-blue-50 text-[#1e3a5f] font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Politique de compte et de sécurité
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`w-full text-left px-4 py-2 rounded transition ${
              activeTab === 'external'
                ? 'bg-blue-50 text-[#1e3a5f] font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Services externes
          </button>
          <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded transition">
            Gérer l'API
          </button>
          <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded transition">
            Intégrations
          </button>
          <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded transition">
            Supprimer le compte
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        {saveError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {saveError}
          </div>
        )}
        {activeTab === 'base_settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">{t('config.baseSettings')}</h2>

            <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('config.companyName')}
                </label>
                <input
                  type="text"
                  value={getConfigValue('company_name')}
                  onChange={(e) => setConfigValue('company_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={getConfigValue('company_address')}
                    onChange={(e) => setConfigValue('company_address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de téléphone de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={getConfigValue('company_phone')}
                    onChange={(e) => setConfigValue('company_phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email de l’entreprise</label>
                <input
                  type="email"
                  value={getConfigValue('company_email')}
                  onChange={(e) => setConfigValue('company_email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                  placeholder="contact@exemple.dj"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Affiché en pied de page des documents imprimés avec le téléphone et l’adresse.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarif de fret
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={getConfigValue('freight_rate')}
                    onChange={(e) => setConfigValue('freight_rate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unités
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={getConfigValue('units')}
                    onChange={(e) => setConfigValue('units', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant CI actuel
                  </label>
                  <input
                    type="number"
                    value={getConfigValue('ci_amount')}
                    onChange={(e) => setConfigValue('ci_amount', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('config.currency')}</label>
                  <select
                    value={getConfigValue('currency_symbol')}
                    onChange={(e) => setConfigValue('currency_symbol', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="FDJ">FDJ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Décimales
                  </label>
                  <select
                    value={getConfigValue('decimals')}
                    onChange={(e) => setConfigValue('decimals', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Préfixe d'ID de génération d'employé (par défaut FRS)
                  </label>
                  <input
                    type="text"
                    value={getConfigValue('employee_id_prefix')}
                    onChange={(e) => setConfigValue('employee_id_prefix', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="welcome_message"
                  checked={getConfigValue('welcome_message_enabled') === 'true'}
                  onChange={(e) => setConfigValue('welcome_message_enabled', e.target.checked ? 'true' : 'false')}
                  className="w-5 h-5 text-[#1e3a5f] rounded focus:ring-[#e67e22]"
                />
                <label htmlFor="welcome_message" className="text-sm text-gray-700">
                  Activer le message de bienvenue à chaque démarrage
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('config.djfRate')}
                </label>
                <input
                  type="number"
                  value={getConfigValue('djf_exchange_rate')}
                  onChange={(e) => setConfigValue('djf_exchange_rate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">Images des documents</h3>
              <p className="mb-4 text-sm text-gray-600">
                Ces visuels sont appliqués aux impressions (ex. Document N° 9) : en-tête en haut de page, logo de
                pied de page, image de signature dans le bloc opérateur.
              </p>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Letter Head (en-tête)</label>
                  <label className="inline-block w-full cursor-pointer rounded-lg bg-[#1e3a5f] px-4 py-2 text-center text-sm text-white transition hover:bg-[#152a44]">
                    Choisir un fichier
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => void handleImagePick('letter_head_image', e.target.files?.[0])}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    {getConfigValue('letter_head_image') ? 'Image enregistrée (aperçu ci-dessous)' : 'Aucun fichier choisi'}
                  </p>
                  {getConfigValue('letter_head_image') ? (
                    <img
                      src={getConfigValue('letter_head_image')}
                      alt="En-tête"
                      className="mt-2 max-h-24 w-full rounded border border-gray-200 object-contain"
                    />
                  ) : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Footer Logo</label>
                  <label className="inline-block w-full cursor-pointer rounded-lg bg-[#1e3a5f] px-4 py-2 text-center text-sm text-white transition hover:bg-[#152a44]">
                    Choisir un fichier
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => void handleImagePick('footer_logo_image', e.target.files?.[0])}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    {getConfigValue('footer_logo_image') ? 'Image enregistrée' : 'Aucun fichier choisi'}
                  </p>
                  {getConfigValue('footer_logo_image') ? (
                    <img
                      src={getConfigValue('footer_logo_image')}
                      alt="Logo pied de page"
                      className="mt-2 max-h-20 w-full rounded border border-gray-200 object-contain"
                    />
                  ) : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Signature Logo</label>
                  <label className="inline-block w-full cursor-pointer rounded-lg bg-[#1e3a5f] px-4 py-2 text-center text-sm text-white transition hover:bg-[#152a44]">
                    Choisir un fichier
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => void handleImagePick('signature_logo_image', e.target.files?.[0])}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    {getConfigValue('signature_logo_image') ? 'Image enregistrée' : 'Aucun fichier choisi'}
                  </p>
                  {getConfigValue('signature_logo_image') ? (
                    <img
                      src={getConfigValue('signature_logo_image')}
                      alt="Signature"
                      className="mt-2 max-h-16 w-full rounded border border-gray-200 object-contain"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Relatif à la paie</h2>
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    A partir du jour du mois (la paie ne sera pas générée entre ces jours)
                  </label>
                  <input
                    type="number"
                    value={getConfigValue('payroll_start_day')}
                    onChange={(e) => setConfigValue('payroll_start_day', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jusqu'au jour du mois
                  </label>
                  <input
                    type="number"
                    value={getConfigValue('payroll_end_day')}
                    onChange={(e) => setConfigValue('payroll_end_day', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hr' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Lié à la présence</h2>
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Absences élevées (entrez une absence de présence supérieure) par défaut (5)
                </label>
                <input
                  type="number"
                  value={getConfigValue('absence_threshold')}
                  onChange={(e) => setConfigValue('absence_threshold', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Politique de compte et de sécurité</h2>
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-gray-700">Activer les limites de connexion</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#e67e22]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e3a5f]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-gray-700">Activer l'expiration du mot de passe</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#e67e22]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e3a5f]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-700">Activer la journalisation détaillée et les actions sensibles.</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#e67e22]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e3a5f]"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#1e3a5f] text-white px-6 py-2 rounded-lg hover:bg-[#152a44] transition"
          >
            <Save size={20} />
            {t('common.save')}
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 py-4 mt-8">
          {t('common.copyright')}
        </div>
      </main>
    </div>
  );
}
