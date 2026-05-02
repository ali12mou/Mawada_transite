import { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Award } from 'lucide-react';
import { ActionMenu } from './common/ActionMenu';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface CertificateData {
  id: string;
  certificate_number: string;
  customer: string;
  description: string;
  destination: string;
  hs_code: string;
  created_at: string;
}

export function CertificateOrigin() {
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    certificate_number: '',
    customer: '',
    destination: '',
    tin_number: '',
    telephone: '',
    description: '',
    hs_code: '',
    mt: '',
    gross_weight: 0,
    transport_type: '',
    origin_product: '',
    declaration_form: '',
    tax_id_nif: '',
    loaded_by: '',
    destination_to: '',
  });

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificate_origin')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('certificate_origin')
        .insert([formData]);

      if (error) throw error;

      setShowModal(false);
      resetForm();
      loadCertificates();
    } catch (error: any) {
      console.error('Error saving certificate:', error);
      alert(error.message || 'Error saving certificate');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;

    try {
      const { error } = await supabase
        .from('certificate_origin')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCertificates();
    } catch (error: any) {
      console.error('Error deleting certificate:', error);
      alert(error.message || 'Error deleting certificate');
    }
  };

  const resetForm = () => {
    setFormData({
      certificate_number: '',
      customer: '',
      destination: '',
      tin_number: '',
      telephone: '',
      description: '',
      hs_code: '',
      mt: '',
      gross_weight: 0,
      transport_type: '',
      origin_product: '',
      declaration_form: '',
      tax_id_nif: '',
      loaded_by: '',
      destination_to: '',
    });
  };

  const filteredCertificates = certificates.filter(cert =>
    (cert.customer && cert.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cert.description && cert.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cert.destination && cert.destination.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="text-gray-700" size={24} />
          <h1 className="text-2xl font-semibold text-gray-800">
            {t('certificateOrigin.title')}
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0F3C66] text-white px-4 py-2 rounded-lg hover:bg-[#152a44] transition"
        >
          {t('certificateOrigin.addNew')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('certificateOrigin.client')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('certificateOrigin.description')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('certificateOrigin.destination')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('certificateOrigin.hsCode')}
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredCertificates?.map((cert, index) => (
                  <tr key={cert.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4">{cert.customer}</td>
                    <td className="py-3 px-4">{cert.description || '-'}</td>
                    <td className="py-3 px-4">{cert.destination || '-'}</td>
                    <td className="py-3 px-4">{cert.hs_code || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <ActionMenu
                          actions={[
                            {
                              label: t('common.view'),
                              icon: <Eye size={16} />,
                              onClick: () => console.log('View', cert.id),
                            },
                            {
                              label: t('common.edit'),
                              icon: <Edit size={16} />,
                              onClick: () => console.log('Edit', cert.id),
                            },
                            {
                              label: t('common.delete'),
                              icon: <Trash2 size={16} />,
                              onClick: () => handleDelete(cert.id),
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
            {t('common.showing')} 1 {t('common.to')} {Math.min(filteredCertificates.length, 2)} {t('common.of')} {filteredCertificates.length} {t('common.entries')}
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
                {t('certificateOrigin.addUpdate')}
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
                      {t('certificateOrigin.client')}
                    </label>
                    <select
                      value={formData.customer}
                      onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="">Select Customer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('certificateOrigin.description')}
                    </label>
                    <select
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select Goods Description</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('certificateOrigin.destination')}
                    </label>
                    <select
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select Destination</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('certificateOrigin.transportType')}
                    </label>
                    <select
                      value={formData.transport_type}
                      onChange={(e) => setFormData({ ...formData, transport_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select transport type</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('certificateOrigin.originProduct')}
                    </label>
                    <input
                      type="text"
                      value={formData.origin_product}
                      onChange={(e) => setFormData({ ...formData, origin_product: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('certificateOrigin.declarationForm')}
                    </label>
                    <input
                      type="text"
                      value={formData.declaration_form}
                      onChange={(e) => setFormData({ ...formData, declaration_form: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('certificateOrigin.taxIdNif')}
                    </label>
                    <input
                      type="text"
                      value={formData.tax_id_nif}
                      onChange={(e) => setFormData({ ...formData, tax_id_nif: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('certificateOrigin.telephone')}
                    </label>
                    <input
                      type="text"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('certificateOrigin.hsCode')}
                    </label>
                    <input
                      type="text"
                      value={formData.hs_code}
                      onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('certificateOrigin.mt')}
                    </label>
                    <input
                      type="text"
                      value={formData.mt}
                      onChange={(e) => setFormData({ ...formData, mt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('certificateOrigin.grossWeight')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.gross_weight}
                    onChange={(e) => setFormData({ ...formData, gross_weight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {t('certificateOrigin.save')}
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


