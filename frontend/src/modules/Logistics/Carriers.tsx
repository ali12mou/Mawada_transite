import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Download, FileText, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  openCarrierPrintWindow,
  openCarriersListPrintWindow,
  type CarrierPrintRecord,
} from '../../lib/carriersPrintHtml';

interface Carrier {
  id: string;
  _id?: string;
  carrier_type: string;
  carrier_name: string;
  capacity?: string;
  owner_id: string;
  mode_id: string;
  route_id?: string;
  weight?: string;
  created_at: string;
}

interface Owner {
  id: string;
  _id?: string;
  name: string;
}

interface CarrierMode {
  id: string;
  _id?: string;
  name: string;
}

interface Route {
  id: string;
  _id?: string;
  source: string;
  destination: string;
}

type CarrierRow = {
  carrier_name: string;
  carrier_type: string;
  capacity: string;
  owner_id: string;
  mode_id: string;
  route_id: string;
  weight: string;
};

function rowId(row: { _id?: string; id?: string }): string {
  return row._id || row.id || '';
}

function emptyRow(): CarrierRow {
  return {
    carrier_name: '',
    carrier_type: '',
    capacity: '',
    owner_id: '',
    mode_id: '',
    route_id: '',
    weight: '',
  };
}

function SortIcon() {
  return (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none text-gray-400">
      <span>▲</span>
      <span>▼</span>
    </span>
  );
}

