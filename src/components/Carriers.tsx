import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Edit2, Trash2, Truck, Search } from 'lucide-react';
import Modal from './common/Modal';
import { ActionMenu } from './common/ActionMenu';

interface Carrier {
  id: string;
  carrier_type: string;
  carrier_name: string;
  capacity?: string;
  owner_id: string;
  mode_id: string;
  route_id?: string;
  weight?: string;
  created_at: string;
  owners?: {
    name: string;
  };
  carrier_modes?: {
    name: string;
  };
  routes?: {
    source: string;
    destination: string;
  };
}

export function Carriers() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [owners, setOwners] = useState<any[]>([]);
  const [modes, setModes] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    carrier_type: '',
    carrier_name: '',
    capacity: '',
    owner_id: '',
    mode_id: '',
    route_id: '',
    weight: ''
  });

  useEffect(() => {
    fetchCarriers();
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [ownersRes, modesRes, routesRes] = await Promise.all([
        supabase.from('owners').select('id, name'),
        supabase.from('carrier_modes').select('id, name'),
        supabase.from('routes').select('id, source, destination')
      ]);

      setOwners(ownersRes.data || []);
      setModes(modesRes.data || []);
      setRoutes(routesRes.data || []);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const fetchCarriers = async () => {
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select(`
          *,
          owners (name),
          carrier_modes (name),
          routes (source, destination)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCarriers(data || []);
    } catch (error) {
      console.error('Error fetching carriers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from('carriers')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('carriers')
          .insert([{
            ...formData,
            created_by: user?.id
          }]);
        if (error) throw error;
      }
      setShowModal(false);
      resetForm();
      fetchCarriers();
    } catch (error) {
      console.error('Error saving carrier:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      carrier_type: '',
      carrier_name: '',
      capacity: '',
      owner_id: '',
      mode_id: '',
      route_id: '',
      weight: ''
    });
    setEditingId(null);
  };

  const handleEdit = (carrier: Carrier) => {
    setEditingId(carrier.id);
    setFormData({
      carrier_type: carrier.carrier_type,
      carrier_name: carrier.carrier_name,
      capacity: carrier.capacity || '',
      owner_id: carrier.owner_id,
      mode_id: carrier.mode_id,
      route_id: carrier.route_id || '',
      weight: carrier.weight || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('carriers.deleteConfirm'))) return;
    try {
      const { error } = await supabase.from('carriers').delete().eq('id', id);
      if (error) throw error;
      fetchCarriers();
    } catch (error) {
      console.error('Error deleting carrier:', error);
    }
  };

  const filteredCarriers = carriers.filter(c =>
    c.carrier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.carrier_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredCarriers.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentItems = filteredCarriers.slice(startIndex, startIndex + entriesPerPage);

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
          <h1 className="text-2xl font-bold tracking-tight text-[#0F3C66]">{t('carriers.title')}</h1>
          <Truck size={24} className="text-[#0F3C66] opacity-80" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-[#EE964C]">{t('common.version')}</div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 font-bold hover:bg-[#154b8a] transition active:scale-95 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            {t('carriers.addButton')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66] transition shadow-sm text-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#0F3C66] text-white">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('carriers.tableCarrierName')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('carriers.tableCarrierType')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('carriers.tableCapacity')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('carriers.tableOwner')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('carriers.tableMode')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('carriers.tableSourceDestination')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('carriers.tableWeight')}</th>
                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider w-24">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {currentItems.map((c) => (
                <tr key={c.id} className="hover:bg-[#0F3C66]/5 transition group">
                  <td className="px-5 py-4 text-sm font-bold text-[#0F3C66]">{c.carrier_name}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{c.carrier_type}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{c.capacity || '-'}</td>
                  <td className="px-5 py-4 text-sm text-[#0F3C66] font-medium">{c.owners?.name || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{c.carrier_modes?.name || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {c.routes ? `${c.routes.source} → ${c.routes.destination}` : '-'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{c.weight || '-'}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => handleEdit(c),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => handleDelete(c.id),
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

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-between items-center text-sm">
          <div className="text-gray-500 font-medium">
            {t('common.showing')} <span className="font-bold text-gray-900">{startIndex + 1}</span> {t('common.to')} <span className="font-bold text-gray-900">{Math.min(startIndex + entriesPerPage, filteredCarriers.length)}</span> {t('common.of')} <span className="font-bold text-gray-900">{filteredCarriers.length}</span> {t('common.entries')}
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
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingId ? t('common.edit') : t('carriers.addButton')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('carriers.tableCarrierName')} *</label>
              <input
                type="text" required value={formData.carrier_name}
                onChange={(e) => setFormData({ ...formData, carrier_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('carriers.tableCarrierType')} *</label>
              <input
                type="text" required value={formData.carrier_type}
                onChange={(e) => setFormData({ ...formData, carrier_type: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('carriers.tableCapacity')}</label>
              <input
                type="text" value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('carriers.tableWeight')}</label>
              <input
                type="text" value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('carriers.tableOwner')} *</label>
              <select
                required value={formData.owner_id}
                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
              >
                <option value="">Select Owner</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('carriers.tableMode')} *</label>
              <select
                required value={formData.mode_id}
                onChange={(e) => setFormData({ ...formData, mode_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
              >
                <option value="">Select Mode</option>
                {modes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('carriers.tableSourceDestination')}</label>
              <select
                value={formData.route_id}
                onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
              >
                <option value="">Select Route</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.source} → {r.destination}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6 text-sm">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition active:scale-95 font-bold">{t('common.cancel')}</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 font-bold hover:bg-[#154b8a] transition active:scale-95">{t('common.save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


