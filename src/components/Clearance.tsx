import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Search, Edit2, Trash2, Printer, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

interface ClearanceDemurrage {
  id: string;
  client_name: string;
  bill_of_lading: string;
  container_count: number;
  expedition_demurrage: number;
  sgtd_demurrage: number;
  total: number;
  created_at: string;
}

export function Clearance() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [entries, setEntries] = useState<ClearanceDemurrage[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ClearanceDemurrage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState('All');
  const [editingEntry, setEditingEntry] = useState<ClearanceDemurrage | null>(null);

  const [formData, setFormData] = useState({
    client_name: '',
    bill_of_lading: '',
    container_count: 0,
    expedition_demurrage: 0,
    sgtd_demurrage: 0
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, selectedClient]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('clearance_demurrage')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    if (selectedClient !== 'All') {
      filtered = filtered.filter(entry => entry.client_name === selectedClient);
    }

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.bill_of_lading.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const total = Number(formData.expedition_demurrage) + Number(formData.sgtd_demurrage);

      if (editingEntry) {
        const { error } = await supabase
          .from('clearance_demurrage')
          .update({
            ...formData,
            total,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEntry.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('clearance_demurrage').insert([{
          ...formData,
          total,
          created_by: user?.id
        }]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingEntry(null);
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const handleEdit = (entry: ClearanceDemurrage) => {
    setEditingEntry(entry);
    setFormData({
      client_name: entry.client_name,
      bill_of_lading: entry.bill_of_lading,
      container_count: entry.container_count,
      expedition_demurrage: entry.expedition_demurrage,
      sgtd_demurrage: entry.sgtd_demurrage
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;

    try {
      const { error } = await supabase
        .from('clearance_demurrage')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      bill_of_lading: '',
      container_count: 0,
      expedition_demurrage: 0,
      sgtd_demurrage: 0
    });
  };

  const formatCurrency = (amount: number) => formatAmount(amount);

  const uniqueClients = ['All', ...Array.from(new Set(entries.map(e => e.client_name)))];

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Gérer les Détails de Démurrage</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingEntry(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Ajouter Nouveau
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Client *</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <input
                type="number"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded"
                min="1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Connaissement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nombre de Conteneurs</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Démurrage de l'Expédition</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Démurrage de SGTD</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentEntries.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                  <td className="px-4 py-3 text-sm">{entry.client_name}</td>
                  <td className="px-4 py-3 text-sm">{entry.bill_of_lading}</td>
                  <td className="px-4 py-3 text-sm">{entry.container_count}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(entry.expedition_demurrage)}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(entry.sgtd_demurrage)}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(entry.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-800 hover:text-gray-900">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredEntries.length)} of {filteredEntries.length} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1">
              {currentPage}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Ajouter/Mettre à Jour les Détails de Démurrage
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingEntry(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Customer</option>
                    <option value="Abdirahman - Towfiiq">Abdirahman - Towfiiq</option>
                    <option value="Mohamed Ali">Mohamed Ali</option>
                    <option value="Client A">Client A</option>
                    <option value="Client B">Client B</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Connaissement *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.bill_of_lading}
                      onChange={(e) => setFormData({ ...formData, bill_of_lading: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de Conteneurs
                    </label>
                    <input
                      type="number"
                      value={formData.container_count}
                      onChange={(e) => setFormData({ ...formData, container_count: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Démurrage de l'Expédition
                    </label>
                    <input
                      type="number"
                      value={formData.expedition_demurrage}
                      onChange={(e) => setFormData({ ...formData, expedition_demurrage: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Démurrage de SGTD *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.sgtd_demurrage}
                      onChange={(e) => setFormData({ ...formData, sgtd_demurrage: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    disabled
                    value={Number(formData.expedition_demurrage) + Number(formData.sgtd_demurrage)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
