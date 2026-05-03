import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import Modal from '../Shared/common/Modal';
import { FormLabel, FormInput, FormSelect, ModalFormFooter, PrimaryButton, SecondaryButton } from '../Shared/common/FormComponents';
import { useLanguage } from '../../contexts/LanguageContext';
import { ActionMenu } from '../Shared/common/ActionMenu';
import { fetchUsers, createUser, deleteUser } from '../../api/usersApi';
import type { AuthUser } from '../../types/authUser';

export function Users() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    nom: '',
    email: '',
    password: '',
    role: 'User',
    phone: '',
    department: ''
  });

  const roles = ['Admin', 'User', 'Manager'];
  const departments = ['IT', 'HR', 'Finance', 'Operations', 'Sales'];

  const resetForm = () => {
    setNewUser({
      nom: '',
      email: '',
      password: '',
      role: 'User',
      phone: '',
      department: ''
    });
    setShowPassword(false);
    setShowCreateModal(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(newUser);
      resetForm();
      await loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error.message || 'Error creating user');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(id);
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Error deleting user');
    }
  };

  const filteredUsers = users.filter(user =>
    (user.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{t('users.title')}</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#0F3C66] text-white px-4 py-2 rounded-lg hover:bg-[#152a44] transition"
        >
          <Plus size={20} />
          {t('common.addNew')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.show')}</span>
            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option>5</option>
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  {t('users.username')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  {t('users.role')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  {t('users.email')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  {t('users.status')}
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredUsers?.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        {user.nom}
                        {user.role === 'admin' && (
                          <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm capitalize">{user.role}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {t('users.active')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => {
                              // Handle edit logic
                            },
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => handleDelete(user.id),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            {t('common.show')} {filteredUsers.length > 0 ? (users.indexOf(filteredUsers[0]) + 1) : 0} {t('common.to')} {users.indexOf(filteredUsers[filteredUsers.length - 1]) + 1} {t('common.of')} {users.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
              &lt;
            </button>
            <button className="px-3 py-1 bg-[#0F3C66] text-white rounded">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
              &gt;
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 py-4">
        {t('common.copyright')}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={resetForm}
        title="Add New User"
        size="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="md:col-span-2">
              <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
              <FormInput
                type="text"
                required
                value={newUser.nom}
                onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
              <FormInput
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
              <div className="relative">
                <FormInput
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="pr-10"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <FormLabel>Role <span className="text-red-500">*</span></FormLabel>
              <FormSelect
                required
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                {roles?.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel>Phone Number</FormLabel>
              <FormInput
                type="tel"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="+252..."
              />
            </div>
            <div className="md:col-span-2">
              <FormLabel>Department</FormLabel>
              <FormSelect
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
              >
                <option value="">Select department</option>
                {departments?.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </FormSelect>
            </div>
          </div>

          <ModalFormFooter>
            <SecondaryButton type="button" onClick={resetForm}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Create User
            </PrimaryButton>
          </ModalFormFooter>
        </form>
      </Modal>
    </div>
  );
}


