import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Edit2, Trash2, Settings2 } from 'lucide-react';
import Modal from './common/Modal';
import { ActionMenu } from './common/ActionMenu';

interface CarrierMode {
  id: string;
  name: string;
  created_at: string;
}

export function CarrierMode() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [modes, setModes] = useState<CarrierMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMode, setEditingMode] = useState<CarrierMode | null>(null);

  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    fetchModes();
  }, []);

  const fetchModes = async () => {
    try {
      const { data, error } = await supabase
        .from('carrier_modes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModes(data || []);
    } catch (error) {
      console.error('Error fetching carrier modes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMode) {
        const { error } = await supabase
          .from('carrier_modes')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMode.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('carrier_modes')
          .insert([{
            ...formData,
            created_by: user?.id
          }]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingMode(null);
      setFormData({ name: '' });
      fetchModes();
    } catch (error) {
      console.error('Error saving carrier mode:', error);
    }
  };

  const handleEdit = (mode: CarrierMode) => {
    setEditingMode(mode);
    setFormData({ name: mode.name });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('carrierMode.deleteConfirm'))) return;

    try {
      const { error } = await supabase
        .from('carrier_modes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchModes();
    } catch (error) {
      console.error('Error deleting carrier mode:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingMode(null);
  };

  const filteredModes = modes.filter(mode =>
    mode.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredModes.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentModes = filteredModes.slice(startIndex, startIndex + entriesPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">{t('carrierMode.title')}</h2>
          <Settings2 size={24} className="text-gray-600" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-[#EE964C]">{t('common.version')}</div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#0F3C66] text-white rounded hover:bg-[#154b8a] transition shadow-sm flex items-center gap-2"
          >
            <Plus size={18} />
            {t('carrierMode.addButton')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.searchLabel')}</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('carrierMode.colName')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentModes?.map((mode, index) => (
                <tr key={mode.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-500">{startIndex + index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{mode.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => handleEdit(mode),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => handleDelete(mode.id),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {currentModes.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500 italic">
                    {t('carrierMode.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center bg-gray-50 rounded-b-lg text-sm text-gray-600">
          <div>
            {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(startIndex + entriesPerPage, filteredModes.length)} {t('common.of')} {filteredModes.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 transition shadow-sm"
            >
              {t('common.previous')}
            </button>
            <span className="font-medium text-gray-700">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 transition shadow-sm"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingMode ? t('common.edit') : t('carrierMode.addButton')}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {t('carrierMode.fieldName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#0F3C66] outline-none transition"
              placeholder="e.g. In Transit, Delivered..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t mt-6 text-sm font-bold">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#0F3C66] text-white rounded-md hover:bg-[#154b8a] transition shadow-sm"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


