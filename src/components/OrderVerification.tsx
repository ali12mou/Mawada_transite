import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, FileText, CheckCircle, XCircle } from 'lucide-react';

interface OrderVerification {
  id: string;
  order_id: string;
  order_number: string;
  client_name: string;
  source_destination: string;
  document_action: string;
  status: string;
  verified_at: string;
  created_at: string;
}

export function OrderVerification() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [verifications, setVerifications] = useState<OrderVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<OrderVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchVerifications();
    fetchOrdersForVerification();
  }, []);

  useEffect(() => {
    filterVerifications();
  }, [verifications, searchTerm]);

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('order_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersForVerification = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, order_number, client_name, source_destination')
        .eq('status', 'PENDING');

      if (error) throw error;
      for (const order of orders || []) {
        const { data: existing } = await supabase
          .from('order_verifications')
          .select('id')
          .eq('order_id', order.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from('order_verifications').insert([{
            order_id: order.id,
            order_number: order.order_number,
            client_name: order.client_name,
            source_destination: order.source_destination,
            created_by: user?.id
          }]);
        }
      }

      fetchVerifications();
    } catch (error) {
      console.error('Error syncing orders for verification:', error);
    }
  };

  const filterVerifications = () => {
    let filtered = [...verifications];

    if (searchTerm) {
      filtered = filtered.filter(verification =>
        verification.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredVerifications(filtered);
  };

  const handleApprove = async (id: string, orderId: string) => {
    try {
      await supabase
        .from('order_verifications')
        .update({
          status: 'CHECKED',
          verified_at: new Date().toISOString()
        })
        .eq('id', id);

      await supabase
        .from('orders')
        .update({ status: 'CHECKED' })
        .eq('id', orderId);

      fetchVerifications();
    } catch (error) {
      console.error('Error approving verification:', error);
    }
  };

  const handleReject = async (id: string, orderId: string) => {
    try {
      await supabase
        .from('order_verifications')
        .update({
          status: 'PENDING',
          verified_at: null
        })
        .eq('id', id);

      await supabase
        .from('orders')
        .update({ status: 'PENDING' })
        .eq('id', orderId);

      fetchVerifications();
    } catch (error) {
      console.error('Error rejecting verification:', error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold';
      case 'CHECKED':
        return 'bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold';
      case 'PENDING':
        return 'bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold';
      default:
        return 'bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold';
    }
  };

  const totalPages = Math.ceil(filteredVerifications.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentVerifications = filteredVerifications.slice(startIndex, endIndex);

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
        <h1 className="text-2xl font-semibold text-gray-800">Approbation de commande</h1>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID de commande</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nom du client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Source et Destination</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action du document</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentVerifications.map((verification, index) => (
                <tr key={verification.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                  <td className="px-4 py-3 text-sm">{verification.order_number}</td>
                  <td className="px-4 py-3 text-sm">{verification.client_name}</td>
                  <td className="px-4 py-3 text-sm">{verification.source_destination || '-'}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800">
                      <FileText className="w-5 h-5" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={getStatusBadgeClass(verification.status)}>
                      {verification.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(verification.id, verification.order_id)}
                        className="text-emerald-600 hover:text-emerald-800"
                        title="Approve"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReject(verification.id, verification.order_id)}
                        className="text-red-600 hover:text-red-800"
                        title="Reject"
                      >
                        <XCircle className="w-5 h-5" />
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredVerifications.length)} of {filteredVerifications.length} entries
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
    </div>
  );
}