export function Carriers() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [modes, setModes] = useState<CarrierMode[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [formRows, setFormRows] = useState<CarrierRow[]>([emptyRow()]);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [carriersData, ownersData, modesData, routesData] = await Promise.all([
        genericApi.list<Carrier>('carriers'),
        genericApi.list<Owner>('owners'),
        genericApi.list<CarrierMode>('carrier_modes'),
        genericApi.list<Route>('routes'),
      ]);
      setCarriers(carriersData || []);
      setOwners(ownersData || []);
      setModes(modesData || []);
      setRoutes(routesData || []);
    } catch (error) {
      console.error('Error fetching carriers data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOwnerName = (id: string) =>
    owners.find((o) => rowId(o) === id)?.name || '—';

  const getModeName = (id: string) => {
    const mode = modes.find((m) => rowId(m) === id);
    if (!mode?.name) return '—';
    try {
      return decodeURIComponent(mode.name);
    } catch {
      return mode.name;
    }
  };

  const getRouteLabel = (id: string) => {
    const r = routes.find((route) => rowId(route) === id);
    return r ? `${r.source} -To- ${r.destination}` : 'N/A';
  };

  const toPrintRecord = (carrier: Carrier): CarrierPrintRecord => ({
    carrier_name: carrier.carrier_name,
    carrier_type: carrier.carrier_type,
    capacity: carrier.capacity,
    owner: getOwnerName(carrier.owner_id),
    mode: getModeName(carrier.mode_id),
    route: carrier.route_id ? getRouteLabel(carrier.route_id) : 'N/A',
    weight: carrier.weight,
    created_at: carrier.created_at,
  });

  const filteredCarriers = useMemo(() => {
    if (!searchTerm.trim()) return carriers;
    const q = searchTerm.toLowerCase();
    return carriers.filter(
      (c) =>
        c.carrier_name?.toLowerCase().includes(q) ||
        c.carrier_type?.toLowerCase().includes(q) ||
        getOwnerName(c.owner_id).toLowerCase().includes(q) ||
        getModeName(c.mode_id).toLowerCase().includes(q)
    );
  }, [carriers, searchTerm, owners, modes]);

  const totalPages = Math.max(1, Math.ceil(filteredCarriers.length / entriesPerPage));
  const startIndex = filteredCarriers.length === 0 ? 0 : (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredCarriers.length);
  const currentItems = filteredCarriers.slice(startIndex, endIndex);

  const updateRow = (index: number, patch: Partial<CarrierRow>) => {
    setFormRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => setFormRows((rows) => [...rows, emptyRow()]);

  const removeRow = (index: number) => {
    setFormRows((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)));
  };

  const openAddModal = () => {
    setEditingCarrier(null);
    setFormRows([emptyRow()]);
    setShowModal(true);
  };

  const openEditModal = (carrier: Carrier) => {
    setEditingCarrier(carrier);
    setFormRows([
      {
        carrier_name: carrier.carrier_name || '',
        carrier_type: carrier.carrier_type || '',
        capacity: carrier.capacity || '',
        owner_id: carrier.owner_id || '',
        mode_id: carrier.mode_id || '',
        route_id: carrier.route_id || '',
        weight: carrier.weight || '',
      },
    ]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCarrier(null);
    setFormRows([emptyRow()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = formRows.filter((r) => r.carrier_name.trim() && r.carrier_type.trim());
    if (validRows.length === 0) return;

    try {
      if (editingCarrier) {
        const row = validRows[0];
        await genericApi.update('carriers', rowId(editingCarrier), {
          ...row,
          updated_at: new Date().toISOString(),
        });
      } else {
        await Promise.all(
          validRows.map((row) =>
            genericApi.create('carriers', {
              ...row,
              created_by: user?.id,
              created_at: new Date().toISOString(),
            })
          )
        );
      }
      closeModal();
      void fetchData();
    } catch (error) {
      console.error('Error saving carrier:', error);
    }
  };

  const handleDelete = async (carrier: Carrier) => {
    if (!confirm(t('carriers.deleteConfirm'))) return;
    try {
      await genericApi.delete('carriers', rowId(carrier));
      void fetchData();
    } catch (error) {
      console.error('Error deleting carrier:', error);
    }
  };

  const handlePrintRow = (carrier: Carrier) => {
    void openCarrierPrintWindow(toPrintRecord(carrier));
  };

  const handlePrintAll = () => {
    void openCarriersListPrintWindow(carriers.map(toPrintRecord));
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
        <h2 className="text-2xl font-bold text-gray-800">{t('carriers.title')}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openAddModal}
            className="rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
          >
            {t('carriers.addButton')}
          </button>
          <button
            type="button"
            onClick={handlePrintAll}
            className="inline-flex items-center gap-2 rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
          >
            <Download size={16} />
            {t('carriers.print')}
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
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{t('common.searchLabel')}</span>
            <input
              type="text"
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
                  {t('carriers.colType')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('carriers.colName')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('carriers.colCapacity')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('carriers.colOwner')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('carriers.colMode')}
                  <SortIcon />
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                currentItems.map((carrier, index) => (
                  <tr key={rowId(carrier)} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-gray-700">{carrier.carrier_type}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{carrier.carrier_name}</td>
                    <td className="px-4 py-3 text-gray-700">{carrier.capacity || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{getOwnerName(carrier.owner_id)}</td>
                    <td className="px-4 py-3 text-gray-700">{getModeName(carrier.mode_id)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(carrier)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-green-600 transition hover:bg-green-50"
                          title={t('common.edit')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(carrier)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-red-600 transition hover:bg-red-50"
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintRow(carrier)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-[#0F3C66] transition hover:bg-blue-50"
                          title={t('carriers.print')}
                        >
                          <FileText size={14} />
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
            {filteredCarriers.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {endIndex} {t('common.of')} {filteredCarriers.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || filteredCarriers.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.previous')}
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
              disabled={currentPage >= totalPages || filteredCarriers.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCarrier ? t('carriers.modalEditTitle') : t('carriers.modalTitle')}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="overflow-x-auto p-4">
                <table className="w-full min-w-[900px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-center text-xs font-semibold uppercase text-gray-700">
                      <th className="border border-gray-200 px-2 py-2 w-10">#</th>
                      <th className="border border-gray-200 px-2 py-2">{t('carriers.tableCarrierName')}</th>
                      <th className="border border-gray-200 px-2 py-2">{t('carriers.tableCarrierType')}</th>
                      <th className="border border-gray-200 px-2 py-2">{t('carriers.tableCapacity')}</th>
                      <th className="border border-gray-200 px-2 py-2">{t('carriers.tableOwner')}</th>
                      <th className="border border-gray-200 px-2 py-2">{t('carriers.tableMode')}</th>
                      <th className="border border-gray-200 px-2 py-2">{t('carriers.tableSourceDestination')}</th>
                      <th className="border border-gray-200 px-2 py-2">{t('carriers.tableWeight')}</th>
                      <th className="border border-gray-200 px-2 py-2 w-14">{t('common.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formRows.map((row, index) => (
                      <tr key={index}>
                        <td className="border border-gray-200 px-2 py-2 text-center text-gray-600">
                          {index + 1}
                        </td>
                        <td className="border border-gray-200 p-1">
                          <input
                            type="text"
                            value={row.carrier_name}
                            onChange={(e) => updateRow(index, { carrier_name: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                            required={index === 0}
                          />
                        </td>
                        <td className="border border-gray-200 p-1">
                          <input
                            type="text"
                            value={row.carrier_type}
                            onChange={(e) => updateRow(index, { carrier_type: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                            required={index === 0}
                          />
                        </td>
                        <td className="border border-gray-200 p-1">
                          <input
                            type="text"
                            value={row.capacity}
                            onChange={(e) => updateRow(index, { capacity: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                          />
                        </td>
                        <td className="border border-gray-200 p-1">
                          <select
                            value={row.owner_id}
                            onChange={(e) => updateRow(index, { owner_id: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                          >
                            <option value="">{t('carriers.selectOwner')}</option>
                            {owners.map((o) => (
                              <option key={rowId(o)} value={rowId(o)}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-200 p-1">
                          <select
                            value={row.mode_id}
                            onChange={(e) => updateRow(index, { mode_id: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                          >
                            <option value="">{t('carriers.selectMode')}</option>
                            {modes.map((m) => (
                              <option key={rowId(m)} value={rowId(m)}>
                                {getModeName(rowId(m))}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-200 p-1">
                          <select
                            value={row.route_id}
                            onChange={(e) => updateRow(index, { route_id: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                          >
                            <option value="">{t('carriers.selectRoute')}</option>
                            {routes.map((r) => (
                              <option key={rowId(r)} value={rowId(r)}>
                                {r.source} -To- {r.destination}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-200 p-1">
                          <input
                            type="text"
                            value={row.weight}
                            onChange={(e) => updateRow(index, { weight: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                          />
                        </td>
                        <td className="border border-gray-200 p-1 text-center">
                          {!editingCarrier && (
                            <button
                              type="button"
                              onClick={() => (index === formRows.length - 1 ? addRow() : removeRow(index))}
                              className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-[#0F3C66] transition hover:bg-blue-50"
                              title={index === formRows.length - 1 ? t('common.add') : t('common.delete')}
                            >
                              {index === formRows.length - 1 ? <Plus size={16} /> : <Trash2 size={14} />}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t border-gray-200 px-6 py-4">
                <button
                  type="submit"
                  className="rounded bg-[#0F3C66] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#154b8a]"
                >
                  {t('carriers.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
