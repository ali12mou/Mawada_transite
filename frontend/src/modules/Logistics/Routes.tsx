import { useState, useEffect, useMemo } from 'react';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Navigation, Pencil, Trash2, X } from 'lucide-react';

interface Route {
  id: string;
  _id?: string;
  source: string;
  destination: string;
  source_latitude?: number;
  source_longitude?: number;
  destination_latitude?: number;
  destination_longitude?: number;
  created_at: string;
}

function rowId(row: { _id?: string; id?: string }): string {
  return row._id || row.id || '';
}

function SortIcon() {
  return (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none text-gray-400">
      <span>▲</span>
      <span>▼</span>
    </span>
  );
}

export function Routes() {
  const { t } = useLanguage();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  const [formData, setFormData] = useState({
    source: '',
    destination: '',
  });

  useEffect(() => {
    void fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const data = await genericApi.list<Route>('routes');
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = useMemo(() => {
    if (!searchTerm.trim()) return routes;
    const q = searchTerm.toLowerCase();
    return routes.filter(
      (route) =>
        route.source?.toLowerCase().includes(q) ||
        route.destination?.toLowerCase().includes(q)
    );
  }, [routes, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / entriesPerPage));
  const startIndex = filteredRoutes.length === 0 ? 0 : (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredRoutes.length);
  const currentRoutes = filteredRoutes.slice(startIndex, endIndex);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      source: formData.source.trim(),
      destination: formData.destination.trim(),
    };

    try {
      if (editingRoute) {
        await genericApi.update('routes', rowId(editingRoute), payload);
      } else {
        await genericApi.create('routes', payload);
      }
      closeModal();
      void fetchRoutes();
    } catch (error) {
      console.error('Error saving route:', error);
    }
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      source: route.source || '',
      destination: route.destination || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (route: Route) => {
    if (!confirm(t('routes.deleteConfirm'))) return;
    try {
      await genericApi.delete('routes', rowId(route));
      void fetchRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const resetForm = () => {
    setFormData({ source: '', destination: '' });
    setEditingRoute(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openAddModal = () => {
    setEditingRoute(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  const thClass =
    'px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">{t('routes.title')}</h2>
          <Navigation size={24} className="text-gray-600" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-[#EE964C]">{t('common.version')}</span>
          <button
            type="button"
            onClick={openAddModal}
            className="rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
          >
            {t('routes.addNew')}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-gray-300 px-2 py-1 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded border border-gray-300 px-3 py-1 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className={thClass}>
                  #
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('routes.colSources')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('routes.colDestinations')}
                  <SortIcon />
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('common.action')}
                  <SortIcon />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentRoutes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                currentRoutes.map((route, index) => (
                  <tr key={rowId(route)} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{route.source}</td>
                    <td className="px-4 py-3 text-gray-700">{route.destination}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(route)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                          title={t('common.edit')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(route)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
          <div>
            {t('common.showing')}{' '}
            {filteredRoutes.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {endIndex} {t('common.of')} {filteredRoutes.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || filteredRoutes.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`rounded px-3 py-1 transition ${
                  currentPage === page
                    ? 'bg-[#0F3C66] text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || filteredRoutes.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">{t('routes.modalTitle')}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-800">
                    {t('routes.colSource')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-800">
                    {t('routes.colDestination')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="rounded bg-[#0F3C66] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#154b8a]"
                >
                  {t('routes.saveButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
