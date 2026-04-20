import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Search, Edit2, Trash2, Eye, FileText, Printer, X } from 'lucide-react';

interface Document4 {
  id: string;
  license_code: string;
  operator: string;
  recipient_declarant_name: string;
  code_no: string;
  declarant_nif_code: string;
  recipient_name: string;
  recipient_nif_code: string;
  fz_warehouse_declaration: string;
  quantity_entered: string;
  boat_name: string;
  arrival_date: string;
  trip_number: string;
  bill_of_lading_number: string;
  country_origin: string;
  sh_code: string;
  exit_qty: string;
  merchandise_description: string;
  gross_weight: string;
  declared_value: number;
  exit_point: string;
  destination: string;
  created_at: string;
}

export function Document4() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<Document4[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document4[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingDocument, setEditingDocument] = useState<Document4 | null>(null);

  const [formData, setFormData] = useState({
    license_code: '',
    operator: '',
    recipient_declarant_name: '',
    code_no: '',
    declarant_nif_code: '',
    recipient_name: '',
    recipient_nif_code: '',
    fz_warehouse_declaration: '',
    quantity_entered: '',
    boat_name: '',
    arrival_date: new Date().toISOString().split('T')[0],
    trip_number: '',
    bill_of_lading_number: '',
    country_origin: '',
    sh_code: '',
    exit_qty: '',
    merchandise_description: '',
    gross_weight: '',
    declared_value: 0,
    exit_point: '',
    destination: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('document_4')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.recipient_declarant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.quantity_entered?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDocument) {
        const { error } = await supabase
          .from('document_4')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDocument.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('document_4').insert([{
          ...formData,
          created_by: user?.id
        }]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingDocument(null);
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  const handleEdit = (document: Document4) => {
    setEditingDocument(document);
    setFormData({
      license_code: document.license_code || '',
      operator: document.operator || '',
      recipient_declarant_name: document.recipient_declarant_name || '',
      code_no: document.code_no || '',
      declarant_nif_code: document.declarant_nif_code || '',
      recipient_name: document.recipient_name || '',
      recipient_nif_code: document.recipient_nif_code || '',
      fz_warehouse_declaration: document.fz_warehouse_declaration || '',
      quantity_entered: document.quantity_entered || '',
      boat_name: document.boat_name || '',
      arrival_date: document.arrival_date || new Date().toISOString().split('T')[0],
      trip_number: document.trip_number || '',
      bill_of_lading_number: document.bill_of_lading_number || '',
      country_origin: document.country_origin || '',
      sh_code: document.sh_code || '',
      exit_qty: document.exit_qty || '',
      merchandise_description: document.merchandise_description || '',
      gross_weight: document.gross_weight || '',
      declared_value: document.declared_value || 0,
      exit_point: document.exit_point || '',
      destination: document.destination || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      const { error } = await supabase
        .from('document_4')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      license_code: '',
      operator: '',
      recipient_declarant_name: '',
      code_no: '',
      declarant_nif_code: '',
      recipient_name: '',
      recipient_nif_code: '',
      fz_warehouse_declaration: '',
      quantity_entered: '',
      boat_name: '',
      arrival_date: new Date().toISOString().split('T')[0],
      trip_number: '',
      bill_of_lading_number: '',
      country_origin: '',
      sh_code: '',
      exit_qty: '',
      merchandise_description: '',
      gross_weight: '',
      declared_value: 0,
      exit_point: '',
      destination: ''
    });
  };

  const totalPages = Math.ceil(filteredDocuments.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex);

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
        <h1 className="text-2xl font-semibold text-gray-800">Document N° 4</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
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

          <button
            onClick={() => {
              setEditingDocument(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Ajouter une nouvelle entrée
          </button>

          <div className="flex items-center gap-2">
            <span>Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name of recipient/declarant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quantity Entered</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Arrival date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentDocuments.map((doc, index) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                  <td className="px-4 py-3 text-sm">{doc.recipient_declarant_name || '-'}</td>
                  <td className="px-4 py-3 text-sm">{doc.quantity_entered || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {doc.arrival_date ? new Date(doc.arrival_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(doc)}
                        className="text-emerald-600 hover:text-emerald-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-800 hover:text-gray-900">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded ${
                  currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Ajouter/mettre à jour une entrée
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingDocument(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code de licence
                  </label>
                  <input
                    type="text"
                    value={formData.license_code}
                    onChange={(e) => setFormData({ ...formData, license_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operator
                  </label>
                  <input
                    type="text"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du destinataire/déclarant
                  </label>
                  <input
                    type="text"
                    value={formData.recipient_declarant_name}
                    onChange={(e) => setFormData({ ...formData, recipient_declarant_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CODE NO
                  </label>
                  <input
                    type="text"
                    value={formData.code_no}
                    onChange={(e) => setFormData({ ...formData, code_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code NIF du déclarant
                  </label>
                  <input
                    type="text"
                    value={formData.declarant_nif_code}
                    onChange={(e) => setFormData({ ...formData, declarant_nif_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du destinataire
                  </label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code NIF du destinataire
                  </label>
                  <input
                    type="text"
                    value={formData.recipient_nif_code}
                    onChange={(e) => setFormData({ ...formData, recipient_nif_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Déclaration d'entrée FZ/Entrepôt
                  </label>
                  <input
                    type="text"
                    value={formData.fz_warehouse_declaration}
                    onChange={(e) => setFormData({ ...formData, fz_warehouse_declaration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité entrée
                  </label>
                  <input
                    type="text"
                    value={formData.quantity_entered}
                    onChange={(e) => setFormData({ ...formData, quantity_entered: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du Bateau
                  </label>
                  <input
                    type="text"
                    value={formData.boat_name}
                    onChange={(e) => setFormData({ ...formData, boat_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'arrivée
                  </label>
                  <input
                    type="date"
                    value={formData.arrival_date}
                    onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de voyage
                  </label>
                  <input
                    type="text"
                    value={formData.trip_number}
                    onChange={(e) => setFormData({ ...formData, trip_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro du connaissement
                  </label>
                  <input
                    type="text"
                    value={formData.bill_of_lading_number}
                    onChange={(e) => setFormData({ ...formData, bill_of_lading_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays d'origine
                  </label>
                  <input
                    type="text"
                    value={formData.country_origin}
                    onChange={(e) => setFormData({ ...formData, country_origin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code SH
                  </label>
                  <input
                    type="text"
                    value={formData.sh_code}
                    onChange={(e) => setFormData({ ...formData, sh_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qté Sortie
                  </label>
                  <input
                    type="text"
                    value={formData.exit_qty}
                    onChange={(e) => setFormData({ ...formData, exit_qty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description de la Marchandise
                  </label>
                  <input
                    type="text"
                    value={formData.merchandise_description}
                    onChange={(e) => setFormData({ ...formData, merchandise_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poids brut
                  </label>
                  <input
                    type="text"
                    value={formData.gross_weight}
                    onChange={(e) => setFormData({ ...formData, gross_weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valeur déclarée
                  </label>
                  <input
                    type="number"
                    value={formData.declared_value}
                    onChange={(e) => setFormData({ ...formData, declared_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Point de sortie
                  </label>
                  <input
                    type="text"
                    value={formData.exit_point}
                    onChange={(e) => setFormData({ ...formData, exit_point: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
