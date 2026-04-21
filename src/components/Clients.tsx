import { useState, useEffect, useMemo } from 'react';
import { Pencil, Trash2, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  type ClientRecord,
} from '../api/clientsApi';
import Modal from './common/Modal';
import { FormLabel, FormInput, PrimaryButton, SecondaryButton } from './common/FormComponents';

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
      setError((e as Error).message || 'Impossible de charger les clients. Vérifiez que le backend est démarré.');
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
      setError((err as Error).message || 'Erreur à l’enregistrement');
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;
    setError(null);
    try {
      await deleteClient(id);
      await load();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Suppression impossible');
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
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">{t('clients.pageTitle')}</h2>
          <Users size={24} className="text-gray-600" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm text-gray-500">{t('common.version')}</div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded bg-[#1e3a5f] px-4 py-2 text-white transition hover:bg-[#2d4a6f]"
          >
            {t('clients.addButton')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('clients.show')}</span>
            <select
              value={entriesPerPage}
              onChange={e => setEntriesPerPage(Number(e.target.value))}
              className="rounded border border-gray-300 px-3 py-1 focus:border-transparent focus:ring-2 focus:ring-[#1e3a5f]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">{t('clients.entries')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('clients.searchLabel')}</span>
            <input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="rounded border border-gray-300 px-3 py-1 focus:border-transparent focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('clients.colCompany')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('clients.colName')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('clients.colEmail')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('clients.colPhone')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('clients.colAddress')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('clients.colAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagedClients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{client.company_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{client.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{client.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{client.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{client.address || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(client)}
                        className="rounded p-1.5 text-gray-600 transition hover:bg-gray-100"
                        aria-label="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(client.id)}
                        className="rounded p-1.5 text-red-600 transition hover:bg-red-50"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {t('clients.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredClients.length > entriesPerPage && (
          <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-gray-600">
            <span>
              {t('common.showing')}{' '}
              {(page - 1) * entriesPerPage + 1} {t('common.to')}{' '}
              {Math.min(page * entriesPerPage, filteredClients.length)} {t('common.of')}{' '}
              {filteredClients.length} {t('common.entries')}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Suivant
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
