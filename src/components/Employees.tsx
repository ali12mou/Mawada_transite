import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Edit2, Trash2, X, ChevronLeft, ChevronRight, User, CreditCard, Banknote, FileText } from 'lucide-react';
import { FormLabel, FormInput, FormSelect, PrimaryButton, SecondaryButton } from './common/FormComponents';

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
  const [residenceFilter, setResidenceFilter] = useState('Tous');

  const [formData, setFormData] = useState({
    full_name: '',
    gender: 'Homme',
    birth_place: '',
    nationality: '',
    civil_status: 'Célibataire',
    judicial_record: 'Non',
    residence_status: 'Citoyen',
    identification_type: 'Numéro de passeport',
    identification_number: '',
    address: '',
    phone_number: '',
    email: '',
    emergency_contact: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    employee_type: 'Imposable',
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

    if (residenceFilter !== 'Tous') {
      filtered = filtered.filter(emp => emp.residence_status === residenceFilter);
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
      gender: employee.gender || 'Homme',
      birth_place: employee.birth_place || '',
      nationality: employee.nationality || '',
      civil_status: employee.civil_status || 'Célibataire',
      judicial_record: employee.judicial_record || 'Non',
      residence_status: employee.residence_status || 'Citoyen',
      identification_type: employee.identification_type || 'Numéro de passeport',
      identification_number: employee.identification_number || '',
      address: employee.address || '',
      phone_number: employee.phone_number || '',
      email: employee.email || '',
      emergency_contact: employee.emergency_contact || '',
      bank_name: employee.bank_name || '',
      account_name: employee.account_name || '',
      account_number: employee.account_number || '',
      employee_type: employee.employee_type || 'Imposable',
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) return;

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
      gender: 'Homme',
      birth_place: '',
      nationality: '',
      civil_status: 'Célibataire',
      judicial_record: 'Non',
      residence_status: 'Citoyen',
      identification_type: 'Numéro de passeport',
      identification_number: '',
      address: '',
      phone_number: '',
      email: '',
      emergency_contact: '',
      bank_name: '',
      account_name: '',
      account_number: '',
      employee_type: 'Imposable',
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
            <h3 className="text-lg font-medium text-gray-800 mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <FormLabel>Nom complet</FormLabel>
                <FormInput
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <FormLabel>Lieu de naissance</FormLabel>
                <FormInput
                  type="text"
                  value={formData.birth_place}
                  onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>Sexe</FormLabel>
                <FormSelect
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Homme">Homme</option>
                  <option value="Female">Female</option>
                </FormSelect>
              </div>
              <div>
                <FormLabel>Nationalité</FormLabel>
                <FormInput
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>État civil</FormLabel>
                <FormSelect
                  value={formData.civil_status}
                  onChange={(e) => setFormData({ ...formData, civil_status: e.target.value })}
                >
                  <option value="Célibataire">Célibataire</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </FormSelect>
              </div>
              <div>
                <FormLabel>Casier judiciaire</FormLabel>
                <FormSelect
                  value={formData.judicial_record}
                  onChange={(e) => setFormData({ ...formData, judicial_record: e.target.value })}
                >
                  <option value="Non">Non</option>
                  <option value="Yes">Yes</option>
                </FormSelect>
              </div>
              <div>
                <FormLabel>Statut de résidence</FormLabel>
                <FormSelect
                  value={formData.residence_status}
                  onChange={(e) => setFormData({ ...formData, residence_status: e.target.value })}
                >
                  <option value="Citoyen">Citoyen</option>
                  <option value="Foriegn">Foriegn</option>
                </FormSelect>
              </div>
              <div>
                <FormLabel>Type d'identification</FormLabel>
                <FormSelect
                  value={formData.identification_type}
                  onChange={(e) => setFormData({ ...formData, identification_type: e.target.value })}
                >
                  <option value="Numéro de passeport">Numéro de passeport</option>
                  <option value="Identity Card">Identity Card</option>
                </FormSelect>
              </div>
              <div className="col-span-2">
                <FormLabel>Type d'employé</FormLabel>
                <FormSelect
                  value={formData.employee_type}
                  onChange={(e) => setFormData({ ...formData, employee_type: e.target.value })}
                >
                  <option value="Imposable">Imposable</option>
                  <option value="Non-Taxable">Non-Taxable</option>
                </FormSelect>
              </div>
              <div className="col-span-2">
                <FormLabel>Profession de l'employé</FormLabel>
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
                Suivant
              </PrimaryButton>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Détails de contact</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <FormLabel>Adresse</FormLabel>
                <FormInput
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>Numéro de téléphone</FormLabel>
                <FormInput
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>Adresse e-mail</FormLabel>
                <FormInput
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>Contact d'urgence</FormLabel>
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
                Précédent
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => setModalStep('banking')}
              >
                Suivant
              </PrimaryButton>
            </div>
          </div>
        );

      case 'banking':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Informations bancaires</h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <FormLabel>Banque</FormLabel>
                <FormSelect
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="border-blue-500"
                >
                  <option value="">l'Est africain Bank</option>
                  <option value="Bank A">Bank A</option>
                  <option value="Bank B">Bank B</option>
                </FormSelect>
              </div>
              <div>
                <FormLabel>Nom du compte</FormLabel>
                <FormInput
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>Numéro de compte</FormLabel>
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
                Précédent
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => setModalStep('contract')}
              >
                Suivant
              </PrimaryButton>
            </div>
          </div>
        );

      case 'contract':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Informations du contrat</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <FormLabel>Type de contrat</FormLabel>
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
                <FormLabel>Date de début</FormLabel>
                <FormInput
                  type="date"
                  value={formData.contract_start_date}
                  onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                />
              </div>
              <div>
                <FormLabel>Date de fin</FormLabel>
                <FormInput
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                  disabled={!formData.allow_end_date}
                  className="disabled:bg-gray-100 disabled:opacity-75"
                />
              </div>
              <div>
                <FormLabel>Date d'emploi</FormLabel>
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
                  Permettre de fournir une date de fin pour le contrat
                </label>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <SecondaryButton
                type="button"
                onClick={() => setModalStep('banking')}
              >
                Précédent
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={handleSubmit}
              >
                Soumettre
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
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Gérer les employés</h1>
        <button
          onClick={() => {
            setEditingEmployee(null);
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Ajouter un nouvel employé
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Résidence des employés</label>
        <select
          value={residenceFilter}
          onChange={(e) => setResidenceFilter(e.target.value)}
          className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Tous">Tous</option>
          <option value="citizen">citizen</option>
          <option value="Foriegn">Foriegn</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <input
                type="number"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded"
                min="1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  # <span className="ml-1">▲</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  Nom complet <span className="ml-1">▲</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Genre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Numéro de téléphone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Statut de résidence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type d'identification</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Numéro d'urgence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date d'entrée</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type d'employé</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{employee.employee_id}</td>
                  <td className="px-4 py-3 text-sm">{employee.full_name}</td>
                  <td className="px-4 py-3 text-sm">{employee.gender}</td>
                  <td className="px-4 py-3 text-sm">{employee.phone_number}</td>
                  <td className="px-4 py-3 text-sm">{employee.residence_status}</td>
                  <td className="px-4 py-3 text-sm">{employee.identification_type}</td>
                  <td className="px-4 py-3 text-sm">{employee.emergency_contact}</td>
                  <td className="px-4 py-3 text-sm">{employee.employment_date}</td>
                  <td className="px-4 py-3 text-sm">{employee.employee_type}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-gray-600 hover:text-gray-800 p-1"
                      >
                        ⋮
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentEmployees.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    Aucun employé trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-white border rounded">{currentPage}</span>
            {currentPage + 1 <= totalPages && <span className="px-3 py-1">{currentPage + 1}</span>}
            {currentPage + 2 <= totalPages && <span className="px-3 py-1">{currentPage + 2}</span>}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => {
                setShowModal(false);
                setEditingEmployee(null);
                resetForm();
            }}></div>

            <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full max-w-4xl border border-slate-100">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-slate-800">Ajouter/Mettre à jour les informations de l'employé</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingEmployee(null);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex border-b">
                <button
                  onClick={() => setModalStep('personal')}
                  className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
                    modalStep === 'personal' ? 'bg-[#3b82f6] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Informations personnelles</span>
                </button>
                <button
                  onClick={() => setModalStep('contact')}
                  className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
                    modalStep === 'contact' ? 'bg-[#3b82f6] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Détails de contact</span>
                </button>
                <button
                  onClick={() => setModalStep('banking')}
                  className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
                    modalStep === 'banking' ? 'bg-[#3b82f6] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Informations bancaires</span>
                </button>
                <button
                  onClick={() => setModalStep('contract')}
                  className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
                    modalStep === 'contract' ? 'bg-[#3b82f6] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Informations du contrat</span>
                </button>
              </div>

              <div className="p-6 bg-white min-h-[400px]">
                {renderModalContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
