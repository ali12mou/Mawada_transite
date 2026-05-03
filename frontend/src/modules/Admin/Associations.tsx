import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import Modal from '../Shared/common/Modal';
import { ActionMenu } from '../Shared/common/ActionMenu';

interface Owner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  is_user: boolean;
  created_at: string;
}

export function Associations() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    is_user: false
  });

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const data = await genericApi.list('owners');

      
      setOwners(data || []);
    } catch (error) {
      console.error('Error fetching owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingOwner) {
        await genericApi.update('owners', editingOwner.id, formData);

        
      } else {
        await genericApi.create('owners', formData);

        
      }

      setShowModal(false);
      setEditingOwner(null);
      resetForm();
      fetchOwners();
    } catch (error) {
      console.error('Error saving owner:', error);
    }
  };

  const handleEdit = (owner: Owner) => {
    setEditingOwner(owner);
    setFormData({
      name: owner.name,
      email: owner.email || '',
      phone: owner.phone || '',
      address: owner.address || '',
      is_user: owner.is_user
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('associations.deleteConfirm'))) return;

    try {
      await genericApi.delete('owners', id);

      
      fetchOwners();
    } catch (error) {
      console.error('Error deleting owner:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      is_user: false
    });
    setEditingOwner(null);
  };

  const filteredOwners = owners.filter(owner =>
    owner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredOwners.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentOwners = filteredOwners.slice(startIndex, startIndex + entriesPerPage);

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
          <h2 className="text-2xl font-bold text-gray-800">{t('associations.manageTitle')}</h2>
          <Users size={24} className="text-gray-600" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-[#EE964C]">{t('common.version')}</div>
          <button
            onClick={() => {
              setEditingOwner(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#0F3C66] text-white rounded hover:bg-[#154b8a] transition shadow-sm flex items-center gap-2"
          >
            <Plus size={18} />
            {t('associations.addButton')}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('associations.colName')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('associations.colPhone')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('associations.colEmail')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('associations.colUser')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentOwners?.map((owner) => (
                <tr key={owner.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{owner.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{owner.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-blue-600 font-medium">{owner.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      owner.is_user ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {owner.is_user ? t('associations.yes') : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => handleEdit(owner),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => handleDelete(owner.id),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center bg-gray-50 rounded-b-lg text-sm text-gray-600">
          <div>
            {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(startIndex + entriesPerPage, filteredOwners.length)} {t('common.of')} {filteredOwners.length} {t('common.entries')}
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
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingOwner ? t('common.edit') : t('associations.addButton')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {t('associations.colName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#0F3C66] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {t('associations.colEmail')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#0F3C66] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {t('associations.colPhone')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#0F3C66] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {t('associations.colAddress')}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#0F3C66] outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="is_user"
              checked={formData.is_user}
              onChange={(e) => setFormData({ ...formData, is_user: e.target.checked })}
              className="w-4 h-4 text-[#0F3C66] border-gray-300 rounded focus:ring-[#0F3C66]"
            />
            <label htmlFor="is_user" className="text-sm font-bold text-gray-700">
              {t('associations.colUser')}
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t mt-6 font-bold text-sm">
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



