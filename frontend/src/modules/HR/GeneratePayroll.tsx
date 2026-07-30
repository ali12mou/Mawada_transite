import { useMemo, useState } from 'react';
import { appConfirm } from '../../lib/appConfirm';
import { useCrudToast } from '../../hooks/useCrudToast';
import { toastError, toastSuccess } from '../../lib/appToast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchEmployees } from '../../api/hrApi';
import { genericApi } from '../../api/genericApi';
import { fetchAppConfig } from '../../api/appConfigApi';

interface EmployeeRow {
  id: string;
  employee_id: string;
  full_name: string;
  employee_type?: string;
  salary?: number;
  base_salary?: number;
  account_number?: string;
}

interface PayrollItem {
  employee_ref: string;
  matricule: string;
  employee_name: string;
  employee_type: string;
  base_salary: number;
  retraite: number;
  amu: number;
  deduction: number;
  cnss: number;
  taxable_salary: number;
  its: number;
  net_salary: number;
}

const MONTH_KEYS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function getEmployeeSalary(emp: EmployeeRow): number {
  const value = emp.salary ?? emp.base_salary ?? 0;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function calculateIts(taxable: number): number {
  if (taxable <= 30000) return 0;
  if (taxable <= 50000) return round2((taxable - 30000) * 0.02);
  if (taxable <= 150000) return round2(400 + (taxable - 50000) * 0.1);
  if (taxable <= 600000) return round2(10400 + (taxable - 150000) * 0.15);
  return round2(77900 + (taxable - 600000) * 0.2);
}

function buildPayrollItem(emp: EmployeeRow, contributionsEnabled: boolean): PayrollItem {
  const base = round2(getEmployeeSalary(emp));

  if (!contributionsEnabled) {
    return {
      employee_ref: emp.id,
      matricule: emp.employee_id,
      employee_name: emp.full_name,
      employee_type: emp.employee_type || 'Taxable',
      base_salary: base,
      retraite: 0,
      amu: 0,
      deduction: 0,
      cnss: 0,
      taxable_salary: base,
      its: 0,
      net_salary: base,
    };
  }

  const retraite = round2(base * 0.04);
  const amu = round2(base * 0.02);
  const deduction = round2(base * 0.157);
  const cnss = round2(base * 0.217);
  const taxable_salary = round2(Math.max(0, base - retraite - amu));
  const its = calculateIts(taxable_salary);
  const net_salary = round2(Math.max(0, base - retraite - amu - deduction - its));

  return {
    employee_ref: emp.id,
    matricule: emp.employee_id,
    employee_name: emp.full_name,
    employee_type: emp.employee_type || 'Taxable',
    base_salary: base,
    retraite,
    amu,
    deduction,
    cnss,
    taxable_salary,
    its,
    net_salary,
  };
}

function emptyTotals() {
  return {
    base_salary: 0,
    retraite: 0,
    amu: 0,
    deduction: 0,
    cnss: 0,
    taxable_salary: 0,
    its: 0,
    net_salary: 0,
  };
}

export function GeneratePayroll() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const crudToast = useCrudToast();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y -= 1) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const monthOptions = useMemo(() => {
    const maxMonth = selectedYear === currentYear ? currentMonth : 12;
    return MONTH_KEYS.slice(0, maxMonth).map((key, index) => ({
      value: index + 1,
      key,
      label:
        language === 'fr'
          ? [
              'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
              'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
            ][index]
          : key,
    }));
  }, [selectedYear, currentYear, currentMonth, language]);

  const selectedPeriodLabel = `${selectedYear}-${MONTH_KEYS[selectedMonth - 1]}`;

  const resetPayrollView = () => {
    setDataLoaded(false);
    setPayrollItems([]);
  };

  const formatMoney = (amount: number) => {
    const formatted = Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `Fdj ${formatted}`;
  };

  const totals = useMemo(() => {
    return payrollItems.reduce((acc, item) => {
      acc.base_salary += item.base_salary;
      acc.retraite += item.retraite;
      acc.amu += item.amu;
      acc.deduction += item.deduction;
      acc.cnss += item.cnss;
      acc.taxable_salary += item.taxable_salary;
      acc.its += item.its;
      acc.net_salary += item.net_salary;
      return acc;
    }, emptyTotals());
  }, [payrollItems]);

  const handleViewPayrollData = async () => {
    if (!selectedYear || !selectedMonth) {
      toastError(t('generatePayroll.selectPeriodError'));
      return;
    }

    if (
      selectedYear > currentYear ||
      (selectedYear === currentYear && selectedMonth > currentMonth)
    ) {
      toastError(t('generatePayroll.futurePeriodError'));
      return;
    }

    setLoadingData(true);
    try {
      const [employees, appConfig] = await Promise.all([
        fetchEmployees(),
        fetchAppConfig({ force: true }),
      ]);
      const contributionsEnabled = appConfig.payroll_contributions_enabled === 'true';

      const withSalary = (employees || [])
        .map((emp) => emp as unknown as EmployeeRow)
        .filter((emp) => getEmployeeSalary(emp) > 0)
        .sort((a, b) =>
          String(a.employee_id || '').localeCompare(String(b.employee_id || ''), undefined, {
            numeric: true,
          })
        );

      const items = withSalary.map((emp) => buildPayrollItem(emp, contributionsEnabled));
      setPayrollItems(items);
      setDataLoaded(true);

      if (items.length === 0) {
        toastError(t('generatePayroll.noSalaryData'));
      }
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toastError(t('generatePayroll.loadError'));
      setPayrollItems([]);
      setDataLoaded(false);
    } finally {
      setLoadingData(false);
    }
  };

  const handleGenerate = async () => {
    if (!dataLoaded || payrollItems.length === 0) {
      toastError(t('generatePayroll.viewDataFirst'));
      return;
    }

    if (
      selectedYear > currentYear ||
      (selectedYear === currentYear && selectedMonth > currentMonth)
    ) {
      toastError(t('generatePayroll.futurePeriodError'));
      return;
    }

    const year = selectedYear;
    const month = selectedMonth;
    const label = selectedPeriodLabel;
    if (
      !(await appConfirm(t('generatePayroll.confirmGenerateMessage'), {
        title: t('generatePayroll.confirmGenerateTitle'),
        variant: 'warning',
      }))
    ) {
      return;
    }

    setSaving(true);
    try {
      const existing = await genericApi.list<any>('payroll_reports', 500);
      const duplicate = (existing || []).find(
        (r) => Number(r.period_year) === year && Number(r.period_month) === month
      );

      if (duplicate) {
        const overwrite =
          language === 'fr'
            ? `Un rapport existe déjà pour ${label}. Le remplacer ?`
            : `A report already exists for ${label}. Replace it?`;
        if (!(await appConfirm(overwrite))) {
          setSaving(false);
          return;
        }
        const dupId = duplicate.id || duplicate._id;
        if (dupId) await genericApi.delete('payroll_reports', String(dupId));
      }

      const existingPayrollRows = await genericApi.list<any>('payroll', 1000);
      await Promise.all(
        (existingPayrollRows || [])
          .filter(
            (row) => Number(row.period_year) === year && Number(row.period_month) === month
          )
          .map((row) => {
            const rowId = row.id || row._id;
            return rowId ? genericApi.delete('payroll', String(rowId)) : Promise.resolve();
          })
      );

      const reportPayload = {
        period_month: month,
        period_year: year,
        period_label: label,
        status: 'generated',
        generated_by: user?.id || null,
        generated_at: new Date().toISOString(),
        items: payrollItems,
        totals: {
          base_salary: round2(totals.base_salary),
          retraite: round2(totals.retraite),
          amu: round2(totals.amu),
          deduction: round2(totals.deduction),
          cnss: round2(totals.cnss),
          taxable_salary: round2(totals.taxable_salary),
          its: round2(totals.its),
          net_salary: round2(totals.net_salary),
        },
        employee_count: payrollItems.length,
      };

      await genericApi.create('payroll_reports', reportPayload);

      await Promise.all(
        payrollItems.map((item) =>
          genericApi.create('payroll', {
            employee_id: item.employee_ref,
            employee_matricule: item.matricule,
            employee_name: item.employee_name,
            period_month: month,
            period_year: year,
            period_label: label,
            base_salary: item.base_salary,
            retraite: item.retraite,
            amu: item.amu,
            deductions: item.deduction,
            cnss: item.cnss,
            taxable_salary: item.taxable_salary,
            tax_amount: item.its,
            bonuses: 0,
            net_salary: item.net_salary,
            employee_type: item.employee_type,
            status: 'pending_approval',
            generated_by: user?.id || null,
          })
        )
      );

      toastSuccess(t('generatePayroll.generatedSuccess'));
    } catch (error) {
      crudToast.onError(error);
      console.error('Error generating payroll:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-semibold text-gray-700">
          {t('generatePayroll.title')}
        </h2>
        <div className="text-sm font-medium text-[#EE964C]">{t('common.version')}</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <label className="block text-sm font-semibold text-[#0F3C66] mb-2">
            {t('generatePayroll.periodLabel')}
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t('generatePayroll.selectYear')}
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const year = Number(e.target.value);
                  setSelectedYear(year);
                  const maxMonth = year === currentYear ? currentMonth : 12;
                  if (selectedMonth > maxMonth) setSelectedMonth(maxMonth);
                  resetPayrollView();
                }}
                className="min-w-[110px] px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66]/15 focus:border-[#0F3C66] outline-none text-sm"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t('generatePayroll.selectMonth')}
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  resetPayrollView();
                }}
                className="min-w-[140px] px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66]/15 focus:border-[#0F3C66] outline-none text-sm"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleViewPayrollData}
              disabled={loadingData}
              className="px-4 py-2 bg-[#3B82F6] text-white rounded-md font-medium text-sm hover:bg-[#2563EB] transition disabled:opacity-50"
            >
              {loadingData ? t('common.loading') : t('generatePayroll.viewData')}
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={saving || !dataLoaded || payrollItems.length === 0}
              className="px-4 py-2 bg-[#0F3C66] text-white rounded-md font-medium text-sm hover:bg-[#154b8a] transition disabled:opacity-50"
            >
              {saving ? t('generatePayroll.generating') : t('generatePayroll.generate')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#F3F4F6]">
                <th className="px-3 py-2.5 text-left text-xs font-bold text-[#374151] border border-gray-200">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-[#374151] border border-gray-200">
                  {t('generatePayroll.colMatricule')}
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-[#374151] border border-gray-200">
                  {t('generatePayroll.colName')}
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-[#374151] border border-gray-200">
                  {t('generatePayroll.colBase')}
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-[#374151] border border-gray-200">
                  {t('generatePayroll.colRetraite')}
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-[#374151] border border-gray-200">
                  {t('generatePayroll.colAmu')}
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-[#374151] border border-gray-200">
                  {t('generatePayroll.colDeduction')}
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-[#374151] border border-gray-200">
                  {t('generatePayroll.colCnss')}
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-[#374151] border border-gray-200">
                  {t('generatePayroll.colTaxable')}
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-[#374151] border border-gray-200">
                  {t('generatePayroll.colIts')}
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-[#374151] border border-gray-200">
                  {t('generatePayroll.colNet')}
                </th>
              </tr>
            </thead>
            <tbody>
              {!dataLoaded ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500 border border-gray-200">
                    {t('generatePayroll.emptyHint')}
                  </td>
                </tr>
              ) : payrollItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500 border border-gray-200">
                    {t('generatePayroll.noSalaryData')}
                  </td>
                </tr>
              ) : (
                <>
                  {payrollItems.map((item, index) => (
                    <tr key={item.employee_ref} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-600 border border-gray-200">{index + 1}</td>
                      <td className="px-3 py-2.5 text-gray-800 border border-gray-200">{item.matricule}</td>
                      <td className="px-3 py-2.5 text-gray-800 border border-gray-200">{item.employee_name}</td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-right border border-gray-200">
                        {formatMoney(item.base_salary)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-right border border-gray-200">
                        {formatMoney(item.retraite)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-right border border-gray-200">
                        {formatMoney(item.amu)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-right border border-gray-200">
                        {formatMoney(item.deduction)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-right border border-gray-200">
                        {formatMoney(item.cnss)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-right border border-gray-200">
                        {formatMoney(item.taxable_salary)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-right border border-gray-200">
                        {formatMoney(item.its)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-800 whitespace-nowrap text-right border border-gray-200">
                        {formatMoney(item.net_salary)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-white">
                    <td className="px-3 py-3 text-sm font-bold text-[#0F3C66] border border-gray-200" colSpan={3}>
                      {t('generatePayroll.total')}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-gray-800 whitespace-nowrap text-right border border-gray-200">
                      {formatMoney(round2(totals.base_salary))}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-gray-800 whitespace-nowrap text-right border border-gray-200">
                      {formatMoney(round2(totals.retraite))}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-gray-800 whitespace-nowrap text-right border border-gray-200">
                      {formatMoney(round2(totals.amu))}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-gray-800 whitespace-nowrap text-right border border-gray-200">
                      {formatMoney(round2(totals.deduction))}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-gray-800 whitespace-nowrap text-right border border-gray-200">
                      {formatMoney(round2(totals.cnss))}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-gray-800 whitespace-nowrap text-right border border-gray-200">
                      {formatMoney(round2(totals.taxable_salary))}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-gray-800 whitespace-nowrap text-right border border-gray-200">
                      {formatMoney(round2(totals.its))}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-gray-800 whitespace-nowrap text-right border border-gray-200">
                      {formatMoney(round2(totals.net_salary))}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
