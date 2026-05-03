import { useState, useEffect } from 'react';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Edit2, Trash2, Printer, Plus, Search } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';
import Modal from '../Shared/common/Modal';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fetchClients, type ClientRecord } from '../../api/clientsApi';
import { formatClientLabel } from '../../lib/clientLabel';
import { openDemurragePrintWindow } from '../../lib/demurragePrintHtml';

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
  const [clientsList, setClientsList] = useState<ClientRecord[]>([]);

  const [formData, setFormData] = useState({
    client_name: '',
    bill_of_lading: '',
    container_count: 0,
    expedition_demurrage: 0,
    sgtd_demurrage: 0
  });

  useEffect(() => {
    fetchEntries();
    fetchClients().then(setClientsList).catch(err => console.error('Error fetching clients:', err));
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, selectedClient]);

  const fetchEntries = async () => {
    try {
      const data = await genericApi.list('clearance');

      
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
      const payload = { ...formData, total };

      if (editingEntry) {
        await genericApi.update('clearance', editingEntry.id, payload);
      } else {
        await genericApi.create('clearance', payload);
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
      await genericApi.delete('clearance', id);

      
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
        <h1 className="text-2xl font-bold tracking-tight text-[#0F3C66]">{t('clearance.title') || 'Manage Demurrage Details'}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingEntry(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 hover:bg-[#154b8a] transition-all font-bold tracking-wide active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('common.addNew')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold shadow-sm active:scale-95">
            <Printer className="w-4 h-4" />
            {t('common.print') || 'Print'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('services.client') || 'Filter by Client'}</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66] text-sm shadow-sm transition"
              >
                <option value="All">{t('financial.all') || 'All Clients'}</option>
                {clientsList?.map((client) => (
                  <option key={client.id} value={formatClientLabel(client)}>
                    {formatClientLabel(client)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
              <span>{t('common.show')}</span>
              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>{t('common.entries')}</span>
            </div>

            <div className="relative w-72">
              <input
                type="text"
                placeholder={`${t('common.search') || 'Search'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66] transition shadow-sm"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#0F3C66] text-white">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">#</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('services.client') || 'Client'}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('clearance.colBillOfLading') || 'Bill Of Lading'}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('clearance.colContainerCount') || 'Container Count'}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('clearance.colExpeditionDemurrage') || 'Expedition Demurrage'}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('clearance.colSgtdDemurrage') || 'SGTD Demurrage'}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('financial.total') || 'Total:'}</th>
                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider w-24 w-16 text-center">{t('common.action') || 'Action'}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                currentEntries.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-[#0F3C66]/5 transition group">
                    <td className="px-5 py-4 text-sm font-medium text-gray-500">{startIndex + index + 1}</td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-800">{entry.client_name}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{entry.bill_of_lading}</td>
                    <td className="px-5 py-4 text-sm font-mono text-gray-600">{entry.container_count}</td>
                    <td className="px-5 py-4 text-sm text-gray-800">{formatCurrency(entry.expedition_demurrage)}</td>
                    <td className="px-5 py-4 text-sm text-gray-800">{formatCurrency(entry.sgtd_demurrage)}</td>
                    <td className="px-5 py-4 text-sm font-black text-green-600">{formatCurrency(entry.total)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionMenu
                          actions={[
                            {
                              label: t('common.edit'),
                              icon: <Edit2 size={16} />,
                              onClick: () => handleEdit(entry),
                            },
                            {
                              label: t('common.delete'),
                              icon: <Trash2 size={16} />,
                              onClick: () => handleDelete(entry.id),
                              variant: 'danger',
                            },
                            {
                              label: t('common.print'),
                              icon: <Printer size={16} />,
                              onClick: () => openDemurragePrintWindow({
                                client_name: entry.client_name,
                                bill_of_lading: entry.bill_of_lading,
                                container_count: entry.container_count,
                                expedition_demurrage: entry.expedition_demurrage,
                                sgtd_demurrage: entry.sgtd_demurrage,
                                total: entry.total
                              }),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-between items-center">
          <div className="text-sm font-medium text-gray-500">
            {t('common.showing')} <span className="font-bold text-gray-900">{startIndex + 1}</span> {t('common.to')} <span className="font-bold text-gray-900">{Math.min(endIndex, filteredEntries.length)}</span> {t('common.of')} <span className="font-bold text-gray-900">{filteredEntries.length}</span> {t('common.entries')}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('common.previous') || 'Previous'}
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - currentPage) < 3).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-10 h-10 rounded-xl transition-all font-bold text-sm ${
                    currentPage === p
                      ? 'bg-[#0F3C66] text-white shadow-lg shadow-[#0F3C66]/20 active:scale-95'
                      : 'border border-gray-200 hover:bg-white hover:border-[#0F3C66]/30 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('common.next') || 'Next'}
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEntry(null);
          resetForm();
        }}
        title={editingEntry ? t('clearance.addUpdate') || 'Update Demurrage Details' : t('clearance.addUpdate') || 'Add Demurrage Details'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-2 space-y-6">
          <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                {t('services.client') || 'Client'} *
              </label>
              <select
                required
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
              >
                <option value="">{t('orderReception.selectCustomer') || 'Select Customer'}</option>
                {clientsList?.map(c => (
                  <option key={c.id} value={formatClientLabel(c)}>
                    {formatClientLabel(c)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  {t('clearance.colBillOfLading') || 'Bill Of Lading'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bill_of_lading}
                  onChange={(e) => setFormData({ ...formData, bill_of_lading: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  {t('clearance.colContainerCount') || 'Container Count'}
                </label>
                <input
                  type="number"
                  value={formData.container_count}
                  onChange={(e) => setFormData({ ...formData, container_count: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  {t('clearance.colExpeditionDemurrage') || 'Expedition Demurrage'}
                </label>
                <input
                  type="number"
                  value={formData.expedition_demurrage}
                  onChange={(e) => setFormData({ ...formData, expedition_demurrage: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  {t('clearance.colSgtdDemurrage') || 'SGTD Demurrage'} *
                </label>
                <input
                  type="number"
                  required
                  value={formData.sgtd_demurrage}
                  onChange={(e) => setFormData({ ...formData, sgtd_demurrage: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                {t('financial.total') || 'Total'}
              </label>
              <input
                type="number"
                disabled
                value={Number(formData.expedition_demurrage) + Number(formData.sgtd_demurrage)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-100 font-bold text-[#0F3C66]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 font-bold">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition active:scale-95"
            >
               {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 hover:bg-[#154b8a] transition active:scale-95"
            >
              {t('common.save') || 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}



