import { useState, useEffect } from 'react';
import { Plus, Eye, Check, X, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';

interface LeaveReturnRequest {
  id: string;
  leave_request_id: string;
  employee_id: string;
  original_end_date: string;
  new_return_date: string;
  reason: string;
  status: string;
  reviewed_by: string;
  reviewed_at: string;
  review_notes: string;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  end_date: string;
  leave_type_id: string;
  status: string;
}

export function LeaveReturnRequest() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [returnRequests, setReturnRequests] = useState<LeaveReturnRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveReturnRequest | null>(null);
  const [formData, setFormData] = useState({
    leave_request_id: '',
    employee_id: '',
    new_return_date: '',
    reason: '',
  });

  useEffect(() => {
    fetchReturnRequests();
    fetchEmployees();
    fetchLeaveRequests();
  }, []);

  const fetchReturnRequests = async () => {
    try {
      const data = await genericApi.list('leave_return_requests');

      
      setReturnRequests(data || []);
    } catch (error) {
      console.error('Error fetching return requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name')
        .order('full_name');

      
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('id, employee_id, end_date, leave_type_id, status')
        .eq('status', 'approved')
        .gte('end_date', new Date().toISOString().split('T')[0]);

      
      setLeaveRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedLeave = leaveRequests.find(lr => lr.id === formData.leave_request_id);
      if (!selectedLeave) {
        alert('Invalid leave request selected');
        return;
      }

      await genericApi.create('leave_return_requests', formData);

      

      resetForm();
      fetchReturnRequests();
      alert('Return request submitted successfully!');
    } catch (error) {
      console.error('Error submitting return request:', error);
      alert('Error submitting return request. Please try again.');
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('Approve this return request?')) return;

    try {
      await genericApi.update('leave_return_requests', editingId, formData);

      

      fetchReturnRequests();
      setShowDetails(false);
      alert('Return request approved!');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request. Please try again.');
    }
  };

  const handleReject = async (requestId: string) => {
    const notes = prompt('Enter reason for rejection:');
    if (!notes) return;

    try {
      await genericApi.update('leave_return_requests', editingId, formData);

      

      fetchReturnRequests();
      setShowDetails(false);
      alert('Return request rejected.');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      leave_request_id: '',
      employee_id: '',
      new_return_date: '',
      reason: '',
    });
    setShowForm(false);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.full_name : 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    setFormData({ ...formData, employee_id: employeeId, leave_request_id: '' });
  };

  const getEmployeeLeaveRequests = () => {
    return leaveRequests.filter(lr => lr.employee_id === formData.employee_id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Return Requests</h2>
          <p className="text-gray-600 mt-1">Manage early return from leave requests</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F3C66] text-white rounded-lg hover:bg-[#154b8a] transition"
        >
          <Plus size={20} />
          New Return Request
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">New Return Request</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee *
                </label>
                <select
                  required
                  value={formData.employee_id}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                >
                  <option value="">Select Employee</option>
                  {employees?.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.employee_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Active Leave Request *
                  </label>
                  <select
                    required
                    value={formData.leave_request_id}
                    onChange={(e) => setFormData({ ...formData, leave_request_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                  >
                    <option value="">Select Leave Request</option>
                    {getEmployeeLeaveRequests()?.map((lr) => (
                      <option key={lr.id} value={lr.id}>
                        Leave ending on {new Date(lr.end_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  {getEmployeeLeaveRequests().length === 0 && (
                    <p className="text-sm text-red-600 mt-1">No active leave requests for this employee</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Return Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.new_return_date}
                  onChange={(e) => setFormData({ ...formData, new_return_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Early Return *
                </label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3C66] text-white rounded-lg hover:bg-[#154b8a]"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Return Request Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Employee</label>
                <div className="font-semibold">{getEmployeeName(selectedRequest.employee_id)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Original End Date</label>
                  <div className="font-semibold">{new Date(selectedRequest.original_end_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">New Return Date</label>
                  <div className="font-semibold">{new Date(selectedRequest.new_return_date).toLocaleDateString()}</div>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Reason</label>
                <div className="text-sm text-gray-800">{selectedRequest.reason}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status.toUpperCase()}
                </span>
              </div>
              {selectedRequest.review_notes && (
                <div>
                  <label className="text-sm text-gray-600">Review Notes</label>
                  <div className="text-sm text-gray-800">{selectedRequest.review_notes}</div>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X size={20} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Check size={20} />
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Return Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returnRequests?.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <RotateCcw size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {getEmployeeName(request.employee_id)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(request.original_end_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-[#0F3C66]">
                      {new Date(request.new_return_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">{request.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetails(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Eye size={16} />
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {returnRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No return requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



