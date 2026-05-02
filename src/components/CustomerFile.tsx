import { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, FolderOpen } from 'lucide-react';
import { ActionMenu } from './common/ActionMenu';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchClients, type ClientRecord } from '../api/clientsApi';
import { formatClientLabel } from '../lib/clientLabel';

interface CustomerFileData {
  id: string;
  file_number: string;
  customer_name: string;
  description: string;
  file_type: string;
  bill_of_lading: string;
  destination: string;
  created_by: string;
  created_at: string;
}

export function CustomerFile() {
  const [files, setFiles] = useState<CustomerFileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [clientsList, setClientsList] = useState<ClientRecord[]>([]);
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    file_number: '',
    customer_name: '',
    description: '',
    file_type: '',
    bill_of_lading: '',
    destination: '',
    created_by: '',
    rta_operation_ref: '',
    transit_number: '',
    arrival_date: '',
    loading_number: '',
    freight_forwarder: '',
    esl_operation_ref: '',
    tax_id: '',
    voyage_number: '',
    received_date: '',
    shipping_line: '',
  });

  useEffect(() => {
    loadCustomerFiles();
    (async () => {
      try {
        setClientsList(await fetchClients());
      } catch (e) {
        console.error('Error loading clients:', e);
      }
    })();
  }, []);

  const loadCustomerFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_file')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading customer files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('customer_file')
        .insert([formData]);

      if (error) throw error;

      setShowModal(false);
      resetForm();
      loadCustomerFiles();
    } catch (error: any) {
      console.error('Error saving customer file:', error);
      alert(error.message || 'Error saving customer file');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer file?')) return;

    try {
      const { error } = await supabase
        .from('customer_file')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCustomerFiles();
    } catch (error: any) {
      console.error('Error deleting customer file:', error);
      alert(error.message || 'Error deleting customer file');
    }
  };

  const resetForm = () => {
    setFormData({
      file_number: '',
      customer_name: '',
      description: '',
      file_type: '',
      bill_of_lading: '',
      destination: '',
      created_by: '',
      rta_operation_ref: '',
      transit_number: '',
      arrival_date: '',
      loading_number: '',
      freight_forwarder: '',
      esl_operation_ref: '',
      tax_id: '',
      voyage_number: '',
      received_date: '',
      shipping_line: '',
    });
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch =
      file.file_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.customer_name && file.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCustomer = !selectedCustomer || file.customer_name === selectedCustomer;

    return matchesSearch && matchesCustomer;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="text-gray-700" size={24} />
          <h1 className="text-2xl font-semibold text-gray-800">
            {t('customerFile.title')}
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0F3C66] text-white px-4 py-2 rounded-lg hover:bg-[#152a44] transition"
        >
          {t('customerFile.addNew')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('customerFile.customerName')} *
          </label>
          <select
            value={selectedCustomer}
            onChange={e => setSelectedCustomer(e.target.value)}
            className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">{t('clients.selectClient')}</option>
            {clientsList?.map(c => (
              <option key={c.id} value={formatClientLabel(c)}>
                {formatClientLabel(c)}
              </option>
            ))}
            {Array.from(new Set(files?.map(f => f.customer_name).filter(Boolean)))
              .filter(
                name =>
                  !clientsList.some(c => formatClientLabel(c) === name) &&
                  !clientsList.some(c => c.name === name)
              )
              ?.map(name => (
                <option key={`legacy-${name}`} value={name}>
                  {name}
                </option>
              ))}
          </select>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.show')}</span>
            <input
              type="number"
              defaultValue={10}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-16"
            />
            <span className="text-sm text-gray-600">{t('common.entries')}</span>
          </div>
          <input
            type="text"
            placeholder={`${t('common.search')}:`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('customerFile.fileNumber')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('customerFile.customerName')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('customerFile.description')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('customerFile.fileType')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('customerFile.billOfLading')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('customerFile.destination')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('customerFile.createdBy')}
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredFiles.slice(0, 3)?.map((file, index) => (
                  <tr key={file.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{index + 3}</td>
                    <td className="py-3 px-4">{file.file_number}</td>
                    <td className="py-3 px-4">{file.customer_name}</td>
                    <td className="py-3 px-4">{file.description || '-'}</td>
                    <td className="py-3 px-4">{file.file_type || '-'}</td>
                    <td className="py-3 px-4">{file.bill_of_lading || '-'}</td>
                    <td className="py-3 px-4">{file.destination || '-'}</td>
                    <td className="py-3 px-4">{file.created_by || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <ActionMenu
                          actions={[
                            {
                              label: t('common.view'),
                              icon: <Eye size={16} />,
                              onClick: () => console.log('View', file.id),
                            },
                            {
                              label: t('common.edit'),
                              icon: <Edit size={16} />,
                              onClick: () => console.log('Edit', file.id),
                            },
                            {
                              label: t('common.delete'),
                              icon: <Trash2 size={16} />,
                              onClick: () => handleDelete(file.id),
                              variant: 'danger',
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

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            {t('common.showing')} 1 {t('common.to')} {Math.min(filteredFiles.length, 3)} {t('common.of')} {filteredFiles.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 bg-[#0F3C66] text-white rounded">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {t('customerFile.addUpdate')}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.fileNumber')}
                    </label>
                    <input
                      type="text"
                      value={formData.file_number}
                      onChange={(e) => setFormData({ ...formData, file_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.customerName')} *
                    </label>
                    <select
                      value={formData.customer_name}
                      onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="">{t('clients.selectClient')}</option>
                      {clientsList?.map(c => (
                        <option key={c.id} value={formatClientLabel(c)}>
                          {formatClientLabel(c)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.description')} *
                    </label>
                    <select
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select goods description</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.fileType')} *
                    </label>
                    <select
                      value={formData.file_type}
                      onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select File Type</option>
                      <option value="Import">Import</option>
                      <option value="Export">Export</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.rtaOperation')}
                    </label>
                    <input
                      type="text"
                      value={formData.rta_operation_ref}
                      onChange={(e) => setFormData({ ...formData, rta_operation_ref: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.billOfLading')}
                    </label>
                    <input
                      type="text"
                      value={formData.bill_of_lading}
                      onChange={(e) => setFormData({ ...formData, bill_of_lading: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.transitNumber')}
                    </label>
                    <input
                      type="text"
                      value={formData.transit_number}
                      onChange={(e) => setFormData({ ...formData, transit_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.arrivalDate')}
                    </label>
                    <input
                      type="date"
                      value={formData.arrival_date}
                      onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.loadingNumber')}
                    </label>
                    <input
                      type="text"
                      value={formData.loading_number}
                      onChange={(e) => setFormData({ ...formData, loading_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.freightForwarder')}
                    </label>
                    <input
                      type="text"
                      value={formData.freight_forwarder}
                      onChange={(e) => setFormData({ ...formData, freight_forwarder: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.eslOperation')}
                    </label>
                    <input
                      type="text"
                      value={formData.esl_operation_ref}
                      onChange={(e) => setFormData({ ...formData, esl_operation_ref: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.taxId')}
                    </label>
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.voyageNumber')}
                    </label>
                    <input
                      type="text"
                      value={formData.voyage_number}
                      onChange={(e) => setFormData({ ...formData, voyage_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.destination')} *
                    </label>
                    <select
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select Source & Destination</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.receivedDate')}
                    </label>
                    <input
                      type="date"
                      value={formData.received_date}
                      onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customerFile.shippingLine')}
                    </label>
                    <input
                      type="text"
                      value={formData.shipping_line}
                      onChange={(e) => setFormData({ ...formData, shipping_line: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {t('customerFile.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-500 py-4">
        {t('common.copyright')}
      </div>
    </div>
  );
}


