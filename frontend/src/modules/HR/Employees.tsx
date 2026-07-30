import { useState, useEffect, useRef } from 'react';
import { appConfirm } from '../../lib/appConfirm';
import { useCrudToast } from '../../hooks/useCrudToast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toastError } from '../../lib/appToast';
import {
  Edit2,
  Trash2,
  User,
  CreditCard,
  Banknote,
  FileText,
  Plus,
  Search,
  Users,
  Eye,
  Phone,
  Mail,
  MapPin,
  Building2,
  Contact,
  DollarSign,
} from 'lucide-react';
import { FormLabel, FormInput, FormSelect, PrimaryButton, SecondaryButton } from '../Shared/common/FormComponents';
import Modal from '../Shared/common/Modal';
import { ActionMenu } from '../Shared/common/ActionMenu';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../api/hrApi';
import { genericApi } from '../../api/genericApi';

const MAX_CONTRACT_FILE_BYTES = 5 * 1024 * 1024;

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
  status?: string;
  salary?: number;
  base_salary?: number;
  contract_document?: string;
  contract_document_name?: string;
  created_at: string;
}

function displayOrNA(value?: string | null): string {
  const v = String(value ?? '').trim();
  return v || 'N/A';
}

function maskAccountNumber(value?: string | null): string {
  const digits = String(value ?? '').replace(/\s+/g, '');
  if (!digits) return 'N/A';
  if (digits.length <= 4) return digits;
  return `****${digits.slice(-4)}`;
}

function employeeInitial(name?: string): string {
  const n = String(name ?? '').trim();
  return n ? n.charAt(0).toUpperCase() : '?';
}

function formatSalaryInput(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '';
  return Number(value).toFixed(2);
}

function readLocalFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsDataURL(file);
  });
}

interface ProfessionOption {
  id?: string;
  _id?: string;
  name: string;
  is_active?: boolean;
}

interface ContractTypeOption {
  id?: string;
  _id?: string;
  name: string;
  is_active?: boolean;
}

interface BankOption {
  id?: string;
  _id?: string;
  name: string;
}

function optionId(row: { id?: string; _id?: string }): string {
  return row._id || row.id || '';
}

type ModalStep = 'personal' | 'contact' | 'banking' | 'contract';

const STEP_ORDER: ModalStep[] = ['personal', 'contact', 'banking', 'contract'];

type FormFieldKey =
  | 'full_name'
  | 'profession'
  | 'address'
  | 'phone_number'
  | 'emergency_contact'
  | 'bank_name'
  | 'account_name'
  | 'account_number'
  | 'contract_type'
  | 'contract_start_date'
  | 'contract_end_date'
  | 'employment_date';

const REQUIRED_BY_STEP: Record<ModalStep, FormFieldKey[]> = {
  personal: ['full_name', 'profession'],
  contact: ['address', 'phone_number', 'emergency_contact'],
  banking: ['bank_name', 'account_name', 'account_number'],
  contract: ['contract_type', 'contract_start_date', 'employment_date'],
};

