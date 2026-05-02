import { useState, useEffect } from 'react';
import { Pencil, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface TaxRate {
  id: string;
  name: string;
  rate_percentage: number;
  min_salary: number;
  max_salary: number;
  is_active: boolean;
  created_at: string;
}

interface CNSSSettings {
  id: string;
  retirement_contribution: number;
  amu_contribution: number;
  employer_deduction: number;
  updated_at: string;
}

export function TaxRates() {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState<'tax' | 'cnss'>('tax');
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [cnssSettings, setCnssSettings] = useState<CNSSSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaxForm, setShowTaxForm] = useState(false);
  const [showCnssForm, setShowCnssForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    rate_percentage: 0,
    min_salary: 0,
    max_salary: 0,
    is_active: true,
  });
  const [cnssFormData, setCnssFormData] = useState({
    retirement_contribution: 0,
    amu_contribution: 0,
    employer_deduction: 0,
  });

  useEffect(() => {
    fetchTaxRates();
    fetchCnssSettings();
  }, []);

  const fetchTaxRates = async () => {
    try {
      const { data, error } = await supabase
        .from('tax_rates')
        .select('*')
        .order('min_salary', { ascending: true });

      if (error) throw error;
      setTaxRates(data || []);
    } catch (error) {
      console.error('Error fetching tax rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCnssSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('cnss_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setCnssSettings(data);
        setCnssFormData({
          retirement_contribution: data.retirement_contribution,
          amu_contribution: data.amu_contribution,
          employer_deduction: data.employer_deduction,
        });
      }
    } catch (error) {
      console.error('Error fetching CNSS settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('tax_rates')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tax_rates')
          .insert([formData]);

        if (error) throw error;
      }

      resetForm();
      fetchTaxRates();
    } catch (error) {
      console.error('Error saving tax rate:', error);
    }
  };

  const handleEdit = (taxRate: TaxRate) => {
    setFormData({
      name: taxRate.name,
      rate_percentage: taxRate.rate_percentage,
      min_salary: taxRate.min_salary,
      max_salary: taxRate.max_salary,
      is_active: taxRate.is_active,
    });
    setEditingId(taxRate.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tax rate?')) {
      try {
        const { error } = await supabase
          .from('tax_rates')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchTaxRates();
      } catch (error) {
        console.error('Error deleting tax rate:', error);
      }
    }
  };

  const handleCnssSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (cnssSettings) {
        const { error } = await supabase
          .from('cnss_settings')
          .update({ ...cnssFormData, updated_at: new Date().toISOString() })
          .eq('id', cnssSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cnss_settings')
          .insert([cnssFormData]);

        if (error) throw error;
      }

      setShowCnssForm(false);
      fetchCnssSettings();
    } catch (error) {
      console.error('Error saving CNSS settings:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rate_percentage: 0,
      min_salary: 0,
      max_salary: 0,
      is_active: true,
    });
    setEditingId(null);
    setShowTaxForm(false);
  };

  const filteredTaxRates = taxRates.filter(rate =>
    rate.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Taux de taxe</h2>
        <div className="text-sm text-gray-500">Version: 2.0.0 / MAJOR</div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('tax')}
          className={`px-6 py-2 rounded font-medium transition ${activeTab === 'tax'
              ? 'bg-[#0F3C66] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Taux de taxe
        </button>
        <button
          onClick={() => setActiveTab('cnss')}
          className={`px-6 py-2 rounded font-medium transition ${activeTab === 'cnss'
              ? 'bg-[#0F3C66] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          CNSS
        </button>
      </div>

      {activeTab === 'tax' ? (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Search:</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tranche basse</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tranche haute</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Montant de la taxe</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTaxRates.slice(0, entriesPerPage)?.map((rate, index) => (
                    <tr key={rate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatAmount(rate.min_salary)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatAmount(rate.max_salary)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{rate.rate_percentage.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEdit(rate)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition"
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTaxRates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Aucune donnée disponible
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showTaxForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Taux de taxe</h3>
                  <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tranche basse <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.min_salary}
                      onChange={(e) => setFormData({ ...formData, min_salary: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tranche haute
                    </label>
                    <input
                      type="number"
                      value={formData.max_salary}
                      onChange={(e) => setFormData({ ...formData, max_salary: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant de la taxe
                    </label>
                    <input
                      type="number"
                      value={formData.rate_percentage}
                      onChange={(e) => setFormData({ ...formData, rate_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#0F3C66] text-white rounded hover:bg-[#154b8a] transition"
                    >
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="max-w-md mx-auto">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-600 mb-1">CONTRIBUTION À LA RETRAITE (%)</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {cnssSettings?.retirement_contribution || 0}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-600 mb-1">CONTRIBUTION AMU (%)</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {cnssSettings?.amu_contribution || 0}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-600 mb-1">Déduction de l'employeur (CNSS %)</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {cnssSettings?.employer_deduction || 0}
                  </div>
                </div>

                <button
                  onClick={() => setShowCnssForm(true)}
                  className="w-full px-6 py-2 bg-[#0F3C66] text-white rounded hover:bg-[#154b8a] transition"
                >
                  Modifier les paramètres
                </button>
              </div>
            </div>
          </div>

          {showCnssForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">CNSS</h3>
                  <button onClick={() => setShowCnssForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleCnssSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CONTRIBUTION À LA RETRAITE (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={cnssFormData.retirement_contribution}
                      onChange={(e) => setCnssFormData({ ...cnssFormData, retirement_contribution: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CONTRIBUTION AMU (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={cnssFormData.amu_contribution}
                      onChange={(e) => setCnssFormData({ ...cnssFormData, amu_contribution: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Déduction de l'employeur (CNSS %) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={cnssFormData.employer_deduction}
                      onChange={(e) => setCnssFormData({ ...cnssFormData, employer_deduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#0F3C66] text-white rounded hover:bg-[#154b8a] transition"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


