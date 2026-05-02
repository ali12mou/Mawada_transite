import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Roles } from './components/Roles';
import { Users } from './components/Users';
import { Configurations } from './components/Configurations';
import { CommercialChamber } from './components/CommercialChamber';
import { LocalCompany } from './components/LocalCompany';
import { TransferDocument9 } from './components/TransferDocument9';
import { ChamberInvoice } from './components/ChamberInvoice';
import { Performa } from './components/Performa';
import { CustomerFile } from './components/CustomerFile';
import { CertificateOrigin } from './components/CertificateOrigin';
import { Orders } from './components/Orders';
import { Suppliers } from './components/Suppliers';
import { OrderVerification } from './components/OrderVerification';
import { OrderReception } from './components/OrderReception';
import { DeliveredOrders } from './components/DeliveredOrders';
import { Document9 } from './components/Document9';
import { Document4 } from './components/Document4';
import { Clearance } from './components/Clearance';
import { InvoiceReport } from './components/InvoiceReport';
import { Products } from './components/Products';
import { Inventories } from './components/Inventories';
import { Warehouse } from './components/Warehouse';
import { Carriers } from './components/Carriers';
import { Associations } from './components/Associations';
import { CarrierMode } from './components/CarrierMode';
import { Routes } from './components/Routes';
import { ShippingLines } from './components/ShippingLines';
import { ExpenseCategories } from './components/ExpenseCategories';
import { Expense } from './components/Expense';
import { ExpenseAllocation } from './components/ExpenseAllocation';
import { OtherExpenses } from './components/OtherExpenses';
import { Employees } from './components/Employees';
import { ContractTypes } from './components/ContractTypes';
import { EmployeeProfessions } from './components/EmployeeProfessions';
import { EmployeeDocuments } from './components/EmployeeDocuments';
import { GeneratePayroll } from './components/GeneratePayroll';
import { PayrollApproval } from './components/PayrollApproval';
import { TaxRates } from './components/TaxRates';
import { LeaveRequest } from './components/LeaveRequest';
import { LeaveTypes } from './components/LeaveTypes';
import { LeaveReturnRequest } from './components/LeaveReturnRequest';
import { Attendance } from './components/Attendance';
import { Clients } from './components/Clients';
import { Banks } from './components/Banks';
import { ProductPrices } from './components/ProductPrices';
import { ProductCategories } from './components/ProductCategories';
import { Companies } from './components/Companies';
import { ImportReports } from './components/ImportReports';
import { HRReports } from './components/HRReports';
import { FinancialReports } from './components/FinancialReports';
import { ServicesReports } from './components/ServicesReports';
import { TransportModuleRouter } from './components/transit/TransportModuleRouter';
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

    switch (currentPage) {
      case 'roles':
        return <Roles />;
      case 'users':
        return <Users />;
      case 'configurations':
        return <Configurations />;
      case 'commercial-chamber':
        return <CommercialChamber />;
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
        return <Dashboard />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
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


