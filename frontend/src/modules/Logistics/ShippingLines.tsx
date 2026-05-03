import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Edit2, Trash2, Ship, Search } from 'lucide-react';
import Modal from '../Shared/common/Modal';
import { ActionMenu } from '../Shared/common/ActionMenu';

interface ShippingLine {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  contact_person?: string;
  created_at: string;
}

export function ShippingLines() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingLine, setEditingLine] = useState<ShippingLine | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchShippingLines();
  }, []);

  const fetchShippingLines = async () => {
    try {
      const data = await genericApi.list('shipping_lines');

      
      setShippingLines(data || []);
    } catch (error) {
      console.error('Error fetching shipping lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingLine) {
        await genericApi.update('shipping_lines', editingLine.id, formData);

        
      } else {
        await genericApi.create('shipping_lines', formData);

        
      }

      setShowModal(false);
      setEditingLine(null);
      resetForm();
      fetchShippingLines();
    } catch (error) {
      console.error('Error saving shipping line:', error);
    }
  };

  const handleEdit = (line: ShippingLine) => {
    setEditingLine(line);
    setFormData({
      name: line.name || '',
      email: line.email || '',
      phone: line.phone || '',
      address: line.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('shippingLines.deleteConfirm'))) return;

    try {
      await genericApi.delete('shipping_lines', id);

      
      fetchShippingLines();
    } catch (error) {
      console.error('Error deleting shipping line:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
  };

  const filteredLines = shippingLines.filter(line =>
    line.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    line.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    line.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredLines.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentLines = filteredLines.slice(startIndex, startIndex + entriesPerPage);

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
          <h1 className="text-2xl font-bold tracking-tight text-[#0F3C66]">{t('shippingLines.manageTitle')}</h1>
          <Ship size={24} className="text-[#0F3C66] opacity-80" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-[#EE964C]">{t('common.version')}</div>
          <button
            onClick={() => {
              setEditingLine(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 font-bold hover:bg-[#154b8a] transition active:scale-95 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            {t('shippingLines.addButton')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition text-sm font-medium"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm font-medium text-gray-600">{t('common.entries')}</span>
          </div>

          <div className="relative w-72">
            <input
              type="text"
              placeholder={`${t('common.searchLabel') || t('common.search')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66] transition shadow-sm text-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#0F3C66] text-white">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('shippingLines.colName')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('shippingLines.colPhone')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('shippingLines.colEmail')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('shippingLines.colAddress')}</th>
                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider w-24">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {currentLines?.map((line) => (
                <tr key={line.id} className="hover:bg-[#0F3C66]/5 transition group">
                  <td className="px-5 py-4 text-sm font-bold text-[#0F3C66]">{line.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{line.phone || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{line.email || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{line.address || '-'}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => handleEdit(line),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => handleDelete(line.id),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {currentLines.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">
                    {t('shippingLines.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-between items-center">
          <div className="text-sm font-medium text-gray-500">
            {t('common.showing')} <span className="font-bold text-gray-900">{startIndex + 1}</span> {t('common.to')} <span className="font-bold text-gray-900">{Math.min(startIndex + entriesPerPage, filteredLines.length)}</span> {t('common.of')} <span className="font-bold text-gray-900">{filteredLines.length}</span> {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('common.previous')}
            </button>
            <div className="px-4 py-2 font-bold text-sm text-gray-700">{currentPage} / {totalPages}</div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
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
        title={editingLine ? t('common.edit') : t('shippingLines.addButton')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-2">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              {t('shippingLines.colName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              {t('shippingLines.colEmail')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              {t('shippingLines.colPhone')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              {t('shippingLines.colAddress')}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
            />
          </div>

          <div className="flex gap-3 pt-4 mt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition active:scale-95 font-bold text-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 font-bold hover:bg-[#154b8a] transition active:scale-95 text-sm"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}