export function Employees() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const crudToast = useCrudToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [professions, setProfessions] = useState<ProfessionOption[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractTypeOption[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [salaryEmployee, setSalaryEmployee] = useState<Employee | null>(null);
  const [salaryValue, setSalaryValue] = useState('');
  const [salaryDocument, setSalaryDocument] = useState('');
  const [salaryDocumentName, setSalaryDocumentName] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);
  const salaryFileRef = useRef<HTMLInputElement>(null);
  const [modalStep, setModalStep] = useState<ModalStep>('personal');
  const [stepErrors, setStepErrors] = useState<Partial<Record<FormFieldKey, boolean>>>({});
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
    profession: '',
    contract_type: '',
    contract_start_date: '',
    contract_end_date: '',
    employment_date: '',
    allow_end_date: false
  });

  useEffect(() => {
    void fetchEmployeesList();
    void fetchLookupLists();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, residenceFilter]);

  const fetchLookupLists = async () => {
    try {
      const [profData, contractData, banksData] = await Promise.all([
        genericApi.list<ProfessionOption>('employee_professions'),
        genericApi.list<ContractTypeOption>('contract_types'),
        genericApi.list<BankOption>('banks'),
      ]);
      setProfessions(
        (profData || []).filter((p) => p.is_active !== false && String(p.name || '').trim())
      );
      setContractTypes(
        (contractData || []).filter((c) => c.is_active !== false && String(c.name || '').trim())
      );
      setBanks(
        (banksData || [])
          .filter((b) => String(b.name || '').trim())
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      );
    } catch (error) {
      console.error('Error fetching professions / contract types / banks:', error);
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const data = await fetchEmployees();
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


  const handleSubmit = async () => {
    if (!validateStep('contract')) return;

    try {
      const employeeData: any = {
        ...formData,
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, employeeData);
      } else {
        await createEmployee(employeeData);
      }

      crudToast.onSaved(!!editingEmployee);

      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      fetchEmployeesList();
    } catch (error) {
      crudToast.onError(error);
      console.error('Error saving employee:', error);
    }
  };

  const isFieldFilled = (key: FormFieldKey): boolean => {
    return String(formData[key] ?? '').trim().length > 0;
  };

  const getRequiredFieldsForStep = (step: ModalStep): FormFieldKey[] => {
    const fields = [...REQUIRED_BY_STEP[step]];
    if (step === 'contract' && formData.allow_end_date) {
      fields.push('contract_end_date');
    }
    return fields;
  };

  const validateStep = (step: ModalStep): boolean => {
    const missing = getRequiredFieldsForStep(step).filter((key) => !isFieldFilled(key));
    if (missing.length === 0) {
      setStepErrors({});
      return true;
    }

    const errors: Partial<Record<FormFieldKey, boolean>> = {};
    missing.forEach((key) => {
      errors[key] = true;
    });
    setStepErrors(errors);
    toastError(t('employees.stepRequiredError'));
    return false;
  };

  const clearFieldError = (key: FormFieldKey) => {
    setStepErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const fieldClass = (key: FormFieldKey, extra = '') =>
    `${extra} ${stepErrors[key] ? 'border-red-500 ring-2 ring-red-200' : ''}`.trim();

  const goToNextStep = (next: ModalStep) => {
    if (!validateStep(modalStep)) return;
    setModalStep(next);
  };

  const tryGoToStep = (target: ModalStep) => {
    const currentIndex = STEP_ORDER.indexOf(modalStep);
    const targetIndex = STEP_ORDER.indexOf(target);
    if (targetIndex <= currentIndex) {
      setStepErrors({});
      setModalStep(target);
      return;
    }
    for (let i = currentIndex; i < targetIndex; i++) {
      if (!validateStep(STEP_ORDER[i])) {
        setModalStep(STEP_ORDER[i]);
        return;
      }
    }
    setModalStep(target);
  };

  const handleViewDetails = (employee: Employee) => {
    setViewingEmployee(employee);
  };

  const openSalarySetup = (employee: Employee) => {
    setSalaryEmployee(employee);
    setSalaryValue(formatSalaryInput(employee.salary ?? employee.base_salary ?? 0));
    setSalaryDocument(employee.contract_document || '');
    setSalaryDocumentName(employee.contract_document_name || '');
    if (salaryFileRef.current) salaryFileRef.current.value = '';
  };

  const closeSalarySetup = () => {
    setSalaryEmployee(null);
    setSalaryValue('');
    setSalaryDocument('');
    setSalaryDocumentName('');
    setSavingSalary(false);
    if (salaryFileRef.current) salaryFileRef.current.value = '';
  };

  const handleSalaryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_CONTRACT_FILE_BYTES) {
      toastError(t('employees.salaryFileTooLarge'));
      e.target.value = '';
      return;
    }

    try {
      const dataUrl = await readLocalFile(file);
      setSalaryDocument(dataUrl);
      setSalaryDocumentName(file.name);
    } catch (error) {
      console.error(error);
      toastError(t('employees.salaryFileReadError'));
      e.target.value = '';
    }
  };

  const handleSaveSalary = async () => {
    if (!salaryEmployee) return;

    const parsed = Number(String(salaryValue).replace(',', '.').trim());
    if (!Number.isFinite(parsed) || parsed < 0) {
      toastError(t('employees.salaryRequired'));
      return;
    }

    setSavingSalary(true);
    try {
      await updateEmployee(salaryEmployee.id, {
        salary: parsed,
        base_salary: parsed,
        contract_document: salaryDocument || undefined,
        contract_document_name: salaryDocumentName || undefined,
      });
      crudToast.onSaved(true);
      closeSalarySetup();
      fetchEmployeesList();
    } catch (error) {
      crudToast.onError(error);
      console.error('Error saving salary:', error);
    } finally {
      setSavingSalary(false);
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
    setStepErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await appConfirm(t('common.confirmDelete')))) return;

    try {
      await deleteEmployee(id);
      crudToast.onDeleted();
      fetchEmployeesList();
    } catch (error) {
      crudToast.onError(error, 'common.errorDeleting');
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
      profession: '',
      contract_type: '',
      contract_start_date: '',
      contract_end_date: '',
      employment_date: '',
      allow_end_date: false
    });
    setModalStep('personal');
    setStepErrors({});
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
                <FormLabel>{t('employees.fieldFullName')} *</FormLabel>
                <FormInput
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value });
                    clearFieldError('full_name');
                  }}
                  className={fieldClass('full_name')}
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
                <FormLabel>{t('employees.fieldProfession')} *</FormLabel>
                <FormSelect
                  value={formData.profession}
                  onChange={(e) => {
                    setFormData({ ...formData, profession: e.target.value });
                    clearFieldError('profession');
                  }}
                  className={fieldClass('profession')}
                  required
                >
                  <option value="">{t('employees.selectProfession') || 'Sélectionner une profession'}</option>
                  {professions.map((p) => (
                    <option key={optionId(p)} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  {formData.profession &&
                    !professions.some((p) => p.name === formData.profession) && (
                      <option value={formData.profession}>{formData.profession}</option>
                    )}
                </FormSelect>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <PrimaryButton
                type="button"
                onClick={() => goToNextStep('contact')}
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
                <FormLabel>{t('employees.fieldAddress')} *</FormLabel>
                <FormInput
                  type="text"
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    clearFieldError('address');
                  }}
                  className={fieldClass('address')}
                  required
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldPhone')} *</FormLabel>
                <FormInput
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => {
                    setFormData({ ...formData, phone_number: e.target.value });
                    clearFieldError('phone_number');
                  }}
                  className={fieldClass('phone_number')}
                  required
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
                <FormLabel>{t('employees.fieldEmergency')} *</FormLabel>
                <FormInput
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => {
                    setFormData({ ...formData, emergency_contact: e.target.value });
                    clearFieldError('emergency_contact');
                  }}
                  className={fieldClass('emergency_contact')}
                  required
                />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <SecondaryButton
                type="button"
                onClick={() => {
                  setStepErrors({});
                  setModalStep('personal');
                }}
              >
                {t('employees.previous')}
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => goToNextStep('banking')}
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
                <FormLabel>{t('employees.fieldBank')} *</FormLabel>
                <FormSelect
                  value={formData.bank_name}
                  onChange={(e) => {
                    setFormData({ ...formData, bank_name: e.target.value });
                    clearFieldError('bank_name');
                  }}
                  className={fieldClass('bank_name', 'border-blue-500')}
                  required
                >
                  <option value="">{t('employees.selectBank')}</option>
                  {banks.map((bank) => (
                    <option key={optionId(bank)} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                  {formData.bank_name &&
                    !banks.some((b) => b.name === formData.bank_name) && (
                      <option value={formData.bank_name}>{formData.bank_name}</option>
                    )}
                </FormSelect>
              </div>
              <div>
                <FormLabel>{t('employees.fieldAccountName')} *</FormLabel>
                <FormInput
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => {
                    setFormData({ ...formData, account_name: e.target.value });
                    clearFieldError('account_name');
                  }}
                  className={fieldClass('account_name')}
                  required
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldAccountNumber')} *</FormLabel>
                <FormInput
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => {
                    setFormData({ ...formData, account_number: e.target.value });
                    clearFieldError('account_number');
                  }}
                  className={fieldClass('account_number')}
                  required
                />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <SecondaryButton
                type="button"
                onClick={() => {
                  setStepErrors({});
                  setModalStep('contact');
                }}
              >
                {t('employees.previous')}
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => goToNextStep('contract')}
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
                <FormLabel>{t('employees.fieldContractType')} *</FormLabel>
                <FormSelect
                  value={formData.contract_type}
                  onChange={(e) => {
                    setFormData({ ...formData, contract_type: e.target.value });
                    clearFieldError('contract_type');
                  }}
                  className={fieldClass('contract_type')}
                  required
                >
                  <option value="">{t('employees.selectContractType') || 'Sélectionner un type de contrat'}</option>
                  {contractTypes.map((c) => (
                    <option key={optionId(c)} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {formData.contract_type &&
                    !contractTypes.some((c) => c.name === formData.contract_type) && (
                      <option value={formData.contract_type}>{formData.contract_type}</option>
                    )}
                </FormSelect>
              </div>
              <div>
                <FormLabel>{t('employees.fieldStartDate')} *</FormLabel>
                <FormInput
                  type="date"
                  value={formData.contract_start_date}
                  onChange={(e) => {
                    setFormData({ ...formData, contract_start_date: e.target.value });
                    clearFieldError('contract_start_date');
                  }}
                  className={fieldClass('contract_start_date')}
                  required
                />
              </div>
              <div>
                <FormLabel>
                  {t('employees.fieldEndDate')}
                  {formData.allow_end_date ? ' *' : ''}
                </FormLabel>
                <FormInput
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => {
                    setFormData({ ...formData, contract_end_date: e.target.value });
                    clearFieldError('contract_end_date');
                  }}
                  disabled={!formData.allow_end_date}
                  className={fieldClass('contract_end_date', 'disabled:bg-gray-100 disabled:opacity-75')}
                  required={formData.allow_end_date}
                />
              </div>
              <div>
                <FormLabel>{t('employees.fieldEmploymentDate')} *</FormLabel>
                <FormInput
                  type="date"
                  value={formData.employment_date}
                  onChange={(e) => {
                    setFormData({ ...formData, employment_date: e.target.value });
                    clearFieldError('employment_date');
                  }}
                  className={fieldClass('employment_date')}
                  required
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allow_end_date"
                  checked={formData.allow_end_date}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({
                      ...formData,
                      allow_end_date: checked,
                      contract_end_date: checked ? formData.contract_end_date : '',
                    });
                    if (!checked) clearFieldError('contract_end_date');
                  }}
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
                onClick={() => {
                  setStepErrors({});
                  setModalStep('banking');
                }}
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
                            label: t('employees.viewDetails'),
                            icon: <Eye size={16} />,
                            onClick: () => handleViewDetails(employee),
                          },
                          {
                            label: t('employees.setupSalary'),
                            icon: <DollarSign size={16} />,
                            onClick: () => openSalarySetup(employee),
                          },
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
        isOpen={!!salaryEmployee}
        onClose={closeSalarySetup}
        title={t('employees.setupSalaryTitle')}
        size="md"
      >
        {salaryEmployee && (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 bg-[#3d4f5f] px-4 py-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                  {t('employees.salaryEmployeeId')}
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                  {t('employees.salaryFullName')}
                </div>
              </div>
              <div className="grid grid-cols-2 bg-white px-4 py-3">
                <div className="text-sm text-slate-600">{salaryEmployee.employee_id}</div>
                <div className="text-sm text-slate-600">{salaryEmployee.full_name}</div>
              </div>
            </div>

            <div>
              <FormLabel>{t('employees.fieldSalary')} (Fdj)</FormLabel>
              <FormInput
                type="text"
                inputMode="decimal"
                value={salaryValue}
                onChange={(e) => setSalaryValue(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <FormLabel>{t('employees.fieldContractDocument')}</FormLabel>
              <div className="flex overflow-hidden rounded-md border border-slate-300">
                <button
                  type="button"
                  onClick={() => salaryFileRef.current?.click()}
                  className="shrink-0 bg-[#3d4f5f] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2f3d4a] transition"
                >
                  {t('employees.chooseFile')}
                </button>
                <div className="flex min-w-0 flex-1 items-center bg-slate-100 px-3 text-sm text-slate-600 truncate">
                  {salaryDocumentName || t('employees.noFileChosen')}
                </div>
              </div>
              <input
                ref={salaryFileRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
                className="hidden"
                onChange={handleSalaryFileChange}
              />
              {salaryDocument && salaryDocumentName && (
                <a
                  href={salaryDocument}
                  download={salaryDocumentName}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-[#0F3C66] hover:underline"
                >
                  <FileText size={14} />
                  {salaryDocumentName}
                </a>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <PrimaryButton type="button" onClick={handleSaveSalary} disabled={savingSalary}>
                {savingSalary ? t('common.loading') : t('employees.saveSalaryChanges')}
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        title={t('employees.viewDetailsTitle')}
        size="xl"
      >
        {viewingEmployee && (
          <div className="max-h-[75vh] overflow-y-auto space-y-4 pr-1">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-200 text-2xl font-bold text-slate-600">
                  {employeeInitial(viewingEmployee.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xl font-bold text-slate-800 truncate">
                    {displayOrNA(viewingEmployee.full_name)}
                  </h4>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {displayOrNA(viewingEmployee.profession)} | {displayOrNA(viewingEmployee.employee_id)}
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Phone size={15} className="text-slate-400 shrink-0" />
                      <span>{displayOrNA(viewingEmployee.phone_number)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={15} className="text-slate-400 shrink-0" />
                      <span className="truncate">{displayOrNA(viewingEmployee.email)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-slate-400 shrink-0" />
                      <span className="truncate">{displayOrNA(viewingEmployee.address)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-slate-400 shrink-0" />
                      <span>
                        {t('employees.detailStatus')}{' '}
                        {displayOrNA(
                          viewingEmployee.status
                            ? viewingEmployee.status.charAt(0).toUpperCase() +
                                viewingEmployee.status.slice(1)
                            : 'Active'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={18} className="text-slate-500" />
                <h5 className="font-semibold text-slate-800">{t('employees.stepPersonal')}</h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.detailEmploymentDate')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.employment_date)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldProfession')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.profession)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldEmployeeType')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.employee_type)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldGender')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.gender)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldCivilStatus')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.civil_status)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldBirthPlace')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.birth_place)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldNationality')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.nationality)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldResidenceStatus')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.residence_status)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldIdType')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.identification_type)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.detailIdNumber')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.identification_number)}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-semibold text-slate-800">{t('employees.detailJudicialRecord')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.judicial_record)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-slate-500" />
                <h5 className="font-semibold text-slate-800">{t('employees.stepContract')}</h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldContractType')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.contract_type)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldStartDate')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.contract_start_date)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldEndDate')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.contract_end_date)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-slate-500" />
                <h5 className="font-semibold text-slate-800">{t('employees.stepBanking')}</h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="sm:col-span-2">
                  <span className="font-semibold text-slate-800">{t('employees.detailBankName')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.bank_name)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.detailAccountName')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.account_name)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.detailAccountNumber')}: </span>
                  <span className="text-slate-600">{maskAccountNumber(viewingEmployee.account_number)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Contact size={18} className="text-slate-500" />
                <h5 className="font-semibold text-slate-800">{t('employees.detailContacts')}</h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.fieldEmergency')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.emergency_contact)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{t('employees.detailEmployeePhone')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.phone_number)}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-semibold text-slate-800">{t('employees.fieldAddress')}: </span>
                  <span className="text-slate-600">{displayOrNA(viewingEmployee.address)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

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
            type="button"
            onClick={() => tryGoToStep('personal')}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold text-sm transition-all rounded-xl whitespace-nowrap ${modalStep === 'personal' ? 'bg-[#0F3C66] text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
              }`}
          >
            <User className="w-4 h-4" />
            <span>{t('employees.stepPersonal')}</span>
          </button>
          <button
            type="button"
            onClick={() => tryGoToStep('contact')}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold text-sm transition-all rounded-xl whitespace-nowrap ${modalStep === 'contact' ? 'bg-[#0F3C66] text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
              }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{t('employees.stepContact')}</span>
          </button>
          <button
            type="button"
            onClick={() => tryGoToStep('banking')}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold text-sm transition-all rounded-xl whitespace-nowrap ${modalStep === 'banking' ? 'bg-[#0F3C66] text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
              }`}
          >
            <Banknote className="w-4 h-4" />
            <span>{t('employees.stepBanking')}</span>
          </button>
          <button
            type="button"
            onClick={() => tryGoToStep('contract')}
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


