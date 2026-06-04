import { lazy, Suspense, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './core/Login';
import { Layout } from './core/Layout';
import { Dashboard } from './core/Dashboard';
import { Roles } from './modules/Admin/Roles';
import { Users } from './modules/Admin/Users';
import { Configurations } from './modules/Admin/Configurations';
import { OtherProfitTransitModule } from './modules/Logistics/transit/OtherProfitTransitModule';
import { ModulePlaceholder } from './modules/Shared/ModulePlaceholder';

const CommercialChamber = lazy(() =>
  import('./modules/Finance/CommercialChamber').then(m => ({ default: m.CommercialChamber }))
);
import { LocalCompany } from './modules/Admin/LocalCompany';
import { TransferDocument9 } from './modules/Logistics/TransferDocument9';
import { ChamberInvoice } from './modules/Finance/ChamberInvoice';
import { Performa } from './modules/Finance/Performa';
import { CustomerFile } from './modules/Admin/CustomerFile';
import { CertificateOrigin } from './modules/Logistics/CertificateOrigin';
import { Orders } from './modules/Logistics/Orders';
import { Suppliers } from './modules/Admin/Suppliers';
import { OrderVerification } from './modules/Logistics/OrderVerification';
import { OrderReception } from './modules/Logistics/OrderReception';
import { DeliveredOrders } from './modules/Logistics/DeliveredOrders';
import { Document9 } from './modules/Logistics/Document9';
import { Document4 } from './modules/Logistics/Document4';
import { Clearance } from './modules/Logistics/Clearance';
import { InvoiceReport } from './modules/Finance/InvoiceReport';
import { Products } from './modules/Admin/Products';
import { Inventories } from './modules/Logistics/Inventories';
import { Warehouse } from './modules/Logistics/Warehouse';
import { Carriers } from './modules/Logistics/Carriers';
import { Associations } from './modules/Admin/Associations';
import { CarrierMode } from './modules/Logistics/CarrierMode';
import { Routes } from './modules/Logistics/Routes';
import { ShippingLines } from './modules/Logistics/ShippingLines';
import { ExpenseCategories } from './modules/Finance/ExpenseCategories';
import { Expense } from './modules/Finance/Expense';
import { ExpenseAllocation } from './modules/Finance/ExpenseAllocation';
import { OtherExpenses } from './modules/Finance/OtherExpenses';
import { Employees } from './modules/HR/Employees';
import { ContractTypes } from './modules/HR/ContractTypes';
import { EmployeeProfessions } from './modules/HR/EmployeeProfessions';
import { EmployeeDocuments } from './modules/HR/EmployeeDocuments';
import { GeneratePayroll } from './modules/HR/GeneratePayroll';
import { PayrollApproval } from './modules/HR/PayrollApproval';
import { TaxRates } from './modules/Finance/TaxRates';
import { LeaveRequest } from './modules/HR/LeaveRequest';
import { LeaveTypes } from './modules/HR/LeaveTypes';
import { LeaveReturnRequest } from './modules/HR/LeaveReturnRequest';
import { Attendance } from './modules/HR/Attendance';
import { Clients } from './modules/Admin/Clients';
import { Banks } from './modules/Finance/Banks';
import { ProductPrices } from './modules/Finance/ProductPrices';
import { ProductCategories } from './modules/Admin/ProductCategories';
import { Companies } from './modules/Admin/Companies';
import { ImportReports } from './modules/Logistics/ImportReports';
import { HRReports } from './modules/HR/HRReports';
import { FinancialReports } from './modules/Finance/FinancialReports';
import { ServicesReports } from './modules/Finance/ServicesReports';
import { TransportModuleRouter } from './modules/Logistics/transit/TransportModuleRouter';
import { isTransportModulePage } from './constants/transportMenu';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE964C]"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    if (isTransportModulePage(currentPage)) {
      return <TransportModuleRouter moduleKey={currentPage} />;
    }

    const page = (() => {
    switch (currentPage) {
      case 'other-profit':
        return <OtherProfitTransitModule />;
      case 'roles':
        return <Roles />;
      case 'users':
        return <Users />;
      case 'configurations':
        return <Configurations />;
      case 'commercial-chamber':
        return <CommercialChamber />;
      case 'chamber-transfer':
        return <ModulePlaceholder menuKey="chamber-transfer" />;
      case 'local-company':
        return <LocalCompany />;
      case 'transfer-document-9':
        return <TransferDocument9 />;
      case 'chamber-invoice':
        return <ChamberInvoice />;
      case 'performa':
        return <Performa />;
      case 'customer-file':
        return <CustomerFile />;
      case 'certificate-origin':
        return <CertificateOrigin />;
      case 'suppliers':
        return <Suppliers />;
      case 'orders':
        return <Orders />;
      case 'order-verification':
        return <OrderVerification />;
      case 'order-reception':
        return <OrderReception />;
      case 'delivered-orders':
        return <DeliveredOrders />;
      case 'document-9':
        return <Document9 />;
      case 'document-4':
        return <Document4 />;
      case 'clearance':
        return <Clearance />;
      case 'invoice-report':
        return <InvoiceReport />;
      case 'products':
        return <Products />;
      case 'inventories':
        return <Inventories />;
      case 'warehouse':
        return <Warehouse />;
      case 'carriers':
        return <Carriers />;
      case 'associations':
        return <Associations />;
      case 'carrier-mode':
        return <CarrierMode />;
      case 'routes':
        return <Routes />;
      case 'shipping-lines':
        return <ShippingLines />;
      case 'expense-categories':
        return <ExpenseCategories />;
      case 'expense':
        return <Expense />;
      case 'expense-allocation':
        return <ExpenseAllocation />;
      case 'other-expenses':
        return <OtherExpenses />;
      case 'employees':
        return <Employees />;
      case 'contract-types':
        return <ContractTypes />;
      case 'employee-professions':
        return <EmployeeProfessions />;
      case 'employee-documents':
        return <EmployeeDocuments />;
      case 'generate-payroll':
        return <GeneratePayroll />;
      case 'payroll-approval':
        return <PayrollApproval />;
      case 'tax-rates':
        return <TaxRates />;
      case 'leave-request':
        return <LeaveRequest />;
      case 'leave-types':
        return <LeaveTypes />;
      case 'leave-return-request':
        return <LeaveReturnRequest />;
      case 'attendance':
        return <Attendance />;
      case 'clients':
        return <Clients />;
      case 'bank':
        return <Banks />;
      case 'item-prices':
        return <ProductPrices />;
      case 'goods-categories':
        return <ProductCategories />;
      case 'companies':
        return <Companies />;
      case 'import-reports':
        return <ImportReports />;
      case 'hr-reports':
        return <HRReports />;
      case 'financial-reports':
        return <FinancialReports />;
      case 'services-reports':
        return <ServicesReports />;
      case 'maritime-lines':
      case 'personnel-file':
      case 'payroll':
      case 'leave-management':
      case 'attendance-management':
        return <ModulePlaceholder menuKey={currentPage} />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
    })();

    return (
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center text-gray-500">Chargement…</div>
        }
      >
        {page}
      </Suspense>
    );
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;


