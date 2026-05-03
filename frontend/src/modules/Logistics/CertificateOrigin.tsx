import { useState, useEffect } from 'react';
import { Trash2, Plus, Eye, Award, Edit, X } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchClients, type ClientRecord } from '../../api/clientsApi';
import { formatClientLabel } from '../../lib/clientLabel';

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
  const [clientsList, setClientsList] = useState<ClientRecord[]>([]);
  const [carrierModes, setCarrierModes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [goodsCategories, setGoodsCategories] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
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
    (async () => {
      try {
        const [clients, modes, locs, categories] = await Promise.all([
          fetchClients(),
          genericApi.list('carrier_modes'),
          genericApi.list('locations'),
          genericApi.list('product_categories')
        ]);
        setClientsList(clients);
        setCarrierModes(modes || []);
        setLocations(locs || []);
        setGoodsCategories(categories || []);
      } catch (e) {
        console.error('Error loading initial data:', e);
      }
    })();
  }, []);

  const loadCertificates = async () => {
    try {
      const data = await genericApi.list('certificate_origin');
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
      if (editingId) {
        await genericApi.update('certificate_origin', editingId, formData);
      } else {
        await genericApi.create('certificate_origin', formData);
      }

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
      if (!id) throw new Error('ID missing');
      await genericApi.delete('certificate_origin', id);
      loadCertificates();
    } catch (error: any) {
      console.error('Error deleting certificate:', error);
      alert(error.message || 'Error deleting certificate');
    }
  };

  const openEditModal = (id: string, viewOnly = false) => {
    const cert = certificates.find(c => (c as any)._id === id || c.id === id);
    if (!cert) return;

    setFormData({
      certificate_number: cert.certificate_number || '',
      customer: cert.customer || '',
      destination: cert.destination || '',
      tin_number: (cert as any).tin_number || '',
      telephone: (cert as any).telephone || '',
      description: cert.description || '',
      hs_code: cert.hs_code || '',
      mt: (cert as any).mt || '',
      gross_weight: Number((cert as any).gross_weight) || 0,
      transport_type: (cert as any).transport_type || '',
      origin_product: (cert as any).origin_product || '',
      declaration_form: (cert as any).declaration_form || '',
      tax_id_nif: (cert as any).tax_id_nif || '',
      loaded_by: (cert as any).loaded_by || '',
      destination_to: (cert as any).destination_to || '',
    });

    setEditingId(id);
    setIsViewOnly(viewOnly);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setIsViewOnly(false);
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
                filteredCertificates?.map((cert, index) => {
                  const pId = (cert as any)._id || cert.id || '';
                  return (
                    <tr key={pId} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-500 font-medium">{index + 1}</td>
                      <td className="py-3 px-4 font-semibold text-blue-700">{cert.customer}</td>
                      <td className="py-3 px-4 text-gray-600">{cert.description || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                          {cert.destination || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{cert.hs_code || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          <ActionMenu
                            actions={[
                              {
                                label: t('common.view'),
                                icon: <Eye size={16} />,
                                onClick: () => openEditModal(pId, true),
                              },
                              {
                                label: t('common.edit'),
                                icon: <Edit size={16} />,
                                onClick: () => openEditModal(pId, false),
                              },
                              {
                                label: t('common.delete'),
                                icon: <Trash2 size={16} />,
                                onClick: () => handleDelete(pId),
                                variant: 'danger',
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            {t('common.showing')} 1 {t('common.to')} {Math.min(filteredCertificates.length, 10)} {t('common.of')} {filteredCertificates.length} {t('common.entries')}
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
          <div className="bg-white rounded-xl p-5 w-full max-w-6xl max-h-[95vh] overflow-y-auto shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {isViewOnly 
                  ? t('certificateOrigin.details') 
                  : (editingId ? t('certificateOrigin.addUpdate') : t('certificateOrigin.addNew'))
                }
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      {t('certificateOrigin.client')}
                    </label>
                    <select
                      disabled={isViewOnly}
                      value={formData.customer}
                      onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
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
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      {t('certificateOrigin.description')}
                    </label>
                    <select
                      disabled={isViewOnly}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select Goods Description</option>
                      {goodsCategories?.map(c => (
                        <option key={c.id || c._id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      {t('certificateOrigin.destination')}
                    </label>
                    <select
                      disabled={isViewOnly}
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select Destination</option>
                      {locations?.map(l => (
                        <option key={l.id || l._id} value={l.name}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      {t('certificateOrigin.transportType')}
                    </label>
                    <select
                      disabled={isViewOnly}
                      value={formData.transport_type}
                      onChange={(e) => setFormData({ ...formData, transport_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Select transport type</option>
                      {carrierModes?.map(m => (
                        <option key={m.id || m._id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      {t('certificateOrigin.originProduct')}
                    </label>
                    <input
                      type="text"
                      disabled={isViewOnly}
                      value={formData.origin_product}
                      onChange={(e) => setFormData({ ...formData, origin_product: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      {t('certificateOrigin.declarationForm')}
                    </label>
                    <input
                      type="text"
                      disabled={isViewOnly}
                      value={formData.declaration_form}
                      onChange={(e) => setFormData({ ...formData, declaration_form: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      {t('certificateOrigin.taxIdNif')}
                    </label>
                    <input
                      type="text"
                      disabled={isViewOnly}
                      value={formData.tax_id_nif}
                      onChange={(e) => setFormData({ ...formData, tax_id_nif: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      {t('certificateOrigin.telephone')}
                    </label>
                    <input
                      type="text"
                      disabled={isViewOnly}
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      {t('certificateOrigin.hsCode')}
                    </label>
                    <input
                      type="text"
                      disabled={isViewOnly}
                      value={formData.hs_code}
                      onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      {t('certificateOrigin.mt')}
                    </label>
                    <input
                      type="text"
                      disabled={isViewOnly}
                      value={formData.mt}
                      onChange={(e) => setFormData({ ...formData, mt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      {t('certificateOrigin.grossWeight')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={isViewOnly}
                      value={formData.gross_weight}
                      onChange={(e) => setFormData({ ...formData, gross_weight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {!isViewOnly && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg font-bold"
                  >
                    {editingId ? t('common.saveChanges') : t('certificateOrigin.save')}
                  </button>
                </div>
              )}
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
