import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Edit2, Trash2, User, CreditCard, Banknote, FileText, Plus, Search, Users } from 'lucide-react';
import { FormLabel, FormInput, FormSelect, PrimaryButton, SecondaryButton } from './common/FormComponents';
import Modal from './common/Modal';
import { ActionMenu } from './common/ActionMenu';

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  gender: string;
  birth_place?: string;
  nationality?: string;
  civil_status?: string;
  judicial_record?: string;
  residence_status: string;
  identification_type: string;
  identification_number?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  emergency_contact?: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  employee_type: string;
  profession?: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  employment_date?: string;
  allow_end_date: boolean;
  created_at: string;
}

type ModalStep = 'personal' | 'contact' | 'banking' | 'contract';

export function Employees() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>('personal');
  const [residenceFilter, setResidenceFilter] = useState('all');

  const [formData, setFormData] = useState({
    full_name: '',
    gender: 'Male',
    birth_place: '',
    nationality: '',
    civil_status: 'Single',
    judicial_record: 'No',
    residence_status: 'Citizen',
    identification_type: 'Passport Number',
    identification_number: '',
    address: '',
    phone_number: '',
    email: '',
    emergency_contact: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    employee_type: 'Taxable',
    profession: 'Project Manager',
    contract_type: '',
    contract_start_date: '',
    contract_end_date: '',
    employment_date: '',
    allow_end_date: false
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, residenceFilter]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    if (residenceFilter !== 'all') {
      filtered = filtered.filter(emp => {
        if (residenceFilter === 'citizen') return emp.residence_status === 'Citizen';
        if (residenceFilter === 'foreign') return emp.residence_status === 'Foreigner';
        return true;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEmployees(filtered);
  };

  const generateEmployeeId = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('employee_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 'HIML00001';
    }

    const lastId = data[0].employee_id;
    const lastNumber = parseInt(lastId.replace('HIML', ''));
    const newNumber = lastNumber + 1;
    return `HIML${String(newNumber).padStart(5, '0')}`;
  };

  const handleSubmit = async () => {
    try {
      const employeeData: any = {
        ...formData,
        created_by: user?.id,
        updated_at: new Date().toISOString()
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', editingEmployee.id);

        if (error) throw error;
      } else {
        const employeeId = await generateEmployeeId();
        employeeData.employee_id = employeeId;

        const { error } = await supabase
          .from('employees')
          .insert([employeeData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name || '',
      gender: employee.gender || 'Male',
      birth_place: employee.birth_place || '',
      nationality: employee.nationality || '',
      civil_status: employee.civil_status || 'Single',
      judicial_record: employee.judicial_record || 'No',
      residence_status: employee.residence_status || 'Citizen',
      identification_type: employee.identification_type || 'Passport Number',
      identification_number: employee.identification_number || '',
      address: employee.address || '',
      phone_number: employee.phone_number || '',
      email: employee.email || '',
      emergency_contact: employee.emergency_contact || '',
      bank_name: employee.bank_name || '',
      account_name: employee.account_name || '',
      account_number: employee.account_number || '',
      employee_type: employee.employee_type || 'Taxable',
      profession: employee.profession || '',
      contract_type: employee.contract_type || '',
      contract_start_date: employee.contract_start_date || '',
      contract_end_date: employee.contract_end_date || '',
      employment_date: employee.employment_date || '',
      allow_end_date: employee.allow_end_date || false
    });
    setModalStep('personal');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      gender: 'Male',
      birth_place: '',
      nationality: '',
      civil_status: 'Single',
      judicial_record: 'No',
      residence_status: 'Citizen',
      identification_type: 'Passport Number',
      identification_number: '',
      address: '',
      phone_number: '',
      email: '',
      emergency_contact: '',
      bank_name: '',
      account_name: '',
      account_number: '',
      employee_type: 'Taxable',
      profession: 'Project Manager',
      contract_type: '',
      contract_start_date: '',
      contract_end_date: '',
      employment_date: '',
      allow_end_date: false
    });
    setModalStep('personal');
  };

  const totalPages = Math.ceil(filteredEmployees.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  const renderModalContent = () => {
    switch (modalStep) {
      case 'personal':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{t('employees.stepPersonal')}</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <FormLabel>{t('employees.fieldFullName')}</FormLabel>
                <FormInput
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldBirthPlace')}</FormLabel>
                <FormInput
                  type="text"
                  value={formData.birth_place}
                  onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldGender')}</FormLabel>
                <FormSelect
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Male">{t('employees.genderMale')}</option>
                  <option value="Female">{t('employees.genderFemale')}</option>
                </FormSelect>
              </div>
              <div>
                <FormLabel>{t('employees.fieldNationality')}</FormLabel>
                <FormInput
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldCivilStatus')}</FormLabel>
                <FormSelect
                  value={formData.civil_status}
                  onChange={(e) => setFormData({ ...formData, civil_status: e.target.value })}
                >
                  <option value="Single">{t('employees.civilSingle')}</option>
                  <option value="Married">{t('employees.civilMarried')}</option>
                  <option value="Divorced">{t('employees.civilDivorced')}</option>
                  <option value="Widowed">{t('employees.civilWidowed')}</option>
                </FormSelect>
              </div>
              <div>
                <FormLabel>{t('employees.fieldJudicialRecord')}</FormLabel>
                <FormSelect
                  value={formData.judicial_record}
                  onChange={(e) => setFormData({ ...formData, judicial_record: e.target.value })}
                >
                  <option value="No">{t('employees.no')}</option>
                  <option value="Yes">{t('employees.yes')}</option>
                </FormSelect>
              </div>
              <div>
                <FormLabel>{t('employees.fieldResidenceStatus')}</FormLabel>
                <FormSelect
                  value={formData.residence_status}
                  onChange={(e) => setFormData({ ...formData, residence_status: e.target.value })}
                >
                  <option value="Citizen">{t('employees.residenceCitizen')}</option>
                  <option value="Foreigner">{t('employees.residenceForeigner')}</option>
                </FormSelect>
              </div>
              <div>
                <FormLabel>{t('employees.fieldIdType')}</FormLabel>
                <FormSelect
                  value={formData.identification_type}
                  onChange={(e) => setFormData({ ...formData, identification_type: e.target.value })}
                >
                  <option value="Passport Number">{t('employees.idPassport')}</option>
                  <option value="Identity Card">{t('employees.idNational')}</option>
                </FormSelect>
              </div>
              <div className="col-span-2">
                <FormLabel>{t('employees.fieldEmployeeType')}</FormLabel>
                <FormSelect
                  value={formData.employee_type}
                  onChange={(e) => setFormData({ ...formData, employee_type: e.target.value })}
                >
                  <option value="Taxable">{t('employees.typeTaxable')}</option>
                  <option value="Non-Taxable">{t('employees.typeNonTaxable')}</option>
                </FormSelect>
              </div>
              <div className="col-span-2">
                <FormLabel>{t('employees.fieldProfession')}</FormLabel>
                <FormSelect
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="border-blue-500"
                >
                  <option value="Project Manager">Project Manager</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="Manager">Manager</option>
                </FormSelect>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <PrimaryButton
                type="button"
                onClick={() => setModalStep('contact')}
              >
                {t('employees.next')}
              </PrimaryButton>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{t('employees.stepContact')}</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <FormLabel>{t('employees.fieldAddress')}</FormLabel>
                <FormInput
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldPhone')}</FormLabel>
                <FormInput
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldEmail')}</FormLabel>
                <FormInput
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldEmergency')}</FormLabel>
                <FormInput
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <SecondaryButton
                type="button"
                onClick={() => setModalStep('personal')}
              >
                {t('employees.previous')}
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => setModalStep('banking')}
              >
                {t('employees.next')}
              </PrimaryButton>
            </div>
          </div>
        );

      case 'banking':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{t('employees.stepBanking')}</h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <FormLabel>{t('employees.fieldBank')}</FormLabel>
                <FormSelect
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="border-blue-500"
                >
                  <option value="">Select Bank</option>
                  <option value="East African Bank">East African Bank</option>
                  <option value="Bank A">Bank A</option>
                  <option value="Bank B">Bank B</option>
                </FormSelect>
              </div>
              <div>
                <FormLabel>{t('employees.fieldAccountName')}</FormLabel>
                <FormInput
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldAccountNumber')}</FormLabel>
                <FormInput
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <SecondaryButton
                type="button"
                onClick={() => setModalStep('contact')}
              >
                {t('employees.previous')}
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => setModalStep('contract')}
              >
                {t('employees.next')}
              </PrimaryButton>
            </div>
          </div>
        );

      case 'contract':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{t('employees.stepContract')}</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <FormLabel>{t('employees.fieldContractType')}</FormLabel>
                <FormSelect
                  value={formData.contract_type}
                  onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                >
                  <option value="">Select Contract Type</option>
                  <option value="CDD">CDD</option>
                  <option value="CDI">CDI</option>
                  <option value="Temporary">Temporary</option>
                </FormSelect>
              </div>
              <div>
                <FormLabel>{t('employees.fieldStartDate')}</FormLabel>
                <FormInput
                  type="date"
                  value={formData.contract_start_date}
                  onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldEndDate')}</FormLabel>
                <FormInput
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                  disabled={!formData.allow_end_date}
                  className="disabled:bg-gray-100 disabled:opacity-75"
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldEmploymentDate')}</FormLabel>
                <FormInput
                  type="date"
                  value={formData.employment_date}
                  onChange={(e) => setFormData({ ...formData, employment_date: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allow_end_date"
                  checked={formData.allow_end_date}
                  onChange={(e) => setFormData({ ...formData, allow_end_date: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="allow_end_date" className="text-sm font-medium text-slate-700">
                  {t('employees.fieldAllowEndDate')}
                </label>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <SecondaryButton
                type="button"
                onClick={() => setModalStep('banking')}
              >
                {t('employees.previous')}
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={handleSubmit}
              >
                {t('employees.submit')}
              </PrimaryButton>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#0F3C66]">{t('employees.manageTitle')}</h1>
          <Users size={24} className="text-[#0F3C66] opacity-80" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-[#EE964C]">{t('common.version')}</div>
          <button
            onClick={() => {
              setEditingEmployee(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 font-bold hover:bg-[#154b8a] transition active:scale-95 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            {t('employees.addEmployee')}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('employees.residenceLabel')}</label>
        <select
          value={residenceFilter}
          onChange={(e) => setResidenceFilter(e.target.value)}
          className="w-64 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition text-sm font-medium shadow-sm"
        >
          <option value="all">{t('employees.all')}</option>
          <option value="citizen">{t('employees.residenceCitizen')}</option>
          <option value="foreign">{t('employees.residenceForeigner')}</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition text-sm font-medium"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm font-medium text-gray-600">{t('common.entries') || 'entries'}</span>
          </div>

          <div className="relative w-72">
            <input
              type="text"
              placeholder={`${t('common.search')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66] transition shadow-sm text-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#0F3C66] text-white">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50 w-16">
                  #
                </th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50 cursor-pointer">
                  {t('employees.colFullName')} <span className="ml-1 opacity-50">▲</span>
                </th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('employees.colGender')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('employees.colPhone')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('employees.colResidence')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('employees.colIdType')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('employees.colEmergency')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('employees.colEntryDate')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('employees.colEmployeeType')}</th>
                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider w-24">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentEmployees?.map((employee) => (
                <tr key={employee.id} className="hover:bg-[#0F3C66]/5 transition group">
                  <td className="px-5 py-4 text-sm text-gray-500 font-bold">{employee.employee_id}</td>
                  <td className="px-5 py-4 text-sm font-bold text-[#0F3C66]">{employee.full_name}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{employee.gender}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 font-medium">{employee.phone_number}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{employee.residence_status}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{employee.identification_type}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{employee.emergency_contact}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{employee.employment_date}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {employee.employee_type}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => handleEdit(employee),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => handleDelete(employee.id),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {currentEmployees.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-gray-500 italic">
                    {t('employees.emptyEmployees')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-between items-center text-sm">
          <div className="text-gray-500 font-medium">
            {t('common.showing')} <span className="font-bold text-gray-900">{startIndex + 1}</span> {t('common.to')} <span className="font-bold text-gray-900">{Math.min(endIndex, filteredEmployees.length)}</span> {t('common.of')} <span className="font-bold text-gray-900">{filteredEmployees.length}</span> {t('common.entries') || 'entries'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('common.previous') || 'Previous'}
            </button>

            <span className="px-4 py-2 font-bold text-sm text-gray-700 border border-gray-200 bg-white rounded-xl shadow-sm">{currentPage}</span>
            {currentPage + 1 <= totalPages && <span className="px-3 py-1 font-bold text-sm text-gray-500">{currentPage + 1}</span>}
            {currentPage + 2 <= totalPages && <span className="px-3 py-1 font-bold text-sm text-gray-500">{currentPage + 2}</span>}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
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
          setEditingEmployee(null);
          resetForm();
        }}
        title={editingEmployee ? t('employees.modalTitle') : t('employees.addEmployee')}
        size="xl"
      >
        <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50 p-2 gap-2 rounded-t-xl mb-4">
          <button
            onClick={() => setModalStep('personal')}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold text-sm transition-all rounded-xl whitespace-nowrap ${modalStep === 'personal' ? 'bg-[#0F3C66] text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
              }`}
          >
            <User className="w-4 h-4" />
            <span>{t('employees.stepPersonal')}</span>
          </button>
          <button
            onClick={() => setModalStep('contact')}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold text-sm transition-all rounded-xl whitespace-nowrap ${modalStep === 'contact' ? 'bg-[#0F3C66] text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
              }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{t('employees.stepContact')}</span>
          </button>
          <button
            onClick={() => setModalStep('banking')}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold text-sm transition-all rounded-xl whitespace-nowrap ${modalStep === 'banking' ? 'bg-[#0F3C66] text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
              }`}
          >
            <Banknote className="w-4 h-4" />
            <span>{t('employees.stepBanking')}</span>
          </button>
          <button
            onClick={() => setModalStep('contract')}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold text-sm transition-all rounded-xl whitespace-nowrap ${modalStep === 'contract' ? 'bg-[#0F3C66] text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
              }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('employees.stepContract')}</span>
          </button>
        </div>

        <div className="p-2 min-h-[400px]">
          {renderModalContent()}
        </div>
      </Modal>
    </div>
  );
}


