import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Edit2, Trash2, Printer, X } from 'lucide-react';

interface CarrierRow {
  id?: string;
  carrier_name: string;
  carrier_type: string;
  capacity: string;
  owner: string;
  carrier_mood: string;
  source_destination: string;
  weight: string;
}

interface Carrier {
  id: string;
  carrier_name: string;
  carrier_type: string;
  capacity: string;
  owner: string;
  carrier_mood: string;
  source_destination: string;
  weight: string;
  created_at: string;
}

export function Carriers() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [filteredCarriers, setFilteredCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);

  const [carrierRows, setCarrierRows] = useState<CarrierRow[]>([
    {
      carrier_name: '',
      carrier_type: '',
      capacity: '',
      owner: '',
      carrier_mood: '',
      source_destination: '',
      weight: ''
    }
  ]);

  useEffect(() => {
    fetchCarriers();
  }, []);

  useEffect(() => {
    filterCarriers();
  }, [carriers, searchTerm]);

  const fetchCarriers = async () => {
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCarriers(data || []);
    } catch (error) {
      console.error('Error fetching carriers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCarriers = () => {
    let filtered = [...carriers];

    if (searchTerm) {
      filtered = filtered.filter(carrier =>
        carrier.carrier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carrier.carrier_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carrier.owner?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCarriers(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCarrier) {
        const carrier = carrierRows[0];
        const { error } = await supabase
          .from('carriers')
          .update({
            ...carrier,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCarrier.id);

        if (error) throw error;
      } else {
        for (const carrier of carrierRows) {
          if (carrier.carrier_name) {
            await supabase.from('carriers').insert([{
              ...carrier,
              created_by: user?.id
            }]);
          }
        }
      }

      setShowModal(false);
      setEditingCarrier(null);
      resetForm();
      fetchCarriers();
    } catch (error) {
      console.error('Error saving carrier:', error);
    }
  };

  const handleEdit = (carrier: Carrier) => {
    setEditingCarrier(carrier);
    setCarrierRows([{
      carrier_name: carrier.carrier_name || '',
      carrier_type: carrier.carrier_type || '',
      capacity: carrier.capacity || '',
      owner: carrier.owner || '',
      carrier_mood: carrier.carrier_mood || '',
      source_destination: carrier.source_destination || '',
      weight: carrier.weight || ''
    }]);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce transporteur ?')) return;

    try {
      const { error } = await supabase
        .from('carriers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCarriers();
    } catch (error) {
      console.error('Error deleting carrier:', error);
    }
  };

  const resetForm = () => {
    setCarrierRows([{
      carrier_name: '',
      carrier_type: '',
      capacity: '',
      owner: '',
      carrier_mood: '',
      source_destination: '',
      weight: ''
    }]);
  };

  const addCarrierRow = () => {
    setCarrierRows([...carrierRows, {
      carrier_name: '',
      carrier_type: '',
      capacity: '',
      owner: '',
      carrier_mood: '',
      source_destination: '',
      weight: ''
    }]);
  };

  const updateCarrierRow = (index: number, field: keyof CarrierRow, value: string) => {
    const newRows = [...carrierRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setCarrierRows(newRows);
  };

  const totalPages = Math.ceil(filteredCarriers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentCarriers = filteredCarriers.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Transporteurs</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <input
                type="number"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded"
                min="1"
              />
              <span>entries</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingCarrier(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ajouter un Nouveau Transporteur
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span>Search:</span>
              <input
                type="text"
                placeholder=""
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  # <span className="ml-1">▲</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  Type de Transporteur <span className="ml-1">▼</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  Nom du Transporteur <span className="ml-1">▼</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  Capacité <span className="ml-1">▼</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  Propriétaire <span className="ml-1">▼</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  Mode de Transport <span className="ml-1">▼</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentCarriers.map((carrier, index) => (
                <tr key={carrier.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                  <td className="px-4 py-3 text-sm">{carrier.carrier_type || '-'}</td>
                  <td className="px-4 py-3 text-sm text-blue-600">{carrier.carrier_name}</td>
                  <td className="px-4 py-3 text-sm">{carrier.capacity || '-'}</td>
                  <td className="px-4 py-3 text-sm text-blue-600">{carrier.owner || '-'}</td>
                  <td className="px-4 py-3 text-sm">{carrier.carrier_mood || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(carrier)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(carrier.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800 p-1">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentCarriers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Aucun transporteur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCarriers.length)} of {filteredCarriers.length} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span className="px-3 py-1 bg-white border rounded">{currentPage}</span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-7xl w-full my-8">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Ajouter un Transporteur</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCarrier(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="overflow-x-auto mb-4">
                <table className="w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 border">#</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 border">Carrier Name</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 border">Carrier Type</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 border">Capacity</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 border">Owner</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 border">Carrier Mood</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 border">Source & Destination</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 border">Weight</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrierRows.map((row, index) => (
                      <tr key={index}>
                        <td className="px-2 py-2 text-sm border text-center">{index + 1}</td>
                        <td className="px-2 py-2 border">
                          <input
                            type="text"
                            value={row.carrier_name}
                            onChange={(e) => updateCarrierRow(index, 'carrier_name', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            required
                          />
                        </td>
                        <td className="px-2 py-2 border">
                          <input
                            type="text"
                            value={row.carrier_type}
                            onChange={(e) => updateCarrierRow(index, 'carrier_type', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-2 py-2 border">
                          <input
                            type="text"
                            value={row.capacity}
                            onChange={(e) => updateCarrierRow(index, 'capacity', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-2 py-2 border">
                          <select
                            value={row.owner}
                            onChange={(e) => updateCarrierRow(index, 'owner', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select Owner</option>
                            <option value="Zakaria Mohamed Yusuf">Zakaria Mohamed Yusuf</option>
                            <option value="Engr Abdikarim">Engr Abdikarim</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 border">
                          <select
                            value={row.carrier_mood}
                            onChange={(e) => updateCarrierRow(index, 'carrier_mood', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select CarrierMood</option>
                            <option value="Truck">Truck</option>
                            <option value="Train2">Train2</option>
                            <option value="HASSAN AHMED ADAWEH">HASSAN AHMED ADAWEH</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 border">
                          <select
                            value={row.source_destination}
                            onChange={(e) => updateCarrierRow(index, 'source_destination', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select</option>
                            <option value="Muqdisho -To- Hargeysa">Muqdisho -To- Hargeysa</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 border">
                          <input
                            type="text"
                            value={row.weight}
                            onChange={(e) => updateCarrierRow(index, 'weight', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-2 py-2 border text-center">
                          {!editingCarrier && (
                            <button
                              type="button"
                              onClick={addCarrierRow}
                              className="text-green-600 hover:text-green-800 text-xl"
                            >
                              +
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
