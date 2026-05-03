import { useState, useEffect } from 'react';
import { genericApi } from '../../api/genericApi';
import { Building2, Eye, Printer } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fetchClients, type ClientRecord } from '../../api/clientsApi';
import { fetchLocalCompanies, type LocalCompanyRecord } from '../../api/localCompanyApi';

interface Order {
  id: string;
  reference: string;
  client_id?: string;
  goods_description?: string;
  service_fee?: number;
  created_at: string;
  created_by?: string;
  source?: string;
  destination?: string;
}

export function ServicesReports() {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [currentView, setCurrentView] = useState<'main' | 'orders' | 'local'>('main');
  const [orders, setOrders] = useState<Order[]>([]);
  const [localCompanies, setLocalCompanies] = useState<LocalCompanyRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState('');
  const [selectedClient, setSelectedClient] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedSeller, setSelectedSeller] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, clientsData] = await Promise.all([
        genericApi.list('orders').order('created_at', { ascending: false }),
        fetchClients(),
      ]);

      if (ordersRes.error) throw ordersRes.error;

      setOrders(ordersRes.data || []);
      setClients(clientsData);

      try {
        setLocalCompanies(await fetchLocalCompanies());
      } catch (e) {
        console.error('Error loading local companies:', e);
        setLocalCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'N/A';
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'N/A';
  };

  const getClientMobile = (clientId?: string) => {
    if (!clientId) return '';
    const client = clients.find(c => c.id === clientId);
    return client?.phone || '';
  };

  if (currentView === 'main') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">{t('services.title')}</h1>
          <p className="text-gray-600">{t('services.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setCurrentView('orders')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition">
                <Building2 className="w-8 h-8 text-[#0F3C66]" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('services.localCompanyReport')}
            </h2>
            <p className="text-gray-600 text-sm">
              {t('services.localCompanyDesc')}
            </p>
          </button>

          <button
            onClick={() => setCurrentView('local')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition">
                <Building2 className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('services.chamberServices')}
            </h2>
            <p className="text-gray-600 text-sm">
              {t('services.chamberServicesDesc')}
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'orders') {
    const totalServiceFee = orders.reduce((sum, order) => sum + (order.service_fee || 0), 0);

    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('main')}
            className="text-[#0F3C66] hover:underline mb-4 flex items-center gap-2"
          >
            {t('services.backToReports')}
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">{t('services.ordersReport')}</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('services.dateRange')}
              </label>
              <input
                type="date"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('services.client')}
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              >
                <option value="All">{t('financial.all')}</option>
                {clients?.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('services.search')}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('services.search') + '...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.ref')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.client')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.mobile')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.goodsDescription')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.serviceFee')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.creationDate')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.createdBy')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders?.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{order.reference}</td>
                    <td className="px-4 py-3 text-sm">{getClientName(order.client_id)}</td>
                    <td className="px-4 py-3 text-sm">{getClientMobile(order.client_id)}</td>
                    <td className="px-4 py-3 text-sm">{order.goods_description || '-'}</td>
                    <td className="px-4 py-3 text-sm">{formatAmount(order.service_fee || 0)}</td>
                    <td className="px-4 py-3 text-sm">{new Date(order.created_at).toLocaleDateString('en-CA')}</td>
                    <td className="px-4 py-3 text-sm text-blue-600">{order.created_by || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <button className="text-gray-700 hover:text-gray-900">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-4 py-3 text-sm" colSpan={4}>{t('services.total')}</td>
                  <td className="px-4 py-3 text-sm">{formatAmount(totalServiceFee)}</td>
                  <td className="px-4 py-3 text-sm" colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'local') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('main')}
            className="text-[#0F3C66] hover:underline mb-4 flex items-center gap-2"
          >
            {t('services.backToReports')}
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">{t('services.localCompanyTitle')}</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('services.dateRange')}
              </label>
              <input
                type="date"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('services.sellingCompany')}
              </label>
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              >
                <option value="All">{t('financial.all')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('services.sourceDestination')}
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              >
                <option value="All">{t('financial.all')}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.client')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.sourceDestination')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.sellingCompany')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.descriptionOfGoods')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.fileFee')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.serviceFee')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.truckQuantity')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.totalProfit')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('services.action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {localCompanies?.map((company, index) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm">{company.client_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{company.source_destination || '-'}</td>
                    <td className="px-4 py-3 text-sm">{company.vendor_company || '-'}</td>
                    <td className="px-4 py-3 text-sm">{company.goods_description || '-'}</td>
                    <td className="px-4 py-3 text-sm">{formatAmount(company.file_fee || 0)}</td>
                    <td className="px-4 py-3 text-sm">{formatAmount(company.service_fee || 0)}</td>
                    <td className="px-4 py-3 text-sm">{company.truck_loading_quantity ?? 0}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatAmount(company.total ?? 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
}



