import { useState, useEffect, useMemo } from 'react';
import { Pencil, Trash2, Users, Plus, Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  type ClientRecord,
} from '../../api/clientsApi';
import Modal from '../Shared/common/Modal';
import { FormLabel, FormInput, PrimaryButton, SecondaryButton } from '../Shared/common/FormComponents';
import { ActionMenu } from '../Shared/common/ActionMenu';

export function Clients() {
  const { t } = useLanguage();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
  });

  const load = async () => {
    setError(null);
    try {
      const data = await fetchClients();
      setClients(data);
    } catch (e) {
      console.error(e);
      setError((e as Error).message || t('clients.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredClients = useMemo(
    () =>
      clients.filter(
        client =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [clients, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / entriesPerPage));
  const page = Math.min(currentPage, totalPages);
  const pagedClients = useMemo(() => {
    const start = (page - 1) * entriesPerPage;
    return filteredClients.slice(start, start + entriesPerPage);
  }, [filteredClients, page, entriesPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entriesPerPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await updateClient(editingId, formData);
      } else {
        await createClient(formData);
      }
      resetForm();
      await load();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || t('clients.errorSave'));
    }
  };

  const handleEdit = (client: ClientRecord) => {
    setFormData({
      name: client.name,
      company_name: client.company_name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('clients.deleteConfirm'))) return;
    setError(null);
    try {
      await deleteClient(id);
      await load();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || t('clients.errorDelete'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company_name: '',
      email: '',
      phone: '',
      address: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">{t('clients.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#0F3C66]">{t('clients.pageTitle')}</h1>
          <Users size={24} className="text-[#0F3C66] opacity-80" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-[#EE964C]">{t('common.version')}</div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 font-bold hover:bg-[#154b8a] transition active:scale-95 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            {t('clients.addButton')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">{t('clients.show') || t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={e => setEntriesPerPage(Number(e.target.value))}
              className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition text-sm font-medium"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm font-medium text-gray-600">{t('clients.entries') || t('common.entries')}</span>
          </div>
          <div className="relative w-72">
            <input
              type="text"
              placeholder={`${t('clients.searchLabel') || t('common.search')}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66] transition shadow-sm text-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#0F3C66] text-white">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('clients.colCompany')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('clients.colName')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('clients.colEmail')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('clients.colPhone')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('clients.colAddress')}</th>
                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider w-24">{t('clients.colAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pagedClients?.map(client => (
                <tr key={client.id} className="hover:bg-[#0F3C66]/5 transition group">
                  <td className="px-5 py-4 text-sm font-bold text-[#0F3C66]">{client.company_name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-900 font-medium">{client.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{client.email || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{client.phone || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{client.address || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.edit'),
                            icon: <Pencil size={16} />,
                            onClick: () => handleEdit(client),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => handleDelete(client.id),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500 italic">
                    {t('clients.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredClients.length > entriesPerPage && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-between items-center text-sm">
            <div className="text-gray-500 font-medium">
              {t('common.showing')} <span className="font-bold text-gray-900">{(page - 1) * entriesPerPage + 1}</span> {t('common.to')} <span className="font-bold text-gray-900">{Math.min(page * entriesPerPage, filteredClients.length)}</span> {t('common.of')} <span className="font-bold text-gray-900">{filteredClients.length}</span> {t('common.entries')}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
              >
                {t('common.previous')}
              </button>
              <div className="px-4 py-2 font-bold text-sm text-gray-700">{page} / {totalPages}</div>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={t('clients.modalTitle')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FormLabel>
              {t('clients.fieldName')} *
            </FormLabel>
            <FormInput
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('clients.fieldName')}
            />
          </div>
          <div>
            <FormLabel>{t('clients.fieldCompany')}</FormLabel>
            <FormInput
              type="text"
              value={formData.company_name}
              onChange={e => setFormData({ ...formData, company_name: e.target.value })}
              placeholder={t('clients.fieldCompany')}
            />
          </div>
          <div>
            <FormLabel>{t('clients.fieldEmail')}</FormLabel>
            <FormInput
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('clients.fieldEmail')}
            />
          </div>
          <div>
            <FormLabel>{t('clients.fieldPhone')}</FormLabel>
            <FormInput
              type="number"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('clients.fieldPhone')}
            />
          </div>
          <div>
            <FormLabel>{t('clients.fieldAddress')}</FormLabel>
            <FormInput
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder={t('clients.fieldAddress')}
            />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-slate-50/90 -mx-6 px-6 py-4 mt-6">
            <SecondaryButton type="button" onClick={resetForm}>
              {t('common.cancel')}
            </SecondaryButton>
            <PrimaryButton type="submit">
              {t('clients.save')}
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}


