import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Edit2, Trash2, Eye, Printer, Plus, Search } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';
import Modal from '../Shared/common/Modal';

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
      const data = await genericApi.list('document_4');

      
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
        await genericApi.update('document_4', editingId, formData);

        
      } else {
        await genericApi.create('document_4', formData);

        
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
    if (!confirm(t('document4.deleteConfirm'))) return;

    try {
      await genericApi.delete('document_4', id);

      
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
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F3C66]">{t('document4.title')}</h1>
        <button
          onClick={() => {
            setEditingDocument(null);
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 hover:bg-[#154b8a] transition-all font-bold tracking-wide active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('document4.addNew') || t('common.addNew')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
            <span>{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>

          <div className="relative w-72">
            <input
              type="text"
              placeholder={`${t('common.searchLabel') || t('common.search')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66] transition shadow-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#0F3C66] text-white">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">#</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document4.colRecipientDeclarant') || 'Recipient Declarant'}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document4.colQuantityEntered') || 'Quantity Entered'}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document4.colArrivalDate') || 'Arrival Date'}</th>
                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider w-24 text-center">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentDocuments?.map((doc, index) => (
                <tr key={doc.id} className="hover:bg-[#0F3C66]/5 transition group">
                  <td className="px-5 py-4 text-sm font-medium text-gray-500">{startIndex + index + 1}</td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-800">{doc.recipient_declarant_name || '-'}</td>
                  <td className="px-5 py-4 text-sm font-mono text-gray-600">{doc.quantity_entered || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {doc.arrival_date ? new Date(doc.arrival_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.view'),
                            icon: <Eye size={16} />,
                            onClick: () => console.log('View Document 4', doc.id),
                          },
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => handleEdit(doc),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => handleDelete(doc.id),
                            variant: 'danger',
                          },
                          {
                            label: t('common.print'),
                            icon: <Printer size={16} />,
                            onClick: () => console.log('Print Document 4', doc.id),
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

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-between items-center">
          <div className="text-sm font-medium text-gray-500">
            {t('common.showing')} <span className="font-bold text-gray-900">{startIndex + 1}</span> {t('common.to')} <span className="font-bold text-gray-900">{Math.min(endIndex, filteredDocuments.length)}</span> {t('common.of')} <span className="font-bold text-gray-900">{filteredDocuments.length}</span> {t('common.entries')}
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
          setEditingDocument(null);
          resetForm();
        }}
        title={editingDocument ? t('document4.addUpdate') || 'Update Document No 4' : t('document4.addUpdate') || 'Add Document No 4'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="p-2">
          <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: t('document4.licenseCode') || 'License Code', key: 'license_code' },
                { label: t('document4.operator') || 'Operator', key: 'operator' },
                { label: t('document4.recipientDeclarantName') || 'Recipient Declarant', key: 'recipient_declarant_name' },
                { label: t('document4.codeNo') || 'Code No', key: 'code_no' },
                { label: t('document4.declarantNifCode') || 'Declarant NIF Code', key: 'declarant_nif_code' },
                { label: t('document4.recipientName') || 'Recipient Name', key: 'recipient_name' },
                { label: t('document4.recipientNifCode') || 'Recipient NIF Code', key: 'recipient_nif_code' },
                { label: t('document4.fzWarehouseDeclaration') || 'FZ Warehouse', key: 'fz_warehouse_declaration' },
                { label: t('document4.quantityEntered') || 'Quantity Entered', key: 'quantity_entered' },
                { label: t('document4.boatName') || 'Boat Name', key: 'boat_name' },
                { label: t('document4.arrivalDate') || 'Arrival Date', key: 'arrival_date', type: 'date' },
                { label: t('document4.tripNumber') || 'Trip Number', key: 'trip_number' },
                { label: t('document4.billOfLadingNumber') || 'Bill of Lading', key: 'bill_of_lading_number' },
                { label: t('document4.countryOrigin') || 'Country Origin', key: 'country_origin' },
                { label: t('document4.shCode') || 'SH Code', key: 'sh_code' },
                { label: t('document4.exitQty') || 'Exit Qty', key: 'exit_qty' },
                { label: t('document4.merchandiseDescription') || 'Merchandise Description', key: 'merchandise_description' },
                { label: t('document4.grossWeight') || 'Gross Weight', key: 'gross_weight' },
                { label: t('document4.declaredValue') || 'Declared Value', key: 'declared_value', type: 'number' },
                { label: t('document4.exitPoint') || 'Exit Point', key: 'exit_point' },
                { label: t('document4.destination') || 'Destination', key: 'destination' }
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    {field.label}
                  </label>
                  <input
                    type={field.type || 'text'}
                    value={formData[field.key as keyof typeof formData] as string | number}
                    onChange={(e) => setFormData({ ...formData, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition text-sm bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition active:scale-95 font-bold text-sm"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 hover:bg-[#154b8a] transition active:scale-95 font-bold text-sm"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}



